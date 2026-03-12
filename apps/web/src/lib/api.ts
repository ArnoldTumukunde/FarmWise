import { getDb } from '../offline/db';

export const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:4000/api/v1";

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
    let token = null;
    
    // Check if we are running in the browser (not in service worker)
    if (typeof window !== 'undefined' && window.localStorage) {
        token = window.localStorage.getItem('token');
    }
    
    // Fallback to IndexedDB (critical for background sync in Service Worker)
    if (!token && typeof indexedDB !== 'undefined') {
        try {
            const db = await getDb();
            token = await db.get('auth', 'token');
        } catch (e) {
            console.error('Failed to read auth token from IndexedDB', e);
        }
    }

    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || error.message || 'Request failed');
    }

    return res.json();
};
