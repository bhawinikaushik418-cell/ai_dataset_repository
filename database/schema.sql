-- ============================================================================
-- Project: AI Dataset Repository with Secure Access & Recommendation
-- File: schema.sql
-- Database Management System: MySQL 8.0+
-- Target Normal Form: Third Normal Form (3NF)
-- ============================================================================

-- Create the database with full UTF-8 Unicode support
CREATE DATABASE IF NOT EXISTS `ai_dataset_repository`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `ai_dataset_repository`;

-- Temporarily disable foreign key checks for clean, idempotent execution
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `RevokedTokens`;
DROP TABLE IF EXISTS `Reviews`;
DROP TABLE IF EXISTS `Ratings`;
DROP TABLE IF EXISTS `Downloads`;
DROP TABLE IF EXISTS `AccessRequests`;
DROP TABLE IF EXISTS `Dataset_Tags`;
DROP TABLE IF EXISTS `Tags`;
DROP TABLE IF EXISTS `Datasets`;
DROP TABLE IF EXISTS `Categories`;
DROP TABLE IF EXISTS `Users`;
DROP VIEW IF EXISTS `vw_dataset_summary`;
DROP VIEW IF EXISTS `vw_admin_repository_analytics`;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- TABLE 1: Users
-- Description: Stores authenticated platform actors (USER and ADMIN).
-- 3NF: All non-key attributes functionally depend strictly on primary key `user_id`.
-- ============================================================================
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(191) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    status ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT chk_users_name_len CHECK (CHAR_LENGTH(TRIM(name)) >= 2),
    CONSTRAINT chk_users_email_fmt CHECK (email LIKE '%_@__%.__%')
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE 1B: RevokedTokens
-- Description: Enforces server-side JWT invalidation upon user logout.
-- ============================================================================
CREATE TABLE RevokedTokens (
    token_id INT AUTO_INCREMENT PRIMARY KEY,
    token_signature VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    revoked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_revoked_sig UNIQUE (token_signature),
    CONSTRAINT fk_revoked_user FOREIGN KEY (user_id)
        REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_revoked_expiry (expires_at)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE 2: Categories
-- Description: Domain taxonomic grouping (e.g., Healthcare, NLP, Life Sciences).
-- 3NF: No transitive dependencies.
-- ============================================================================
CREATE TABLE Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_categories_name UNIQUE (name),
    CONSTRAINT chk_categories_name_len CHECK (CHAR_LENGTH(TRIM(name)) >= 2)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE 3: Datasets
-- Description: Core metadata entity for AI/ML datasets. Physical files (.csv/.zip)
-- are stored on the secure filesystem; metadata is cataloged here.
-- 3NF: Computed aggregate values (average rating, download counts) are excluded
-- to eliminate update anomalies and preserve single-source-of-truth integrity.
-- ============================================================================
CREATE TABLE Datasets (
    dataset_id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    source_url VARCHAR(500) NOT NULL,
    license VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT UNSIGNED NOT NULL,
    file_format ENUM('CSV', 'ZIP') NOT NULL,
    domain VARCHAR(100) NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    data_type VARCHAR(100) NOT NULL,
    difficulty_level ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') NOT NULL,
    access_level ENUM('PUBLIC', 'RESTRICTED') NOT NULL DEFAULT 'PUBLIC',
    approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    quality_score DECIMAL(3, 1) NULL, -- No arbitrary default; populated via rigorous evaluation or NULL
    rejection_reason VARCHAR(255) NULL,
    uploader_id INT NOT NULL,
    category_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Referential Integrity Constraints
    CONSTRAINT fk_datasets_uploader FOREIGN KEY (uploader_id)
        REFERENCES Users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_datasets_category FOREIGN KEY (category_id)
        REFERENCES Categories(category_id) ON DELETE RESTRICT ON UPDATE CASCADE,

    -- Business Rule Validation Constraints
    CONSTRAINT chk_datasets_name_len CHECK (CHAR_LENGTH(TRIM(dataset_name)) >= 2),
    CONSTRAINT chk_datasets_file_size CHECK (file_size_bytes > 0),
    CONSTRAINT chk_datasets_quality_score CHECK (quality_score IS NULL OR (quality_score >= 0.0 AND quality_score <= 10.0)),
    CONSTRAINT chk_datasets_source_url CHECK (source_url LIKE 'http%://%')
) ENGINE=InnoDB;

-- Performance Indexes for search, filtering, and role-based discovery
CREATE INDEX idx_datasets_status_access ON Datasets (approval_status, access_level);
CREATE INDEX idx_datasets_category ON Datasets (category_id);
CREATE INDEX idx_datasets_uploader ON Datasets (uploader_id);
CREATE INDEX idx_datasets_domain_task ON Datasets (domain, task_type);
CREATE INDEX idx_datasets_created_at ON Datasets (created_at DESC);

-- ============================================================================
-- TABLE 4: Tags
-- Description: Granular keyword labels for search and AI TF-IDF matching.
-- ============================================================================
CREATE TABLE Tags (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    CONSTRAINT uk_tags_name UNIQUE (name),
    CONSTRAINT chk_tags_name_len CHECK (CHAR_LENGTH(TRIM(name)) >= 2)
) ENGINE=InnoDB;

-- ============================================================================
-- TABLE 5: Dataset_Tags
-- Description: Junction table resolving the Many-to-Many (M:N) relationship
-- between Datasets and Tags.
-- 3NF: Composite PK (dataset_id, tag_id). No partial or transitive dependencies.
-- ============================================================================
CREATE TABLE Dataset_Tags (
    dataset_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (dataset_id, tag_id),
    CONSTRAINT fk_dt_dataset FOREIGN KEY (dataset_id)
        REFERENCES Datasets(dataset_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_dt_tag FOREIGN KEY (tag_id)
        REFERENCES Tags(tag_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_dt_tag ON Dataset_Tags (tag_id);

-- ============================================================================
-- TABLE 6: AccessRequests
-- Description: Governs restricted dataset access approval workflows.
-- Crucial Relational Rule: A user is allowed to submit a new request if their
-- previous request was REJECTED. However, at most ONE 'PENDING' request is
-- allowed for a given (user_id, dataset_id) pair simultaneously.
-- Implementation: Handled via a deterministic MySQL 8 STORED generated column
-- where non-pending rows evaluate to NULL (MySQL ignores multiple NULLs in UNIQUE keys).
-- ============================================================================
CREATE TABLE AccessRequests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_id INT NOT NULL,
    user_id INT NOT NULL,
    justification TEXT NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    rejection_reason VARCHAR(255) NULL,
    reviewed_by INT NULL,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    
    CONSTRAINT fk_ar_dataset FOREIGN KEY (dataset_id)
        REFERENCES Datasets(dataset_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ar_user FOREIGN KEY (user_id)
        REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ar_reviewer FOREIGN KEY (reviewed_by)
        REFERENCES Users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_ar_justification_len CHECK (CHAR_LENGTH(TRIM(justification)) >= 10)
) ENGINE=InnoDB;

-- Functional Unique Index: Ensures at most ONE PENDING request per (user_id, dataset_id).
-- Non-pending requests evaluate to NULL, allowing multiple historical approved/rejected requests.
CREATE UNIQUE INDEX uk_pending_access_request ON AccessRequests (
    (CASE WHEN status = 'PENDING' THEN CONCAT(user_id, '_', dataset_id) ELSE NULL END)
);

CREATE INDEX idx_ar_user_status ON AccessRequests (user_id, status);
CREATE INDEX idx_ar_dataset_status ON AccessRequests (dataset_id, status);

-- ============================================================================
-- TABLE 7: Downloads
-- Description: Immutable audit log tracking file downloads.
-- Preservation Rule: `user_id` is nullable with ON DELETE SET NULL so that
-- if a user account is deleted, the historical download count and audit metrics
-- remain intact for repository compliance and analytics.
-- ============================================================================
CREATE TABLE Downloads (
    download_id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_id INT NOT NULL,
    user_id INT NULL,
    ip_address VARCHAR(45) NULL,
    downloaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_downloads_dataset FOREIGN KEY (dataset_id)
        REFERENCES Datasets(dataset_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_downloads_user FOREIGN KEY (user_id)
        REFERENCES Users(user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_downloads_dataset ON Downloads (dataset_id);
CREATE INDEX idx_downloads_user ON Downloads (user_id);
CREATE INDEX idx_downloads_date ON Downloads (downloaded_at DESC);

-- ============================================================================
-- TABLE 8: Ratings
-- Description: Stores user ratings (1 to 5 stars).
-- Constraint: Exactly one rating per user per dataset (uk_user_dataset_rating).
-- ============================================================================
CREATE TABLE Ratings (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_id INT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uk_user_dataset_rating UNIQUE (user_id, dataset_id),
    CONSTRAINT fk_ratings_dataset FOREIGN KEY (dataset_id)
        REFERENCES Datasets(dataset_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ratings_user FOREIGN KEY (user_id)
        REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_ratings_range CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE INDEX idx_ratings_dataset ON Ratings (dataset_id);

-- ============================================================================
-- TABLE 9: Reviews
-- Description: Textual qualitative feedback and discussion from users.
-- ============================================================================
CREATE TABLE Reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_id INT NOT NULL,
    user_id INT NOT NULL,
    review_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_reviews_dataset FOREIGN KEY (dataset_id)
        REFERENCES Datasets(dataset_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id)
        REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_reviews_text_len CHECK (CHAR_LENGTH(TRIM(review_text)) >= 5)
) ENGINE=InnoDB;

CREATE INDEX idx_reviews_dataset ON Reviews (dataset_id);
CREATE INDEX idx_reviews_user ON Reviews (user_id);

-- ============================================================================
-- DATABASE VIEWS (Virtual Tables)
-- Preserves 3NF while providing fast aggregated metric views for the application.
-- ============================================================================

-- View 1: Dataset Summary with Dynamic Ratings & Downloads
CREATE OR REPLACE VIEW vw_dataset_summary AS
SELECT 
    d.dataset_id,
    d.dataset_name,
    d.description,
    d.source_url,
    d.license,
    d.file_name,
    d.file_size_bytes,
    d.file_format,
    d.domain,
    d.task_type,
    d.data_type,
    d.difficulty_level,
    d.access_level,
    d.approval_status,
    d.quality_score,
    d.uploader_id,
    u.name AS uploader_name,
    d.category_id,
    c.name AS category_name,
    d.created_at,
    COALESCE(ROUND(AVG(r.rating), 2), 0.00) AS avg_rating,
    COUNT(DISTINCT r.rating_id) AS total_ratings,
    COUNT(DISTINCT rev.review_id) AS total_reviews,
    COUNT(DISTINCT dl.download_id) AS total_downloads
FROM Datasets d
JOIN Users u ON d.uploader_id = u.user_id
JOIN Categories c ON d.category_id = c.category_id
LEFT JOIN Ratings r ON d.dataset_id = r.dataset_id
LEFT JOIN Reviews rev ON d.dataset_id = rev.dataset_id
LEFT JOIN Downloads dl ON d.dataset_id = dl.dataset_id
GROUP BY d.dataset_id, u.name, c.name;

-- View 2: High-Level Repository Analytics for Admin Dashboard
CREATE OR REPLACE VIEW vw_admin_repository_analytics AS
SELECT 
    (SELECT COUNT(*) FROM Users) AS total_users,
    (SELECT COUNT(*) FROM Datasets) AS total_datasets,
    (SELECT COUNT(*) FROM Datasets WHERE approval_status = 'APPROVED') AS approved_datasets,
    (SELECT COUNT(*) FROM Datasets WHERE approval_status = 'PENDING') AS pending_approvals,
    (SELECT COUNT(*) FROM AccessRequests WHERE status = 'PENDING') AS pending_access_requests,
    (SELECT COUNT(*) FROM Downloads) AS total_downloads,
    (SELECT COUNT(*) FROM Categories) AS total_categories;
