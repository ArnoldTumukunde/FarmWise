import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Stub redis so tests don't need a live instance.
const redisStore = new Map<string, string>();
vi.mock('../lib/redis', () => ({
  redisClient: {
    get: vi.fn(async (k: string) => redisStore.get(k) ?? null),
    set: vi.fn(async (k: string, v: string) => {
      redisStore.set(k, v);
      return 'OK';
    }),
    del: vi.fn(async (k: string) => {
      redisStore.delete(k);
      return 1;
    }),
  },
}));

process.env.PESAPAL_ENV = 'sandbox';
process.env.PESAPAL_CONSUMER_KEY = 'test_key';
process.env.PESAPAL_CONSUMER_SECRET = 'test_secret';

const SANDBOX = 'https://cybqa.pesapal.com/pesapalv3';

interface MockResponse {
  match: (url: string, init: RequestInit) => boolean;
  status?: number;
  body: unknown;
}

let queue: MockResponse[] = [];

function enqueue(r: MockResponse) {
  queue.push(r);
}

function fakeFetch(url: string, init: RequestInit): Promise<Response> {
  const found = queue.findIndex((r) => r.match(url, init));
  if (found < 0) throw new Error(`unexpected fetch: ${init.method} ${url}`);
  const r = queue.splice(found, 1)[0];
  return Promise.resolve(
    new Response(JSON.stringify(r.body), {
      status: r.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

const validTokenBody = (ttlSec = 300) => ({
  token: 'JWT.' + Math.random(),
  expiryDate: new Date(Date.now() + ttlSec * 1000).toISOString(),
  error: null,
  status: '200',
  message: 'ok',
});

beforeEach(() => {
  redisStore.clear();
  queue = [];
  vi.stubGlobal('fetch', fakeFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PesapalService', () => {
  it('caches the token across calls', async () => {
    const { PesapalService } = await import('./pesapal.service');

    enqueue({
      match: (u) => u.endsWith('/api/Auth/RequestToken'),
      body: validTokenBody(),
    });
    enqueue({
      match: (u) => u.includes('/api/URLSetup/GetIpnList'),
      body: [{ ipn_id: 'i1', url: 'x', ipn_status_description: 'Active' }],
    });
    enqueue({
      match: (u) => u.includes('/api/URLSetup/GetIpnList'),
      body: [{ ipn_id: 'i1', url: 'x', ipn_status_description: 'Active' }],
    });

    await PesapalService.listIpns();
    await PesapalService.listIpns();

    // queue should be empty: one auth + two list calls consumed.
    expect(queue.length).toBe(0);
  });

  it('refreshes token on 401 and retries once', async () => {
    redisStore.clear();
    const { PesapalService } = await import('./pesapal.service');

    let authCalls = 0;
    let listCalls = 0;

    const matchAuth = (u: string) => {
      if (u.endsWith('/api/Auth/RequestToken')) {
        authCalls++;
        return true;
      }
      return false;
    };
    const matchList = (u: string) => {
      if (u.includes('/api/URLSetup/GetIpnList')) {
        listCalls++;
        return true;
      }
      return false;
    };

    queue = [
      { match: matchAuth, body: validTokenBody() },
      { match: matchList, status: 401, body: { error: { message: 'Token expired' } } },
      { match: matchAuth, body: validTokenBody() },
      { match: matchList, body: [] },
    ];

    const result = await PesapalService.listIpns();
    expect(result).toEqual([]);
    expect(authCalls).toBe(2); // initial + after-401
    expect(listCalls).toBe(2);
  });

  it('submitOrder validates merchantReference shape', async () => {
    const { PesapalService } = await import('./pesapal.service');

    await expect(
      PesapalService.submitOrder({
        merchantReference: 'has spaces',
        currency: 'UGX',
        amount: 1000,
        description: 'x',
        callbackUrl: 'https://x.test/cb',
        notificationId: 'ipn',
        billing: { email: 'a@b.test' },
      }),
    ).rejects.toThrow(/alphanumeric/);
  });

  it('submitOrder requires email or phone', async () => {
    const { PesapalService } = await import('./pesapal.service');

    await expect(
      PesapalService.submitOrder({
        merchantReference: 'AAN-001',
        currency: 'UGX',
        amount: 1000,
        description: 'x',
        callbackUrl: 'https://x.test/cb',
        notificationId: 'ipn',
        billing: {},
      }),
    ).rejects.toThrow(/email or.*phone/);
  });

  it('submitOrder returns redirectUrl + orderTrackingId', async () => {
    const { PesapalService } = await import('./pesapal.service');

    enqueue({ match: (u) => u.endsWith('/api/Auth/RequestToken'), body: validTokenBody() });
    enqueue({
      match: (u) => u.includes('/SubmitOrderRequest'),
      body: {
        order_tracking_id: 'OT-123',
        merchant_reference: 'AAN-001',
        redirect_url: `${SANDBOX}/redirect/OT-123`,
        error: null,
        status: '200',
      },
    });

    const r = await PesapalService.submitOrder({
      merchantReference: 'AAN-001',
      currency: 'UGX',
      amount: 50000,
      description: 'AAN Course',
      callbackUrl: 'https://aan.academy/payments/return',
      notificationId: 'ipn-id',
      billing: { phone: '+256700000000', firstName: 'Jane', lastName: 'Doe' },
    });

    expect(r.orderTrackingId).toBe('OT-123');
    expect(r.redirectUrl).toContain('OT-123');
  });

  it('submitOrder surfaces Pesapal error block', async () => {
    const { PesapalService } = await import('./pesapal.service');

    enqueue({ match: (u) => u.endsWith('/api/Auth/RequestToken'), body: validTokenBody() });
    enqueue({
      match: (u) => u.includes('/SubmitOrderRequest'),
      body: {
        order_tracking_id: null,
        error: { code: 'invalid_amount', message: 'Amount too low' },
        status: '500',
      },
    });

    await expect(
      PesapalService.submitOrder({
        merchantReference: 'AAN-002',
        currency: 'UGX',
        amount: 1,
        description: 'x',
        callbackUrl: 'https://x/cb',
        notificationId: 'ipn',
        billing: { email: 'a@b' },
      }),
    ).rejects.toThrow(/Amount too low/);
  });

  it('getStatus maps all status codes', async () => {
    const { PesapalService } = await import('./pesapal.service');

    enqueue({ match: (u) => u.endsWith('/api/Auth/RequestToken'), body: validTokenBody() });

    for (const sc of [0, 1, 2, 3]) {
      enqueue({
        match: (u) => u.includes('/GetTransactionStatus'),
        body: {
          payment_method: 'Visa',
          amount: 100,
          currency: 'KES',
          confirmation_code: 'CC-1',
          payment_status_description: 'x',
          description: 'desc',
          payment_account: '4761**00',
          status_code: sc,
          merchant_reference: 'AAN-1',
          status: '200',
          error: { error_type: null, code: null, message: null },
        },
      });
    }

    const results = [];
    for (let i = 0; i < 4; i++) results.push(await PesapalService.getStatus(`OT-${i}`));
    expect(results.map((r) => r.statusCode)).toEqual([0, 1, 2, 3]);
  });

  it('getStatus coerces unknown status_code to 0 (INVALID)', async () => {
    const { PesapalService } = await import('./pesapal.service');

    enqueue({ match: (u) => u.endsWith('/api/Auth/RequestToken'), body: validTokenBody() });
    enqueue({
      match: (u) => u.includes('/GetTransactionStatus'),
      body: { status_code: 99, amount: 0, currency: 'UGX', merchant_reference: 'x', status: '200', error: null },
    });
    const r = await PesapalService.getStatus('OT-x');
    expect(r.statusCode).toBe(0);
  });

  it('refund returns accepted=true on 200', async () => {
    const { PesapalService } = await import('./pesapal.service');
    enqueue({ match: (u) => u.endsWith('/api/Auth/RequestToken'), body: validTokenBody() });
    enqueue({
      match: (u) => u.includes('/RefundRequest'),
      body: { status: '200', message: 'Refund request successfully' },
    });

    const r = await PesapalService.refund({
      confirmationCode: 'CC-1',
      amount: 100,
      username: 'admin@aan',
      remarks: 'duplicate',
    });
    expect(r.accepted).toBe(true);
  });

  it('refund returns accepted=false on 500', async () => {
    const { PesapalService } = await import('./pesapal.service');
    enqueue({ match: (u) => u.endsWith('/api/Auth/RequestToken'), body: validTokenBody() });
    enqueue({
      match: (u) => u.includes('/RefundRequest'),
      status: 500,
      body: { status: '500', message: 'Refund rejected' },
    });

    const r = await PesapalService.refund({
      confirmationCode: 'CC-2',
      amount: 100,
      username: 'admin',
      remarks: 'x',
    });
    expect(r.accepted).toBe(false);
  });

  it('registerIpn returns ipn_id', async () => {
    const { PesapalService } = await import('./pesapal.service');
    enqueue({ match: (u) => u.endsWith('/api/Auth/RequestToken'), body: validTokenBody() });
    enqueue({
      match: (u) => u.includes('/RegisterIPN'),
      body: {
        url: 'https://aan.academy/api/v1/payments/ipn',
        ipn_id: 'ipn-guid-123',
        ipn_status: 1,
        ipn_status_description: 'Active',
        error: null,
        status: '200',
      },
    });

    const id = await PesapalService.registerIpn('https://aan.academy/api/v1/payments/ipn', 'POST');
    expect(id).toBe('ipn-guid-123');
  });
});
