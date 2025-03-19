// backend/routes/dataRoutes.js
const express = require("express");
const db = require("../config/db");

const router = express.Router();

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
