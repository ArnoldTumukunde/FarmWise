import { create } from 'zustand';
import { getDb } from '../offline/db';

interface User {
    id: string;
    role: 'FARMER' | 'INSTRUCTOR' | 'ADMIN';
}

interface AuthState {
    user: User | null;
    token: string | null;
    initialized: boolean;
    setAuth: (user: User, token: string) => void;
    logout: () => void;
    init: () => Promise<void>;
}

function loadFromStorage(): { user: User | null; token: string | null } {
    try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        return { token, user };
    } catch {
        return { token: null, user: null };
    }
}

// Hydrate synchronously from localStorage so the first render has auth state
const initial = loadFromStorage();

export const useAuthStore = create<AuthState>((set, get) => ({
    user: initial.user,
    token: initial.token,
    initialized: false,
    setAuth: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        getDb().then(db => db.put('auth', token, 'token')).catch(console.error);
        set({ user, token });
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        getDb().then(db => db.delete('auth', 'token')).catch(console.error);
        set({ user: null, token: null });
    },
    init: async () => {
        const { token } = get();
        if (!token) {
            set({ initialized: true });
            return;
        }
        try {
            const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/api/v1';
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('user', JSON.stringify(data.user));
                set({ user: data.user, initialized: true });
            } else {
                // Token expired or invalid — clear auth
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                set({ user: null, token: null, initialized: true });
            }
        } catch {
            // Network error — keep local state, user might be offline
            set({ initialized: true });
        }
    },
}));
