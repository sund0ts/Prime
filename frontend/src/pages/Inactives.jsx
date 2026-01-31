import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { inactivesApi } from '../api';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const STATUS_LABELS = { pending: 'На рассмотрении', approved: 'Одобрен', rejected: 'Отклонён' };
const STATUS_CLASS = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' };

export default function Inactives() {
  const { user, isCuratorOrAdmin } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = () => {
    inactivesApi
      .list()
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id) => {
    try {
      await inactivesApi.approve(id);
      setModal(null);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await inactivesApi.reject(id, rejectReason);
      setModal(null);
      setRejectReason('');
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const hasPending = list.some((i) => i.user_id === user?.id && i.status === 'pending');

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Загрузка неактивов...</p>;
  if (error) return <p style={{ color: 'var(--danger)' }}>{error}</p>;

  return (
    <div>
      <h1 style={{ marginBottom: 24, fontSize: '1.5rem' }}>Неактивы</h1>
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          Подать заявку на неактив
        </button>
        {!user?.staff && (
          <p style={{ marginTop: 8, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Заявку могут подавать только сотрудники из состава администрации. Если вы в составе — после одобрения заявка появится в списке.
          </p>
        )}
      </div>
      <div className="table-wrap glass">
        <table>
          <thead>
            <tr>
              {isCuratorOrAdmin && <th>Сотрудник</th>}
              <th>Период</th>
              <th>Причина</th>
              <th>Статус</th>
              {isCuratorOrAdmin && <th>Действия</th>}
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr key={row.id}>
                {isCuratorOrAdmin && (
                  <td>{row.nickname}</td>
                )}
                <td>
                  {formatDate(row.start_date)} — {formatDate(row.end_date)}
                </td>
                <td>
                  {isCuratorOrAdmin ? (row.reason || '—') : '—'}
                </td>
                <td>
                  <span className={`badge ${STATUS_CLASS[row.status] || 'badge-muted'}`}>
                    {STATUS_LABELS[row.status]}
                  </span>
                  {row.reject_reason && isCuratorOrAdmin && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Причина отклонения: {row.reject_reason}
                    </div>
                  )}
                </td>
                {isCuratorOrAdmin && row.status === 'pending' && (
                  <td>
                    <button className="btn btn-primary" style={{ marginRight: 8 }} onClick={() => handleApprove(row.id)}>
                      Одобрить
                    </button>
                    <button className="btn btn-danger" onClick={() => setModal({ type: 'reject', id: row.id })}>
                      Отклонить
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length === 0 && <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Нет заявок на неактив.</p>}

      {modal === 'new' && <InactiveRequestModal onClose={() => setModal(null)} onSuccess={() => { setModal(null); load(); }} />}
      {modal?.type === 'reject' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <h2>Отклонить заявку</h2>
            <div className="form-group">
              <label>Причина (необязательно)</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-danger" onClick={() => handleReject(modal.id)}>Отклонить</button>
              <button className="btn" onClick={() => setModal(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InactiveRequestModal({ onClose, onSuccess }) {
  const [start_date, setStart] = useState('');
  const [end_date, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await inactivesApi.create(start_date, end_date, reason);
      onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal glass" onClick={(e) => e.stopPropagation()}>
        <h2>Заявка на неактив</h2>
        <p style={{ marginBottom: 16, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Укажите период и при необходимости причину. Только сотрудники из состава администрации могут подавать заявки.
        </p>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Дата начала</label>
            <input type="date" value={start_date} onChange={(e) => setStart(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Дата окончания</label>
            <input type="date" value={end_date} onChange={(e) => setEnd(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Причина</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Необязательно" />
          </div>
          {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Отправка...' : 'Отправить'}</button>
            <button type="button" className="btn" onClick={onClose}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}
