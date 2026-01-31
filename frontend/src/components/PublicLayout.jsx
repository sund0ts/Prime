import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

export default function PublicLayout() {
  const location = useLocation();
  const is = (path) => location.pathname === path;
  const isHome = location.pathname === '/';

  return (
    <div className="public-layout">
      <nav className="nav-top">
        <Link
          to="/"
          className={`glass-btn ${isHome ? 'active' : ''}`}
        >
          Главная
        </Link>
        <Link
          to="/anketa"
          className={`glass-btn ${is('/anketa') ? 'active' : ''}`}
        >
          Анкета
        </Link>
        <Link
          to="/company"
          className={`glass-btn ${is('/company') ? 'active' : ''}`}
        >
          О компании Arizona Prime
        </Link>
        <Link
          to="/leadership"
          className={`glass-btn ${is('/leadership') ? 'active' : ''}`}
        >
          Руководящий состав
        </Link>
      </nav>
      <Outlet />
      <Link to="/admin" className="admin-entry" title="Вход для администратора" aria-label="Админ">
        &#x2699;
      </Link>
    </div>
  );
}
