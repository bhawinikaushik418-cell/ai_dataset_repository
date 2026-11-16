const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seedUsers() {
  try {
    console.log('[SEED] Starting user seeding with verified bcrypt hashes...');

    const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);
    const userPasswordHash = await bcrypt.hash('User@12345', 10);

    const usersToSeed = [
      { id: 1, name: 'System Administrator', email: 'admin@aixplore.edu', hash: adminPasswordHash, role: 'ADMIN', status: 'ACTIVE' },
      { id: 2, name: 'Alice Johnson', email: 'alice@aixplore.edu', hash: userPasswordHash, role: 'USER', status: 'ACTIVE' },
      { id: 3, name: 'Bob Smith', email: 'bob@aixplore.edu', hash: userPasswordHash, role: 'USER', status: 'ACTIVE' },
      { id: 4, name: 'Dr. Clara Oswald', email: 'clara@aixplore.edu', hash: userPasswordHash, role: 'USER', status: 'ACTIVE' }
    ];

    for (const u of usersToSeed) {
      await pool.execute(
        `INSERT INTO Users (user_id, name, email, password_hash, role, status)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           password_hash = VALUES(password_hash),
           role = VALUES(role),
           status = VALUES(status)`,
        [u.id, u.name, u.email, u.hash, u.role, u.status]
      );
      console.log(`[SEED] Configured user: ${u.email} (${u.role})`);
    }

    console.log('[SEED] User seeding completed successfully.');
  } catch (err) {
    console.error('[SEED] Error seeding users:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seedUsers();
}

module.exports = seedUsers;
