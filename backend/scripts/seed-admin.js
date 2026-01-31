/**
 * Создаёт первого администратора: логин "admin", пароль "admin123".
 * Запуск: npm run db:seed  (или node scripts/seed-admin.js)
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

async function seed() {
  const [rows] = await pool.query('SELECT id FROM users WHERE nickname = ?', ['admin']);
  if (rows.length) {
    console.log('Пользователь admin уже есть. Чтобы сделать админом другого пользователя: node scripts/make-admin.js <ник>');
    process.exit(0);
    return;
  }
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query(
    "INSERT INTO users (nickname, password_hash, role) VALUES (?, ?, 'admin')",
    ['admin', hash]
  );
  console.log('Создан администратор: логин "admin", пароль "admin123". Войдите на сайт и смените пароль в профиле.');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
