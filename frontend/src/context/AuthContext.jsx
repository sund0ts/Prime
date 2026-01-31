import React, { createContext, useContext, useState, useEffect } from 'react';
import { usersApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    usersApi
      .me()
      .then((data) => setUser({ id: data.id, nickname: data.nickname, role: data.role, avatar_emoji: data.avatar_emoji, staff: data.staff }))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshMe = () => {
    return usersApi.me().then((data) => {
      setUser((prev) => ({ ...prev, nickname: data.nickname, role: data.role, avatar_path: data.avatar_path, staff: data.staff }));
      return data;
    });
  };

  const isCuratorOrAdmin = user && (user.role === 'curator' || user.role === 'admin');
  const isAdmin = user && user.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshMe, isCuratorOrAdmin, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth only inside AuthProvider');
  return ctx;
}
