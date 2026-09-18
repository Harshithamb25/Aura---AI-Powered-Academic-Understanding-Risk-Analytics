import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  demoLogin: (role: Role, id?: number) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('aura_auth_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (err) {
          console.warn('Session expired, logging out', err);
          logout();
        }
      } else {
        // Default to Demo Teacher Dr. Rajesh Iyer for instantaneous preview exploration!
        try {
          const res = await api.demoLogin('TEACHER', 101);
          setToken(res.token);
          setUser(res.user);
          localStorage.setItem('aura_auth_token', res.token);
        } catch (e) {
          console.error("Auto demo login failed", e);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await api.login(email, pass);
      localStorage.setItem('aura_auth_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role: Role, id?: number) => {
    setLoading(true);
    try {
      const res = await api.demoLogin(role, id);
      localStorage.setItem('aura_auth_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('aura_auth_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const res = await api.getMe();
        setUser(res.user);
      } catch (err) {
        console.error("Failed to refresh user", err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, demoLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
