import { getDb } from '../offline/db';

export const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:4000/api/v1";

async function readToken(): Promise<string | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
        const t = window.localStorage.getItem('token');
        if (t) return t;
    }
    if (typeof indexedDB !== 'undefined') {
        try {
            const db = await getDb();
            return (await db.get('auth', 'token')) || null;
        } catch { /* ignore */ }
    }
    return null;
}

async function writeToken(token: string) {
    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('token', token);
    }
    try {
        const db = await getDb();
        await db.put('auth', token, 'token');
    } catch { /* ignore */ }
}

async function clearToken() {
    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('token');
    }
    try {
        const db = await getDb();
        await db.delete('auth', 'token');
    } catch { /* ignore */ }
}

// Single in-flight refresh promise — prevents thundering-herd refresh
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
        try {
            const res = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
            });
            if (!res.ok) return null;
            const data = await res.json();
            if (data.accessToken) {
                await writeToken(data.accessToken);
                return data.accessToken;
            }
            return null;
        } catch {
            return null;
        } finally {
            // Reset after a tick so concurrent callers share the same in-flight refresh
            setTimeout(() => { refreshPromise = null; }, 0);
        }
    })();
    return refreshPromise;
}

export const fetchApi = async (endpoint: string, options: RequestInit = {}, _retry = false): Promise<any> => {
    const token = await readToken();

    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
    });

    // Auto-refresh on 401 (one retry only; refresh endpoint excluded)
    if (res.status === 401 && !_retry && !endpoint.startsWith('/auth/refresh') && !endpoint.startsWith('/auth/login')) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            return fetchApi(endpoint, options, true);
        }
        await clearToken();
    }

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        const err: any = new Error(error.error || error.message || 'Request failed');
        err.status = res.status;
        throw err;
    }

    return res.json();
};
