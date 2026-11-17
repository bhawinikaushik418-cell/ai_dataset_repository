-- ============================================================================
-- Project: AI Dataset Repository with Secure Access & Recommendation
-- File: seed.sql
-- Database Management System: MySQL 8.0+
-- Description: Verified real UCI Machine Learning Repository metadata and seed data.
-- ============================================================================

USE `ai_dataset_repository`;

START TRANSACTION;

-- ----------------------------------------------------------------------------
-- 1. USERS SEED DATA
-- Passwords:
-- Admin: Admin@12345 (bcrypt hash below)
-- Users: User@12345  (bcrypt hash below)
-- ----------------------------------------------------------------------------
INSERT INTO Users (user_id, name, email, password_hash, role, status) VALUES
(1, 'System Administrator', 'admin@aixplore.edu', '$2a$10$g.s064Kq2th0K0F4XcDBMe3VutxBEe5lgbbmXM3rDVNsFJxLxX/KC', 'ADMIN', 'ACTIVE'),
(2, 'Alice Johnson', 'alice@aixplore.edu', '$2a$10$7TNsSCdFN/bU73JJls2bw.KgtI6Ki8nZbPx2eoCwAHoENcyB2PAU6', 'USER', 'ACTIVE'),
(3, 'Bob Smith', 'bob@aixplore.edu', '$2a$10$7TNsSCdFN/bU73JJls2bw.KgtI6Ki8nZbPx2eoCwAHoENcyB2PAU6', 'USER', 'ACTIVE'),
(4, 'Dr. Clara Oswald', 'clara@aixplore.edu', '$2a$10$7TNsSCdFN/bU73JJls2bw.KgtI6Ki8nZbPx2eoCwAHoENcyB2PAU6', 'USER', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name), password_hash=VALUES(password_hash), role=VALUES(role), status=VALUES(status);

-- ----------------------------------------------------------------------------
-- 2. CATEGORIES SEED DATA
-- ----------------------------------------------------------------------------
INSERT INTO Categories (category_id, name, description) VALUES
(1, 'Life Sciences & Biology', 'Datasets focusing on botanical taxonomy, genomics, and ecological modeling.'),
(2, 'Healthcare & Medicine', 'Clinical observations, patient diagnostics, oncology, and epidemiological records.'),
(3, 'Agriculture & Food Science', 'Physicochemical profiles, viticulture, crop yields, and agrarian analytics.'),
(4, 'Social Sciences & Education', 'Demographic profiles, academic achievement, psychometrics, and behavioral surveys.')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ----------------------------------------------------------------------------
-- 3. DATASETS SEED DATA (5 REAL UCI ML REPOSITORY DATASETS)
-- NOTE: Real source URLs, official licenses, and exact attributes are retained.
-- Quality score is strictly NULL until evaluated (no arbitrary defaults).
-- ----------------------------------------------------------------------------
INSERT INTO Datasets (
    dataset_id,
    dataset_name,
    description,
    source_url,
    license,
    file_name,
    file_path,
    file_size_bytes,
    file_format,
    domain,
    task_type,
    data_type,
    difficulty_level,
    access_level,
    approval_status,
    quality_score,
    rejection_reason,
    uploader_id,
    category_id
) VALUES
(
    1,
    'Iris',
    'The foundational benchmark machine learning classification dataset created by Ronald Fisher from the UCI Machine Learning Repository. Widely used for evaluating supervised learning algorithms, featuring 150 instances of iris flowers across 3 species (Setosa, Versicolour, Virginica) with 4 sepal and petal measurements.',
    'https://archive.ics.uci.edu/dataset/53/iris',
    'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    'iris.csv',
    'uploads/datasets/iris.csv',
    4551,
    'CSV',
    'Life Sciences',
    'Classification',
    'Tabular',
    'BEGINNER',
    'PUBLIC',
    'APPROVED',
    NULL,
    NULL,
    1,
    1
),
(
    2,
    'Heart Disease (Cleveland)',
    'Classic machine learning clinical diagnostic benchmark dataset from the Cleveland Clinic Foundation (Dr. Robert Detrano) and UCI Machine Learning Repository. Features 14 clinical attributes used for predictive healthcare modeling and binary/multiclass classification of heart disease.',
    'https://archive.ics.uci.edu/dataset/45/heart+disease',
    'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    'heart_disease.csv',
    'uploads/datasets/heart_disease.csv',
    11328,
    'CSV',
    'Healthcare',
    'Classification',
    'Tabular',
    'INTERMEDIATE',
    'RESTRICTED',
    'APPROVED',
    NULL,
    NULL,
    1,
    2
),
(
    3,
    'Wine Quality',
    'Machine learning benchmark datasets for regression and classification by Paulo Cortez et al. from the UCI Machine Learning Repository. Evaluates sensory quality scores of Portuguese Vinho Verde wine variants using 11 objective physicochemical features.',
    'https://archive.ics.uci.edu/dataset/186/wine+quality',
    'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    'wine_quality.zip',
    'uploads/datasets/wine_quality.zip',
    89342,
    'ZIP',
    'Agriculture',
    'Classification',
    'Tabular',
    'BEGINNER',
    'PUBLIC',
    'APPROVED',
    NULL,
    NULL,
    2,
    3
),
(
    4,
    'Breast Cancer Wisconsin (Diagnostic)',
    'Widely cited machine learning oncology benchmark dataset from the UCI Machine Learning Repository by Dr. William H. Wolberg, W. Nick Street, and Olvi L. Mangasarian. Employs 30 real-valued features computed from fine needle aspirate (FNA) images for cancer classification (malignant vs benign).',
    'https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic',
    'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    'breast_cancer_wisconsin.csv',
    'uploads/datasets/breast_cancer_wisconsin.csv',
    124434,
    'CSV',
    'Healthcare',
    'Classification',
    'Tabular',
    'INTERMEDIATE',
    'RESTRICTED',
    'APPROVED',
    NULL,
    NULL,
    1,
    2
),
(
    5,
    'Student Performance',
    'Benchmark machine learning dataset for predictive modeling and regression from the UCI Machine Learning Repository by Paulo Cortez and Alice Silva. Evaluates student academic achievement in secondary education using demographic, social, and academic attributes.',
    'https://archive.ics.uci.edu/dataset/320/student+performance',
    'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    'student_performance.csv',
    'uploads/datasets/student_performance.csv',
    41036,
    'CSV',
    'Social Sciences',
    'Regression',
    'Tabular',
    'BEGINNER',
    'PUBLIC',
    'APPROVED',
    NULL,
    NULL,
    3,
    4
)
ON DUPLICATE KEY UPDATE dataset_name=VALUES(dataset_name), description=VALUES(description);

-- ----------------------------------------------------------------------------
-- 4. TAGS SEED DATA
-- ----------------------------------------------------------------------------
INSERT INTO Tags (tag_id, name) VALUES
(1, 'botany'),
(2, 'classification'),
(3, 'multivariate'),
(4, 'beginner'),
(5, 'cardiology'),
(6, 'clinical'),
(7, 'healthcare'),
(8, 'chemistry'),
(9, 'agriculture'),
(10, 'food-science'),
(11, 'oncology'),
(12, 'diagnostic'),
(13, 'education'),
(14, 'social-sciences'),
(15, 'regression'),
(16, 'machine-learning'),
(17, 'ai'),
(18, 'data-science'),
(19, 'benchmark')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ----------------------------------------------------------------------------
-- 5. DATASET_TAGS (M:N RESOLUTION)
-- ----------------------------------------------------------------------------
INSERT INTO Dataset_Tags (dataset_id, tag_id) VALUES
-- Iris
(1, 1), (1, 2), (1, 3), (1, 4), (1, 16), (1, 17), (1, 19),
-- Heart Disease
(2, 2), (2, 5), (2, 6), (2, 7), (2, 16), (2, 17), (2, 19),
-- Wine Quality
(3, 2), (3, 8), (3, 9), (3, 10), (3, 16), (3, 17), (3, 19),
-- Breast Cancer Wisconsin
(4, 2), (4, 7), (4, 11), (4, 12), (4, 16), (4, 17), (4, 19),
-- Student Performance
(5, 13), (5, 14), (5, 15), (5, 16), (5, 17), (5, 19)
ON DUPLICATE KEY UPDATE dataset_id=VALUES(dataset_id);

-- ----------------------------------------------------------------------------
-- 6. ACCESS REQUESTS SEED DATA
-- Demonstrates workflow:
-- - Alice had an initial request for Heart Disease REJECTED.
-- - Alice was subsequently permitted to submit a new PENDING request with detailed justification.
-- - Bob requested Breast Cancer and was APPROVED by Admin.
-- ----------------------------------------------------------------------------
INSERT INTO AccessRequests (
    request_id,
    dataset_id,
    user_id,
    justification,
    status,
    rejection_reason,
    reviewed_by,
    requested_at,
    reviewed_at
) VALUES
(
    1,
    2,
    2,
    'Undergraduate semester project on heart arrhythmia detection.',
    'REJECTED',
    'Institutional affiliation and faculty advisor endorsement missing.',
    1,
    '2026-11-01 09:30:00',
    '2026-11-01 14:15:00'
),
(
    2,
    2,
    2,
    'Updated request with institutional endorsement from Prof. Alan Turing, Stanford Department of Bioengineering.',
    'PENDING',
    NULL,
    NULL,
    '2026-11-05 11:20:00',
    NULL
),
(
    3,
    4,
    3,
    'Ph.D. research thesis investigating benign vs malignant breast lesion feature boundaries.',
    'APPROVED',
    NULL,
    1,
    '2026-11-02 10:00:00',
    '2026-11-02 16:45:00'
)
ON DUPLICATE KEY UPDATE justification=VALUES(justification);

-- ----------------------------------------------------------------------------
-- 7. DOWNLOADS AUDIT LOG SEED DATA
-- ----------------------------------------------------------------------------
INSERT INTO Downloads (download_id, dataset_id, user_id, ip_address, downloaded_at) VALUES
(1, 1, 2, '192.168.1.101', '2026-11-02 12:00:00'),
(2, 1, 3, '192.168.1.102', '2026-11-03 14:22:00'),
(3, 3, 2, '192.168.1.101', '2026-11-04 18:10:00'),
(4, 5, 3, '192.168.1.102', '2026-11-06 09:45:00'),
(5, 4, 3, '192.168.1.102', '2026-11-07 15:30:00') -- Permitted because Request #3 was APPROVED
ON DUPLICATE KEY UPDATE dataset_id=VALUES(dataset_id);

-- ----------------------------------------------------------------------------
-- 8. RATINGS SEED DATA (UNIQUE(user_id, dataset_id))
-- ----------------------------------------------------------------------------
INSERT INTO Ratings (rating_id, dataset_id, user_id, rating) VALUES
(1, 1, 2, 5),
(2, 1, 3, 4),
(3, 3, 2, 4),
(4, 4, 3, 5),
(5, 5, 2, 4),
(6, 5, 3, 3)
ON DUPLICATE KEY UPDATE rating=VALUES(rating);

-- ----------------------------------------------------------------------------
-- 9. REVIEWS SEED DATA
-- ----------------------------------------------------------------------------
INSERT INTO Reviews (review_id, dataset_id, user_id, review_text) VALUES
(1, 1, 2, 'Flawless classic benchmark dataset for testing simple logistic regression and k-NN models.'),
(2, 1, 3, 'Well-structured, balanced classes, and ideal for classroom demonstrations.'),
(3, 3, 2, 'Comprehensive physicochemical parameters. Great for multivariable classification tasks.'),
(4, 4, 3, 'Excellent diagnostic features with high precision. Required institutional access was swiftly cleared.')
ON DUPLICATE KEY UPDATE review_text=VALUES(review_text);

COMMIT;
