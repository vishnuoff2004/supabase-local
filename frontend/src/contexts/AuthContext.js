import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.id, role: payload.role });
        const exp = payload.exp * 1000;
        if (Date.now() >= exp) {
          logout();
        }
      } catch {
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message
        || err.message
        || 'Login failed';
      console.error('Login error:', err?.response?.status, err?.response?.data, err?.message);
      setError(msg);
      throw err;
    }
  }, []);

  const register = useCallback(async (data) => {
    try {
      setError(null);
      const res = await api.post('/auth/register', data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
