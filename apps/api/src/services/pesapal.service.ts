/**
 * Pesapal API 3.0 client.
 *
 * Hand-rolled (no SDK) — surface is small (~6 endpoints) and existing third-party
 * SDKs are solo-maintained with low adoption (see audit in migration plan).
 *
 * Auth model: token (5-min TTL JWT) cached in Redis; concurrent requests share.
 * Security model: callback + IPN payloads carry NO payment status — server MUST
 * call GetTransactionStatus with the bearer token to fetch real status. Never
 * trust client/IPN-supplied status.
 */

import { redisClient } from '../lib/redis';

const ENV = (process.env.PESAPAL_ENV || 'sandbox').toLowerCase();
const BASE_URL =
  ENV === 'production'
    ? 'https://pay.pesapal.com/v3'
    : 'https://cybqa.pesapal.com/pesapalv3';

const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET || '';
const TOKEN_CACHE_KEY = `pesapal:token:${ENV}`;
const TOKEN_LOCK_KEY = `pesapal:token:lock:${ENV}`;
const REQUEST_TIMEOUT_MS = 15_000;

if (!CONSUMER_KEY || !CONSUMER_SECRET) {
  console.warn('[pesapal] PESAPAL_CONSUMER_KEY / PESAPAL_CONSUMER_SECRET not set — payments will not work.');
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SubmitOrderInput {
  merchantReference: string;       // alphanumeric + - _ . :, max 50 chars
  currency: 'KES' | 'UGX' | 'TZS' | 'USD';
  amount: number;                  // major units, decimals OK (e.g. 1500.00)
  description: string;             // max 100 chars
  callbackUrl: string;
  cancellationUrl?: string;
  notificationId: string;          // our registered IPN ID (env)
  billing: {
    email?: string;
    phone?: string;                // E.164 ideally; either email or phone required
    countryCode?: string;          // ISO 3166-1 alpha-2 (e.g. UG, KE)
    firstName?: string;
    lastName?: string;
  };
  branch?: string;
}

export interface SubmitOrderResult {
  orderTrackingId: string;
  merchantReference: string;
  redirectUrl: string;
}

export type PesapalStatusCode = 0 | 1 | 2 | 3; // INVALID | COMPLETED | FAILED | REVERSED

export interface TransactionStatus {
  statusCode: PesapalStatusCode;
  paymentMethod: string | null;
  amount: number;
  currency: string;
  confirmationCode: string | null;
  paymentStatusDescription: string | null;
  description: string | null;        // failure reason for FAILED
  paymentAccount: string | null;
  merchantReference: string;
  createdDate: string | null;
  rawStatus: string;
}

export interface RefundInput {
  confirmationCode: string;
  amount: number;
  username: string;        // who initiated the refund (admin email or display name)
  remarks: string;
}

// ─── Errors ─────────────────────────────────────────────────────────────────

export class PesapalError extends Error {
  constructor(
    message: string,
    public readonly endpoint: string,
    public readonly httpStatus?: number,
    public readonly pesapalError?: unknown,
  ) {
    super(message);
    this.name = 'PesapalError';
  }
}

// ─── HTTP helpers ───────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function isErrorBlock(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const e = value as Record<string, unknown>;
  return Boolean(e.code || e.error_type || e.message);
}

// ─── Token management ──────────────────────────────────────────────────────

async function fetchFreshToken(): Promise<{ token: string; ttlSec: number }> {
  const res = await fetchWithTimeout(`${BASE_URL}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ consumer_key: CONSUMER_KEY, consumer_secret: CONSUMER_SECRET }),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || !json?.token || isErrorBlock(json?.error)) {
    throw new PesapalError(
      `RequestToken failed: ${json?.error?.message || json?.message || res.statusText}`,
      '/api/Auth/RequestToken',
      res.status,
      json?.error,
    );
  }

  // Token TTL is exactly 5 minutes; expiryDate is UTC. Cache for 4 min so we
  // refresh before Pesapal rejects.
  let ttlSec = 240;
  if (json.expiryDate) {
    const expMs = new Date(json.expiryDate).getTime();
    if (Number.isFinite(expMs)) {
      const remainSec = Math.floor((expMs - Date.now()) / 1000);
      ttlSec = Math.max(60, remainSec - 30);
    }
  }
  return { token: json.token, ttlSec };
}

/**
 * Get a valid bearer token, using Redis as the shared cache so we don't
 * stampede the auth endpoint when many requests start a checkout simultaneously.
 *
 * `forceRefresh` skips the cache (used after a 401 response).
 */
async function getToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh) {
    const cached = await redisClient.get(TOKEN_CACHE_KEY).catch(() => null);
    if (cached) return cached;
  }

  // Best-effort distributed lock so only one process refreshes at a time.
  const lock = await redisClient.set(TOKEN_LOCK_KEY, '1', 'EX', 10, 'NX').catch(() => null);
  if (!lock && !forceRefresh) {
    // Another process is refreshing; wait briefly and re-read cache.
    await new Promise((r) => setTimeout(r, 250));
    const cached = await redisClient.get(TOKEN_CACHE_KEY).catch(() => null);
    if (cached) return cached;
  }

  try {
    const { token, ttlSec } = await fetchFreshToken();
    await redisClient.set(TOKEN_CACHE_KEY, token, 'EX', ttlSec).catch(() => undefined);
    return token;
  } finally {
    await redisClient.del(TOKEN_LOCK_KEY).catch(() => undefined);
  }
}

async function authedRequest(
  endpoint: string,
  init: RequestInit,
  retried = false,
): Promise<{ res: Response; json: any }> {
  const token = await getToken(retried);
  const res = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });

  if (res.status === 401 && !retried) {
    await redisClient.del(TOKEN_CACHE_KEY).catch(() => undefined);
    return authedRequest(endpoint, init, true);
  }

  const json = await res.json().catch(() => ({}));
  return { res, json };
}

// ─── Public API ─────────────────────────────────────────────────────────────

export const PesapalService = {
  /**
   * One-time setup: register the IPN URL. Returns the ipn_id (GUID) that must be
   * stored as PESAPAL_IPN_ID and passed as `notification_id` on every order.
   */
  async registerIpn(url: string, notificationType: 'GET' | 'POST' = 'POST'): Promise<string> {
    const { res, json } = await authedRequest('/api/URLSetup/RegisterIPN', {
      method: 'POST',
      body: JSON.stringify({ url, ipn_notification_type: notificationType }),
    });
    if (!res.ok || !json?.ipn_id || isErrorBlock(json?.error)) {
      throw new PesapalError(
        `RegisterIPN failed: ${json?.error?.message || res.statusText}`,
        '/api/URLSetup/RegisterIPN',
        res.status,
        json?.error,
      );
    }
    return json.ipn_id as string;
  },

  /** List all registered IPN URLs. Useful for setup script + admin diagnostics. */
  async listIpns(): Promise<Array<{ ipn_id: string; url: string; ipn_status_description: string }>> {
    const { res, json } = await authedRequest('/api/URLSetup/GetIpnList', { method: 'GET' });
    if (!res.ok) {
      throw new PesapalError(`GetIpnList failed: ${res.statusText}`, '/api/URLSetup/GetIpnList', res.status);
    }
    if (!Array.isArray(json)) return [];
    // Pesapal API returns the field as `ipn_status_decription` (typo).
    // Tolerate both spellings in case they fix it.
    return json.map((r: any) => ({
      ipn_id: r.ipn_id,
      url: r.url,
      ipn_status_description: r.ipn_status_description ?? r.ipn_status_decription ?? '',
    }));
  },

  async submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResult> {
    if (!input.billing.email && !input.billing.phone) {
      throw new PesapalError(
        'billing.email or billing.phone is required',
        '/api/Transactions/SubmitOrderRequest',
      );
    }
    if (input.merchantReference.length > 50 || !/^[A-Za-z0-9._:\-]+$/.test(input.merchantReference)) {
      throw new PesapalError(
        'merchantReference must be alphanumeric + -_.: and max 50 chars',
        '/api/Transactions/SubmitOrderRequest',
      );
    }

    const body = {
      id: input.merchantReference,
      currency: input.currency,
      amount: Number(input.amount.toFixed(2)),
      description: input.description.slice(0, 100),
      callback_url: input.callbackUrl,
      cancellation_url: input.cancellationUrl,
      notification_id: input.notificationId,
      branch: input.branch,
      billing_address: {
        email_address: input.billing.email,
        phone_number: input.billing.phone,
        country_code: input.billing.countryCode,
        first_name: input.billing.firstName,
        last_name: input.billing.lastName,
      },
    };

    const { res, json } = await authedRequest('/api/Transactions/SubmitOrderRequest', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!res.ok || !json?.order_tracking_id || isErrorBlock(json?.error)) {
      throw new PesapalError(
        `SubmitOrderRequest failed: ${json?.error?.message || json?.message || res.statusText}`,
        '/api/Transactions/SubmitOrderRequest',
        res.status,
        json?.error,
      );
    }

    return {
      orderTrackingId: json.order_tracking_id,
      merchantReference: json.merchant_reference,
      redirectUrl: json.redirect_url,
    };
  },

  async getStatus(orderTrackingId: string): Promise<TransactionStatus> {
    const { res, json } = await authedRequest(
      `/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
      { method: 'GET' },
    );

    if (!res.ok) {
      throw new PesapalError(
        `GetTransactionStatus failed: ${json?.error?.message || res.statusText}`,
        '/api/Transactions/GetTransactionStatus',
        res.status,
        json?.error,
      );
    }

    const sc = Number(json.status_code);
    const statusCode: PesapalStatusCode = (sc === 1 || sc === 2 || sc === 3 ? sc : 0) as PesapalStatusCode;

    return {
      statusCode,
      paymentMethod: json.payment_method ?? null,
      amount: Number(json.amount ?? 0),
      currency: String(json.currency ?? ''),
      confirmationCode: json.confirmation_code ?? null,
      paymentStatusDescription: json.payment_status_description ?? null,
      description: json.description ?? null,
      paymentAccount: json.payment_account ?? null,
      merchantReference: String(json.merchant_reference ?? ''),
      createdDate: json.created_date ?? null,
      rawStatus: String(json.status ?? ''),
    };
  },

  /**
   * Request a refund. Async on Pesapal's side: a 200 means received, not settled.
   * Card payments support partial refunds; mobile-money is full only. Only one
   * refund per payment is allowed by Pesapal — caller must enforce.
   */
  async refund(input: RefundInput): Promise<{ accepted: boolean; message: string }> {
    const { res, json } = await authedRequest('/api/Transactions/RefundRequest', {
      method: 'POST',
      body: JSON.stringify({
        confirmation_code: input.confirmationCode,
        amount: input.amount.toFixed(2),
        username: input.username,
        remarks: input.remarks,
      }),
    });

    const accepted = res.ok && String(json?.status) === '200';
    return {
      accepted,
      message: String(json?.message || (accepted ? 'Refund request accepted' : 'Refund request rejected')),
    };
  },
};
