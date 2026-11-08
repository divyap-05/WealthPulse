import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { apiRequest } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await apiRequest('/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
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
    const res = await apiRequest('/demo/enter', {
      method: 'POST',
    });
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  }, []);

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
