import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PublicLayout from './components/PublicLayout';
import Home from './pages/Home';
import Anketa from './pages/Anketa';
import Company from './pages/Company';
import Leadership from './pages/Leadership';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function AdminRoute() {
  const { user, loading, isAdmin } = useAuth();
  if (loading) {
    return (
      <div className="public-layout" style={{ justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>
      </div>
    );
  }
  if (!user) return <AdminLogin />;
  return <AdminDashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="anketa" element={<Anketa />} />
        <Route path="company" element={<Company />} />
        <Route path="leadership" element={<Leadership />} />
      </Route>
      <Route path="/admin" element={<AdminRoute />} />
      <Route path="/login" element={<Navigate to="/admin" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/administration" element={<Navigate to="/" replace />} />
      <Route path="/inactives" element={<Navigate to="/" replace />} />
      <Route path="/profile" element={<Navigate to="/" replace />} />
      <Route path="/admin-panel" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
