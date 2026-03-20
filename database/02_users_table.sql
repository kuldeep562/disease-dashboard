-- ============================================================
-- MedWatch v2 — Users table + schema additions
-- Run AFTER the original 01_schema.sql
-- ============================================================

USE disease_dashboard;

-- ── USERS TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    user_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(80)  NOT NULL UNIQUE,
    password_hash   VARCHAR(64)  NOT NULL,
    full_name       VARCHAR(200) NOT NULL,
    email           VARCHAR(200) NOT NULL UNIQUE,
    role            ENUM('Admin','Doctor','Nurse','Field Officer','Analyst','Staff') NOT NULL DEFAULT 'Staff',
    department      VARCHAR(150),
    phone           VARCHAR(20),
    is_active       TINYINT(1) DEFAULT 1,
    last_login      DATETIME,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email    (email),
    INDEX idx_user_username (username)
) ENGINE=InnoDB;

-- ── SEED DEFAULT USERS ────────────────────────────────────
-- Passwords: admin123 (hash uses SECRET_KEY from .env — use seed_users.py for proper hashing)
-- Default SECRET_KEY produces these hashes for password 'admin123':
-- You MUST run: python seed_users.py  to insert users with correct hashes.

-- ── SAMPLE INSERT (plain SHA256 of 'admin123' with empty secret for demo) ──
-- Actually, run seed_users.py script for proper hashing.
-- This is just a placeholder:
INSERT IGNORE INTO users (username, password_hash, full_name, email, role, department) VALUES
  ('placeholder_run_seed_users', 'placeholder', 'Run seed_users.py', 'seed@localhost', 'Admin', 'IT');

SELECT 'Run seed_users.py to create proper user accounts' AS INSTRUCTION;
