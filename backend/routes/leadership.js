import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { body, validationResult } from 'express-validator';
import pool from '../config/db.js';
import { auth, requireRole } from '../middleware/auth.js';
import { uploadLeadershipAvatar } from '../middleware/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, avatar_path, position, bio, sort_order FROM leadership ORDER BY sort_order ASC, id ASC'
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
  body('name').trim().isLength({ min: 1, max: 128 }),
  body('position').optional().trim().isLength({ max: 255 }),
  body('bio').optional().trim(),
  body('sort_order').optional().isInt({ min: 0 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { name, position = '', bio = '', sort_order = 0 } = req.body;
      const [r] = await pool.query(
        'INSERT INTO leadership (name, position, bio, sort_order) VALUES (?, ?, ?, ?)',
        [name, position, bio, sort_order]
      );
      res.status(201).json({ id: r.insertId, name, position, bio, sort_order });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.patch(
  '/:id',
  auth,
  requireRole('admin'),
  body('name').optional().trim().isLength({ min: 1, max: 128 }),
  body('position').optional().trim().isLength({ max: 255 }),
  body('bio').optional().trim(),
  body('sort_order').optional().isInt({ min: 0 }),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updates = {};
      ['name', 'position', 'bio', 'sort_order'].forEach((k) => {
        if (req.body[k] !== undefined) updates[k] = req.body[k];
      });
      if (Object.keys(updates).length === 0) return res.json({ ok: true });
      const set = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
      await pool.query(`UPDATE leadership SET ${set} WHERE id = ?`, [...Object.values(updates), id]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.post('/:id/avatar', auth, requireRole('admin'), (req, res, next) => {
  uploadLeadershipAvatar(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Ошибка загрузки' });
    const id = parseInt(req.params.id, 10);
    const filename = req.file?.filename;
    if (!filename) return res.status(400).json({ error: 'Файл не выбран' });
    try {
      await pool.query('UPDATE leadership SET avatar_path = ? WHERE id = ?', [filename, id]);
      res.json({ ok: true, avatar_path: filename });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM leadership WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
