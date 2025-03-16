const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const {
  authMiddleware,
  TeacherOnlyMiddleware,
} = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * 🔹 INSCRIPTION (SANS HASHAGE)
 */

// Inscription des étudiants
router.post("/register/student", async (req, res) => {
  const { firstName, lastName, ddn, numCarte, email, profilPhoto, password } =
    req.body;

  if (
    !firstName ||
    !lastName ||
    !ddn ||
    !numCarte ||
    !email ||
    !profilPhoto ||
    !password
  ) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }

  try {
    db.query(
      "INSERT INTO student (firstName, lastName, ddn, numCarte, email, profilPhoto, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [firstName, lastName, ddn, numCarte, email, profilPhoto, password],
      (err, results) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Erreur SQL", details: err.message });
        }
        res.status(201).json({ message: "Étudiant enregistré !" });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'enregistrement." });
  }
});

// Inscription des enseignants
router.post("/register/teacher", async (req, res) => {
  const { firstName, lastName, email, contact, profilPhoto, password } =
    req.body;

  try {
    db.query(
      "INSERT INTO teacher (firstName, lastName, email, contact, profilPhoto, password_hash) VALUES (?, ?, ?, ?, ?, ?)",
      [firstName, lastName, email, contact, profilPhoto, password],
      (err, results) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Erreur SQL", details: err.message });
        }
        res.status(201).json({ message: "Enseignant enregistré !" });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'enregistrement." });
  }
});

/**
 * 🔹 CONNEXION (SANS VERIFICATION HASH)
 */

// Connexion des étudiants
router.post("/login/student", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM student WHERE email = ?", [email], (err, results) => {
    if (err || results.length === 0) {
      return res
        .status(400)
        .json({ error: "Email ou mot de passe incorrect." });
    }

    const user = results[0];

    if (password !== user.password_hash) {
      return res
        .status(400)
        .json({ error: "Email ou mot de passe incorrect." });
    }

    const token = jwt.sign(
      { id: user.id, role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: "student",
      },
    });
  });
});

// Connexion des enseignants
router.post("/login/teacher", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM teacher WHERE email = ?", [email], (err, results) => {
    if (err || results.length === 0) {
      return res
        .status(400)
        .json({ error: "Email ou mot de passe incorrect." });
    }

    const user = results[0];

    if (password !== user.password_hash) {
      return res
        .status(400)
        .json({ error: "Email ou mot de passe incorrect." });
    }

    const token = jwt.sign(
      { id: user.id, role: "teacher" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: "teacher",
      },
    });
  });
});

/**
 * 🔹 ROUTE PROTÉGÉE
 */

router.get("/dashboard", authMiddleware, TeacherOnlyMiddleware, (req, res) => {
  res.json({
    message: `Bienvenue, utilisateur ${req.user.id} (${req.user.role}) !`,
    user: req.user,
  });
});

module.exports = router;
