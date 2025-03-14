const express = require("express");
const mysql = require("mysql2");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();
const port = process.env.PORT || 5000;

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

const connectWithRetry = () => {
  db.connect((err) => {
    if (err) {
      console.error(
        "❌ Erreur de connexion à MySQL, nouvelle tentative dans 5s..."
      );
      setTimeout(connectWithRetry, 5000);
    } else {
      console.log("✅ Connecté à MySQL !");
    }
  });
};

db.on("error", (err) => {
  console.error("❌ Erreur MySQL:", err);
});

connectWithRetry();

// Middleware pour parser le JSON
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", dashboardRoutes);

// Route par défaut
app.get("/", (req, res) => {
  res.send("Backend en cours de développement...");
});

app.listen(port, () => {
  console.log(`🚀 Serveur backend démarré sur le port ${port}`);
});
