import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import pool from '../config/db.js';
import { auth, requireRole } from '../middleware/auth.js';
import { logAction } from '../middleware/log.js';

const router = Router();

router.post(
  '/register',
  body('nickname').trim().isLength({ min: 2, max: 64 }).withMessage('Ник 2-64 символа'),
  body('password').isLength({ min: 6 }).withMessage('Пароль минимум 6 символов'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { nickname, password } = req.body;
      const [existing] = await pool.query('SELECT id FROM users WHERE nickname = ?', [nickname]);
      if (existing.length) return res.status(400).json({ error: 'Никнейм занят' });
      const hash = await bcrypt.hash(password, 10);
      const [result] = await pool.query(
        'INSERT INTO users (nickname, password_hash, role) VALUES (?, ?, ?)',
        [nickname, hash, 'user']
      );
      const token = jwt.sign(
        { userId: result.insertId },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );
      await logAction(result.insertId, 'register', { nickname }, req.ip);
      res.json({ token, userId: result.insertId, nickname, role: 'user' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.post(
  '/login',
  body('nickname').trim().notEmpty(),
  body('password').notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { nickname, password } = req.body;
      const [rows] = await pool.query(
        'SELECT id, nickname, password_hash, role, avatar_path FROM users WHERE nickname = ?',
        [nickname]
      );
      if (!rows.length) return res.status(401).json({ error: 'Неверный ник или пароль' });
      const ok = await bcrypt.compare(password, rows[0].password_hash);
      if (!ok) return res.status(401).json({ error: 'Неверный ник или пароль' });
      const token = jwt.sign(
        { userId: rows[0].id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );
      await logAction(rows[0].id, 'login', {}, req.ip);
      res.json({
        token,
        userId: rows[0].id,
        nickname: rows[0].nickname,
        role: rows[0].role,
        avatar_path: rows[0].avatar_path,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.post(
  '/create',
  auth,
  requireRole('admin'),
  body('nickname').trim().isLength({ min: 2, max: 64 }),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { nickname, password } = req.body;
      const [existing] = await pool.query('SELECT id FROM users WHERE nickname = ?', [nickname]);
      if (existing.length) return res.status(400).json({ error: 'Никнейм занят' });
      const hash = await bcrypt.hash(password, 10);
      const [result] = await pool.query(
        'INSERT INTO users (nickname, password_hash, role) VALUES (?, ?, ?)',
        [nickname, hash, 'user']
      );
      await logAction(req.user.id, 'user_create', { nickname, user_id: result.insertId }, req.ip);
      res.json({ userId: result.insertId, nickname });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

export default router;
