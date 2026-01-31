import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/db.js';
import { auth, requireRole } from '../middleware/auth.js';
import { logAction } from '../middleware/log.js';

const router = Router();

router.get('/', auth, async (req, res) => {
  try {
    const isCuratorOrAdmin = ['curator', 'admin'].includes(req.user.role);
    let query = `
      SELECT i.*, u.nickname, u.avatar_path
      FROM inactives i
      JOIN users u ON i.user_id = u.id
    `;
    const params = [];
    if (!isCuratorOrAdmin) {
      query += ' WHERE i.user_id = ?';
      params.push(req.user.id);
    }
    query += ' ORDER BY i.created_at DESC';
    const [rows] = await pool.query(query, params);
    if (!isCuratorOrAdmin) {
      rows.forEach((r) => { r.reason = null; });
    }
    rows.forEach((r) => { r.avatar_path = r.avatar_path ?? null; });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post(
  '/',
  auth,
  body('start_date').isISO8601(),
  body('end_date').isISO8601(),
  body('reason').optional().isString(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const start = new Date(req.body.start_date);
      const end = new Date(req.body.end_date);
      if (end <= start) return res.status(400).json({ error: 'Конец неактива должен быть после начала' });
      const [staff] = await pool.query('SELECT id FROM staff WHERE user_id = ?', [req.user.id]);
      if (!staff.length) return res.status(403).json({ error: 'Только сотрудник может подать неактив' });
      await pool.query(
        'INSERT INTO inactives (user_id, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, req.body.start_date, req.body.end_date, req.body.reason || '', 'pending']
      );
      await logAction(req.user.id, 'inactive_request', { start_date: req.body.start_date, end_date: req.body.end_date }, req.ip);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.post(
  '/:id/approve',
  auth,
  requireRole('curator', 'admin'),
  async (req, res) => {
    try {
      const [row] = await pool.query('SELECT id, user_id FROM inactives WHERE id = ? AND status = ?', [req.params.id, 'pending']);
      if (!row.length) return res.status(404).json({ error: 'Заявка не найдена или уже рассмотрена' });
      await pool.query(
        'UPDATE inactives SET status = ?, reviewed_by_id = ?, reviewed_at = NOW() WHERE id = ?',
        ['approved', req.user.id, req.params.id]
      );
      await logAction(req.user.id, 'inactive_approve', { inactive_id: req.params.id, user_id: row[0].user_id }, req.ip);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.post(
  '/:id/reject',
  auth,
  requireRole('curator', 'admin'),
  body('reject_reason').optional().isString(),
  async (req, res) => {
    try {
      const [row] = await pool.query('SELECT id, user_id FROM inactives WHERE id = ? AND status = ?', [req.params.id, 'pending']);
      if (!row.length) return res.status(404).json({ error: 'Заявка не найдена или уже рассмотрена' });
      await pool.query(
        'UPDATE inactives SET status = ?, reviewed_by_id = ?, reviewed_at = NOW(), reject_reason = ? WHERE id = ?',
        ['rejected', req.user.id, req.body.reject_reason || null, req.params.id]
      );
      await logAction(req.user.id, 'inactive_reject', { inactive_id: req.params.id, reason: req.body.reject_reason }, req.ip);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

export default router;
