import React, { useState, useEffect } from 'react';
import { leadershipApi, leadershipAvatarUrl } from '../api';

export default function Leadership() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leadershipApi.list()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-content">
        <h2 className="page-title font-geo">Руководящий состав</h2>
        <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <h2 className="page-title font-geo">Руководящий состав Arizona Prime</h2>
      <div className="leadership-grid">
        {list.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Список пока пуст.</p>
        ) : (
          list.map((person) => (
            <article key={person.id} className="glass leadership-card">
              {person.avatar_path ? (
                <img
                  src={leadershipAvatarUrl(person.avatar_path)}
                  alt={person.name}
                  className="leadership-avatar"
                />
              ) : (
                <div className="avatar-placeholder">?</div>
              )}
              <div className="leadership-info">
                <h3>{person.name}</h3>
                {person.position && <p className="leadership-position">{person.position}</p>}
                {person.bio && <p className="leadership-bio">{person.bio}</p>}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
