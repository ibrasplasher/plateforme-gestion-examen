const express = require("express");
const mysql = require("mysql2");
require("dotenv").config();
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PORT:", process.env.DB_PORT);


const app = express();
const port = 5000;

// Connexion à MySQL (Docker)
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

const connectWithRetry = () => {
  console.log("Tentative de connexion à MySQL...");
  const interval = setInterval(() => {
      db.connect((err) => {
          if (err) {
              console.error("❌ Erreur de connexion à MySQL, nouvelle tentative dans 5s...");
          } else {
              console.log("✅ Connecté à MySQL !");
              clearInterval(interval); // Arrête la boucle dès que la connexion réussit
          }
      });
  }, 5000);
};
  
  connectWithRetry();

// Route pour tester la base de données
app.get("/api/users", (req, res) => {
  db.query("SELECT * FROM teacher", (err, results) => {
    if (err) {
      res.status(500).json({ error: "Erreur SQL" });
    } else {
      res.json(results);
    }
  });
});

app.get("/", (req, res) => {
  res.send("Backend en cours de développement...");
});

app.listen(5000, () => {
  console.log("Serveur backend démarré sur le port 5000");
});
