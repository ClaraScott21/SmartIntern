-- ============================================
-- NEXORA — SmartIntern schema (login stage)
-- ============================================

CREATE DATABASE IF NOT EXISTS smartintern
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smartintern;

-- ---------- User ----------
CREATE TABLE IF NOT EXISTS User (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('student','company','admin') NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- Student ----------
CREATE TABLE IF NOT EXISTS Student (
  student_id  INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL UNIQUE,
  first_name  VARCHAR(100),
  last_name   VARCHAR(100),
  gpa         DECIMAL(3,2),
  study_year  INT,
  FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- Company ----------
CREATE TABLE IF NOT EXISTS Company (
  company_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL UNIQUE,
  company_name VARCHAR(150) NOT NULL,
  description  TEXT,
  FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- Skill (needed for profileCompleted check) ----------
CREATE TABLE IF NOT EXISTS Skill (
  skill_id    INT AUTO_INCREMENT PRIMARY KEY,
  skill_name  VARCHAR(100) NOT NULL UNIQUE,
  category    VARCHAR(50),
  description TEXT
) ENGINE=InnoDB;

-- ---------- Student_Skill (bridge) ----------
CREATE TABLE IF NOT EXISTS Student_Skill (
  student_id        INT NOT NULL,
  skill_id          INT NOT NULL,
  proficiency_level ENUM('Beginner','Intermediate','Advanced') DEFAULT 'Beginner',
  years_experience  DECIMAL(3,1) DEFAULT 0,
  last_used_year    INT,
  PRIMARY KEY (student_id, skill_id),
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id)   REFERENCES Skill(skill_id)   ON DELETE CASCADE
) ENGINE=InnoDB;