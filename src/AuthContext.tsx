/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from './types';

interface AuthContextType {
    user: User | null;
    login: (email: string, password?: string, name?: string, isRegister?: boolean) => Promise<void>;
    googleLogin: (email: string, name: string, googleId: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAdmin: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });
    const [error, setError] = useState<string | null>(null);

    const refreshUser = async () => {
        if (user) {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
            } catch (err) {
                console.error("Failed to fetch user data", err);
            }
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const login = async (email: string, password?: string, name?: string, isRegister?: boolean) => {
        try {
            setError(null);
            const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Authentication failed');
                throw new Error(data.error || 'Authentication failed');
            }
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
        } catch (error: any) {
            console.error("Login/Register failed", error);
            throw error;
        }
    };

    const googleLogin = async (email: string, name: string, googleId: string) => {
        try {
            setError(null);
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, googleId })
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Google Auth failed');
                throw new Error(data.error || 'Google Auth failed');
            }
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
        } catch (error: any) {
            console.error("Google login failed", error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        // Optional: Call logout endpoint if cookies are used to clear token
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    };

    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, login, googleLogin, logout, refreshUser, isAdmin, error }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
