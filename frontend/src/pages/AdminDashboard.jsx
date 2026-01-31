import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  applicationsApi,
  leadershipApi,
  leadershipAvatarUrl,
} from '../api';

export default function AdminDashboard() {
  const { user, isAdmin, logout } = useAuth();
  const [tab, setTab] = useState('applications');
  const [applications, setApplications] = useState([]);
  const [leadership, setLeadership] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', position: '', bio: '', sort_order: 0 });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadApplications = () => {
    applicationsApi.list().then(setApplications).catch(() => setApplications([]));
  };

  const loadLeadership = () => {
    leadershipApi.list().then(setLeadership).catch(() => setLeadership([]));
  };

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    Promise.all([applicationsApi.list().then(setApplications).catch(() => []), leadershipApi.list().then(setLeadership).catch(() => [])])
      .finally(() => setLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    if (tab === 'applications') loadApplications();
    if (tab === 'leadership') loadLeadership();
  }, [tab]);

  const openAddLeadership = () => {
    setForm({ name: '', position: '', bio: '', sort_order: leadership.length });
    setModal('add');
    setError('');
  };

  const openEditLeadership = (person) => {
    setForm({
      id: person.id,
      name: person.name,
      position: person.position || '',
      bio: person.bio || '',
      sort_order: person.sort_order ?? 0,
    });
    setModal('edit');
    setError('');
  };

  const saveLeadership = async () => {
    setError('');
    setSaving(true);
    try {
      if (modal === 'add') {
        await leadershipApi.add({
          name: form.name,
          position: form.position,
          bio: form.bio,
          sort_order: form.sort_order,
        });
        loadLeadership();
        setModal(null);
      } else {
        await leadershipApi.update(form.id, {
          name: form.name,
          position: form.position,
          bio: form.bio,
          sort_order: form.sort_order,
        });
        loadLeadership();
        setModal(null);
      }
    } catch (err) {
      setError(err.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const deleteLeadership = async (id) => {
    if (!confirm('Удалить этого сотрудника?')) return;
    try {
      await leadershipApi.delete(id);
      loadLeadership();
      setModal(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const uploadAvatar = async (id, file) => {
    if (!file) return;
    try {
      await leadershipApi.uploadAvatar(id, file);
      loadLeadership();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-layout">
        <p className="error-msg">Недостаточно прав. Только администратор может открыть эту страницу.</p>
        <button type="button" className="glass-btn" onClick={logout}>Выйти</button>
        <a href="/" className="glass-btn" style={{ marginLeft: 8 }}>На главную</a>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 className="font-geo" style={{ fontSize: '1.5rem' }}>Панель администратора</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user?.nickname}</span>
          <button type="button" className="glass-btn" onClick={logout}>Выйти</button>
          <a href="/" className="glass-btn">На сайт</a>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          type="button"
          className={`glass-btn ${tab === 'applications' ? 'active' : ''}`}
          onClick={() => setTab('applications')}
        >
          Заявления
        </button>
        <button
          type="button"
          className={`glass-btn ${tab === 'leadership' ? 'active' : ''}`}
          onClick={() => setTab('leadership')}
        >
          Руководящий состав
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>
      ) : tab === 'applications' ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Никнейм</th>
                <th>Должность</th>
                <th>Discord</th>
                <th>ВК</th>
                <th>Форум</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr><td colSpan={6} style={{ color: 'var(--text-muted)' }}>Нет заявлений</td></tr>
              ) : (
                applications.map((a) => (
                  <tr key={a.id}>
                    <td>{a.game_nickname}</td>
                    <td>{a.server_position}</td>
                    <td>{a.discord || '—'}</td>
                    <td>{a.vk_url ? <a href={a.vk_url} target="_blank" rel="noopener noreferrer">Ссылка</a> : '—'}</td>
                    <td>{a.forum_url ? <a href={a.forum_url} target="_blank" rel="noopener noreferrer">Ссылка</a> : '—'}</td>
                    <td>{new Date(a.created_at).toLocaleDateString('ru')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <button type="button" className="glass-btn primary" onClick={openAddLeadership} style={{ marginBottom: 20 }}>
            Добавить в руководство
          </button>
          <div className="leadership-grid">
            {leadership.map((person) => (
              <div key={person.id} className="glass leadership-card" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flex: 1 }}>
                  <label style={{ cursor: 'pointer' }}>
                    {person.avatar_path ? (
                      <img src={leadershipAvatarUrl(person.avatar_path)} alt="" className="leadership-avatar" />
                    ) : (
                      <div className="avatar-placeholder">?</div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(person.id, f); e.target.value = ''; }}
                    />
                  </label>
                  <div className="leadership-info">
                    <h3>{person.name}</h3>
                    {person.position && <p className="leadership-position">{person.position}</p>}
                    {person.bio && <p className="leadership-bio" style={{ maxWidth: 400 }}>{person.bio}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="glass-btn" onClick={() => openEditLeadership(person)}>Изменить</button>
                  <button type="button" className="glass-btn btn-danger" onClick={() => deleteLeadership(person.id)}>Удалить</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modal && (modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{modal === 'add' ? 'Добавить сотрудника' : 'Редактировать'}</h2>
            <div className="form-group">
              <label>Имя</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ФИО или псевдоним"
              />
            </div>
            <div className="form-group">
              <label>Должность</label>
              <input
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="Должность"
              />
            </div>
            <div className="form-group">
              <label>О сотруднике</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Краткое описание"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Порядок (число)</label>
              <input
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="button" className="glass-btn primary" onClick={saveLeadership} disabled={saving}>
                {saving ? 'Сохранение…' : 'Сохранить'}
              </button>
              <button type="button" className="glass-btn" onClick={() => setModal(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
