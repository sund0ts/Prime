import pool from '../config/db.js';

export async function logAction(userId, action, details = {}, ip = null) {
  await pool.query(
    'INSERT INTO activity_logs (user_id, action, details, ip) VALUES (?, ?, ?, ?)',
    [userId, action, JSON.stringify(details), ip]
  );
}
