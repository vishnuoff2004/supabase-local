import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import supabase from '../services/supabase';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const profileCheckedRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.access_token) {
        localStorage.setItem('supabase_token', s.access_token);
        if (!profileCheckedRef.current) {
          profileCheckedRef.current = true;
          fetchUser(s.access_token);
        }
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        setSession(s);
        if (s?.access_token) {
          localStorage.setItem('supabase_token', s.access_token);
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (!profileCheckedRef.current) {
              profileCheckedRef.current = true;
              fetchUser(s.access_token);
            }
          }
        } else {
          localStorage.removeItem('supabase_token');
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  async function fetchUser(token) {
    try {
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email, password,
      });
      if (authError) throw authError;
      localStorage.setItem('supabase_token', data.session.access_token);
      setSession(data.session);
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${data.session.access_token}` }
      });
      setUser(res.data);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message
        || err.message
        || 'Login failed';
      setError(msg);
      throw err;
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      throw error;
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

  const setupRole = useCallback(async (data) => {
    try {
      setError(null);
      const token = localStorage.getItem('supabase_token');
      const res = await api.post('/auth/setup-role', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Setup failed');
      throw err;
    }
  }, []);

  const completeOAuthSetup = useCallback(async (data) => {
    try {
      setError(null);
      const token = localStorage.getItem('supabase_token');
      const res = await api.post('/auth/oauth-setup', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = res.data?.user || res.data;
      if (userData) setUser(userData);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'OAuth setup failed');
      throw err;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const activeToken = session?.access_token || localStorage.getItem('supabase_token');
    if (activeToken) {
      try {
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        setUser(res.data);
        return res.data;
      } catch (err) {
        setUser(null);
        throw err;
      }
    }
  }, [session]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('supabase_token');
    setSession(null);
    setUser(null);
  }, []);

  const token = session?.access_token || null;

  return (
    <AuthContext.Provider value={{
      user, session, token, loading, error,
      login, loginWithGoogle, register, setupRole, completeOAuthSetup, logout,
      fetchUser: refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
