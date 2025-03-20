const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const cors = require("cors");
require("dotenv").config({ path: "./docker/.env" });

// Import des routes
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const profileRoutes = require("./routes/profileRoutes");
const dataRoutes = require("./routes/dataRoutes");
const aiRoutes = require("./routes/aiRoutes");

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

// Démarrage du serveur
app.listen(port, () => {
  console.log(`🚀 Serveur backend démarré sur le port ${port}`);
});
