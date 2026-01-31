import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1 className="hero-title font-geo">ARIZONA PRIME</h1>
        <p className="hero-sub">
          Мы тщательно поддерживаем высокий уровень Role‑Play на всех проектах Arizona Games — здесь каждый персонаж оживает, а сюжеты развиваются естественно. Чего ты ждёшь? Присоединяйся к нашему активному сообществу, создавай уникальную историю и погружайся в мир, где твои решения имеют значение!
        </p>
        <div className="cta-wrap">
          <Link to="/anketa" className="glass-btn primary">
            Подать заявление
          </Link>
        </div>
      </section>
    </>
  );
}
