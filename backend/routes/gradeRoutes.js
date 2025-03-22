// backend/routes/gradeRoutes.js
const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const db = require("../config/db");
const router = express.Router();

// Route pour récupérer les soumissions pour un examen spécifique
router.get("/exam-submissions/:examId", authMiddleware, (req, res) => {
  // Vérifier si l'utilisateur est un enseignant
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un enseignant." });
  }

  const examId = req.params.examId;
  const teacherId = req.user.id;

  // Vérifier que l'examen appartient à cet enseignant
  db.query(
    `SELECT e.*, s.name as subjectName, c.className
         FROM exam e
         JOIN subject s ON e.subject_id = s.id
         JOIN class c ON e.class_id = c.id
         WHERE e.id = ? AND e.teacher_id = ?`,
    [examId, teacherId],
    (err, results) => {
      if (err) {
        console.error("Erreur lors de la vérification de l'examen:", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      if (results.length === 0) {
        return res
          .status(403)
          .json({ error: "Vous n'êtes pas autorisé à accéder à cet examen" });
      }

      const examInfo = results[0];

      // Récupérer toutes les soumissions pour cet examen
      const query = `
                SELECT 
                    s.id, s.file_path, s.submitted_at, s.score,
                    st.id as student_id, st.firstName, st.lastName, st.numCarte,
                    e.title as examTitle
                FROM submission s
                JOIN student st ON s.student_id = st.id
                JOIN exam e ON s.exam_id = e.id
                WHERE s.exam_id = ?
                ORDER BY s.submitted_at DESC
            `;

      db.query(query, [examId], (err, submissions) => {
        if (err) {
          console.error("Erreur lors de la récupération des soumissions:", err);
          return res.status(500).json({ error: "Erreur serveur" });
        }

        res.json({
          examInfo: examInfo,
          submissions: submissions,
        });
      });
    }
  );
});

// Route pour récupérer une soumission spécifique
router.get("/submission/:submissionId", authMiddleware, (req, res) => {
  // Vérifier si l'utilisateur est un enseignant
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un enseignant." });
  }

  const submissionId = req.params.submissionId;
  const teacherId = req.user.id;

  // Récupérer les détails de la soumission
  const query = `
        SELECT 
            s.id, s.file_path, s.submitted_at, s.score,
            st.id as student_id, st.firstName, st.lastName, st.numCarte,
            e.title as examTitle, e.id as exam_id
        FROM submission s
        JOIN student st ON s.student_id = st.id
        JOIN exam e ON s.exam_id = e.id
        WHERE s.id = ? AND e.teacher_id = ?
    `;

  db.query(query, [submissionId, teacherId], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération de la soumission:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    if (results.length === 0) {
      return res.status(403).json({
        error: "Vous n'êtes pas autorisé à accéder à cette soumission",
      });
    }

    res.json(results[0]);
  });
});

// Route pour mettre à jour une note
router.post("/update-grade", authMiddleware, (req, res) => {
  // Vérifier si l'utilisateur est un enseignant
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un enseignant." });
  }

  const { submissionId, score } = req.body;

  if (!submissionId || score === undefined) {
    return res.status(400).json({ error: "Paramètres manquants" });
  }

  // Vérifier que la note est valide
  const scoreNum = parseFloat(score);
  if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 20) {
    return res
      .status(400)
      .json({ error: "La note doit être un nombre entre 0 et 20" });
  }

  const teacherId = req.user.id;

  // Vérifier que la soumission appartient à un examen de cet enseignant
  db.query(
    `SELECT s.id
         FROM submission s
         JOIN exam e ON s.exam_id = e.id
         WHERE s.id = ? AND e.teacher_id = ?`,
    [submissionId, teacherId],
    (err, results) => {
      if (err) {
        console.error("Erreur lors de la vérification de la soumission:", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      if (results.length === 0) {
        return res
          .status(403)
          .json({ error: "Vous n'êtes pas autorisé à noter cette soumission" });
      }

      // Mettre à jour la note
      db.query(
        "UPDATE submission SET score = ? WHERE id = ?",
        [scoreNum, submissionId],
        (err, result) => {
          if (err) {
            console.error("Erreur lors de la mise à jour de la note:", err);
            return res.status(500).json({ error: "Erreur serveur" });
          }

          res.json({
            message: "Note mise à jour avec succès",
            submissionId: submissionId,
            score: scoreNum,
          });
        }
      );
    }
  );
});

// Route pour récupérer les soumissions récentes
router.get("/teacher-recent-submissions", authMiddleware, (req, res) => {
  // Vérifier si l'utilisateur est un enseignant
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un enseignant." });
  }

  const teacherId = req.user.id;

  // Récupérer les soumissions récentes pour les examens de cet enseignant
  const query = `
        SELECT 
            s.id, s.file_path, s.submitted_at, s.score,
            st.id as student_id, st.firstName, st.lastName, st.numCarte,
            e.title as examTitle
        FROM submission s
        JOIN student st ON s.student_id = st.id
        JOIN exam e ON s.exam_id = e.id
        WHERE e.teacher_id = ?
        ORDER BY s.submitted_at DESC
        LIMIT 10
    `;

  db.query(query, [teacherId], (err, submissions) => {
    if (err) {
      console.error("Erreur lors de la récupération des soumissions:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    res.json(submissions);
  });
});

// Route pour noter automatiquement une soumission avec l'IA
// Cette route est déjà définie dans aiRoutes.js, mais pour compléter la fonctionnalité,
// nous allons exposer une API similaire ici pour intégrer cela plus facilement
router.post("/auto-grade/:submissionId", authMiddleware, (req, res) => {
  // Vérifier si l'utilisateur est un enseignant
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un enseignant." });
  }

  const submissionId = req.params.submissionId;
  const teacherId = req.user.id;

  // Vérifier que la soumission appartient à un examen de cet enseignant
  db.query(
    `SELECT s.id, s.exam_id
         FROM submission s
         JOIN exam e ON s.exam_id = e.id
         WHERE s.id = ? AND e.teacher_id = ?`,
    [submissionId, teacherId],
    (err, results) => {
      if (err) {
        console.error("Erreur lors de la vérification de la soumission:", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      if (results.length === 0) {
        return res
          .status(403)
          .json({ error: "Vous n'êtes pas autorisé à noter cette soumission" });
      }

      // Rediriger vers l'API de notation automatique
      // Note: Ceci nécessite que aiRoutes.js soit configuré correctement
      req.originalUrl = `/api/ai/grade-submission/${submissionId}`;
      req.url = `/grade-submission/${submissionId}`;
      req.method = "POST";

      // Appeler le prochain middleware pour traiter la requête
      req.app._router.handle(req, res);
    }
  );
});

module.exports = router;
