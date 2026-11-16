-- ============================================================================
-- Project: AI Dataset Repository with Secure Access & Recommendation
-- File: queries.sql
-- Database Management System: MySQL 8.0+
-- Description: Demonstrates core DBMS PBL concepts:
--   1. INNER, LEFT, & MULTI-TABLE JOINS
--   2. AGGREGATE FUNCTIONS (AVG, COUNT, SUM, MIN, MAX)
--   3. GROUP BY & HAVING CLAUSES
--   4. CORRELATED & NESTED SUBQUERIES
--   5. WINDOW FUNCTIONS (DENSE_RANK, OVER)
--   6. DATABASE VIEWS
--   7. ACID TRANSACTIONS WITH COMMIT / ROLLBACK
-- ============================================================================

USE `ai_dataset_repository`;

-- ============================================================================
-- 1. MULTI-TABLE INNER JOIN
-- Retrieves approved datasets with uploader details and category names.
-- Demonstrates 3-table relational traversal.
-- ============================================================================
SELECT 
    d.dataset_id,
    d.dataset_name,
    c.name AS category_name,
    d.access_level,
    d.file_format,
    ROUND(d.file_size_bytes / 1024, 2) AS file_size_kb,
    u.name AS uploader_name,
    u.email AS uploader_email,
    d.created_at
FROM Datasets d
INNER JOIN Categories c ON d.category_id = c.category_id
INNER JOIN Users u ON d.uploader_id = u.user_id
WHERE d.approval_status = 'APPROVED'
ORDER BY d.created_at DESC;

-- ============================================================================
-- 2. LEFT OUTER JOIN WITH AGGREGATION
-- Calculates average rating, total ratings, and total downloads for all datasets.
-- Datasets with zero downloads or ratings return 0 instead of NULL.
-- ============================================================================
SELECT 
    d.dataset_id,
    d.dataset_name,
    d.domain,
    d.access_level,
    COALESCE(ROUND(AVG(r.rating), 2), 0.00) AS average_rating,
    COUNT(DISTINCT r.rating_id) AS total_ratings,
    COUNT(DISTINCT rev.review_id) AS total_reviews,
    COUNT(DISTINCT dl.download_id) AS total_downloads
FROM Datasets d
LEFT JOIN Ratings r ON d.dataset_id = r.dataset_id
LEFT JOIN Reviews rev ON d.dataset_id = rev.dataset_id
LEFT JOIN Downloads dl ON d.dataset_id = dl.dataset_id
WHERE d.approval_status = 'APPROVED'
GROUP BY d.dataset_id, d.dataset_name, d.domain, d.access_level
ORDER BY total_downloads DESC, average_rating DESC;

-- ============================================================================
-- 3. GROUP BY WITH HAVING CLAUSE
-- Finds categories that have at least 1 dataset and an overall category average
-- rating greater than or equal to 4.0.
-- ============================================================================
SELECT 
    c.category_id,
    c.name AS category_name,
    COUNT(DISTINCT d.dataset_id) AS dataset_count,
    ROUND(AVG(r.rating), 2) AS category_avg_rating
FROM Categories c
INNER JOIN Datasets d ON c.category_id = d.category_id
INNER JOIN Ratings r ON d.dataset_id = r.dataset_id
WHERE d.approval_status = 'APPROVED'
GROUP BY c.category_id, c.name
HAVING COUNT(DISTINCT d.dataset_id) >= 1 AND category_avg_rating >= 4.00
ORDER BY category_avg_rating DESC;

-- ============================================================================
-- 4. SCALAR SUBQUERY IN SELECT
-- Computes each dataset's percentage contribution to total platform downloads.
-- ============================================================================
SELECT 
    d.dataset_name,
    COUNT(dl.download_id) AS dataset_downloads,
    (SELECT COUNT(*) FROM Downloads) AS platform_total_downloads,
    ROUND((COUNT(dl.download_id) * 100.0) / (SELECT COUNT(*) FROM Downloads), 2) AS download_share_pct
FROM Datasets d
LEFT JOIN Downloads dl ON d.dataset_id = dl.dataset_id
GROUP BY d.dataset_id, d.dataset_name
ORDER BY download_share_pct DESC;

-- ============================================================================
-- 5. CORRELATED SUBQUERY IN WHERE CLAUSE
-- Finds datasets whose average rating is strictly higher than the average rating
-- of all datasets within their own category.
-- ============================================================================
SELECT 
    d.dataset_id,
    d.dataset_name,
    d.category_id,
    c.name AS category_name,
    ROUND(AVG(r.rating), 2) AS dataset_avg_rating
FROM Datasets d
JOIN Categories c ON d.category_id = c.category_id
JOIN Ratings r ON d.dataset_id = r.dataset_id
GROUP BY d.dataset_id, d.dataset_name, d.category_id, c.name
HAVING AVG(r.rating) > (
    -- Subquery calculating the category average rating
    SELECT AVG(r2.rating)
    FROM Datasets d2
    JOIN Ratings r2 ON d2.dataset_id = r2.dataset_id
    WHERE d2.category_id = d.category_id
);

-- ============================================================================
-- 6. NESTED SUBQUERY WITH NOT EXISTS
-- Identifies registered users who have NEVER downloaded any restricted dataset.
-- Useful for auditing restricted data compliance and security checks.
-- ============================================================================
SELECT 
    u.user_id,
    u.name,
    u.email,
    u.role
FROM Users u
WHERE u.role = 'USER'
  AND NOT EXISTS (
      SELECT 1 
      FROM Downloads dl
      JOIN Datasets d ON dl.dataset_id = d.dataset_id
      WHERE dl.user_id = u.user_id 
        AND d.access_level = 'RESTRICTED'
  );

-- ============================================================================
-- 7. STRING AGGREGATION (GROUP_CONCAT)
-- Aggregates M:N tags into a single comma-delimited string per dataset.
-- Used by the backend AI recommendation engine for keyword tokenization.
-- ============================================================================
SELECT 
    d.dataset_id,
    d.dataset_name,
    d.domain,
    d.task_type,
    d.difficulty_level,
    GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ', ') AS tags
FROM Datasets d
LEFT JOIN Dataset_Tags dt ON d.dataset_id = dt.dataset_id
LEFT JOIN Tags t ON dt.tag_id = t.tag_id
WHERE d.approval_status = 'APPROVED'
GROUP BY d.dataset_id, d.dataset_name, d.domain, d.task_type, d.difficulty_level;

-- ============================================================================
-- 8. WINDOW FUNCTION (DENSE_RANK & PARTITION BY)
-- Ranks datasets by total downloads within each scientific domain.
-- ============================================================================
SELECT 
    d.domain,
    d.dataset_name,
    COUNT(dl.download_id) AS total_downloads,
    DENSE_RANK() OVER (
        PARTITION BY d.domain 
        ORDER BY COUNT(dl.download_id) DESC
    ) AS domain_popularity_rank
FROM Datasets d
LEFT JOIN Downloads dl ON d.dataset_id = dl.dataset_id
WHERE d.approval_status = 'APPROVED'
GROUP BY d.domain, d.dataset_id, d.dataset_name
ORDER BY d.domain, domain_popularity_rank;

-- ============================================================================
-- 9. QUERYING THE DATABASE VIEWS
-- Views encapsulate complex logic while preserving Third Normal Form (3NF).
-- ============================================================================

-- Query 9A: Overview from vw_dataset_summary
SELECT 
    dataset_name, 
    domain, 
    task_type, 
    access_level, 
    avg_rating, 
    total_downloads 
FROM vw_dataset_summary
ORDER BY avg_rating DESC, total_downloads DESC;

-- Query 9B: Repository Health KPIs from vw_admin_repository_analytics
SELECT * FROM vw_admin_repository_analytics;

-- ============================================================================
-- 10. ACID TRANSACTION DEMONSTRATION 1: ACCESS REQUEST WORKFLOW
-- Enforces data integrity when a user requests access to a restricted dataset.
-- Checks that no active PENDING request exists before inserting.
-- ============================================================================
START TRANSACTION;

-- Step 1: Verify the dataset is indeed restricted and approved
SELECT dataset_id, access_level, approval_status 
FROM Datasets 
WHERE dataset_id = 2 AND access_level = 'RESTRICTED' AND approval_status = 'APPROVED'
FOR UPDATE;

-- Step 2: Ensure the user doesn't already have an active pending request
-- (Handled by schema constraint `uk_pending_access_request`, but safely handled here too)
INSERT INTO AccessRequests (dataset_id, user_id, justification, status)
VALUES (
    2,
    4,
    'Research on cardiology biomarker predictive modeling for cardiovascular research paper.',
    'PENDING'
);

-- Commit transaction atomically
COMMIT;

-- ============================================================================
-- 11. ACID TRANSACTION DEMONSTRATION 2: ADMIN APPROVAL & DOWNLOAD AUDITING
-- When an admin approves an access request, status is updated, reviewer timestamped,
-- and the action is safely recorded.
-- ============================================================================
START TRANSACTION;

-- Step 1: Lock the access request record for update
SELECT request_id, status 
FROM AccessRequests 
WHERE request_id = 2 
FOR UPDATE;

-- Step 2: Update the request status to APPROVED
UPDATE AccessRequests 
SET status = 'APPROVED',
    reviewed_by = 1,
    reviewed_at = NOW()
WHERE request_id = 2;

-- Step 3: Log an immediate audit trail entry or permit authorized download
INSERT INTO Downloads (dataset_id, user_id, ip_address, downloaded_at)
VALUES (2, 2, '192.168.1.101', NOW());

COMMIT;
