// backend/seed.js
// Run once: node seed.js
// Then delete this file.
const bcrypt = require('bcrypt');
const pool = require('./db');

async function seed() {
  const hash = await bcrypt.hash('password123', 10);
  console.log('bcrypt hash for "password123":');
  console.log(hash);
  console.log('\nCopy this hash into your seed SQL, or uncomment the SQL below.\n');

  // ---- OPTIONAL: run this if your friend wants you to insert directly ----
  // const users = [
  //   ['admin@nexora.com',  hash, 'admin'],
  //   ['hein@student.com',  hash, 'student'],
  //   ['win@student.com',   hash, 'student'],
  //   ['ye@student.com',    hash, 'student'],
  //   ['hr@techcorp.com',   hash, 'company'],
  // ];
  // for (const u of users) {
  //   await pool.query(
  //     'INSERT IGNORE INTO User (email, password_hash, role) VALUES (?, ?, ?)',
  //     u
  //   );
  // }
  // console.log('✅ Seeded users');
  // process.exit(0);

  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });