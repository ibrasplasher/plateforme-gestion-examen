DROP DATABASE IF EXISTS exam_platform;
CREATE DATABASE exam_platform;
USE exam_platform;

-- Table des étudiants
CREATE TABLE student (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    numCarte VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

-- Table des enseignants
CREATE TABLE teacher (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    contact VARCHAR(255) NOT NULL,
    profilPhoto VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

-- Table des classes
CREATE TABLE class (
    id INT AUTO_INCREMENT PRIMARY KEY,
    className VARCHAR(255) NOT NULL
);

-- Table d'affectation des étudiants aux classes
CREATE TABLE inClass (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    FOREIGN KEY (class_id) REFERENCES class(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE
);

-- Table des matières
CREATE TABLE subject (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Table d'affectation des enseignants aux matières et classes
CREATE TABLE teachSubject (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    subject_id INT NOT NULL,
    class_id INT NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES teacher(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES class(id) ON DELETE CASCADE
);

-- Table des examens
CREATE TABLE exam (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(255) NOT NULL,
    teacher_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deadline DATETIME NOT NULL,
    corrige VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (teacher_id) REFERENCES teacher(id) ON DELETE CASCADE
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

-- Index pour optimiser les recherches
CREATE INDEX idx_student_email ON student(email);
CREATE INDEX idx_teacher_email ON teacher(email);
CREATE INDEX idx_student_numCarte ON student(numCarte);
CREATE INDEX idx_exam_teacher ON exam(teacher_id);
CREATE INDEX idx_submission_exam ON submission(exam_id);

-- Insertion des classes
INSERT INTO class (className) VALUES
('DSTTR1A'), ('DSTTR1B'), ('DSTI1A'), ('DSTI1B'), ('DSTI1C'), ('DSTI1D'),
('DSTI2A'), ('DSTI2B'), ('DSTI2C'), ('Licence 1A'), ('Licence 1B'),
('Licence 2A'), ('Licence 2B'), ('Licence 3A'), ('Licence 3B'),
('Master 1'), ('Master 2'), ('DIC1'), ('DIC2'), ('DIC3');

-- Insertion des matières
INSERT INTO subject (name) VALUES
('Langage C'), ('POO'), ('Algo'), ('Base de donnees'), ('Reseaux'),
('Systeme d''exploitation'), ('Developpement Web'), ('Maths discretes'),
('Analyse'), ('Probabilite'), ('Algebre'), ('PPP'), ('IPDL'),
('Architecture'), ('UML'), ('Genie Logiciel'), ('Signal'), ('Anglais');

-- Insertion des étudiants
INSERT INTO student (firstName, lastName,numCarte, email, password_hash) VALUES
('Jean', 'Dupont', '20180AFRD', 'dupont@gmail.com',  '$2y$10$3'),
('Coumba', 'FALL', '20220AXCF', 'coumbafall@gmail.com', '$2y$10$3');

-- Insertion des enseignants
INSERT INTO teacher (firstName, lastName, email, contact, profilPhoto, password_hash) VALUES
('Ahmadou', 'MBACKE', 'ahmadoumbacke@gmail.com', '778945612', '../profiles/defaultPicture.jpg', '$2y$10$3'),
('Khadija', 'NDAO', 'khadija.ndao@gmail.com', '778123456', '../profiles/defaultPicture.jpg', '$2y$10$3'),
('Boubacar', 'SARR', 'boubacar.sarr@gmail.com', '776789012', '../profiles/defaultPicture.jpg', '$2y$10$3');

-- Assignation d'un prof à une matière et une classe
INSERT INTO teachSubject (teacher_id, subject_id, class_id) VALUES
(1, 1, 1), (2, 2, 2), (3, 3, 3);

-- Assignation d'étudiants à des classes
INSERT INTO inClass (class_id, student_id) VALUES
(1, 1), (1, 2), (2, 3), (3, 4), (3, 5);
