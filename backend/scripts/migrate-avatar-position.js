/**
 * Добавляет колонки avatar_path в users и position в staff (для уже существующей БД).
 * Запуск: node scripts/migrate-avatar-position.js
 */
import 'dotenv/config';
import pool from '../config/db.js';

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN avatar_path VARCHAR(255) DEFAULT NULL
    `);
    console.log('users.avatar_path добавлена');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('users.avatar_path уже есть');
    else throw e;
  }
  try {
    await pool.query(`
      ALTER TABLE staff ADD COLUMN position VARCHAR(128) DEFAULT ''
    `);
    console.log('staff.position добавлена');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('staff.position уже есть');
    else throw e;
  }
  console.log('Миграция завершена.');
  process.exit(0);
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
