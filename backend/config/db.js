// config/db.js
const mysql = require("mysql2");
require("dotenv").config({ path: "../docker/.env" }); // Charge le .env depuis le dossier docker

// Configuration de la connexion à MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Vérifier la connexion
db.connect((err) => {
  if (err) {
    console.error("❌ Erreur de connexion à la base de données:", err);
  } else {
    console.log("✅ Connexion à la base de données réussie");

    // Vérifier la structure de la table teacher
    db.query("DESCRIBE teacher", (err, results) => {
      if (err) {
        console.error(
          "❌ Erreur lors de la vérification de la table teacher:",
          err
        );
      } else {
        console.log("Structure de la table teacher:");
        console.table(results);
      }
    });
  }
});

module.exports = db;
