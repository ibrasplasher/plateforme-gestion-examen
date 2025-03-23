// backend/routes/studentExamRoutes.js
const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const db = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");
const router = express.Router();

// Créer le dossier pour les soumissions s'il n'existe pas
const submissionsDir = path.join(__dirname, "../../frontend/submissions");
const examsDir = path.join(__dirname, "../../frontend/exams");

// Middleware pour créer les répertoires s'ils n'existent pas
router.use(async (req, res, next) => {
  try {
    await fs.mkdir(submissionsDir, { recursive: true });
    await fs.mkdir(examsDir, { recursive: true });
    next();
  } catch (error) {
    console.error("Erreur lors de la création des répertoires:", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la préparation des répertoires" });
  }
});

// Route pour récupérer les examens disponibles pour un étudiant
router.get("/student-exams", authMiddleware, (req, res) => {
  // Vérifier que l'utilisateur est un étudiant
  if (req.user.role !== "student") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un étudiant." });
  }

  const studentId = req.user.id;
  const studentClassId = req.user.classId; // Assurez-vous que cela est disponible dans l'objet utilisateur

  // Requête pour obtenir les examens disponibles pour la classe de l'étudiant
  const query = `
        SELECT 
            e.id, 
            e.title, 
            e.description, 
            e.deadline, 
            e.file_path,
            s.name as subject,
            c.className,
            (SELECT COUNT(*) FROM submission sub 
             WHERE sub.exam_id = e.id AND sub.student_id = ?) as submitted
        FROM exam e
        JOIN subject s ON e.subject_id = s.id
        JOIN class c ON e.class_id = c.id
        WHERE e.class_id = ? AND e.deadline > NOW()
        ORDER BY e.deadline ASC
    `;

  db.query(query, [studentId, studentClassId], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des examens:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    // Transformer les résultats
    const exams = results.map((exam) => ({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      deadline: exam.deadline,
      subject: exam.subject,
      className: exam.className,
      filePath: exam.file_path,
      submitted: exam.submitted > 0,
    }));

    res.json(exams);
  });
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
  // REQUÊTE CORRIGÉE: utiliser join avec la table student directement sans référence à ic
  db.query(
    `SELECT e.*
           FROM exam e
           JOIN student s ON e.class_id = s.class_id
           WHERE e.id = ? AND s.id = ?`,
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
        console.log(`Fichier non trouvé: ${filePath}`);

        // Création d'un fichier de démonstration
        const demoDir = path.join(__dirname, "../../frontend/exams");
        const demoPath = path.join(demoDir, "demo-exam.pdf");

        if (!fs.existsSync(demoDir)) {
          fs.mkdirSync(demoDir, { recursive: true });
        }

        // Si pas de fichier de démo, en créer un simple
        if (!fs.existsSync(demoPath)) {
          // Créer un fichier texte simple (à remplacer par un vrai PDF si disponible)
          fs.writeFileSync(demoPath, "Ceci est un examen de démonstration.");
          console.log("Création d'un fichier de démonstration:", demoPath);
        }

        return res.download(demoPath);
      }

      // Envoyer le fichier
      res.download(filePath);
    }
  );
});
// Route pour soumettre un examen
router.post(
  "/submit-exam",
  authMiddleware,
  upload.single("examFile"),
  (req, res) => {
    // AJOUTEZ CES LOGS AU DÉBUT
    console.log("=== SOUMISSION D'EXAMEN (studentExamRoutes) ===");
    console.log(
      "Fichier reçu:",
      req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            destination: req.file.destination,
            filename: req.file.filename,
            path: req.file.path,
          }
        : "Aucun fichier"
    );

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

    // D'abord, récupérer la classe de l'étudiant
    db.query(
      "SELECT class_id FROM student WHERE id = ?",
      [studentId],
      (err, studentResults) => {
        if (err) {
          console.error("Erreur lors de la récupération de la classe:", err);
          return res.status(500).json({ error: "Erreur serveur" });
        }

        if (studentResults.length === 0 || !studentResults[0].class_id) {
          return res
            .status(404)
            .json({ error: "Étudiant non assigné à une classe" });
        }

        const studentClassId = studentResults[0].class_id;

        // Vérifier si l'examen existe et est dans la bonne classe
        const verifyExamQuery = `
            SELECT id, deadline, class_id 
            FROM exam 
            WHERE id = ? AND class_id = ? AND deadline > NOW()
          `;

        db.query(
          verifyExamQuery,
          [examId, studentClassId],
          (err, examResults) => {
            if (err) {
              console.error("Erreur lors de la vérification de l'examen:", err);
              return res.status(500).json({ error: "Erreur serveur" });
            }

            if (examResults.length === 0) {
              // Supprimer le fichier uploadé
              fs.unlink(req.file.path).catch(console.error);

              return res.status(400).json({
                error: "Examen invalide ou délai de soumission dépassé",
              });
            }

            // Obtenir le chemin relatif pour le frontend
            const relativePath = `submissions/${path.basename(req.file.path)}`;

            // Vérifier si une soumission existe déjà
            const checkSubmissionQuery = `
                SELECT id FROM submission 
                WHERE exam_id = ? AND student_id = ?
              `;

            db.query(
              checkSubmissionQuery,
              [examId, studentId],
              (err, submissionResults) => {
                if (err) {
                  console.error(
                    "Erreur lors de la vérification de la soumission:",
                    err
                  );
                  return res.status(500).json({ error: "Erreur serveur" });
                }

                if (submissionResults.length > 0) {
                  // Mettre à jour la soumission existante
                  const updateQuery = `
                      UPDATE submission
                      SET file_path = ?, submitted_at = NOW()
                      WHERE exam_id = ? AND student_id = ?
                    `;

                  db.query(
                    updateQuery,
                    [relativePath, examId, studentId],
                    (err) => {
                      if (err) {
                        console.error(
                          "Erreur lors de la mise à jour de la soumission:",
                          err
                        );
                        return res
                          .status(500)
                          .json({ error: "Erreur serveur" });
                      }

                      res.status(200).json({
                        message: "Soumission mise à jour avec succès",
                        filePath: relativePath,
                      });
                    }
                  );
                } else {
                  // Créer une nouvelle soumission
                  const insertQuery = `
                      INSERT INTO submission (exam_id, student_id, file_path, submitted_at)
                      VALUES (?, ?, ?, NOW())
                    `;

                  db.query(
                    insertQuery,
                    [examId, studentId, relativePath],
                    (err, result) => {
                      if (err) {
                        console.error(
                          "Erreur lors de l'insertion de la soumission:",
                          err
                        );
                        return res
                          .status(500)
                          .json({ error: "Erreur serveur" });
                      }

                      res.status(201).json({
                        message: "Soumission réussie",
                        submissionId: result.insertId,
                        filePath: relativePath,
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
  }
);

module.exports = router;
