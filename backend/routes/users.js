import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/db.js';
import { auth, requireRole } from '../middleware/auth.js';
import { logAction } from '../middleware/log.js';
import { uploadAvatar } from '../middleware/upload.js';

const router = Router();

router.get('/me', auth, async (req, res) => {
  try {
    const [staff] = await pool.query(
      'SELECT s.id as staff_id, s.real_name, s.position, s.appointment_date, s.last_promotion_date, s.points FROM staff s WHERE s.user_id = ?',
      [req.user.id]
    );
    const [punishments] = await pool.query(
      `SELECT p.id, p.type, p.reason, p.issued_at, p.removed_at, u.nickname as issued_by
       FROM punishments p JOIN staff s ON p.staff_id = s.id JOIN users u ON p.issued_by_id = u.id
       WHERE s.user_id = ? ORDER BY p.issued_at DESC`,
      [req.user.id]
    );
    const [userRow] = await pool.query(
      'SELECT id, nickname, role, avatar_path, vk_url, discord_url, telegram_url, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    const user = userRow[0];
    const warnings = punishments.filter((p) => p.type === 'warning' && !p.removed_at).length;
    const reprimands = punishments.filter((p) => p.type === 'reprimand' && !p.removed_at).length;
    res.json({
      ...user,
      staff: staff[0] || null,
      punishments,
      warnings_count: warnings,
      reprimands_count: reprimands,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/me/avatar', auth, (req, res, next) => {
  uploadAvatar(req, res, (err) => {
    if (err) return res.status(400).json({ error: 'Ошибка загрузки. Только изображения до 3 МБ.' });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не выбран' });
    const filename = req.file.filename;
    await pool.query('UPDATE users SET avatar_path = ? WHERE id = ?', [filename, req.user.id]);
    await logAction(req.user.id, 'avatar_upload', { filename }, req.ip);
    res.json({ avatar_path: filename });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/list/all', auth, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nickname, role, avatar_path, created_at FROM users ORDER BY nickname LIMIT 500'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch(
  '/me',
  auth,
  body('vk_url').optional().isString().isLength({ max: 255 }),
  body('discord_url').optional().isString().isLength({ max: 255 }),
  body('telegram_url').optional().isString().isLength({ max: 255 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const updates = {};
      ['vk_url', 'discord_url', 'telegram_url'].forEach((key) => {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      });
      if (Object.keys(updates).length === 0) return res.json({ ok: true });
      const set = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
      await pool.query(`UPDATE users SET ${set} WHERE id = ?`, [...Object.values(updates), req.user.id]);
      await logAction(req.user.id, 'profile_update', updates, req.ip);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.get('/:id', auth, async (req, res) => {
  try {
    const [userRow] = await pool.query(
      'SELECT id, nickname, role, avatar_path, vk_url, discord_url, telegram_url, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!userRow.length) return res.status(404).json({ error: 'Пользователь не найден' });
    const [staff] = await pool.query('SELECT * FROM staff WHERE user_id = ?', [req.params.id]);
    const [punishments] = await pool.query(
      `SELECT p.id, p.type, p.reason, p.issued_at, p.removed_at, p.remove_reason, u.nickname as issued_by
       FROM punishments p JOIN staff s ON p.staff_id = s.id JOIN users u ON p.issued_by_id = u.id
       WHERE s.user_id = ? ORDER BY p.issued_at DESC`,
      [req.params.id]
    );
    const warnings = punishments.filter((p) => p.type === 'warning' && !p.removed_at).length;
    const reprimands = punishments.filter((p) => p.type === 'reprimand' && !p.removed_at).length;
    res.json({
      ...userRow[0],
      staff: staff[0] || null,
      punishments,
      warnings_count: warnings,
      reprimands_count: reprimands,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch(
  '/:id/nickname',
  auth,
  requireRole('curator', 'admin'),
  body('nickname').trim().isLength({ min: 2, max: 64 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const targetId = parseInt(req.params.id, 10);
      const [existing] = await pool.query('SELECT id FROM users WHERE nickname = ? AND id != ?', [req.body.nickname, targetId]);
      if (existing.length) return res.status(400).json({ error: 'Никнейм занят' });
      await pool.query('UPDATE users SET nickname = ? WHERE id = ?', [req.body.nickname, targetId]);
      await logAction(req.user.id, 'nickname_change', { target_user_id: targetId, new_nickname: req.body.nickname }, req.ip);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.patch(
  '/:id/profile',
  auth,
  requireRole('curator', 'admin'),
  body('vk_url').optional().isString(),
  body('discord_url').optional().isString(),
  body('telegram_url').optional().isString(),
  body('real_name').optional().isString(),
  body('position').optional().isString(),
  body('role').optional().isIn(['user', 'curator', 'admin']),
  async (req, res) => {
    try {
      const targetId = parseInt(req.params.id, 10);
      if (req.body.role && req.user.role !== 'admin') return res.status(403).json({ error: 'Только админ может менять роль' });
      const u = {};
      ['vk_url', 'discord_url', 'telegram_url', 'role'].forEach((k) => {
        if (req.body[k] !== undefined) u[k] = req.body[k];
      });
      if (Object.keys(u).length) {
        const set = Object.keys(u).map((k) => `${k} = ?`).join(', ');
        await pool.query(`UPDATE users SET ${set} WHERE id = ?`, [...Object.values(u), targetId]);
      }
      if (req.body.real_name !== undefined || req.body.position !== undefined) {
        const [staff] = await pool.query('SELECT id FROM staff WHERE user_id = ?', [targetId]);
        if (staff.length) {
          const up = {};
          if (req.body.real_name !== undefined) up.real_name = req.body.real_name;
          if (req.body.position !== undefined) up.position = req.body.position;
          if (Object.keys(up).length) {
            const set = Object.keys(up).map((k) => `${k} = ?`).join(', ');
            await pool.query(`UPDATE staff SET ${set} WHERE user_id = ?`, [...Object.values(up), targetId]);
          }
        } else {
          await pool.query(
            'INSERT INTO staff (user_id, real_name, position) VALUES (?, ?, ?)',
            [targetId, req.body.real_name || '', req.body.position || '']
          );
        }
      }
      await logAction(req.user.id, 'admin_profile_edit', { target_user_id: targetId, changes: req.body }, req.ip);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

export default router;
