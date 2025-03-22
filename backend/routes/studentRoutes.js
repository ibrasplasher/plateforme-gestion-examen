// backend/routes/studentRoutes.js
const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");
const multer = require("multer");
const router = express.Router();

// Configuration de Multer pour les soumissions d'étudiants
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const submissionsDir = path.join(__dirname, "../../frontend/submissions");
    if (!fs.existsSync(submissionsDir)) {
      fs.mkdirSync(submissionsDir, { recursive: true });
    }
    cb(null, submissionsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "submission-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // limite de 10 MB
});

// Route pour obtenir les statistiques de l'étudiant
router.get("/student-statistics", authMiddleware, (req, res) => {
  // Vérifier que l'utilisateur est un étudiant
  if (req.user.role !== "student") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un étudiant." });
  }

  const studentId = req.user.id;

  // Requête pour récupérer les statistiques de l'étudiant
  const statsQuery = `
        SELECT 
            MAX(s.score) as bestGrade,
            MIN(s.score) as worstGrade,
            (SELECT subj.name 
             FROM submission s2
             JOIN exam e2 ON s2.exam_id = e2.id
             JOIN subject subj ON e2.subject_id = subj.id
             WHERE s2.student_id = ? AND s2.score = MAX(s.score)
             LIMIT 1) as bestCourse,
            (SELECT subj.name 
             FROM submission s2
             JOIN exam e2 ON s2.exam_id = e2.id
             JOIN subject subj ON e2.subject_id = subj.id
             WHERE s2.student_id = ? AND s2.score = MIN(s.score)
             LIMIT 1) as worstCourse,
            ROUND((SUM(CASE WHEN s.score >= 10 THEN 1 ELSE 0 END) / COUNT(*)) * 100) as successRate
        FROM submission s
        WHERE s.student_id = ? AND s.score IS NOT NULL
    `;

  // Requête pour récupérer les données de progression au fil du temps
  const progressQuery = `
        SELECT 
            DATE_FORMAT(s.submitted_at, '%Y-%m') as month,
            ROUND(AVG(s.score), 2) as avgScore
        FROM submission s
        WHERE s.student_id = ? AND s.score IS NOT NULL
        GROUP BY DATE_FORMAT(s.submitted_at, '%Y-%m')
        ORDER BY month DESC
        LIMIT 7
    `;

  // Exécuter les requêtes en parallèle
  Promise.all([
    new Promise((resolve, reject) => {
      db.query(
        statsQuery,
        [studentId, studentId, studentId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        }
      );
    }),
    new Promise((resolve, reject) => {
      db.query(progressQuery, [studentId], (err, results) => {
        if (err) reject(err);
        else {
          // Transformer les résultats pour les graphiques
          const months = [];
          const scores = [];

          // Inverser l'ordre pour avoir les données du plus ancien au plus récent
          results.reverse().forEach((row) => {
            const [year, month] = row.month.split("-");
            const date = new Date(year, month - 1, 1);
            const formattedMonth = date.toLocaleDateString("fr-FR", {
              month: "short",
            });

            months.push(formattedMonth);
            scores.push(row.avgScore);
          });

          resolve({ labels: months, values: scores });
        }
      });
    }),
  ])
    .then(([stats, progress]) => {
      res.json({
        bestGrade: stats.bestGrade,
        worstGrade: stats.worstGrade,
        bestCourse: stats.bestCourse,
        worstCourse: stats.worstCourse,
        successRate: stats.successRate || 0,
        progressData: {
          labels: progress.labels,
          values: progress.values,
        },
      });
    })
    .catch((error) => {
      console.error("Erreur lors de la récupération des statistiques:", error);
      res.status(500).json({ error: "Erreur serveur" });
    });
});

// Route pour récupérer les examens disponibles pour l'étudiant
router.get("/student-available-exams", authMiddleware, (req, res) => {
  // Vérifier que l'utilisateur est un étudiant
  if (req.user.role !== "student") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un étudiant." });
  }

  const studentId = req.user.id;

  // Récupérer la classe de l'étudiant - MODIFIÉ POUR UTILISER LA COLONNE class_id
  db.query(
    "SELECT class_id FROM student WHERE id = ?",
    [studentId],
    (err, results) => {
      if (err) {
        console.error("Erreur lors de la récupération de la classe:", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      if (results.length === 0 || !results[0].class_id) {
        return res
          .status(404)
          .json({ error: "Étudiant non assigné à une classe" });
      }

      const classId = results[0].class_id;

      // Récupérer les examens pour cette classe qui ne sont pas expirés
      const query = `
            SELECT 
                e.id, e.title, e.description, e.deadline, 
                s.name as subjectName,
                (SELECT COUNT(*) FROM submission sub WHERE sub.exam_id = e.id AND sub.student_id = ?) as isSubmitted
            FROM exam e
            JOIN subject s ON e.subject_id = s.id
            WHERE e.class_id = ? AND e.deadline > NOW()
            ORDER BY e.deadline ASC
        `;

      db.query(query, [studentId, classId], (err, exams) => {
        if (err) {
          console.error("Erreur lors de la récupération des examens:", err);
          return res.status(500).json({ error: "Erreur serveur" });
        }

        // Formater les résultats
        const formattedExams = exams.map((exam) => ({
          id: exam.id,
          title: exam.title,
          description: exam.description,
          deadline: exam.deadline,
          subjectName: exam.subjectName,
          isSubmitted: exam.isSubmitted > 0,
        }));

        res.json(formattedExams);
      });
    }
  );
});

// Route pour télécharger un examen
router.get("/download-exam/:examId", authMiddleware, (req, res) => {
  // Vérifier que l'utilisateur est un étudiant
  if (req.user.role !== "student") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un étudiant." });
  }

  const examId = req.params.examId;
  const studentId = req.user.id;

  // Vérifier que l'étudiant a accès à cet examen
  db.query(
    `SELECT e.*, ic.student_id
         FROM exam e
         JOIN inClass ic ON e.class_id = ic.class_id
         WHERE e.id = ? AND ic.student_id = ?`,
    [examId, studentId],
    (err, results) => {
      if (err) {
        console.error("Erreur lors de la vérification de l'accès:", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      if (results.length === 0) {
        return res
          .status(403)
          .json({ error: "Vous n'êtes pas autorisé à accéder à cet examen" });
      }

      const exam = results[0];
      const filePath = path.join(__dirname, "../../frontend", exam.file_path);

      // Vérifier si le fichier existe
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Fichier d'examen non trouvé" });
      }

      // Envoyer le fichier
      res.download(filePath);
    }
  );
});

// Route pour soumettre une réponse à un examen
router.post(
  "/submit-exam",
  authMiddleware,
  upload.single("submissionFile"),
  (req, res) => {
    // Vérifier que l'utilisateur est un étudiant
    if (req.user.role !== "student") {
      return res
        .status(403)
        .json({ error: "Accès refusé. Vous devez être un étudiant." });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Aucun fichier n'a été téléchargé." });
    }

    const studentId = req.user.id;
    const examId = req.body.examId;

    if (!examId) {
      return res.status(400).json({ error: "ID d'examen manquant" });
    }

    // Vérifier que l'étudiant a accès à cet examen
    db.query(
      `SELECT e.*, ic.student_id
         FROM exam e
         JOIN inClass ic ON e.class_id = ic.class_id
         WHERE e.id = ? AND ic.student_id = ?`,
      [examId, studentId],
      (err, results) => {
        if (err) {
          console.error("Erreur lors de la vérification de l'accès:", err);
          return res.status(500).json({ error: "Erreur serveur" });
        }

        if (results.length === 0) {
          return res
            .status(403)
            .json({ error: "Vous n'êtes pas autorisé à accéder à cet examen" });
        }

        const exam = results[0];

        // Vérifier si la date limite est dépassée
        const deadline = new Date(exam.deadline);
        const now = new Date();
        if (now > deadline) {
          return res
            .status(400)
            .json({ error: "La date limite de soumission est dépassée" });
        }

        // Vérifier si l'étudiant a déjà soumis une réponse
        db.query(
          "SELECT * FROM submission WHERE exam_id = ? AND student_id = ?",
          [examId, studentId],
          (err, submissions) => {
            if (err) {
              console.error(
                "Erreur lors de la vérification des soumissions:",
                err
              );
              return res.status(500).json({ error: "Erreur serveur" });
            }

            // Si une soumission existe déjà, la mettre à jour
            if (submissions.length > 0) {
              const submission = submissions[0];

              // Supprimer l'ancien fichier
              const oldFilePath = path.join(
                __dirname,
                "../../frontend",
                submission.file_path
              );
              if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
              }

              // Mettre à jour la soumission
              const relativePath =
                "submissions/" + path.basename(req.file.path);
              db.query(
                "UPDATE submission SET file_path = ?, submitted_at = NOW(), score = NULL WHERE id = ?",
                [relativePath, submission.id],
                (err, result) => {
                  if (err) {
                    console.error(
                      "Erreur lors de la mise à jour de la soumission:",
                      err
                    );
                    return res.status(500).json({ error: "Erreur serveur" });
                  }

                  res.status(200).json({
                    message: "Soumission mise à jour avec succès",
                    submissionId: submission.id,
                  });
                }
              );
            }
            // Sinon, créer une nouvelle soumission
            else {
              const relativePath =
                "submissions/" + path.basename(req.file.path);
              db.query(
                "INSERT INTO submission (student_id, exam_id, file_path, submitted_at) VALUES (?, ?, ?, NOW())",
                [studentId, examId, relativePath],
                (err, result) => {
                  if (err) {
                    console.error(
                      "Erreur lors de l'enregistrement de la soumission:",
                      err
                    );
                    return res.status(500).json({ error: "Erreur serveur" });
                  }

                  res.status(201).json({
                    message: "Soumission enregistrée avec succès",
                    submissionId: result.insertId,
                  });
                }
              );
            }
          }
        );
      }
    );
  }
);

// Route pour récupérer les notes de l'étudiant
router.get("/student-grades", authMiddleware, (req, res) => {
  // Vérifier que l'utilisateur est un étudiant
  if (req.user.role !== "student") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un étudiant." });
  }

  const studentId = req.user.id;

  // Récupérer toutes les soumissions de l'étudiant avec les détails des examens
  const query = `
        SELECT 
            s.id, s.file_path, s.submitted_at, s.score,
            e.title as examTitle,
            subj.name as subjectName
        FROM submission s
        JOIN exam e ON s.exam_id = e.id
        JOIN subject subj ON e.subject_id = subj.id
        WHERE s.student_id = ?
        ORDER BY s.submitted_at DESC
    `;

  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des notes:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    res.json(results);
  });
});

// Route pour récupérer les examens de l'étudiant (pour le tableau de bord)
router.get("/student-exams", authMiddleware, (req, res) => {
  // Vérifier que l'utilisateur est un étudiant
  if (req.user.role !== "student") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un étudiant." });
  }

  const studentId = req.user.id;

  // Récupérer la classe de l'étudiant
  db.query(
    "SELECT class_id FROM inClass WHERE student_id = ?",
    [studentId],
    (err, results) => {
      if (err) {
        console.error("Erreur lors de la récupération de la classe:", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ error: "Étudiant non assigné à une classe" });
      }

      const classId = results[0].class_id;

      // Récupérer les examens à venir pour cette classe
      const query = `
            SELECT 
                e.id, e.title, e.deadline, 
                s.name as subjectName
            FROM exam e
            JOIN subject s ON e.subject_id = s.id
            WHERE e.class_id = ? AND e.deadline > NOW()
            ORDER BY e.deadline ASC
            LIMIT 5
        `;

      db.query(query, [classId], (err, exams) => {
        if (err) {
          console.error("Erreur lors de la récupération des examens:", err);
          return res.status(500).json({ error: "Erreur serveur" });
        }

        res.json(exams);
      });
    }
  );
});

// Route pour voir une soumission
router.get("/view-submission/:submissionId", authMiddleware, (req, res) => {
  // Cette route peut être utilisée par les étudiants (pour voir leurs propres soumissions)
  // ou par les enseignants (pour voir les soumissions des étudiants)

  const submissionId = req.params.submissionId;
  const userId = req.user.id;
  const isTeacher = req.user.role === "teacher";

  let query;
  let params;

  if (isTeacher) {
    // Un enseignant peut voir les soumissions pour ses examens
    query = `
            SELECT s.file_path 
            FROM submission s
            JOIN exam e ON s.exam_id = e.id
            WHERE s.id = ? AND e.teacher_id = ?
        `;
    params = [submissionId, userId];
  } else {
    // Un étudiant ne peut voir que ses propres soumissions
    query = `
            SELECT file_path FROM submission WHERE id = ? AND student_id = ?
        `;
    params = [submissionId, userId];
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération de la soumission:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    if (results.length === 0) {
      return res.status(403).json({
        error: "Vous n'êtes pas autorisé à accéder à cette soumission",
      });
    }

    const filePath = path.join(
      __dirname,
      "../../frontend",
      results[0].file_path
    );

    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ error: "Fichier de soumission non trouvé" });
    }

    // Envoyer le fichier
    res.download(filePath);
  });
});

module.exports = router;
