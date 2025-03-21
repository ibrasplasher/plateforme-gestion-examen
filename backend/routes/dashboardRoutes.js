// backend/routes/dashboardRoutes.js
const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const router = express.Router();
const db = require("../config/db");

// Route pour récupérer les statistiques du tableau de bord d'un enseignant
router.get("/teacher-statistics", authMiddleware, (req, res) => {
  // Vérifier que l'utilisateur est un enseignant
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un enseignant." });
  }

  const teacherId = req.user.id;

  // Récupérer le nombre total d'étudiants dans les classes de l'enseignant
  const studentCountQuery = `
    SELECT COUNT(DISTINCT ic.student_id) as studentCount
    FROM teachSubject ts
    JOIN inClass ic ON ts.class_id = ic.class_id
    WHERE ts.teacher_id = ?
  `;

  // Récupérer le nombre d'examens créés par l'enseignant
  const examCountQuery = `
    SELECT COUNT(*) as examCount
    FROM exam
    WHERE teacher_id = ?
  `;

  // Récupérer le nombre de soumissions pour les examens de l'enseignant
  const submissionCountQuery = `
    SELECT COUNT(*) as submissionCount
    FROM submission s
    JOIN exam e ON s.exam_id = e.id
    WHERE e.teacher_id = ?
  `;

  // Récupérer le taux de réussite (pourcentage de notes >= 10/20)
  const successRateQuery = `
    SELECT 
      ROUND(
        (SUM(CASE WHEN s.score >= 10 THEN 1 ELSE 0 END) / COUNT(*)) * 100
      ) as successRate
    FROM submission s
    JOIN exam e ON s.exam_id = e.id
    WHERE e.teacher_id = ? AND s.score IS NOT NULL
  `;

  // Récupérer les données de performance sur les 6 derniers mois
  const performanceQuery = `
    SELECT 
      DATE_FORMAT(s.submitted_at, '%Y-%m') as month,
      ROUND(AVG(s.score), 2) as avgScore
    FROM submission s
    JOIN exam e ON s.exam_id = e.id
    WHERE e.teacher_id = ? AND s.score IS NOT NULL
    GROUP BY DATE_FORMAT(s.submitted_at, '%Y-%m')
    ORDER BY month DESC
    LIMIT 6
  `;

  // Récupérer la distribution des notes
  const gradeDistributionQuery = `
    SELECT 
      CASE 
        WHEN s.score < 5 THEN '0-5'
        WHEN s.score < 10 THEN '6-10'
        WHEN s.score < 14 THEN '11-13'
        WHEN s.score < 17 THEN '14-16'
        ELSE '17-20'
      END as gradeRange,
      COUNT(*) as count
    FROM submission s
    JOIN exam e ON s.exam_id = e.id
    WHERE e.teacher_id = ? AND s.score IS NOT NULL
    GROUP BY gradeRange
  `;

  // Exécuter les requêtes en parallèle
  Promise.all([
    new Promise((resolve, reject) => {
      db.query(studentCountQuery, [teacherId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].studentCount);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(examCountQuery, [teacherId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].examCount);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(submissionCountQuery, [teacherId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].submissionCount);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(successRateQuery, [teacherId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].successRate || 0);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(performanceQuery, [teacherId], (err, results) => {
        if (err) reject(err);
        else {
          const months = [];
          const averages = [];

          // Inverser l'ordre pour afficher du plus ancien au plus récent
          results.reverse().forEach((row) => {
            // Formater le mois pour l'affichage (YYYY-MM -> MMM)
            const [year, month] = row.month.split("-");
            const date = new Date(year, month - 1, 1);
            const formattedMonth = date.toLocaleDateString("fr-FR", {
              month: "short",
            });

            months.push(formattedMonth);
            averages.push(row.avgScore);
          });

          resolve({ labels: months, averages: averages });
        }
      });
    }),
    new Promise((resolve, reject) => {
      db.query(gradeDistributionQuery, [teacherId], (err, results) => {
        if (err) reject(err);
        else {
          // Créer un tableau avec les plages de notes dans l'ordre
          const gradeRanges = ["0-5", "6-10", "11-13", "14-16", "17-20"];
          const counts = Array(gradeRanges.length).fill(0);

          // Remplir les valeurs existantes
          results.forEach((row) => {
            const index = gradeRanges.indexOf(row.gradeRange);
            if (index !== -1) {
              counts[index] = row.count;
            }
          });

          resolve({ labels: gradeRanges, values: counts });
        }
      });
    }),
  ])
    .then(
      ([
        studentCount,
        examCount,
        submissionCount,
        successRate,
        performance,
        gradeDistribution,
      ]) => {
        res.json({
          studentCount,
          examCount,
          submissionCount,
          successRate,
          performance,
          gradeDistribution,
        });
      }
    )
    .catch((error) => {
      console.error("Erreur lors de la récupération des statistiques:", error);
      res.status(500).json({ error: "Erreur serveur" });
    });
});

// Route pour récupérer les activités récentes d'un enseignant
router.get("/teacher-activities", authMiddleware, (req, res) => {
  // Vérifier que l'utilisateur est un enseignant
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un enseignant." });
  }

  const teacherId = req.user.id;

  // Cette requête est complexe et combinerait plusieurs tables
  // Pour simplifier, nous allons créer une union de plusieurs requêtes

  // 1. Examens créés récemment
  const examsQuery = `
    SELECT 
      'exam_created' as type,
      CONCAT('Nouvel examen créé: ', title) as title,
      CONCAT('Vous avez créé l\'examen "', title, '" pour la classe ', 
        (SELECT className FROM class WHERE id = class_id), 
        ' en ', 
        (SELECT name FROM subject WHERE id = subject_id)) as description,
      created_at as timestamp
    FROM exam
    WHERE teacher_id = ?
    ORDER BY created_at DESC
    LIMIT 5
  `;

  // 2. Soumissions récentes
  const submissionsQuery = `
    SELECT 
      'submission_received' as type,
      'Nouvelle soumission' as title,
      CONCAT(
        (SELECT CONCAT(firstName, ' ', lastName) FROM student WHERE id = s.student_id),
        ' a soumis sa copie pour l\'examen "',
        e.title,
        '"'
      ) as description,
      s.submitted_at as timestamp
    FROM submission s
    JOIN exam e ON s.exam_id = e.id
    WHERE e.teacher_id = ?
    ORDER BY s.submitted_at DESC
    LIMIT 5
  `;

  // 3. Notes attribuées récemment
  const gradesQuery = `
    SELECT 
      'grade_assigned' as type,
      'Note attribuée' as title,
      CONCAT(
        'Vous avez noté la copie de ',
        (SELECT CONCAT(firstName, ' ', lastName) FROM student WHERE id = s.student_id),
        ' (',
        s.score,
        '/20) pour l\'examen "',
        e.title,
        '"'
      ) as description,
      s.updated_at as timestamp
    FROM submission s
    JOIN exam e ON s.exam_id = e.id
    WHERE e.teacher_id = ? AND s.score IS NOT NULL
    ORDER BY s.updated_at DESC
    LIMIT 5
  `;

  // Exécuter les requêtes en parallèle
  Promise.all([
    new Promise((resolve, reject) => {
      db.query(examsQuery, [teacherId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(submissionsQuery, [teacherId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(gradesQuery, [teacherId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    }),
  ])
    .then(([exams, submissions, grades]) => {
      // Combiner tous les résultats
      const activities = [...exams, ...submissions, ...grades];

      // Trier par date décroissante
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Limiter à 10 activités maximum
      res.json(activities.slice(0, 10));
    })
    .catch((error) => {
      console.error("Erreur lors de la récupération des activités:", error);
      res.status(500).json({ error: "Erreur serveur" });
    });
});

// Route pour récupérer les examens à venir
router.get("/teacher-upcoming-exams", authMiddleware, (req, res) => {
  // Vérifier que l'utilisateur est un enseignant
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un enseignant." });
  }

  const teacherId = req.user.id;

  // Récupérer les examens avec date limite future, triés par date limite croissante
  const query = `
    SELECT 
      e.id,
      e.title,
      e.deadline,
      s.name as subjectName,
      c.className,
      (SELECT COUNT(*) FROM submission WHERE exam_id = e.id) as submissionsCount
    FROM exam e
    JOIN subject s ON e.subject_id = s.id
    JOIN class c ON e.class_id = c.id
    WHERE e.teacher_id = ? AND e.deadline > NOW()
    ORDER BY e.deadline ASC
    LIMIT 5
  `;

  db.query(query, [teacherId], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des examens à venir:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    res.json(results);
  });
});

// Route pour récupérer les soumissions récentes
router.get("/teacher-recent-submissions", authMiddleware, (req, res) => {
  // Vérifier que l'utilisateur est un enseignant
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un enseignant." });
  }

  const teacherId = req.user.id;

  // Récupérer les soumissions récentes avec détails
  const query = `
    SELECT 
      s.id,
      s.file_path,
      s.submitted_at,
      s.score,
      st.firstName,
      st.lastName,
      e.title as examTitle
    FROM submission s
    JOIN student st ON s.student_id = st.id
    JOIN exam e ON s.exam_id = e.id
    WHERE e.teacher_id = ?
    ORDER BY s.submitted_at DESC
    LIMIT 10
  `;

  db.query(query, [teacherId], (err, results) => {
    if (err) {
      console.error(
        "Erreur lors de la récupération des soumissions récentes:",
        err
      );
      return res.status(500).json({ error: "Erreur serveur" });
    }

    res.json(results);
  });
});

module.exports = router;
