import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';

export default function AdminLogin() {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login(nickname, password);
      login(data.token, {
        id: data.userId,
        nickname: data.nickname,
        role: data.role,
        avatar_path: data.avatar_path,
      });
      if (data.role === 'admin') {
        navigate('/admin');
      } else {
        setError('Доступ только для администратора');
      }
    } catch (err) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-layout">
      <div className="glass" style={{ maxWidth: 400, padding: 32, marginTop: 40 }}>
        <h1 className="font-geo" style={{ marginBottom: 24, textAlign: 'center', fontSize: '1.5rem' }}>
          Вход для администратора
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Логин</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Логин"
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="glass-btn primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Вход…' : 'Войти'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/" className="glass-btn" style={{ display: 'inline-block' }}>На главную</Link>
        </p>
      </div>
    </div>
  );
}
