import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/db.js';
import { auth, requireRole } from '../middleware/auth.js';
import { logAction } from '../middleware/log.js';

const router = Router();

router.get('/staff/:staffId', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.nickname as issued_by_nickname
       FROM punishments p
       JOIN users u ON p.issued_by_id = u.id
       WHERE p.staff_id = ? ORDER BY p.issued_at DESC`,
      [req.params.staffId]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post(
  '/',
  auth,
  requireRole('curator', 'admin'),
  body('staff_id').isInt(),
  body('type').isIn(['warning', 'reprimand']),
  body('reason').optional().isString(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const [staff] = await pool.query('SELECT id, user_id FROM staff WHERE id = ?', [req.body.staff_id]);
      if (!staff.length) return res.status(404).json({ error: 'Сотрудник не найден' });
      await pool.query(
        'INSERT INTO punishments (staff_id, type, reason, issued_by_id) VALUES (?, ?, ?, ?)',
        [req.body.staff_id, req.body.type, req.body.reason || '', req.user.id]
      );
      await logAction(req.user.id, 'punishment_issue', {
        staff_id: req.body.staff_id,
        type: req.body.type,
        reason: req.body.reason,
      }, req.ip);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.post(
  '/:id/remove',
  auth,
  requireRole('curator', 'admin'),
  body('reason').optional().isString(),
  async (req, res) => {
    try {
      const [p] = await pool.query('SELECT id, staff_id FROM punishments WHERE id = ? AND removed_at IS NULL', [req.params.id]);
      if (!p.length) return res.status(404).json({ error: 'Наказание не найдено или уже снято' });
      await pool.query(
        'UPDATE punishments SET removed_at = NOW(), removed_by_id = ?, remove_reason = ? WHERE id = ?',
        [req.user.id, req.body.reason || null, req.params.id]
      );
      await logAction(req.user.id, 'punishment_remove', { punishment_id: req.params.id, reason: req.body.reason }, req.ip);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

export default router;
