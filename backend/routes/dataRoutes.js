// backend/routes/dataRoutes.js
const express = require("express");
const db = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse"); // Ajout de pdf-parse
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

// Route pour récupérer le contenu d'un fichier d'examen
router.get("/exam-content/:examId", authMiddleware, (req, res) => {
  const examId = req.params.examId;
  const teacherId = req.user.id;

  // Vérifier que l'enseignant a accès à cet examen
  const verifyQuery = `
    SELECT file_path FROM exam WHERE id = ? AND teacher_id = ?
  `;

  db.query(verifyQuery, [examId, teacherId], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération du fichier d'examen:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    if (results.length === 0) {
      return res.status(403).json({
        error: "Vous n'êtes pas autorisé à accéder à ce fichier",
      });
    }

    const filePath = results[0].file_path;
    const fullPath = path.join(__dirname, "../../frontend", filePath);

    // Vérifier si le fichier existe
    if (!fs.existsSync(fullPath)) {
      console.error("Fichier non trouvé:", fullPath);
      return res.status(404).json({ error: "Fichier d'examen non trouvé" });
    }

    // Détecter le type de fichier
    const fileExtension = path.extname(fullPath).toLowerCase();

    // Pour les fichiers texte, lire directement le contenu
    if (fileExtension === ".txt") {
      fs.readFile(fullPath, "utf8", (err, data) => {
        if (err) {
          console.error("Erreur lors de la lecture du fichier:", err);
          return res
            .status(500)
            .json({ error: "Erreur lors de la lecture du fichier" });
        }

        res.json({ content: data });
      });
    }
    // Pour les fichiers PDF, utiliser pdf-parse
    else if (fileExtension === ".pdf") {
      // Lire le fichier PDF comme un buffer
      fs.readFile(fullPath, (err, buffer) => {
        if (err) {
          console.error("Erreur lors de la lecture du fichier PDF:", err);
          return res
            .status(500)
            .json({ error: "Erreur lors de la lecture du fichier PDF" });
        }

        // Utiliser pdf-parse pour extraire le texte
        pdfParse(buffer)
          .then((data) => {
            // data.text contient le texte extrait du PDF
            res.json({ content: data.text });
          })
          .catch((err) => {
            console.error("Erreur lors de l'extraction du texte du PDF:", err);
            return res
              .status(500)
              .json({ error: "Erreur lors de l'extraction du texte du PDF" });
          });
      });
    }
    // Pour les autres types de fichiers, renvoyer le chemin et indiquer qu'une extraction de texte est nécessaire
    else {
      res.json({
        content: `Ce fichier est un ${fileExtension
          .substring(1)
          .toUpperCase()} et nécessite une extraction de texte spécifique.`,
        filePath: filePath,
        fileType: fileExtension.substring(1),
        error:
          "Format de fichier non pris en charge pour l'extraction automatique de texte",
      });
    }
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

// Route pour récupérer un corrigé existant
router.get("/corrections/:examId", authMiddleware, (req, res) => {
  // Vérifier que l'utilisateur est un enseignant
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un enseignant." });
  }

  const examId = req.params.examId;
  const teacherId = req.user.id;

  // Vérifier que l'enseignant est bien celui qui a créé l'examen
  const verifyQuery = `
    SELECT * FROM exam WHERE id = ? AND teacher_id = ?
  `;

  db.query(verifyQuery, [examId, teacherId], (err, results) => {
    if (err) {
      console.error("Erreur lors de la vérification de l'examen:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    if (results.length === 0) {
      return res.status(403).json({
        error: "Vous n'êtes pas autorisé à accéder à ce corrigé",
      });
    }

    // L'enseignant est autorisé, récupérer le corrigé
    const query = `
      SELECT * FROM correction_template
      WHERE exam_id = ?
    `;

    db.query(query, [examId], (err, results) => {
      if (err) {
        console.error("Erreur lors de la récupération du corrigé:", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      if (results.length === 0) {
        // Pas de corrigé trouvé
        return res.status(404).json({
          error: "Aucun corrigé trouvé pour cet examen",
        });
      }

      res.json(results[0]);
    });
  });
});

// Route pour enregistrer un corrigé
router.post("/save-correction", authMiddleware, (req, res) => {
  // Vérifier que l'utilisateur est un enseignant
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un enseignant." });
  }

  const { examId, content } = req.body;
  const teacherId = req.user.id;

  if (!examId || !content) {
    return res.status(400).json({ error: "Données incomplètes" });
  }

  // Vérifier que l'enseignant est bien celui qui a créé l'examen
  const verifyQuery = `
    SELECT * FROM exam WHERE id = ? AND teacher_id = ?
  `;

  db.query(verifyQuery, [examId, teacherId], (err, results) => {
    if (err) {
      console.error("Erreur lors de la vérification de l'examen:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    if (results.length === 0) {
      return res.status(403).json({
        error: "Vous n'êtes pas autorisé à modifier ce corrigé",
      });
    }

    // Vérifier si un corrigé existe déjà pour cet examen
    const checkQuery = `
      SELECT * FROM correction_template WHERE exam_id = ?
    `;

    db.query(checkQuery, [examId], (err, results) => {
      if (err) {
        console.error(
          "Erreur lors de la vérification du corrigé existant:",
          err
        );
        return res.status(500).json({ error: "Erreur serveur" });
      }

      if (results.length > 0) {
        // Mettre à jour le corrigé existant
        const updateQuery = `
          UPDATE correction_template
          SET content = ?, updated_at = NOW()
          WHERE exam_id = ?
        `;

        db.query(updateQuery, [content, examId], (err, result) => {
          if (err) {
            console.error("Erreur lors de la mise à jour du corrigé:", err);
            return res.status(500).json({ error: "Erreur serveur" });
          }

          res.status(200).json({
            message: "Corrigé mis à jour avec succès",
            id: results[0].id,
          });
        });
      } else {
        // Créer un nouveau corrigé
        const insertQuery = `
          INSERT INTO correction_template (exam_id, content, created_at, updated_at)
          VALUES (?, ?, NOW(), NOW())
        `;

        db.query(insertQuery, [examId, content], (err, result) => {
          if (err) {
            console.error("Erreur lors de la création du corrigé:", err);
            return res.status(500).json({ error: "Erreur serveur" });
          }

          res.status(201).json({
            message: "Corrigé créé avec succès",
            id: result.insertId,
          });
        });
      }
    });
  });
});

// Route pour récupérer les détails d'un examen
router.get("/exams/:id", authMiddleware, (req, res) => {
  const examId = req.params.id;
  const teacherId = req.user.id;

  // Requête pour obtenir les détails de l'examen avec le nom de la matière et de la classe
  const query = `
    SELECT e.*, s.name as subjectName, c.className
    FROM exam e
    JOIN subject s ON e.subject_id = s.id
    JOIN class c ON e.class_id = c.id
    WHERE e.id = ? AND e.teacher_id = ?
  `;

  db.query(query, [examId, teacherId], (err, results) => {
    if (err) {
      console.error(
        "Erreur lors de la récupération des détails de l'examen:",
        err
      );
      return res.status(500).json({ error: "Erreur serveur" });
    }

    if (results.length === 0) {
      return res.status(404).json({
        error: "Examen non trouvé ou vous n'êtes pas autorisé à y accéder",
      });
    }

    res.json(results[0]);
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

// Route pour récupérer tous les examens d'un enseignant avec les détails de classe et matière
router.get("/teacher-exams", authMiddleware, (req, res) => {
  // Vérifier que l'utilisateur est un enseignant
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un enseignant." });
  }

  const teacherId = req.user.id;

  // Requête SQL pour obtenir les examens avec les noms de matière et classe
  const query = `
    SELECT e.*, s.name as subjectName, c.className 
    FROM exam e
    JOIN subject s ON e.subject_id = s.id
    JOIN class c ON e.class_id = c.id
    WHERE e.teacher_id = ?
    ORDER BY e.created_at DESC
  `;

  db.query(query, [teacherId], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des examens:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    res.json(results);
  });
});

// Route pour récupérer le nombre de soumissions pour un examen
router.get("/exam-submissions-count/:examId", authMiddleware, (req, res) => {
  const examId = req.params.examId;
  const teacherId = req.user.id;

  // Vérifier que l'enseignant a accès à cet examen
  const verifyQuery = `
    SELECT id FROM exam WHERE id = ? AND teacher_id = ?
  `;

  db.query(verifyQuery, [examId, teacherId], (err, results) => {
    if (err) {
      console.error("Erreur lors de la vérification de l'examen:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    if (results.length === 0) {
      return res.status(403).json({
        error: "Vous n'êtes pas autorisé à accéder à cet examen",
      });
    }

    // Compter les soumissions
    const countQuery = `
      SELECT COUNT(*) as count FROM submission WHERE exam_id = ?
    `;

    db.query(countQuery, [examId], (err, results) => {
      if (err) {
        console.error("Erreur lors du comptage des soumissions:", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      res.json({ count: results[0].count });
    });
  });
});

// Route pour mettre à jour un examen
router.put("/exams/:id", authMiddleware, (req, res) => {
  // Vérifier que l'utilisateur est un enseignant
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un enseignant." });
  }

  const examId = req.params.id;
  const teacherId = req.user.id;
  const { title, description, deadline } = req.body;

  // Vérifier que l'enseignant est bien le propriétaire de l'examen
  const verifyQuery = `
    SELECT id FROM exam WHERE id = ? AND teacher_id = ?
  `;

  db.query(verifyQuery, [examId, teacherId], (err, results) => {
    if (err) {
      console.error("Erreur lors de la vérification de l'examen:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    if (results.length === 0) {
      return res.status(403).json({
        error: "Vous n'êtes pas autorisé à modifier cet examen",
      });
    }

    // Mettre à jour l'examen
    const updateQuery = `
      UPDATE exam 
      SET title = ?, description = ?, deadline = ?
      WHERE id = ? AND teacher_id = ?
    `;

    db.query(
      updateQuery,
      [title, description, deadline, examId, teacherId],
      (err, result) => {
        if (err) {
          console.error("Erreur lors de la mise à jour de l'examen:", err);
          return res.status(500).json({ error: "Erreur serveur" });
        }

        res.json({
          message: "Examen mis à jour avec succès",
          id: examId,
        });
      }
    );
  });
});

// Route pour supprimer un examen
router.delete("/exams/:id", authMiddleware, (req, res) => {
  // Vérifier que l'utilisateur est un enseignant
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Vous devez être un enseignant." });
  }

  const examId = req.params.id;
  const teacherId = req.user.id;

  // Vérifier que l'enseignant est bien le propriétaire de l'examen
  const verifyQuery = `
    SELECT file_path FROM exam WHERE id = ? AND teacher_id = ?
  `;

  db.query(verifyQuery, [examId, teacherId], (err, results) => {
    if (err) {
      console.error("Erreur lors de la vérification de l'examen:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    if (results.length === 0) {
      return res.status(403).json({
        error: "Vous n'êtes pas autorisé à supprimer cet examen",
      });
    }

    const filePath = results[0].file_path;
    const fullPath = path.join(__dirname, "../../frontend", filePath);

    // Supprimer l'examen de la base de données (la suppression des soumissions
    // est automatique grâce à la contrainte ON DELETE CASCADE)
    const deleteQuery = `
      DELETE FROM exam WHERE id = ? AND teacher_id = ?
    `;

    db.query(deleteQuery, [examId, teacherId], (err, result) => {
      if (err) {
        console.error("Erreur lors de la suppression de l'examen:", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      // Tenter de supprimer le fichier physique
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (err) {
          console.error("Erreur lors de la suppression du fichier:", err);
          // On continue malgré l'erreur de suppression du fichier
        }
      }

      res.json({
        message: "Examen supprimé avec succès",
        id: examId,
      });
    });
  });
});

module.exports = router;
