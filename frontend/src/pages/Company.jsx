import React from 'react';

export default function Company() {
  return (
    <div className="page-content">
      <h2 className="page-title font-geo">О компании Arizona Prime</h2>
      <div className="glass" style={{ padding: '28px' }}>
        <p style={{ marginBottom: '16px', lineHeight: '1.65', color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text)' }}>Arizona Prime</strong> — часть экосистемы Arizona Games, отвечающая за качество и развитие ролевых проектов. Мы создаём условия, в которых каждый игрок может проживать убедительные истории и влиять на мир.
        </p>
        <p style={{ marginBottom: '16px', lineHeight: '1.65', color: 'var(--text-muted)' }}>
          На наших серверах действуют единые стандарты Role‑Play: от проработки персонажей до логики сюжетов. Команда следит за атмосферой и правилами, чтобы сохранять баланс между свободой и порядком.
        </p>
        <p style={{ marginBottom: '16px', lineHeight: '1.65', color: 'var(--text-muted)' }}>
          Если ты хочешь присоединиться к администрации, курировать проекты или просто подать заявку — заполни анкету через кнопку «Подать заявление» на главной странице. Мы рассматриваем каждую заявку и связываемся с кандидатами по указанным контактам.
        </p>
        <p style={{ lineHeight: '1.65', color: 'var(--text-muted)' }}>
          Добро пожаловать в Arizona Prime — место, где твои решения имеют значение.
        </p>
      </div>
    </div>
  );
}
