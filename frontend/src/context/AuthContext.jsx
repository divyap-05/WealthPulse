import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { apiRequest } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authStateRevision = useRef(0);

  const checkAuth = useCallback(async () => {
    const requestRevision = authStateRevision.current;
    try {
      const res = await apiRequest('/auth/me');
      if (authStateRevision.current === requestRevision) {
        setUser(res.success && res.user ? res.user : null);
      }
    } catch (err) {
      if (authStateRevision.current === requestRevision) setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  }, []);

  const enterDemo = useCallback(async () => {
    // Invalidate any earlier /auth/me request so its old account response
    // cannot overwrite the demo identity after this transition succeeds.
    const requestRevision = authStateRevision.current + 1;
    authStateRevision.current = requestRevision;
    try {
      const res = await apiRequest('/demo/enter', {
        method: 'POST',
      });
      if (authStateRevision.current === requestRevision && res.success && res.user) {
        setUser(res.user);
      }
      return res;
    } catch (error) {
      // If demo entry fails, restore the session identity that is still in the cookie.
      if (authStateRevision.current === requestRevision) await checkAuth();
      throw error;
    }
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (data) => {
    const res = await apiRequest('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    enterDemo,
    logout,
    updateProfile,
    isAuthenticated: Boolean(user),
  }), [user, loading, login, register, enterDemo, logout, updateProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
