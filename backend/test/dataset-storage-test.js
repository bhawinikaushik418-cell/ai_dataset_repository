/**
 * Phase 4 Integration Test Suite: Dataset Management, Secure File Storage & Access Workflows
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { startServer } = require('../src/server');
const { pool } = require('../src/config/db');

const BASE_URL = 'http://localhost:5000/api';

async function runDatasetStorageTestSuite() {
  console.log('================================================================');
  console.log(' Starting Phase 4: Dataset Management & Secure Storage Tests   ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failed++;
    }
  }

  let server;
  try {
    server = await startServer();
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }

  try {
    // ------------------------------------------------------------------------
    // SETUP: Users & Tokens
    // ------------------------------------------------------------------------
    // 1. Admin Token
    const [adminRows] = await pool.execute('SELECT user_id, email FROM Users WHERE role = "ADMIN" LIMIT 1');
    const adminToken = jwt.sign(
      { userId: adminRows[0].user_id, email: adminRows[0].email, role: 'ADMIN' },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '1d' }
    );

    // 2. Student User 1 (Uploader)
    const uploaderRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Researcher',
        email: `alice_${Date.now()}@aixplore.edu`,
        password: 'Password@123'
      })
    });
    const uploaderData = await uploaderRes.json();
    const uploaderToken = uploaderData.data.token;
    const uploaderId = uploaderData.data.user.userId;

    // 3. Student User 2 (Requester & Downloader)
    const requesterRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob Requester',
        email: `bob_${Date.now()}@aixplore.edu`,
        password: 'Password@123'
      })
    });
    const requesterData = await requesterRes.json();
    const requesterToken = requesterData.data.token;
    const requesterId = requesterData.data.user.userId;

    // ------------------------------------------------------------------------
    // SECTION 1: FILE VALIDATION & DATASET UPLOADS (CSV & ZIP)
    // ------------------------------------------------------------------------
    console.log('\n--- Section 1: File Validation & Multipart Uploads ---');

    // Test 1: Invalid file format (.txt)
    const badForm = new FormData();
    badForm.append('dataset_file', new Blob(['test content'], { type: 'text/plain' }), 'notes.txt');
    badForm.append('dataset_name', 'Invalid Dataset Format');
    badForm.append('description', 'Attempting to upload a plain text file rather than CSV or ZIP.');
    badForm.append('source_url', 'https://archive.ics.uci.edu');
    badForm.append('license', 'MIT');
    badForm.append('domain', 'Testing');
    badForm.append('task_type', 'Classification');
    badForm.append('data_type', 'Tabular');
    badForm.append('difficulty_level', 'BEGINNER');
    badForm.append('access_level', 'PUBLIC');
    badForm.append('category_id', '1');

    const badExtRes = await fetch(`${BASE_URL}/datasets`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${uploaderToken}` },
      body: badForm
    });
    assert(badExtRes.status === 400, 'Multer file filter blocks invalid file format .txt (400 Bad Request)');

    // Test 2: Valid CSV Dataset Upload
    const validCsvContent = 'feature_1,feature_2,feature_3,label\n1.2,3.4,5.6,A\n7.8,9.0,1.2,B\n';
    const csvForm = new FormData();
    csvForm.append('dataset_file', new Blob([validCsvContent], { type: 'text/csv' }), 'solar_flares.csv');
    csvForm.append('dataset_name', 'Solar Flare Analytics');
    csvForm.append('description', 'Comprehensive multi-spectral solar flare observations cataloged by heliophysics observatories.');
    csvForm.append('source_url', 'https://archive.ics.uci.edu/dataset/999/solar+flare');
    csvForm.append('license', 'Creative Commons Attribution 4.0');
    csvForm.append('domain', 'Astronomy');
    csvForm.append('task_type', 'Regression');
    csvForm.append('data_type', 'Tabular');
    csvForm.append('difficulty_level', 'INTERMEDIATE');
    csvForm.append('access_level', 'PUBLIC');
    csvForm.append('category_id', '1');
    csvForm.append('tags', 'astronomy, solar, regression, space-weather');

    const uploadCsvRes = await fetch(`${BASE_URL}/datasets`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${uploaderToken}` },
      body: csvForm
    });
    const uploadCsvData = await uploadCsvRes.json();
    assert(uploadCsvRes.status === 201 && uploadCsvData.data.dataset_id, 'Valid CSV upload created in MySQL (201 Created)');
    assert(uploadCsvData.data.approval_status === 'PENDING', 'Student uploads are initially flagged PENDING approval');

    const solarDatasetId = uploadCsvData.data.dataset_id;

    // Test 3: Valid ZIP Dataset Upload (Restricted Access)
    const validZipHeader = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00]); // Standard PK zip header
    const zipForm = new FormData();
    zipForm.append('dataset_file', new Blob([validZipHeader], { type: 'application/zip' }), 'genomic_sequences.zip');
    zipForm.append('dataset_name', 'Human Genomic Sequence Profiles');
    zipForm.append('description', 'High-throughput whole exome sequencing reads and variant annotations for biomedical research.');
    zipForm.append('source_url', 'https://archive.ics.uci.edu/dataset/998/genomic+profiles');
    zipForm.append('license', 'Creative Commons Attribution 4.0');
    zipForm.append('domain', 'Healthcare');
    zipForm.append('task_type', 'Classification');
    zipForm.append('data_type', 'Tabular');
    zipForm.append('difficulty_level', 'ADVANCED');
    zipForm.append('access_level', 'RESTRICTED');
    zipForm.append('category_id', '2');
    zipForm.append('tags', 'genomics, bioinformatics, oncology, exome');

    const uploadZipRes = await fetch(`${BASE_URL}/datasets`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${uploaderToken}` },
      body: zipForm
    });
    const uploadZipData = await uploadZipRes.json();
    assert(uploadZipRes.status === 201 && uploadZipData.data.dataset_id, 'Valid ZIP upload created in MySQL as RESTRICTED (201 Created)');

    const genomicDatasetId = uploadZipData.data.dataset_id;

    // ------------------------------------------------------------------------
    // SECTION 2: SECURE FILE STORAGE & ZERO PATH LEAKAGE
    // ------------------------------------------------------------------------
    console.log('\n--- Section 2: Secure Storage & Path Privacy ---');

    // Test 4: Physical file exists on local disk
    const [fileRow] = await pool.execute('SELECT file_path, file_name FROM Datasets WHERE dataset_id = ?', [solarDatasetId]);
    assert(fs.existsSync(fileRow[0].file_path), 'File physically stored in backend/uploads/datasets directory');

    // Test 5: Verify private file_path is NOT leaked to clients via public dataset API
    const detailRes = await fetch(`${BASE_URL}/datasets/${solarDatasetId}`, {
      headers: { Authorization: `Bearer ${uploaderToken}` }
    });
    const detailData = await detailRes.json();
    assert(detailData.data.file_path === undefined, 'CRITICAL PRIVACY: Server absolute file_path is NOT exposed to clients');

    // ------------------------------------------------------------------------
    // SECTION 3: DATASET APPROVAL / REJECTION WORKFLOW
    // ------------------------------------------------------------------------
    console.log('\n--- Section 3: Administrator Dataset Approval Workflow ---');

    // Test 6: Other users cannot see pending dataset in repository
    const publicListBefore = await fetch(`${BASE_URL}/datasets`, {
      headers: { Authorization: `Bearer ${requesterToken}` }
    });
    const publicListBeforeData = await publicListBefore.json();
    assert(
      !publicListBeforeData.data.some((d) => d.dataset_id === solarDatasetId),
      'Pending dataset is hidden from general public repository'
    );

    // Test 7: Uploader CAN see their own pending dataset in my uploads
    const myUploadsRes = await fetch(`${BASE_URL}/datasets/my/uploads`, {
      headers: { Authorization: `Bearer ${uploaderToken}` }
    });
    const myUploadsData = await myUploadsRes.json();
    assert(
      myUploadsData.data.some((d) => d.dataset_id === solarDatasetId),
      'Uploader can track their pending dataset in /my/uploads'
    );

    // Test 8: Admin approves the public dataset
    const approveSolarRes = await fetch(`${BASE_URL}/datasets/${solarDatasetId}/approval`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'APPROVED' })
    });
    assert(approveSolarRes.status === 200, 'Admin approves pending dataset (200 OK)');

    // Test 9: Dataset is now visible in repository for all users
    const publicListAfter = await fetch(`${BASE_URL}/datasets`, {
      headers: { Authorization: `Bearer ${requesterToken}` }
    });
    const publicListAfterData = await publicListAfter.json();
    assert(
      publicListAfterData.data.some((d) => d.dataset_id === solarDatasetId),
      'Approved dataset is immediately visible in public repository'
    );

    // Test 10: Admin approves the restricted dataset
    const approveGenomicRes = await fetch(`${BASE_URL}/datasets/${genomicDatasetId}/approval`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'APPROVED' })
    });
    assert(approveGenomicRes.status === 200, 'Admin approves restricted dataset (200 OK)');

    // ------------------------------------------------------------------------
    // SECTION 4: RESTRICTED DATASET ACCESS & DOWNLOAD GATE
    // ------------------------------------------------------------------------
    console.log('\n--- Section 4: Restricted Access Request & Download Gate ---');

    // Test 11: Unapproved user blocked from downloading restricted dataset
    const blockedDlRes = await fetch(`${BASE_URL}/datasets/${genomicDatasetId}/download`, {
      headers: { Authorization: `Bearer ${requesterToken}` }
    });
    assert(blockedDlRes.status === 403, 'User without access grant blocked from downloading restricted dataset (403 Forbidden)');

    // Test 12: User submits access request
    const createReqRes = await fetch(`${BASE_URL}/access-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${requesterToken}`
      },
      body: JSON.stringify({
        dataset_id: genomicDatasetId,
        justification: 'Graduate thesis on molecular biomarker discovery in genomic sequence variations.'
      })
    });
    const createReqData = await createReqRes.json();
    assert(createReqRes.status === 201 && createReqData.data.request_id, 'Access request submitted with justification (201 Created)');

    const requestId = createReqData.data.request_id;

    // Test 13: Admin approves the access request
    const approveReqRes = await fetch(`${BASE_URL}/access-requests/${requestId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'APPROVED' })
    });
    assert(approveReqRes.status === 200, 'Admin approves access request (200 OK)');

    // Test 14: User now successfully downloads the restricted dataset
    const allowedDlRes = await fetch(`${BASE_URL}/datasets/${genomicDatasetId}/download`, {
      headers: { Authorization: `Bearer ${requesterToken}` }
    });
    assert(allowedDlRes.status === 200, 'Approved user permitted to download restricted dataset (200 OK)');

    // Test 15: Download audit log verified in Downloads table
    const [dlLog] = await pool.execute(
      'SELECT download_id, dataset_id, user_id FROM Downloads WHERE dataset_id = ? AND user_id = ?',
      [genomicDatasetId, requesterId]
    );
    assert(dlLog.length > 0, 'Downloads table recorded the download event with exact user and dataset IDs');

    // ------------------------------------------------------------------------
    // SECTION 5: RATINGS & REVIEWS SYSTEM
    // ------------------------------------------------------------------------
    console.log('\n--- Section 5: Ratings & Reviews System ---');

    // Test 16: User rates dataset 5 stars
    const rateRes = await fetch(`${BASE_URL}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${requesterToken}`
      },
      body: JSON.stringify({ dataset_id: solarDatasetId, rating: 5 })
    });
    const rateData = await rateRes.json();
    assert(rateRes.status === 200 && rateData.data.rating === 5, 'User rates dataset 5 stars');

    // Test 17: User updates rating to 4 stars (Atomic upsert test)
    const updateRateRes = await fetch(`${BASE_URL}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${requesterToken}`
      },
      body: JSON.stringify({ dataset_id: solarDatasetId, rating: 4 })
    });
    assert(updateRateRes.status === 200, 'User updates rating to 4 stars via atomic upsert');

    // Check no duplicate ratings row was created
    const [ratingCount] = await pool.execute(
      'SELECT COUNT(*) AS count FROM Ratings WHERE dataset_id = ? AND user_id = ?',
      [solarDatasetId, requesterId]
    );
    assert(ratingCount[0].count === 1, 'Duplicate rating prevented: exactly 1 rating row exists for (user, dataset)');

    // Test 18: User posts a qualitative review
    const postRevRes = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${requesterToken}`
      },
      body: JSON.stringify({
        dataset_id: solarDatasetId,
        review_text: 'Clean telemetry attributes. Very helpful for building flare magnitude forecasting models.'
      })
    });
    const postRevData = await postRevRes.json();
    assert(postRevRes.status === 201 && postRevData.data.review_id, 'Review posted successfully (201 Created)');

    const reviewId = postRevData.data.review_id;

    // Test 19: Retrieve reviews for dataset
    const getRevsRes = await fetch(`${BASE_URL}/reviews/${solarDatasetId}`);
    const getRevsData = await getRevsRes.json();
    assert(getRevsData.data.length >= 1, 'GET /api/reviews/:id returns dataset reviews');

    // Test 20: User deletes their review
    const delRevRes = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${requesterToken}` }
    });
    assert(delRevRes.status === 200, 'User can delete their own review (200 OK)');

  } catch (err) {
    console.error('Test run failed with error:', err);
    failed++;
  } finally {
    console.log('\n================================================================');
    console.log(` Phase 4 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('================================================================\n');

    if (server) {
      server.close(() => {
        process.exit(failed > 0 ? 1 : 0);
      });
    } else {
      process.exit(failed > 0 ? 1 : 0);
    }
  }
}

runDatasetStorageTestSuite();
