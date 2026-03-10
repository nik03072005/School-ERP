import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '@/src/api/authService';
import type { LoginPayload, RegisterPayload } from '@/src/api/authService';

const TOKEN_KEY = 'school_erp_token';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile?: string;
  role: 'student' | 'teaching_staff' | 'non_teaching_staff' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  admission_status?: 'not_submitted' | 'pending' | 'approved' | 'rejected';
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore session from SecureStore
  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (stored) {
          setToken(stored);
          const { user: me } = await authService.getMe(stored);
          setUser(me);
        }
      } catch {
        // Token invalid or expired — clear it
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (payload: LoginPayload) => {
    const data = await authService.login(payload);
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      if (token) await authService.logout(token);
    } catch {
      // Stateless — ignore errors
    } finally {
      await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
      setToken(null);
      setUser(null);
    }
  };

  const register = async (payload: RegisterPayload) => {
    await authService.register(payload);
    // Accounts start as "pending" — do not auto-login
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const { user: me } = await authService.getMe(token);
      setUser(me);
    } catch {
      // Silently ignore — user stays as-is
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
