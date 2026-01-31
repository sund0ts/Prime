import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const pool = (await import('../config/db.js')).default;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      game_nickname VARCHAR(128) NOT NULL,
      server_position VARCHAR(255) NOT NULL,
      discord VARCHAR(255) DEFAULT '',
      vk_url VARCHAR(512) DEFAULT '',
      forum_url VARCHAR(512) DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS leadership (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(128) NOT NULL,
      avatar_path VARCHAR(255) DEFAULT NULL,
      position VARCHAR(255) DEFAULT '',
      bio TEXT,
      sort_order INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const leadershipDir = path.join(__dirname, '..', 'uploads', 'leadership');
  if (!fs.existsSync(leadershipDir)) {
    fs.mkdirSync(leadershipDir, { recursive: true });
  }

  console.log('Applications and leadership tables ready.');
  process.exit(0);
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
