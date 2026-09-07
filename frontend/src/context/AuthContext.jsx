import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // True until initial session check completes

  // ── Session restore on mount ───────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) { setLoading(false); return; }

      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch {
        // Token invalid/expired — try silent refresh
        try {
          const { data } = await api.post('/auth/refresh');
          localStorage.setItem('accessToken', data.accessToken);
          setUser(data.user);
        } catch {
          localStorage.removeItem('accessToken');
        }
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  // ── Listen for forced logout (expired refresh) ─────────────────────────
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      localStorage.removeItem('accessToken');
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  // ── Auth actions ───────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/signup', { name, email, password });
    return data; // Returns _devEmailVerifyToken for simulated flow
  }, []);

  const verifyEmail = useCallback(async (token) => {
    const { data } = await api.get(`/auth/verify-email/${token}`);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* best effort */ }
    localStorage.removeItem('accessToken');
    setUser(null);
  }, []);

  // Optimistically update upvotedPosts list locally after toggling
  const updateUpvote = useCallback((postId, voted) => {
    setUser((prev) => {
      if (!prev) return prev;
      const set = new Set(prev.upvotedPosts.map(String));
      if (voted) set.add(String(postId));
      else set.delete(String(postId));
      return { ...prev, upvotedPosts: Array.from(set) };
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, verifyEmail, logout, updateUpvote }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
