-- ============================================================
-- Run this as MySQL/MariaDB root user FIRST
-- ============================================================

-- Create database (if not done already)
CREATE DATABASE IF NOT EXISTS disease_dashboard
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Create application user
CREATE USER IF NOT EXISTS 'medwatch_user'@'localhost' IDENTIFIED BY 'StrongPassword@123';

-- Grant privileges
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER
    ON disease_dashboard.* TO 'medwatch_user'@'localhost';

FLUSH PRIVILEGES;

-- Verify
SELECT User, Host FROM mysql.user WHERE User = 'medwatch_user';
