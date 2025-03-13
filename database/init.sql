CREATE DATABASE IF NOT EXISTS exam_platform;
USE exam_platform;

-- Table des etudiants
CREATE TABLE student (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    ddn DATE NOT NULL,
    numCarte INT UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

-- Table des enseignants
CREATE TABLE teacher (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    ddn DATE NOT NULL,
    numCarte INT UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    speciality VARCHAR(255) NOT NULL
);

-- Table des examens
CREATE TABLE exam (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(255) NOT NULL,
    teacher_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deadline TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    corrige VARCHAR(255) DEFAULT NULL,
    foreign key (teacher_id) references teacher(id) on delete cascade
);

-- Table des copies soumises
CREATE TABLE submission (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    exam_id INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score FLOAT DEFAULT NULL,
    FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exam(id) ON DELETE CASCADE,
    CONSTRAINT chk_score CHECK (score >= 0 AND score <= 20)
);

-- Table des corrections automatiques
CREATE TABLE correction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    corrected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ai_score FLOAT NOT NULL,
    comments TEXT,
    FOREIGN KEY (submission_id) REFERENCES submission(id) ON DELETE CASCADE,
    CONSTRAINT chk_ai_score CHECK (ai_score >= 0 AND ai_score <= 20)
);

crate table class(
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    teacherIn INT NOT NULL,
    studentIn INT NOT NULL,
    foreign key (teacherIn) references teacher(id) on delete cascade,
    foreign key (studentIn) references student(id) on delete cascade
);

CREATE INDEX idx_student_email ON student(email);
CREATE INDEX idx_teacher_email ON teacher(email);
CREATE INDEX idx_student_numCarte ON student(numCarte);
CREATE INDEX idx_teacher_numCarte ON teacher(numCarte);
CREATE INDEX idx_exam_teacher ON exam(teacher_id);
CREATE INDEX idx_submission_exam ON submission(exam_id);


-- Requête pour afficher les soumissions avec les noms des étudiants et les titres des examens
--SELECT s.id, st.firstName AS student_name, e.title AS exam_title, s.file_path, s.score
--FROM submission s
--JOIN student st ON s.student_id = st.id
--JOIN exam e ON s.exam_id = e.id
--ORDER BY s.submitted_at DESC;

-- Insertion de 50 étudiants
INSERT INTO student (firstName, lastName, ddn, numCarte, email, password_hash) VALUES
('Alice', 'Durand', '2002-05-10', 1001, 'alice.durand@example.com', 'hashed_password'),
('Bob', 'Lemoine', '2001-08-20', 1002, 'bob.lemoine@example.com', 'hashed_password'),
('Charlie', 'Morel', '2003-02-15', 1003, 'charlie.morel@example.com', 'hashed_password'),
('David', 'Lambert', '2002-11-30', 1004, 'david.lambert@example.com', 'hashed_password'),
('Emma', 'Bertrand', '2000-06-25', 1005, 'emma.bertrand@example.com', 'hashed_password'),
('Zoe', 'Martin', '2003-07-12', 1050, 'zoe.martin@example.com', 'hashed_password');

-- Insertion de 50 enseignants
INSERT INTO teacher (firstName, lastName, ddn, numCarte, email, password_hash, speciality) VALUES
('Jean', 'Dupont', '1980-03-22', 2001, 'jean.dupont@example.com', 'hashed_password', 'Mathématiques'),
('Marie', 'Curie', '1975-09-14', 2002, 'marie.curie@example.com', 'hashed_password', 'Physique'),
('Paul', 'Durand', '1982-07-05', 2003, 'paul.durand@example.com', 'hashed_password', 'Informatique'),
('Sophie', 'Blanc', '1978-12-19', 2004, 'sophie.blanc@example.com', 'hashed_password', 'Chimie'),
('Antoine', 'Moreau', '1985-02-10', 2005, 'antoine.moreau@example.com', 'hashed_password', 'Biologie'),
('Lucie', 'Rousseau', '1981-06-30', 2050, 'lucie.rousseau@example.com', 'hashed_password', 'Philosophie');



