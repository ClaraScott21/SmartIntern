// ============================================
// NEXORA — TEMPORARY in-memory database
// Swap back to MySQL later (see db.mysql.js)
// ============================================
const bcrypt = require('bcrypt');

// ---------- In-memory tables ----------
const users = [];      // { user_id, email, password_hash, role, created_at }
const students = [];   // { student_id, user_id, first_name, last_name, gpa, study_year }
const companies = [];  // { company_id, user_id, company_name, description }
const skills = [];     // { skill_id, skill_name, category }
const studentSkills = []; // { student_id, skill_id, proficiency_level, years_experience }

let nextUserId = 1;
let nextStudentId = 1;
let nextCompanyId = 1;
let nextSkillId = 1;

// ---------- Fake query() method ----------
// Mimics mysql2's pool.query() enough for our routes.
// NOTE: this only handles the exact queries we use in auth.js.
async function query(sql, params = []) {
  const s = sql.replace(/\s+/g, ' ').trim().toLowerCase();

  // ---- SELECT user_id FROM User WHERE email = ? ----
  if (s.startsWith('select user_id from user where email')) {
    const email = params[0];
    const found = users.filter(u => u.email === email);
    return [found.map(u => ({ user_id: u.user_id }))];
  }

  // ---- SELECT user_id, email, password_hash, role FROM User WHERE email = ? LIMIT 1 ----
  if (s.startsWith('select user_id, email, password_hash, role from user where email')) {
    const email = params[0];
    const found = users.find(u => u.email === email);
    return [found ? [{ ...found }] : []];
  }

  // ---- SELECT user_id, email, role FROM User WHERE user_id = ? LIMIT 1 ----
  if (s.startsWith('select user_id, email, role from user where user_id')) {
    const id = params[0];
    const found = users.find(u => u.user_id === id);
    return [found ? [{ user_id: found.user_id, email: found.email, role: found.role }] : []];
  }

  // ---- SELECT first_name, last_name, (subquery) FROM Student WHERE user_id = ? ----
  if (s.startsWith('select first_name, last_name') && s.includes('from student')) {
    const userId = params[0];
    const stu = students.find(s => s.user_id === userId);
    if (!stu) return [[]];
    const skillCount = studentSkills.filter(ss => ss.student_id === stu.student_id).length;
    return [[{
      first_name: stu.first_name,
      last_name: stu.last_name,
      skill_count: skillCount
    }]];
  }

  // ---- SELECT company_name FROM Company WHERE user_id = ? ----
  if (s.startsWith('select company_name from company where user_id')) {
    const userId = params[0];
    const c = companies.find(c => c.user_id === userId);
    return [c ? [{ company_name: c.company_name }] : []];
  }

  // ---- INSERT INTO User (email, password_hash, role) VALUES (?, ?, ?) ----
  if (s.startsWith('insert into user')) {
    const [email, password_hash, role] = params;
    const user = {
      user_id: nextUserId++,
      email,
      password_hash,
      role,
      created_at: new Date()
    };
    users.push(user);
    return [{ insertId: user.user_id, affectedRows: 1 }];
  }

  // ---- INSERT INTO Student (user_id, first_name, last_name) VALUES (?, ?, ?) ----
  if (s.startsWith('insert into student')) {
    const [user_id, first_name, last_name] = params;
    const stu = {
      student_id: nextStudentId++,
      user_id,
      first_name,
      last_name,
      gpa: null,
      study_year: null
    };
    students.push(stu);
    return [{ insertId: stu.student_id, affectedRows: 1 }];
  }

  // ---- INSERT INTO Company (user_id, company_name, description) VALUES (?, ?, ?) ----
  if (s.startsWith('insert into company')) {
    const [user_id, company_name, description] = params;
    const c = {
      company_id: nextCompanyId++,
      user_id,
      company_name,
      description
    };
    companies.push(c);
    return [{ insertId: c.company_id, affectedRows: 1 }];
  }

  // ---- Unsupported query ----
  console.warn('⚠️  Unhandled in-memory query:', sql);
  return [[]];
}

// ---------- Fake pool methods ----------
async function getConnection() {
  return {
    query,
    release: () => {},
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {}
  };
}

// ---------- Seed demo accounts ----------
(async () => {
  const hash = await bcrypt.hash('password123', 10);

  // Admin
  users.push({ user_id: nextUserId++, email: 'admin@nexora.com', password_hash: hash, role: 'admin', created_at: new Date() });

  // Students
  const studentSeeds = [
    { email: 'hein@student.com', first: 'Hein Htet', last: 'Aung', gpa: 3.45, year: 4 },
    { email: 'win@student.com',  first: 'Win Khant', last: 'Ko Ko', gpa: 3.20, year: 3 },
    { email: 'ye@student.com',   first: 'Ye Lin',    last: 'Aung', gpa: 3.75, year: 4 }
  ];
  for (const seed of studentSeeds) {
    const u = { user_id: nextUserId++, email: seed.email, password_hash: hash, role: 'student', created_at: new Date() };
    users.push(u);
    students.push({
      student_id: nextStudentId++,
      user_id: u.user_id,
      first_name: seed.first,
      last_name: seed.last,
      gpa: seed.gpa,
      study_year: seed.year
    });
  }

  // Companies
  const companySeeds = [
    { email: 'hr@techcorp.com',        name: 'TechCorp Ltd.',        desc: 'Full-stack software house.' },
    { email: 'jobs@innovate.com',      name: 'Innovate Solutions',   desc: 'Cloud & DevOps consulting.' },
    { email: 'careers@datamind.com',   name: 'DataMind Analytics',   desc: 'Data science and BI.' }
  ];
  for (const seed of companySeeds) {
    const u = { user_id: nextUserId++, email: seed.email, password_hash: hash, role: 'company', created_at: new Date() };
    users.push(u);
    companies.push({
      company_id: nextCompanyId++,
      user_id: u.user_id,
      company_name: seed.name,
      description: seed.desc
    });
  }

  // Skills
  const skillNames = [
    ['JavaScript', 'Programming'], ['Python', 'Programming'], ['Java', 'Programming'],
    ['SQL', 'Database'], ['MySQL', 'Database'],
    ['Node.js', 'Backend'], ['Express', 'Backend'],
    ['React', 'Frontend'], ['HTML', 'Frontend'], ['CSS', 'Frontend'],
    ['Git', 'Tooling'], ['Docker', 'DevOps']
  ];
  for (const [name, cat] of skillNames) {
    skills.push({ skill_id: nextSkillId++, skill_name: name, category: cat });
  }

  // Give each student a couple of skills
  studentSkills.push(
    { student_id: 1, skill_id: 1, proficiency_level: 'Advanced', years_experience: 3, last_used_year: 2025 },
    { student_id: 1, skill_id: 4, proficiency_level: 'Advanced', years_experience: 2, last_used_year: 2025 },
    { student_id: 2, skill_id: 2, proficiency_level: 'Intermediate', years_experience: 2, last_used_year: 2024 },
    { student_id: 3, skill_id: 1, proficiency_level: 'Advanced', years_experience: 3, last_used_year: 2025 }
  );

  console.log('✅ In-memory DB seeded with demo accounts (password: password123)');
  console.log('   Students: hein@student.com, win@student.com, ye@student.com');
  console.log('   Companies: hr@techcorp.com, jobs@innovate.com, careers@datamind.com');
  console.log('   Admin: admin@nexora.com');
})();

module.exports = { query, getConnection };