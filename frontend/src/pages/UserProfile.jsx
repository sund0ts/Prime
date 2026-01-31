import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersApi, punishmentsApi, staffApi, avatarUrl } from '../api';

const ROLE_LABELS = { admin: 'Администратор', curator: 'Куратор', user: 'Пользователь' };

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('ru-RU');
}

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me, isCuratorOrAdmin, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [punishments, setPunishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminEdit, setAdminEdit] = useState(false);
  const [form, setForm] = useState({ nickname: '', real_name: '', position: '', vk_url: '', discord_url: '', telegram_url: '', role: '', points: '' });
  const [punishmentModal, setPunishmentModal] = useState(null);

  const isMe = Number(id) === me?.id;

  useEffect(() => {
    usersApi
      .get(id)
      .then((d) => {
        setData(d);
        setForm({
          nickname: d.nickname,
          real_name: d.staff?.real_name || '',
          position: d.staff?.position || '',
          vk_url: d.vk_url || '',
          discord_url: d.discord_url || '',
          telegram_url: d.telegram_url || '',
          role: d.role,
          points: d.staff?.points ?? '',
        });
        if (d.staff) {
          return punishmentsApi.byStaff(d.staff.id).then(setPunishments);
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  const saveAdminProfile = async () => {
    try {
      await usersApi.updateProfile(id, {
        nickname: form.nickname,
        real_name: form.real_name,
        position: form.position,
        vk_url: form.vk_url,
        discord_url: form.discord_url,
        telegram_url: form.telegram_url,
        role: isAdmin ? form.role : undefined,
      });
      if (data.staff && form.points !== '' && form.points !== undefined) {
        await staffApi.update(data.staff.id, { points: Number(form.points) });
      }
      setData((prev) => ({ ...prev, nickname: form.nickname, vk_url: form.vk_url, discord_url: form.discord_url, telegram_url: form.telegram_url, role: form.role, staff: prev.staff ? { ...prev.staff, real_name: form.real_name, position: form.position, points: form.points } : null }));
      setAdminEdit(false);
    } catch (e) {
      alert(e.message);
    }
  };

  const issuePunishment = async (staffId, type, reason) => {
    try {
      await punishmentsApi.issue(staffId, type, reason);
      const list = await punishmentsApi.byStaff(staffId);
      setPunishments(list);
      setPunishmentModal(null);
    } catch (e) {
      alert(e.message);
    }
  };

  const removePunishment = async (punishmentId) => {
    try {
      await punishmentsApi.remove(punishmentId);
      if (data.staff) {
        const list = await punishmentsApi.byStaff(data.staff.id);
        setPunishments(list);
      }
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Загрузка профиля...</p>;
  if (!data) return <p style={{ color: 'var(--danger)' }}>Пользователь не найден.</p>;

  const avatarSrc = data.avatar_path ? avatarUrl(data.avatar_path) : null;
  const warningsCount = data.warnings_count ?? 0;
  const reprimandsCount = data.reprimands_count ?? 0;

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <button className="btn" onClick={() => navigate(-1)}>← Назад</button>
        <h1 style={{ fontSize: '1.5rem' }}>Профиль</h1>
      </div>
      <div className="glass" style={{ padding: 24, maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 24 }}>
          <div className="mini-profile-avatar" style={{ width: 80, height: 80 }}>
            {avatarSrc ? <img src={avatarSrc} alt="" /> : <div className="avatar-placeholder" style={{ fontSize: 32 }}>👤</div>}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 4 }}>{data.nickname}</h2>
            <p className={`role-${data.role}`} style={{ marginBottom: 4 }}>{ROLE_LABELS[data.role]}</p>
            {data.staff?.position && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 4 }}>Должность: {data.staff.position}</p>}
            <p style={{ marginBottom: 8 }}>
              <span className="badge badge-warning" style={{ marginRight: 8 }}>Предупреждения: {warningsCount}</span>
              <span className="badge badge-danger">Выговоры: {reprimandsCount}</span>
            </p>
            {data.staff && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Имя: {data.staff.real_name || '—'} · Баллы: {data.staff.points ?? '—'} · Назначен: {formatDate(data.staff.appointment_date)}
              </p>
            )}
            {isCuratorOrAdmin && !isMe && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => setAdminEdit(true)}>Редактировать профиль</button>
                {data.staff && (
                  <button className="btn btn-danger" onClick={() => setPunishmentModal({ action: 'issue' })}>Выдать наказание</button>
                )}
              </div>
            )}
          </div>
        </div>

        <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>Ссылки</h3>
        <p>ВК: {data.vk_url ? <a href={data.vk_url} target="_blank" rel="noopener noreferrer">{data.vk_url}</a> : '—'}</p>
        <p>Discord: {data.discord_url || '—'}</p>
        <p>Telegram: {data.telegram_url || '—'}</p>

        <h3 style={{ marginTop: 24, marginBottom: 12, fontSize: '1rem' }}>История наказаний</h3>
        {punishments.length ? (
          <div className="table-wrap" style={{ marginTop: 8 }}>
            <table>
              <thead>
                <tr>
                  <th>Тип</th>
                  <th>Причина</th>
                  <th>Кто выдал</th>
                  <th>Дата</th>
                  <th>Снято</th>
                  {isCuratorOrAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {punishments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className={`badge ${p.type === 'reprimand' ? 'badge-danger' : 'badge-warning'}`}>
                        {p.type === 'reprimand' ? 'Выговор' : 'Предупреждение'}
                      </span>
                    </td>
                    <td>{p.reason || '—'}</td>
                    <td>{p.issued_by_nickname}</td>
                    <td>{formatDate(p.issued_at)}</td>
                    <td>{p.removed_at ? formatDate(p.removed_at) : '—'}</td>
                    {isCuratorOrAdmin && !p.removed_at && (
                      <td>
                        <button className="btn" style={{ padding: '4px 10px', fontSize: '0.85rem' }} onClick={() => removePunishment(p.id)}>Снять</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>Нет наказаний.</p>
        )}
      </div>

      {adminEdit && (
        <div className="modal-overlay" onClick={() => setAdminEdit(false)}>
          <div className="modal glass" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <h2>Редактирование профиля</h2>
            <div className="form-group">
              <label>Никнейм</label>
              <input value={form.nickname} onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Должность</label>
              <input value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} placeholder="Название должности" />
            </div>
            <div className="form-group">
              <label>Имя</label>
              <input value={form.real_name} onChange={(e) => setForm((f) => ({ ...f, real_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>ВК</label>
              <input value={form.vk_url} onChange={(e) => setForm((f) => ({ ...f, vk_url: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Discord</label>
              <input value={form.discord_url} onChange={(e) => setForm((f) => ({ ...f, discord_url: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Telegram</label>
              <input value={form.telegram_url} onChange={(e) => setForm((f) => ({ ...f, telegram_url: e.target.value }))} />
            </div>
            {isAdmin && (
              <div className="form-group">
                <label>Роль</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                  <option value="user">Пользователь</option>
                  <option value="curator">Куратор</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            )}
            {data.staff && (
              <div className="form-group">
                <label>Баллы</label>
                <input type="number" value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={saveAdminProfile}>Сохранить</button>
              <button className="btn" onClick={() => setAdminEdit(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {punishmentModal?.action === 'issue' && data.staff && (
        <PunishmentIssueModal
          onClose={() => setPunishmentModal(null)}
          onIssue={(type, reason) => issuePunishment(data.staff.id, type, reason)}
        />
      )}
    </div>
  );
}

function PunishmentIssueModal({ onClose, onIssue }) {
  const [type, setType] = useState('warning');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    onIssue(type, reason).finally(() => setLoading(false));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal glass" onClick={(e) => e.stopPropagation()}>
        <h2>Выдать наказание</h2>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Тип</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="warning">Предупреждение</option>
              <option value="reprimand">Выговор</option>
            </select>
          </div>
          <div className="form-group">
            <label>Причина</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-danger" disabled={loading}>{loading ? 'Отправка...' : 'Выдать'}</button>
            <button type="button" className="btn" onClick={onClose}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}
