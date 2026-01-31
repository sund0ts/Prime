import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersApi, avatarUrl } from '../api';

const ROLE_LABELS = { admin: 'Администратор', curator: 'Куратор', user: 'Пользователь' };

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('ru-RU');
}

export default function Profile() {
  const { user, refreshMe } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ vk_url: '', discord_url: '', telegram_url: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    usersApi
      .me()
      .then((d) => {
        setData(d);
        setForm({ vk_url: d.vk_url || '', discord_url: d.discord_url || '', telegram_url: d.telegram_url || '' });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await usersApi.updateMe(form);
      await refreshMe();
      setData((prev) => ({ ...prev, ...form }));
      setEditing(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await usersApi.uploadAvatar(file);
      await refreshMe();
      setData((prev) => ({ ...prev, avatar_path: result.avatar_path }));
    } catch (err) {
      alert(err.message || 'Ошибка загрузки');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Загрузка профиля...</p>;
  if (!data) return <p style={{ color: 'var(--danger)' }}>Не удалось загрузить профиль.</p>;

  const avatarSrc = data.avatar_path ? avatarUrl(data.avatar_path) : null;

  return (
    <div>
      <h1 style={{ marginBottom: 24, fontSize: '1.5rem' }}>Мой профиль</h1>
      <div className="glass" style={{ padding: 24, maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <div className="mini-profile-avatar" style={{ width: 80, height: 80 }}>
              {avatarSrc ? <img src={avatarSrc} alt="" /> : <div className="avatar-placeholder" style={{ fontSize: 32 }}>👤</div>}
            </div>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={onAvatarChange} style={{ display: 'none' }} />
            <button type="button" className="btn" style={{ marginTop: 8, width: '100%', padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Загрузка...' : 'Загрузить аватар'}
            </button>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 4 }}>{data.nickname}</h2>
            <p className={`role-${data.role}`} style={{ marginBottom: 4 }}>{ROLE_LABELS[data.role]}</p>
            {data.staff && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {data.staff.position && <span>Должность: {data.staff.position} · </span>}
                Имя: {data.staff.real_name || '—'} · Баллы: {data.staff.points ?? '—'} · Назначен: {formatDate(data.staff.appointment_date)}
              </p>
            )}
          </div>
          {!editing ? (
            <button className="btn btn-primary" onClick={() => setEditing(true)}>Редактировать</button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
              <button className="btn" onClick={() => { setEditing(false); setForm({ vk_url: data.vk_url || '', discord_url: data.discord_url || '', telegram_url: data.telegram_url || '' }); }}>Отмена</button>
            </div>
          )}
        </div>

        <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>Ссылки</h3>
        <div className="form-group">
          <label>ВКонтакте</label>
          {editing ? (
            <input value={form.vk_url} onChange={(e) => setForm((f) => ({ ...f, vk_url: e.target.value }))} placeholder="https://vk.com/..." />
          ) : (
            <p>{data.vk_url ? <a href={data.vk_url} target="_blank" rel="noopener noreferrer">{data.vk_url}</a> : '—'}</p>
          )}
        </div>
        <div className="form-group">
          <label>Discord</label>
          {editing ? (
            <input value={form.discord_url} onChange={(e) => setForm((f) => ({ ...f, discord_url: e.target.value }))} placeholder="Discord или ссылка" />
          ) : (
            <p>{data.discord_url || '—'}</p>
          )}
        </div>
        <div className="form-group">
          <label>Telegram</label>
          {editing ? (
            <input value={form.telegram_url} onChange={(e) => setForm((f) => ({ ...f, telegram_url: e.target.value }))} placeholder="@nick или ссылка" />
          ) : (
            <p>{data.telegram_url || '—'}</p>
          )}
        </div>

        <h3 style={{ marginTop: 24, marginBottom: 12, fontSize: '1rem' }}>История наказаний</h3>
        {(data.warnings_count > 0 || data.reprimands_count > 0) && (
          <p style={{ marginBottom: 8 }}>
            <span className="badge badge-warning" style={{ marginRight: 8 }}>Предупреждения: {data.warnings_count ?? 0}</span>
            <span className="badge badge-danger">Выговоры: {data.reprimands_count ?? 0}</span>
          </p>
        )}
        {data.punishments?.length ? (
          <div className="table-wrap" style={{ marginTop: 8 }}>
            <table>
              <thead>
                <tr>
                  <th>Тип</th>
                  <th>Причина</th>
                  <th>Кто выдал</th>
                  <th>Дата</th>
                  <th>Снято</th>
                </tr>
              </thead>
              <tbody>
                {data.punishments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className={`badge ${p.type === 'reprimand' ? 'badge-danger' : 'badge-warning'}`}>
                        {p.type === 'reprimand' ? 'Выговор' : 'Предупреждение'}
                      </span>
                    </td>
                    <td>{p.reason || '—'}</td>
                    <td>{p.issued_by}</td>
                    <td>{formatDate(p.issued_at)}</td>
                    <td>{p.removed_at ? formatDate(p.removed_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>Нет наказаний.</p>
        )}
      </div>
    </div>
  );
}
