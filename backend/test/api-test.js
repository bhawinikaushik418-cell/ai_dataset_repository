/**
 * Automated Integration Test Suite for AI Dataset Repository Backend API
 * Uses native Node.js fetch to test endpoints against the live Express server.
 */

const { startServer } = require('../src/server');
const { pool } = require('../src/config/db');

const BASE_URL = 'http://localhost:5000/api';

async function runTestSuite() {
  console.log('--- Starting Backend API Test Suite ---\n');

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
    console.error('Failed to start server for testing:', err.message);
    process.exit(1);
  }

  try {
    // 1. Healthcheck
    console.log('\n1. System Healthcheck');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.success === true, 'GET /api/health returns 200 OK');

    // 2. Authentication: Register new test user
    console.log('\n2. User Authentication (Register & Login)');
    const testEmail = `student_${Date.now()}@aixplore.edu`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student',
        email: testEmail,
        password: 'Password@123'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.data.token, 'POST /api/auth/register creates user and issues JWT');

    const userToken = regData.data.token;
    const userId = regData.data.user.userId;

    // 3. Register Duplicate Email (Constraint check)
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Student',
        email: testEmail,
        password: 'Password@123'
      })
    });
    assert(dupRes.status === 409, 'POST /api/auth/register prevents duplicate email (409 Conflict)');

    // 4. User Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password@123'
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.data.token, 'POST /api/auth/login authenticates user');

    // 5. Get Current User Profile
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.data.email === testEmail, 'GET /api/auth/me returns current user identity');

    // 6. Admin Authentication
    console.log('\n3. Admin Authentication & RBAC');
    // We will generate an admin token directly using the admin account seeded in Phase 1
    const [adminRows] = await pool.execute('SELECT user_id, email, role FROM Users WHERE role = "ADMIN" LIMIT 1');
    const adminUser = adminRows[0];
    const jwt = require('jsonwebtoken');
    const adminToken = jwt.sign(
      { userId: adminUser.user_id, email: adminUser.email, role: 'ADMIN' },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '1d' }
    );

    const adminMeRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminMeData = await adminMeRes.json();
    assert(adminMeRes.status === 200 && adminMeData.data.role === 'ADMIN', 'Admin identity verified with ADMIN role');

    // User attempting Admin-only endpoint (RBAC check)
    const forbiddenRes = await fetch(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(forbiddenRes.status === 403, 'GET /api/auth/users blocks standard user with 403 Forbidden');

    const adminUsersRes = await fetch(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminUsersRes.status === 200, 'GET /api/auth/users permits Admin with 200 OK');

    // 7. Categories & Tags
    console.log('\n4. Categories & Tags Exploration');
    const catRes = await fetch(`${BASE_URL}/categories`);
    const catData = await catRes.json();
    assert(catRes.status === 200 && Array.isArray(catData.data) && catData.data.length >= 4, 'GET /api/categories returns normalized categories');

    const tagsRes = await fetch(`${BASE_URL}/categories/tags`);
    const tagsData = await tagsRes.json();
    assert(tagsRes.status === 200 && Array.isArray(tagsData.data) && tagsData.data.length >= 10, 'GET /api/categories/tags returns tags with counts');

    // 8. Datasets Exploration
    console.log('\n5. Dataset Discovery & Parametric Filters');
    const datasetsRes = await fetch(`${BASE_URL}/datasets`);
    const datasetsData = await datasetsRes.json();
    assert(datasetsRes.status === 200 && datasetsData.data.length >= 5, 'GET /api/datasets returns approved real datasets');

    // Test Domain Filter
    const filterRes = await fetch(`${BASE_URL}/datasets?domain=Life%20Sciences`);
    const filterData = await filterRes.json();
    assert(filterRes.status === 200 && filterData.data.some(d => d.dataset_name === 'Iris'), 'GET /api/datasets?domain=Life Sciences returns Iris');

    // 9. Dataset Details & Access Checks
    console.log('\n6. Dataset Detail & Access Control Verification');
    // Public dataset: Iris (id 1)
    const irisRes = await fetch(`${BASE_URL}/datasets/1`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const irisData = await irisRes.json();
    assert(irisData.data.has_access === true && irisData.data.access_level === 'PUBLIC', 'Dataset #1 (Iris) is PUBLIC and accessible without restriction');

    // Restricted dataset: Heart Disease (id 2) - new user without approved request
    const heartRes = await fetch(`${BASE_URL}/datasets/2`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const heartData = await heartRes.json();
    assert(heartData.data.has_access === false && heartData.data.access_level === 'RESTRICTED', 'Dataset #2 (Heart Disease) is RESTRICTED and requires approval');

    // 10. Download Block on Restricted Dataset
    console.log('\n7. Protected File Download & Security Gate');
    const unauthorizedDlRes = await fetch(`${BASE_URL}/datasets/2/download`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(unauthorizedDlRes.status === 403, 'GET /api/datasets/2/download blocks unauthorized user with 403 Forbidden');

    // 11. Request Access Workflow
    console.log('\n8. Access Request Workflow');
    const reqAccessRes = await fetch(`${BASE_URL}/access-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        dataset_id: 2,
        justification: 'Graduate research studying cardiovascular risk predictive modeling algorithms.'
      })
    });
    const reqAccessData = await reqAccessRes.json();
    assert(reqAccessRes.status === 201 && reqAccessData.data.status === 'PENDING', 'POST /api/access-requests creates PENDING request');

    const createdRequestId = reqAccessData.data.request_id;

    // Check duplicate pending request prevention
    const dupReqRes = await fetch(`${BASE_URL}/access-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        dataset_id: 2,
        justification: 'Another concurrent pending request attempt.'
      })
    });
    assert(dupReqRes.status === 409, 'POST /api/access-requests blocks duplicate PENDING request with 409 Conflict');

    // 12. Admin Approves Request
    console.log('\n9. Administrator Approval & Audit Grant');
    const approveRes = await fetch(`${BASE_URL}/access-requests/${createdRequestId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'APPROVED'
      })
    });
    assert(approveRes.status === 200, 'PATCH /api/access-requests/:id/review approves request');

    // 13. Download Now Permitted!
    console.log('\n10. Permitted Download & Audit Trail Verification');
    const authorizedDlRes = await fetch(`${BASE_URL}/datasets/2/download`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(authorizedDlRes.status === 200, 'GET /api/datasets/2/download permits download after approval (200 OK)');

    // Verify audit record in Downloads table
    const [dlAudit] = await pool.execute(
      'SELECT download_id FROM Downloads WHERE dataset_id = 2 AND user_id = ? ORDER BY download_id DESC LIMIT 1',
      [userId]
    );
    assert(dlAudit.length > 0, 'Downloads table contains audited record for user download');

    // 14. Ratings & Reviews
    console.log('\n11. Ratings & Reviews System');
    const rateRes = await fetch(`${BASE_URL}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        dataset_id: 1,
        rating: 5
      })
    });
    const rateData = await rateRes.json();
    assert(rateRes.status === 200 && rateData.data.rating === 5, 'POST /api/ratings records 5-star user rating');

    const reviewRes = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        dataset_id: 1,
        review_text: 'Highly reliable iris dataset. Clean sepal and petal measurements for evaluation.'
      })
    });
    assert(reviewRes.status === 201, 'POST /api/reviews posts substantive feedback');

    // 15. Admin Analytics
    console.log('\n12. Admin Analytics Dashboard');
    const analyticsRes = await fetch(`${BASE_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const analyticsData = await analyticsRes.json();
    assert(
      analyticsRes.status === 200 &&
      analyticsData.data.kpis.total_datasets >= 5 &&
      Array.isArray(analyticsData.data.top_downloaded),
      'GET /api/admin/analytics returns repository KPIs & charts'
    );

  } catch (error) {
    console.error('Test execution error:', error);
    failed++;
  } finally {
    console.log('\n=======================================');
    console.log(` Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('=======================================\n');

    if (server) {
      server.close(() => {
        process.exit(failed > 0 ? 1 : 0);
      });
    } else {
      process.exit(failed > 0 ? 1 : 0);
    }
  }
}

runTestSuite();
