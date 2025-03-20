// backend/routes/profileRoutes.js
const express = require("express");
const { upload } = require("../middleware/uploadMiddleware");
const db = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");
const path = require("path");

const router = express.Router();

// Route pour uploader une photo de profil sans authentification (pour l'inscription)
router.post(
  "/upload-photo-public",
  upload.single("profilePhoto"),
  (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Aucun fichier n'a été téléchargé." });
    }

    // Obtenir le chemin relatif pour le frontend
    const relativePath = "assets/img/" + path.basename(req.file.path);

    console.log("Photo téléchargée avec succès:", relativePath);

    // Simplement renvoyer le chemin du fichier sans mise à jour de la DB
    res.status(200).json({
      message: "Photo téléchargée avec succès",
      filePath: relativePath,
    });
  }
);

// Route pour uploader une photo de profil avec authentification
router.post(
  "/upload-photo",
  authMiddleware,
  upload.single("profilePhoto"),
  (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Aucun fichier n'a été téléchargé." });
    }

    // Obtenir le chemin relatif pour le frontend
    const relativePath = "assets/img/" + path.basename(req.file.path);

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

    // Renvoyer le chemin de la photo, ou l'image par défaut si pas de photo
    res.status(200).json({
      photoPath: results[0].profilPhoto || "assets/img/default-avatar.jpg",
    });
  });
});

module.exports = router;
