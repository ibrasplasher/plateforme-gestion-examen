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
  const studentClassId = req.user.classId;

  // Vérifier que l'examen appartient à la classe de l'étudiant
  const query = `
        SELECT file_path FROM exam 
        WHERE id = ? AND class_id = ?
    `;

  db.query(query, [examId, studentClassId], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération du fichier d'examen:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Examen non trouvé" });
    }

    const filePath = path.join(
      __dirname,
      "../../frontend",
      results[0].file_path
    );

    // Vérifier si le fichier existe
    fs.access(filePath)
      .then(() => {
        // Envoyer le fichier
        res.download(filePath, (err) => {
          if (err) {
            console.error("Erreur lors du téléchargement:", err);
            res.status(500).json({ error: "Erreur lors du téléchargement" });
          }
        });
      })
      .catch(() => {
        res.status(404).json({ error: "Fichier d'examen non trouvé" });
      });
  });
});

// Route pour soumettre un examen
router.post(
  "/submit-exam",
  authMiddleware,
  upload.single("examFile"),
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

    // Vérifier si l'examen existe et est dans la bonne classe
    const verifyExamQuery = `
            SELECT id, deadline, class_id 
            FROM exam 
            WHERE id = ? AND class_id = ? AND deadline > NOW()
        `;

    db.query(
      verifyExamQuery,
      [examId, req.user.classId],
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
                    return res.status(500).json({ error: "Erreur serveur" });
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
                    return res.status(500).json({ error: "Erreur serveur" });
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

module.exports = router;
