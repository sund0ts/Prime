import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/db.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post(
  '/',
  body('game_nickname').trim().isLength({ min: 1, max: 128 }).withMessage('Укажите игровой никнейм'),
  body('server_position').trim().isLength({ min: 1, max: 255 }).withMessage('Укажите должность или прочерк'),
  body('discord').optional().trim().isLength({ max: 255 }),
  body('vk_url').optional().trim().isLength({ max: 512 }),
  body('forum_url').optional().trim().isLength({ max: 512 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { game_nickname, server_position, discord = '', vk_url = '', forum_url = '' } = req.body;
      await pool.query(
        `INSERT INTO applications (game_nickname, server_position, discord, vk_url, forum_url)
         VALUES (?, ?, ?, ?, ?)`,
        [game_nickname, server_position, discord, vk_url, forum_url]
      );
      res.status(201).json({ ok: true, message: 'Заявление отправлено' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, game_nickname, server_position, discord, vk_url, forum_url, created_at FROM applications ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
