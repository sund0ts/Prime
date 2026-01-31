import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { staffApi } from '../api';
import { avatarUrl } from '../api';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function Administration() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    staffApi
      .list()
      .then(setStaff)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Загрузка списка администрации...</p>;
  if (error) return <p style={{ color: 'var(--danger)' }}>{error}</p>;

  return (
    <div>
      <h1 style={{ marginBottom: 24, fontSize: '1.5rem' }}>Администрация</h1>
      <div className="table-wrap glass">
        <table>
          <thead>
            <tr>
              <th>Администратор</th>
              <th>Должность</th>
              <th>Имя</th>
              <th>День назначения</th>
              <th>Последнее повышение</th>
              <th>Баллы</th>
              <th>Выговоры</th>
              <th>Предупреждения</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link to={`/profile/${row.user_id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'inherit', textDecoration: 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--glass-bg)' }}>
                      {row.avatar_path ? (
                        <img src={avatarUrl(row.avatar_path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div className="avatar-placeholder" style={{ fontSize: 18 }}>👤</div>
                      )}
                    </div>
                    <span style={{ fontWeight: 600 }}>{row.nickname}</span>
                    <span className={`badge badge-muted role-${row.role}`}>{row.role}</span>
                  </Link>
                </td>
                <td>{row.position || '—'}</td>
                <td>{row.real_name || '—'}</td>
                <td>{formatDate(row.appointment_date)}</td>
                <td>{formatDate(row.last_promotion_date)}</td>
                <td>{row.points ?? '—'}</td>
                <td>
                  {Number(row.reprimands) > 0 ? (
                    <span className="badge badge-danger">{row.reprimands}</span>
                  ) : (
                    <span className="badge badge-muted">0</span>
                  )}
                </td>
                <td>
                  {Number(row.warnings) > 0 ? (
                    <span className="badge badge-warning">{row.warnings}</span>
                  ) : (
                    <span className="badge badge-muted">0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {staff.length === 0 && (
        <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>
          Пока никого в составе администрации. Добавить сотрудников можно в Админ-панели → Состав.
        </p>
      )}
    </div>
  );
}
