import React, { useState } from 'react';
import { applicationsApi } from '../api';

export default function Anketa() {
  const [form, setForm] = useState({
    game_nickname: '',
    server_position: '',
    discord: '',
    vk_url: '',
    forum_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    const position = form.server_position.trim() || '—';
    setLoading(true);
    try {
      await applicationsApi.submit({
        game_nickname: form.game_nickname.trim(),
        server_position: position,
        discord: form.discord.trim(),
        vk_url: form.vk_url.trim(),
        forum_url: form.forum_url.trim(),
      });
      setSuccess(true);
      setForm({ game_nickname: '', server_position: '', discord: '', vk_url: '', forum_url: '' });
    } catch (err) {
      setError(err.message || 'Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <h2 className="page-title font-geo">Анкета</h2>
      <form onSubmit={handleSubmit} className="glass" style={{ padding: '28px' }}>
        <div className="form-group">
          <label>Игровой никнейм *</label>
          <input
            name="game_nickname"
            value={form.game_nickname}
            onChange={handleChange}
            placeholder="Ваш ник в игре"
            required
          />
        </div>
        <div className="form-group">
          <label>Должность на сервере *</label>
          <input
            name="server_position"
            value={form.server_position}
            onChange={handleChange}
            placeholder="— если нет; для админа — должность; для лидера/зама — должность и название организации"
          />
          <small style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px', display: 'block' }}>
            При отсутствии укажите прочерк (—). Администратор — свою должность. Лидер/заместитель организации — должность и название организации.
          </small>
        </div>
        <div className="form-group">
          <label>Discord</label>
          <input
            name="discord"
            value={form.discord}
            onChange={handleChange}
            placeholder="Ник или ссылка"
          />
        </div>
        <div className="form-group">
          <label>ВКонтакте</label>
          <input
            name="vk_url"
            value={form.vk_url}
            onChange={handleChange}
            placeholder="Ссылка на страницу (ID можно узнать на regvk.com)"
            type="url"
          />
        </div>
        <div className="form-group">
          <label>Форумный аккаунт</label>
          <input
            name="forum_url"
            value={form.forum_url}
            onChange={handleChange}
            placeholder="Ссылка на профиль на форуме"
            type="url"
          />
        </div>
        {error && <p className="error-msg">{error}</p>}
        {success && <p className="success-msg">Заявление успешно отправлено.</p>}
        <button type="submit" className="glass-btn primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
          {loading ? 'Отправка…' : 'Отправить заявление'}
        </button>
      </form>
    </div>
  );
}
