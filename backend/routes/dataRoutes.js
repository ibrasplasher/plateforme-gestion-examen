// backend/routes/dataRoutes.js
const express = require("express");
const db = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");
const path = require("path");
const fs = require("fs");
const router = express.Router();

// Créer le dossier pour les examens s'il n'existe pas
const examsDir = path.join(__dirname, "../../frontend/exams");
if (!fs.existsSync(examsDir)) {
  fs.mkdirSync(examsDir, { recursive: true });
}

// Route pour récupérer toutes les classes
router.get("/classes", (req, res) => {
  db.query("SELECT * FROM class ORDER BY className", (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des classes:", err);
      return res.status(500).json({ error: "Erreur serveur." });
    }
    res.json(results);
  });
});

// Route pour récupérer toutes les matières
router.get("/subjects", (req, res) => {
  db.query("SELECT * FROM subject ORDER BY name", (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des matières:", err);
      return res.status(500).json({ error: "Erreur serveur." });
    }
    res.json(results);
  });
});

// Route pour récupérer les matières et classes associées à un enseignant
router.get("/teacher-subjects-classes", authMiddleware, (req, res) => {
  // Vérifier que l'utilisateur est un enseignant
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un enseignant." });
  }

  const teacherId = req.user.id;

  // Requête pour obtenir les matières et classes affectées à cet enseignant
  const query = `
    SELECT DISTINCT s.id as subjectId, s.name as subjectName, 
                   c.id as classId, c.className
    FROM teachSubject ts
    JOIN subject s ON ts.subject_id = s.id
    JOIN class c ON ts.class_id = c.id
    WHERE ts.teacher_id = ?
  `;

  db.query(query, [teacherId], (err, results) => {
    if (err) {
      console.error(
        "Erreur lors de la récupération des matières et classes:",
        err
      );
      return res.status(500).json({ error: "Erreur serveur" });
    }

    // Regrouper les résultats
    const subjects = [];
    const classes = [];
    const subjectIds = new Set();
    const classIds = new Set();

    results.forEach((row) => {
      // Ajouter la matière si elle n'est pas déjà dans la liste
      if (!subjectIds.has(row.subjectId)) {
        subjects.push({
          id: row.subjectId,
          name: row.subjectName,
        });
        subjectIds.add(row.subjectId);
      }

      // Ajouter la classe si elle n'est pas déjà dans la liste
      if (!classIds.has(row.classId)) {
        classes.push({
          id: row.classId,
          className: row.className,
        });
        classIds.add(row.classId);
      }
    });

    res.json({ subjects, classes });
  });
});

// Route pour uploader un examen
router.post(
  "/upload-exam",
  authMiddleware,
  upload.single("examFile"),
  (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Aucun fichier n'a été téléchargé." });
    }

    // Obtenir le chemin relatif pour le frontend
    const relativePath = "exams/" + path.basename(req.file.path);

    // Simplement renvoyer le chemin du fichier
    res.status(200).json({
      message: "Fichier d'examen téléchargé avec succès",
      filePath: relativePath,
    });
  }
);

// Route pour enregistrer un nouvel examen
router.post("/exams", authMiddleware, upload.single("examFile"), (req, res) => {
  // Vérifier que l'utilisateur est un enseignant
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un enseignant." });
  }

  if (!req.file) {
    return res.status(400).json({ error: "Aucun fichier n'a été téléchargé." });
  }

  const teacherId = req.user.id;
  const { title, description, classId, subjectId, deadline } = req.body;

  // Obtenir le chemin relatif pour le frontend
  const filePath = "exams/" + path.basename(req.file.path);

  // Vérifier que l'enseignant a le droit d'assigner un examen à cette classe et cette matière
  const verifyQuery = `
    SELECT COUNT(*) as count FROM teachSubject 
    WHERE teacher_id = ? AND subject_id = ? AND class_id = ?
  `;

  db.query(verifyQuery, [teacherId, subjectId, classId], (err, results) => {
    if (err) {
      console.error("Erreur lors de la vérification des droits:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    if (results[0].count === 0) {
      // L'enseignant n'a pas le droit d'assigner un examen à cette classe et cette matière
      // Supprimer le fichier téléchargé
      fs.unlink(req.file.path, (err) => {
        if (err)
          console.error("Erreur lors de la suppression du fichier:", err);
      });
      return res.status(403).json({
        error:
          "Vous n'êtes pas autorisé à assigner un examen à cette classe et cette matière",
      });
    }

    // Insérer l'examen dans la base de données
    const insertQuery = `
      INSERT INTO exam (title, description, file_path, teacher_id, deadline, subject_id, class_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertQuery,
      [title, description, filePath, teacherId, deadline, subjectId, classId],
      (err, result) => {
        if (err) {
          console.error("Erreur lors de l'enregistrement de l'examen:", err);
          // Supprimer le fichier téléchargé en cas d'erreur
          fs.unlink(req.file.path, (err) => {
            if (err)
              console.error("Erreur lors de la suppression du fichier:", err);
          });
          return res.status(500).json({ error: "Erreur serveur" });
        }

        res.status(201).json({
          message: "Examen enregistré avec succès",
          examId: result.insertId,
        });
      }
    );
  });
});

// Route pour assigner un enseignant à des matières et classes
router.post("/assign-teacher", async (req, res) => {
  const { teacherId, subjects, classes } = req.body;
  if (
    !teacherId ||
    !subjects ||
    !classes ||
    !subjects.length ||
    !classes.length
  ) {
    return res.status(400).json({ error: "Données incomplètes" });
  }
  try {
    // Pour chaque combinaison de matière et classe, créer une entrée dans teachSubject
    const values = [];
    const placeholders = [];
    // Créer des combinaisons de toutes les matières avec toutes les classes
    for (const subjectId of subjects) {
      for (const classId of classes) {
        values.push(teacherId, subjectId, classId);
        placeholders.push("(?, ?, ?)");
      }
    }
    if (placeholders.length === 0) {
      return res
        .status(400)
        .json({ error: "Aucune combinaison matière-classe valide" });
    }
    const query = `INSERT INTO teachSubject (teacher_id, subject_id, class_id) VALUES ${placeholders.join(
      ", "
    )}`;
    db.query(query, values, (err, result) => {
      if (err) {
        console.error("Erreur lors de l'assignation:", err);
        return res.status(500).json({
          error: "Erreur lors de l'assignation des matières et classes.",
        });
      }
      res.status(201).json({
        message: "Assignation réussie",
        affectedRows: result.affectedRows,
      });
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur lors de l'assignation." });
  }
});

module.exports = router;
