import { create } from 'zustand';
import { getDb } from '../offline/db';

interface User {
    id: string;
    role: 'FARMER' | 'INSTRUCTOR' | 'ADMIN';
}

interface AuthState {
    user: User | null;
    token: string | null;
    setAuth: (user: User, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    setAuth: (user, token) => {
        localStorage.setItem('token', token);
        getDb().then(db => db.put('auth', token, 'token')).catch(console.error);
        set({ user, token });
    },
    logout: () => {
        localStorage.removeItem('token');
        getDb().then(db => db.delete('auth', 'token')).catch(console.error);
        set({ user: null, token: null });
    },
}));
