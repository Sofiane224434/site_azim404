CREATE DATABASE IF NOT EXISTS azim404
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE azim404;

-- Table des utilisateurs (authentification)
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    firstname VARCHAR(100),
    lastname VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB;

-- Projets du portfolio
CREATE TABLE IF NOT EXISTS portfolio_projects (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    technologies JSON,
    image VARCHAR(500),
    link VARCHAR(500),
    domain VARCHAR(255),
    badge VARCHAR(100) DEFAULT 'En ligne',
    is_displayed TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_domain (domain)
) ENGINE=InnoDB;

-- Dérogations et modes maintenance des sites
CREATE TABLE IF NOT EXISTS maintenance_overrides (
    domain VARCHAR(255) PRIMARY KEY,
    is_maintenance TINYINT(1) DEFAULT 0,
    page_target VARCHAR(255) DEFAULT '*',
    bypass_ips TEXT,
    custom_message TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Cibles de synchronisation du contexte privé
CREATE TABLE IF NOT EXISTS context_sync_targets (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    folder VARCHAR(255) NOT NULL,
    enabled TINYINT(1) DEFAULT 1,
    last_synced_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Fichiers du dossier de contexte privé
CREATE TABLE IF NOT EXISTS context_files (
    id VARCHAR(100) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    content LONGTEXT NOT NULL,
    size_bytes INT DEFAULT 0,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Comptes privés d'accès admin / démo
CREATE TABLE IF NOT EXISTS private_accounts (
    identifier VARCHAR(100) PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    display_name VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
