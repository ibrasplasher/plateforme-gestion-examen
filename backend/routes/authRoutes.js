const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const {
  authMiddleware,
  TeacherOnlyMiddleware,
} = require("../middleware/authMiddleware");

const router = express.Router();
const SALT_ROUNDS = 10;
const { body, validationResult } = require("express-validator");

/**
 * 🔹 INSCRIPTION (AVEC HASHAGE)
 */

// Inscription des étudiants
router.post(
  "/register/student",
  [
    body("firstName").notEmpty().withMessage("Le prénom est requis."),
    body("lastName").notEmpty().withMessage("Le nom est requis."),
    body("numCarte").notEmpty().withMessage("Le numéro de carte est requis."),
    body("email").isEmail().withMessage("Email invalide."),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Le mot de passe doit contenir au moins 6 caractères."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, numCarte, email, password } = req.body;

    try {
      // Vérifier si l'email existe déjà
      db.query(
        "SELECT * FROM student WHERE email = ?",
        [email],
        async (err, results) => {
          if (err) return res.status(500).json({ error: "Erreur serveur." });

          if (results.length > 0) {
            return res.status(400).json({ error: "Email déjà utilisé." });
          }

          // Hachage du mot de passe
          const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

          // Insérer l'étudiant
          db.query(
            "INSERT INTO student (firstName, lastName, numCarte, email, password_hash) VALUES (?, ?, ?, ?, ?)",
            [firstName, lastName, numCarte, email, hashedPassword],
            (err) => {
              if (err) return res.status(500).json({ error: "Erreur SQL." });

              res.status(201).json({ message: "Étudiant enregistré !" });
            }
          );
        }
      );
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de l'enregistrement." });
    }
  }
);

// Inscription des enseignants avec plus de logs
router.post("/register/teacher", async (req, res) => {
  console.log("========= INSCRIPTION ENSEIGNANT =========");
  console.log("Données reçues:", req.body);

  const { firstName, lastName, email, contact, profilPhoto, password } =
    req.body;

  // Vérification des champs obligatoires
  if (!firstName || !lastName || !email || !password) {
    console.log("Validation: champs obligatoires manquants");
    return res
      .status(400)
      .json({ error: "Tous les champs obligatoires doivent être remplis." });
  }

  try {
    console.log("Vérification si l'email existe déjà:", email);
    db.query(
      "SELECT * FROM teacher WHERE email = ?",
      [email],
      async (err, results) => {
        if (err) {
          console.error("Erreur de requête SQL (vérification email):", err);
          return res.status(500).json({ error: "Erreur serveur." });
        }

        if (results && results.length > 0) {
          console.log("Email déjà utilisé:", email);
          return res.status(400).json({ error: "Email déjà utilisé." });
        }

        try {
          console.log("Hashage du mot de passe...");
          const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
          console.log("Mot de passe haché avec succès");

          // Utilisation de valeurs par défaut si nécessaire
          const contactValue = contact || "";
          const profileValue = profilPhoto || "../profiles/defaultPicture.jpg";

          console.log("Préparation de l'insertion avec les valeurs:");
          console.log({
            firstName,
            lastName,
            email,
            contact: contactValue,
            profilPhoto: profileValue,
            password_hash: "***",
          });

          const query =
            "INSERT INTO teacher (firstName, lastName, email, contact, profilPhoto, password_hash) VALUES (?, ?, ?, ?, ?, ?)";

          db.query(
            query,
            [
              firstName,
              lastName,
              email,
              contactValue,
              profileValue,
              hashedPassword,
            ],
            (err, result) => {
              if (err) {
                console.error("Erreur d'insertion SQL:", err);
                return res.status(500).json({
                  error: "Erreur lors de l'insertion dans la base de données.",
                });
              }

              console.log("Insertion réussie! ID:", result.insertId);
              return res.status(201).json({
                message: "Enseignant enregistré avec succès!",
                teacherId: result.insertId,
              });
            }
          );
        } catch (hashError) {
          console.error("Erreur lors du hashage du mot de passe:", hashError);
          return res
            .status(500)
            .json({ error: "Erreur lors du traitement du mot de passe." });
        }
      }
    );
  } catch (error) {
    console.error("Erreur générale:", error);
    return res.status(500).json({ error: "Erreur lors de l'enregistrement." });
  }
});

/**
 * 🔹 CONNEXION (AVEC VERIFICATION HASH)
 */

// Connexion des étudiants
router.post(
  "/login/student",
  [
    body("email").isEmail().withMessage("Email invalide"),
    body("password").notEmpty().withMessage("Le mot de passe est requis"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    db.query(
      "SELECT * FROM student WHERE email = ?",
      [email],
      (err, results) => {
        if (err || results.length === 0) {
          return res
            .status(400)
            .json({ error: "Email ou mot de passe incorrect." });
        }

        const user = results[0];

        bcrypt.compare(password, user.password_hash, (err, isMatch) => {
          if (err || !isMatch) {
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
      }
    );
  }
);
// Connexion des enseignants
router.post("/login/teacher", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM teacher WHERE email = ?",
    [email],
    async (err, results) => {
      if (err || results.length === 0) {
        return res
          .status(400)
          .json({ error: "Email ou mot de passe incorrect." });
      }

      const user = results[0];

      // Vérification du mot de passe hashé
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
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
    }
  );
});

/**
 * 🔹 ROUTE PROTÉGÉE
 */

router.get("/dashboard", authMiddleware, TeacherOnlyMiddleware, (req, res) => {
  res.json({
    message: `Bienvenue ${req.user.firstName} (${req.user.role}) !`,
    user: req.user,
  });
});

module.exports = router;
