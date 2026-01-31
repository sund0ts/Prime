import { Router } from 'express';
import pool from '../config/db.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const offset = parseInt(req.query.offset, 10) || 0;
    const [rows] = await pool.query(
      `SELECT l.id, l.user_id, l.action, l.details, l.ip, l.created_at, u.nickname
       FROM activity_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
