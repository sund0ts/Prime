import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';

export default function Register() {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    if (password.length < 6) {
      setError('Пароль минимум 6 символов');
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.register(nickname, password);
      login(data.token, {
        id: data.userId,
        nickname: data.nickname,
        role: data.role,
        avatar_path: null,
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass" style={{ maxWidth: 400, margin: '80px auto', padding: 32 }}>
      <h1 style={{ marginBottom: 24, textAlign: 'center', fontSize: '1.5rem' }}>Регистрация — Arizona Prime</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Никнейм</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Никнейм (2–64 символа)"
            required
            minLength={2}
            maxLength={64}
            autoComplete="username"
          />
        </div>
        <div className="form-group">
          <label>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Минимум 6 символов"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <div className="form-group">
          <label>Повторите пароль</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Повторите пароль"
            required
            autoComplete="new-password"
          />
        </div>
        {error && <p style={{ color: 'var(--danger)', marginBottom: 12, fontSize: '0.9rem' }}>{error}</p>}
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} disabled={loading}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
}
