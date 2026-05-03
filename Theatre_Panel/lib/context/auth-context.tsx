'use client';

/**
 * Auth context — thin wrapper around Redux auth state.
 * All components that previously called `useAuth()` continue to work
 * unchanged; internally it reads from/dispatches to Redux instead of Supabase.
 */

import { createContext, useContext, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { Client_Login, Client_Logout, Client_Register } from '@/redux/Actions/auth.actions';
import { clearError } from '@/redux/Reducers/auth.reducers';
import type { AuthUser } from '@/lib/types/auth';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    phone?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading, error } = useAppSelector(
    (state) => state.auth
  );

  const signIn = async (email: string, password: string) => {
    await dispatch(Client_Login({ email, password }) as any);
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    phone?: string
  ) => {
    await dispatch(
      Client_Register({ name, email, password, phone }) as any
    );
  };

  const signOut = async () => {
    await dispatch(Client_Logout() as any);
  };

  const clearAuthError = () => dispatch(clearError());

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
