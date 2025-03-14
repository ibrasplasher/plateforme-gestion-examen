const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware"); // Import du middleware

const router = express.Router();

// Inscription
router.post("/register", (req, res) => {
  const { name, email, password, role } = req.body;

  // Hash du mot de passe (à implémenter)
  const passwordHash = password; // Remplacez par bcrypt plus tard

  db.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
    [name, email, passwordHash, role],
    (err, results) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Erreur SQL", details: err.message });
      }
      res.status(201).json({ message: "Utilisateur enregistré !" });
    }
  );
});

// Connexion
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err || results.length === 0) {
      return res
        .status(400)
        .json({ error: "Email ou mot de passe incorrect." });
    }

    const user = results[0];

    // Vérification du mot de passe (à implémenter)
    if (password !== user.password_hash) {
      return res
        .status(400)
        .json({ error: "Email ou mot de passe incorrect." });
    }

    // Génération du token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  });
});

// Route protégée
router.get("/dashboard", authMiddleware, (req, res) => {
  res.json({
    message: `Bienvenue, utilisateur ${req.user.id}!`,
    user: req.user,
  });
});

module.exports = router;
