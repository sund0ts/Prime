import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';

export default function Login() {
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
      navigate('/');
    } catch (err) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass" style={{ maxWidth: 400, margin: '80px auto', padding: 32 }}>
      <h1 style={{ marginBottom: 24, textAlign: 'center', fontSize: '1.5rem' }}>Вход — Arizona Prime</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Никнейм</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Никнейм"
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
        {error && <p style={{ color: 'var(--danger)', marginBottom: 12, fontSize: '0.9rem' }}>{error}</p>}
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Нет аккаунта? <Link to="/register">Регистрация</Link>
      </p>
    </div>
  );
}
