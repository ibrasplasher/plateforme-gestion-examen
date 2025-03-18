// backend/routes/profileRoutes.js
const express = require("express");
const { upload } = require("../middleware/uploadMiddleware");
const db = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");
const path = require("path");

const router = express.Router();

// Route pour uploader une photo de profil
router.post(
  "/upload-photo-public",
  upload.single("profilePhoto"),
  (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Aucun fichier n'a été téléchargé." });
    }
    // Obtenir le chemin relatif à partir de la racine du projet frontend
    const relativePath = path
      .relative(path.join(__dirname, "../../frontend"), req.file.path)
      .replace(/\\/g, "/"); // Remplacer les backslashes par des slashes pour la compatibilité

    // Mettre à jour la base de données avec le chemin de la photo
    const query =
      req.user.role === "teacher"
        ? "UPDATE teacher SET profilPhoto = ? WHERE id = ?"
        : "UPDATE student SET profilPhoto = ? WHERE id = ?";

    db.query(query, [relativePath, req.user.id], (err, result) => {
      if (err) {
        console.error(
          "Erreur lors de la mise à jour de la photo de profil:",
          err
        );
        return res.status(500).json({
          error: "Erreur lors de la mise à jour de la photo de profil.",
        });
      }

      res.status(200).json({
        message: "Photo de profil mise à jour avec succès",
        filePath: relativePath,
      });
    });
  }
);

// Route pour récupérer la photo de profil actuelle
router.get("/get-photo", authMiddleware, (req, res) => {
  const query =
    req.user.role === "teacher"
      ? "SELECT profilPhoto FROM teacher WHERE id = ?"
      : "SELECT profilPhoto FROM student WHERE id = ?";

  db.query(query, [req.user.id], (err, results) => {
    if (err) {
      console.error(
        "Erreur lors de la récupération de la photo de profil:",
        err
      );
      return res.status(500).json({ error: "Erreur serveur." });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    res.status(200).json({
      photoPath: results[0].profilPhoto || "../profiles/defaultPicture.jpg",
    });
  });
});

module.exports = router;
