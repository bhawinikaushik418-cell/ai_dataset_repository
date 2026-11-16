/**
 * Phase 3 Test Suite: Authentication, Role-Based Authorization & Token Revocation
 */

const { startServer } = require('../src/server');
const { pool } = require('../src/config/db');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000/api';

async function runAuthRBACTestSuite() {
  console.log('=======================================================');
  console.log(' Starting Phase 3: Auth & Authorization Test Suite     ');
  console.log('=======================================================\n');

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
    // SECTION 1: REGISTRATION & SELF-PROMOTION PREVENTION
    // ------------------------------------------------------------------------
    console.log('\n--- Section 1: Registration, Input Validation & Security Rules ---');

    // 1. Weak password validation
    const weakPassRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Shorty', email: 'short@test.com', password: '123' })
    });
    assert(weakPassRes.status === 400, 'Registration rejects password shorter than 6 characters (400 Bad Request)');

    // 2. Invalid email format
    const badEmailRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bad Mail', email: 'not-an-email', password: 'ValidPassword@123' })
    });
    assert(badEmailRes.status === 400, 'Registration rejects invalid email format (400 Bad Request)');

    // 3. Valid user registration + Security check: attempting to sneak `role: ADMIN`
    const timestamp = Date.now();
    const testEmail = `researcher_${timestamp}@aixplore.edu`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Jane Roe',
        email: testEmail,
        password: 'SecurePassword@123',
        role: 'ADMIN' // Malicious attempt to self-promote to ADMIN
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.success === true, 'Valid registration creates user account (201 Created)');
    assert(regData.data.user.role === 'USER', 'CRITICAL SECURITY: Server strictly ignores client role and assigns USER');

    const userToken = regData.data.token;
    const testUserId = regData.data.user.userId;

    // 4. Duplicate email prevention
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Jane Roe Clone',
        email: testEmail,
        password: 'SecurePassword@123'
      })
    });
    assert(dupRes.status === 409, 'Duplicate email registration blocked (409 Conflict)');

    // ------------------------------------------------------------------------
    // SECTION 2: LOGIN & PASSWORD VERIFICATION
    // ------------------------------------------------------------------------
    console.log('\n--- Section 2: Login & Password Verification ---');

    // 5. Non-existent email
    const noUserRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ghost_user@aixplore.edu', password: 'SomePassword' })
    });
    assert(noUserRes.status === 401, 'Login fails for non-existent email (401 Unauthorized)');

    // 6. Invalid password
    const wrongPassRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword@999' })
    });
    assert(wrongPassRes.status === 401, 'Login fails for incorrect password (401 Unauthorized)');

    // 7. Correct credentials
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'SecurePassword@123' })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.data.token, 'Login succeeds with valid credentials (200 OK)');

    const activeUserToken = loginData.data.token;

    // ------------------------------------------------------------------------
    // SECTION 3: PROTECTED ROUTES & JWT VERIFICATION
    // ------------------------------------------------------------------------
    console.log('\n--- Section 3: Protected Routes & JWT Verification ---');

    // 8. Missing token
    const noTokenRes = await fetch(`${BASE_URL}/auth/me`);
    assert(noTokenRes.status === 401, 'Protected route /api/auth/me rejects missing token (401 Unauthorized)');

    // 9. Tampered token
    const fakeToken = `${activeUserToken.slice(0, -6)}xxxxxx`;
    const tamperedRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${fakeToken}` }
    });
    assert(tamperedRes.status === 401, 'Protected route rejects forged/tampered JWT (401 Unauthorized)');

    // 10. Valid token
    const validMeRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${activeUserToken}` }
    });
    const validMeData = await validMeRes.json();
    assert(validMeRes.status === 200 && validMeData.data.email === testEmail, 'Protected route accepts valid JWT');

    // ------------------------------------------------------------------------
    // SECTION 4: ROLE-BASED ACCESS CONTROL (USER vs ADMIN)
    // ------------------------------------------------------------------------
    console.log('\n--- Section 4: Role-Based Access Control (RBAC) ---');

    // Get Admin Token from Database
    const [adminRow] = await pool.execute('SELECT user_id, email FROM Users WHERE role = "ADMIN" LIMIT 1');
    const adminToken = jwt.sign(
      { userId: adminRow[0].user_id, email: adminRow[0].email, role: 'ADMIN' },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '1d' }
    );

    // 11. User accessing /api/auth/users (Admin only)
    const userAccessUsers = await fetch(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${activeUserToken}` }
    });
    assert(userAccessUsers.status === 403, 'RBAC Gate: Standard user blocked from /api/auth/users (403 Forbidden)');

    // 12. User accessing /api/categories POST (Admin only)
    const userCreateCat = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeUserToken}`
      },
      body: JSON.stringify({ name: 'Unauthorized Category' })
    });
    assert(userCreateCat.status === 403, 'RBAC Gate: Standard user blocked from category creation (403 Forbidden)');

    // 13. User accessing /api/admin/analytics (Admin only)
    const userAnalytics = await fetch(`${BASE_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${activeUserToken}` }
    });
    assert(userAnalytics.status === 403, 'RBAC Gate: Standard user blocked from admin analytics (403 Forbidden)');

    // 14. Admin accessing admin endpoints
    const adminAccessUsers = await fetch(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminAccessUsers.status === 200, 'RBAC: Admin successfully accesses /api/auth/users (200 OK)');

    const adminAnalytics = await fetch(`${BASE_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminAnalytics.status === 200, 'RBAC: Admin successfully accesses /api/admin/analytics (200 OK)');

    // ------------------------------------------------------------------------
    // SECTION 5: DATASET ACCESS PERMISSION GATE BEFORE DOWNLOAD
    // ------------------------------------------------------------------------
    console.log('\n--- Section 5: Protected Download Permission Gate ---');

    // 15. Anonymous download without login -> 401 Unauthorized
    const anonPublicDl = await fetch(`${BASE_URL}/datasets/1/download`);
    assert(anonPublicDl.status === 401, 'Permission Check: Anonymous download without login blocked (401 Unauthorized)');

    // 16. Authenticated user downloading approved public dataset -> 200 OK
    const authPublicDl = await fetch(`${BASE_URL}/datasets/1/download`, {
      headers: { Authorization: `Bearer ${activeUserToken}` }
    });
    assert(authPublicDl.status === 200, 'Permission Check: Authenticated user downloads approved public dataset (200 OK)');

    // 17. Restricted dataset download by user without approved request -> 403 Forbidden
    const unapprovedDl = await fetch(`${BASE_URL}/datasets/2/download`, {
      headers: { Authorization: `Bearer ${activeUserToken}` }
    });
    assert(unapprovedDl.status === 403, 'Permission Check: Restricted dataset blocks unapproved user (403 Forbidden)');

    // ------------------------------------------------------------------------
    // SECTION 6: LOGOUT & SERVER-SIDE TOKEN INVALIDATION STRATEGY
    // ------------------------------------------------------------------------
    console.log('\n--- Section 6: Server-Side Logout & Token Invalidation ---');

    // 18. User calls /api/auth/logout with active token
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${activeUserToken}` }
    });
    const logoutData = await logoutRes.json();
    assert(logoutRes.status === 200 && logoutData.success === true, 'POST /api/auth/logout successfully executes');

    // 19. Try accessing protected route with the LOGGED-OUT token
    const postLogoutMe = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${activeUserToken}` }
    });
    assert(postLogoutMe.status === 401, 'CRITICAL: Revoked token immediately blocked on /api/auth/me (401 Unauthorized)');

    // ------------------------------------------------------------------------
    // SECTION 7: USER ACCOUNT SUSPENSION ENFORCEMENT
    // ------------------------------------------------------------------------
    console.log('\n--- Section 7: User Account Suspension Enforcement ---');

    // User logs in again to get a fresh token
    const freshLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'SecurePassword@123' })
    });
    const freshData = await freshLogin.json();
    const freshToken = freshData.data.token;

    // Admin suspends the user account
    const suspendRes = await fetch(`${BASE_URL}/auth/users/${testUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'SUSPENDED' })
    });
    assert(suspendRes.status === 200, 'Admin successfully updates user status to SUSPENDED');

    // Attempting login with suspended account
    const suspendedLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'SecurePassword@123' })
    });
    assert(suspendedLogin.status === 403, 'Login rejected for SUSPENDED account (403 Forbidden)');

    // Attempting API call with existing token from suspended user
    const suspendedApiCall = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${freshToken}` }
    });
    assert(suspendedApiCall.status === 403, 'Existing JWT for suspended account immediately denied (403 Forbidden)');

  } catch (err) {
    console.error('Test run failed with error:', err);
    failed++;
  } finally {
    console.log('\n=======================================================');
    console.log(` Phase 3 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('=======================================================\n');

    if (server) {
      server.close(() => {
        process.exit(failed > 0 ? 1 : 0);
      });
    } else {
      process.exit(failed > 0 ? 1 : 0);
    }
  }
}

runAuthRBACTestSuite();
