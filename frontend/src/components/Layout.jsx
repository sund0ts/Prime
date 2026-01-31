import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { avatarUrl } from '../api';

const ROLE_LABELS = { admin: 'Администратор', curator: 'Куратор', user: 'Пользователь' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const avatarSrc = user?.avatar_path ? avatarUrl(user.avatar_path) : null;
  const position = user?.staff?.position || ROLE_LABELS[user?.role] || 'Пользователь';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div style={{ padding: '20px 20px 8px', borderBottom: '1px solid var(--glass-border)' }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>
            Arizona Prime
          </h1>
        </div>
        <nav className="sidebar-tabs">
          <NavLink to="/administration" className={({ isActive }) => `sidebar-tab ${isActive ? 'active' : ''}`}>
            <span>👥</span> Администрация
          </NavLink>
          <NavLink to="/inactives" className={({ isActive }) => `sidebar-tab ${isActive ? 'active' : ''}`}>
            <span>📋</span> Неактивы
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `sidebar-tab ${isActive ? 'active' : ''}`}>
            <span>👤</span> Мой профиль
          </NavLink>
          {(user?.role === 'curator' || user?.role === 'admin') && (
            <NavLink to="/admin" className={({ isActive }) => `sidebar-tab ${isActive ? 'active' : ''}`}>
              <span>⚙️</span> Админ-панель
            </NavLink>
          )}
        </nav>
        <div className="mini-profile">
          <div className="mini-profile-avatar">
            {avatarSrc ? <img src={avatarSrc} alt="" /> : <div className="avatar-placeholder">👤</div>}
          </div>
          <div className="mini-profile-info">
            <div className="mini-profile-nick">{user?.nickname || '—'}</div>
            <div className="mini-profile-role" style={{ color: 'var(--text-muted)' }}>{position}</div>
            <button type="button" onClick={handleLogout} className="btn" style={{ marginTop: 6, padding: '4px 8px', fontSize: '0.8rem' }}>Выйти</button>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
