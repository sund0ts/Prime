import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/db.js';
import { auth, requireRole } from '../middleware/auth.js';
import { logAction } from '../middleware/log.js';

const router = Router();

router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.user_id, s.real_name, s.position, s.appointment_date, s.last_promotion_date, s.points, s.created_at,
        u.nickname, u.avatar_path, u.role,
        (SELECT COUNT(*) FROM punishments p WHERE p.staff_id = s.id AND p.type = 'warning' AND p.removed_at IS NULL) as warnings,
        (SELECT COUNT(*) FROM punishments p WHERE p.staff_id = s.id AND p.type = 'reprimand' AND p.removed_at IS NULL) as reprimands
       FROM staff s
       JOIN users u ON s.user_id = u.id
       ORDER BY u.nickname`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post(
  '/',
  auth,
  requireRole('admin'),
  body('user_id').isInt(),
  body('real_name').optional().isString(),
  body('appointment_date').optional().isISO8601(),
  body('points').optional().isInt({ min: 0 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const [existing] = await pool.query('SELECT id FROM staff WHERE user_id = ?', [req.body.user_id]);
      if (existing.length) return res.status(400).json({ error: 'Уже в составе' });
      await pool.query(
        'INSERT INTO staff (user_id, real_name, appointment_date, points) VALUES (?, ?, ?, ?)',
        [req.body.user_id, req.body.real_name || '', req.body.appointment_date || null, req.body.points || 0]
      );
      await logAction(req.user.id, 'staff_add', { user_id: req.body.user_id }, req.ip);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.patch(
  '/:id',
  auth,
  requireRole('curator', 'admin'),
  body('real_name').optional().isString(),
  body('position').optional().isString(),
  body('appointment_date').optional().isISO8601(),
  body('last_promotion_date').optional().isISO8601(),
  body('points').optional().isInt({ min: 0 }),
  async (req, res) => {
    try {
      const staffId = parseInt(req.params.id, 10);
      const updates = {};
      ['real_name', 'position', 'appointment_date', 'last_promotion_date', 'points'].forEach((k) => {
        if (req.body[k] !== undefined) updates[k] = req.body[k];
      });
      if (Object.keys(updates).length === 0) return res.json({ ok: true });
      const set = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
      await pool.query(`UPDATE staff SET ${set} WHERE id = ?`, [...Object.values(updates), staffId]);
      await logAction(req.user.id, 'staff_update', { staff_id: staffId, updates }, req.ip);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM staff WHERE id = ?', [req.params.id]);
    await logAction(req.user.id, 'staff_remove', { staff_id: req.params.id }, req.ip);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
