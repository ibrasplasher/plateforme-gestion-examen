// Mise à jour du backend/server.js
const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const cors = require("cors");
const plagiarismRoutes = require("./routes/plagiarismRoutes");

require("dotenv").config({ path: "./docker/.env" });

// Import des routes
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const profileRoutes = require("./routes/profileRoutes");
const dataRoutes = require("./routes/dataRoutes");
const aiRoutes = require("./routes/aiRoutes");
const studentRoutes = require("./routes/studentRoutes"); // Nouvelles routes pour les étudiants
const gradeRoutes = require("./routes/gradeRoutes"); // Nouvelles routes pour la gestion des notes

// Initialiser Express
const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(express.json());
app.use(cors({ origin: "http://localhost:8080" }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, "../frontend")));

app.use(
  "/profiles",
  express.static(path.join(__dirname, "../frontend/profiles"))
);

// Configuration des routes
app.use("/api/auth", authRoutes);
app.use("/api", dashboardRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/plagiarism", plagiarismRoutes);
app.use("/api/data", studentRoutes); // Routes pour les étudiants
app.use("/api/data", gradeRoutes); // Routes pour la gestion des notes
app.use(
  "/submissions",
  express.static(path.join(__dirname, "../frontend/submissions"))
);

// Vérification des variables d'environnement essentielles
if (
  !process.env.DB_HOST ||
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD ||
  !process.env.DB_NAME ||
  !process.env.JWT_SECRET
) {
  console.error(
    "❌ Une ou plusieurs variables d'environnement sont manquantes !"
  );
  process.exit(1);
}

// Connexion à MySQL (Docker)
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

db.connect((err) => {
  if (err) {
    console.error("❌ Erreur de connexion à MySQL:", err.message);
    process.exit(1);
  } else {
    console.log("✅ Connecté à MySQL !");
  }
});

// Route par défaut
app.get("/", (req, res) => {
  res.send("Backend en cours de développement...");
});
app.get("/", (req, res) => {
  res.redirect("/Connexion.html");
});
// Démarrage du serveur
app.listen(port, () => {
  console.log(`🚀 Serveur backend démarré sur le port ${port}`);
});
// Créer un fichier de démonstration si le dossier submissions est vide
const fs = require("fs");
const submissionsDir = path.join(__dirname, "../frontend/submissions");

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(submissionsDir)) {
  fs.mkdirSync(submissionsDir, { recursive: true });
  console.log("✅ Dossier submissions créé");
}

// Créer un fichier de démonstration si le dossier est vide
fs.readdir(submissionsDir, (err, files) => {
  if (err) {
    console.error("❌ Erreur lors de la lecture du dossier submissions:", err);
    return;
  }

  if (files.length === 0) {
    console.log(
      "⚠️ Dossier submissions vide, création d'un fichier de démonstration..."
    );

    // Créer un fichier texte simple pour tester
    fs.writeFile(
      path.join(submissionsDir, "demo-submission.txt"),
      "Ceci est un fichier de soumission de démonstration.\n\nIl est utilisé pour tester la fonctionnalité de visualisation des soumissions.",
      (err) => {
        if (err) {
          console.error(
            "❌ Erreur lors de la création du fichier de démonstration:",
            err
          );
        } else {
          console.log("✅ Fichier de démonstration créé avec succès");
        }
      }
    );
  }
});
