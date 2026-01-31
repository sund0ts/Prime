/**
 * Назначить пользователя администратором по никнейму.
 * Запуск: node scripts/make-admin.js <никнейм>
 * Пример: node scripts/make-admin.js Admin
 */
import 'dotenv/config';
import pool from '../config/db.js';

const nickname = process.argv[2];
if (!nickname) {
  console.log('Использование: node scripts/make-admin.js <никнейм>');
  console.log('Пример: node scripts/make-admin.js Admin');
  process.exit(1);
}

async function run() {
  const [rows] = await pool.query('SELECT id, nickname FROM users WHERE nickname = ?', [nickname]);
  if (!rows.length) {
    console.log('Пользователь с ником "' + nickname + '" не найден. Сначала зарегистрируйтесь на сайте.');
    process.exit(1);
  }
  await pool.query("UPDATE users SET role = 'admin' WHERE id = ?", [rows[0].id]);
  console.log('Пользователь "' + rows[0].nickname + '" теперь администратор.');
  process.exit(0);
}

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
