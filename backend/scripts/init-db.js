import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function init() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'arizona_prime'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.end();

  const pool = (await import('../config/db.js')).default;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      nickname VARCHAR(64) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('user', 'curator', 'admin') DEFAULT 'user',
      avatar_path VARCHAR(255) DEFAULT NULL,
      vk_url VARCHAR(255) DEFAULT '',
      discord_url VARCHAR(255) DEFAULT '',
      telegram_url VARCHAR(255) DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS staff (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL UNIQUE,
      real_name VARCHAR(128) DEFAULT '',
      position VARCHAR(128) DEFAULT '',
      appointment_date DATE,
      last_promotion_date DATE,
      points INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS punishments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      staff_id INT NOT NULL,
      type ENUM('warning', 'reprimand') NOT NULL,
      reason TEXT,
      issued_by_id INT NOT NULL,
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      removed_at DATETIME NULL,
      removed_by_id INT NULL,
      remove_reason TEXT NULL,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
      FOREIGN KEY (issued_by_id) REFERENCES users(id),
      FOREIGN KEY (removed_by_id) REFERENCES users(id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inactives (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      reviewed_by_id INT NULL,
      reviewed_at DATETIME NULL,
      reject_reason TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by_id) REFERENCES users(id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NULL,
      action VARCHAR(128) NOT NULL,
      details JSON,
      ip VARCHAR(45),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

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

  console.log('Database initialized.');
  process.exit(0);
}

init().catch((e) => {
  console.error(e);
  process.exit(1);
});
