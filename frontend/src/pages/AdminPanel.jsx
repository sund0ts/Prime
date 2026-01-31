import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logsApi, usersApi, staffApi, authApi, avatarUrl } from '../api';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('ru-RU');
}

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('logs');
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addStaffModal, setAddStaffModal] = useState(false);
  const [addStaffUserId, setAddStaffUserId] = useState('');
  const [addStaffName, setAddStaffName] = useState('');
  const [addStaffPosition, setAddStaffPosition] = useState('');
  const [addStaffDate, setAddStaffDate] = useState('');
  const [addStaffPoints, setAddStaffPoints] = useState(0);
  const [createUserModal, setCreateUserModal] = useState(false);
  const [createNickname, setCreateNickname] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (tab === 'logs') {
      setLoading(true);
      logsApi.list(200, 0).then(setLogs).catch(() => setLogs([])).finally(() => setLoading(false));
    } else if (tab === 'users' && isAdmin) {
      setLoading(true);
      usersApi.listAll().then(setUsers).catch(() => setUsers([])).finally(() => setLoading(false));
    } else if (tab === 'staff') {
      setLoading(true);
      staffApi.list().then(setStaff).catch(() => setStaff([])).finally(() => setLoading(false));
    }
  }, [tab, isAdmin]);

  useEffect(() => {
    if (addStaffModal && isAdmin) {
      usersApi.listAll().then(setUsers).catch(() => setUsers([]));
    }
  }, [addStaffModal, isAdmin]);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!addStaffUserId) return;
    setLoading(true);
    try {
      await staffApi.add({
        user_id: Number(addStaffUserId),
        real_name: addStaffName,
        position: addStaffPosition,
        appointment_date: addStaffDate || null,
        points: Number(addStaffPoints) || 0,
      });
      setAddStaffModal(false);
      setAddStaffUserId('');
      setAddStaffName('');
      setAddStaffPosition('');
      setAddStaffDate('');
      setAddStaffPoints(0);
      if (tab === 'staff') staffApi.list().then(setStaff);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeStaff = async (id) => {
    if (!confirm('Удалить из состава?')) return;
    try {
      await staffApi.remove(id);
      setStaff((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24, fontSize: '1.5rem' }}>Админ-панель</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button className={`btn ${tab === 'logs' ? 'btn-primary' : ''}`} onClick={() => setTab('logs')}>Логи</button>
        <button className={`btn ${tab === 'staff' ? 'btn-primary' : ''}`} onClick={() => setTab('staff')}>Состав</button>
        {isAdmin && <button className={`btn ${tab === 'users' ? 'btn-primary' : ''}`} onClick={() => setTab('users')}>Пользователи</button>}
        {isAdmin && <button className="btn btn-primary" onClick={() => setCreateUserModal(true)}>Добавить пользователя</button>}
      </div>

      {tab === 'logs' && (
        <div className="glass table-wrap">
          <table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Пользователь</th>
                <th>Действие</th>
                <th>Детали</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}>Загрузка...</td></tr>
              ) : (
                logs.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.created_at)}</td>
                    <td>{row.nickname || `id:${row.user_id}`}</td>
                    <td>{row.action}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.details && typeof row.details === 'string' ? row.details : JSON.stringify(row.details || {})}
                    </td>
                    <td>{row.ip || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'staff' && (
        <div>
          {isAdmin && (
            <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={() => setAddStaffModal(true)}>
              Добавить в состав
            </button>
          )}
          <div className="glass table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ник</th>
                  <th>Должность</th>
                  <th>Имя</th>
                  <th>Дата назначения</th>
                  <th>Баллы</th>
                  {isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {staff.map((row) => (
                  <tr key={row.id}>
                    <td>{row.avatar_emoji} {row.nickname}</td>
                    <td>{row.real_name || '—'}</td>
                    <td>{formatDate(row.appointment_date)}</td>
                    <td>{row.points ?? '—'}</td>
                    {isAdmin && (
                      <td>
                        <a href={`/profile/${row.user_id}`} className="btn" style={{ marginRight: 8 }}>Профиль</a>
                        <button className="btn btn-danger" style={{ padding: '4px 10px' }} onClick={() => removeStaff(row.id)}>Удалить</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'users' && isAdmin && (
        <div className="glass table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ник</th>
                <th>Роль</th>
                <th>Регистрация</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((row) => (
                <tr key={row.id}>
                  <td>{row.nickname}</td>
                  <td><span className={`badge role-${row.role}`}>{row.role}</span></td>
                  <td>{formatDate(row.created_at)}</td>
                  <td><Link to={`/profile/${row.id}`} className="btn">Профиль</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {addStaffModal && (
        <div className="modal-overlay" onClick={() => setAddStaffModal(false)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <h2>Добавить в состав администрации</h2>
            <form onSubmit={handleAddStaff}>
              <div className="form-group">
                <label>Пользователь</label>
                <select value={addStaffUserId} onChange={(e) => setAddStaffUserId(e.target.value)} required>
                  <option value="">Выберите пользователя</option>
                  {users
                    .filter((u) => !staff.some((s) => s.user_id === u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>{u.nickname} ({u.role})</option>
                    ))}
                </select>
                {users.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>Загрузка списка...</p>}
              </div>
              <div className="form-group">
                <label>Должность</label>
                <input value={addStaffPosition} onChange={(e) => setAddStaffPosition(e.target.value)} placeholder="Название должности" />
              </div>
              <div className="form-group">
                <label>Имя</label>
                <input value={addStaffName} onChange={(e) => setAddStaffName(e.target.value)} placeholder="Реальное имя" />
              </div>
              <div className="form-group">
                <label>Дата назначения</label>
                <input type="date" value={addStaffDate} onChange={(e) => setAddStaffDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Баллы</label>
                <input type="number" min={0} value={addStaffPoints} onChange={(e) => setAddStaffPoints(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Добавление...' : 'Добавить'}</button>
                <button type="button" className="btn" onClick={() => setAddStaffModal(false)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {createUserModal && (
        <div className="modal-overlay" onClick={() => setCreateUserModal(false)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <h2>Добавить пользователя</h2>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Никнейм</label>
                <input value={createNickname} onChange={(e) => setCreateNickname(e.target.value)} placeholder="Никнейм" required minLength={2} maxLength={64} />
              </div>
              <div className="form-group">
                <label>Пароль</label>
                <input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} placeholder="Минимум 6 символов" required minLength={6} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Создание...' : 'Создать'}</button>
                <button type="button" className="btn" onClick={() => setCreateUserModal(false)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
