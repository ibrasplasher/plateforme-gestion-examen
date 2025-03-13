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

// Connexion à la base de données
db.connect((err) => {
  if (err) {
    console.error(`❌ Erreur MySQL : ${err.message}`);
    process.exit(1); // Arrête le backend si la connexion échoue
  } else {
    console.log("✅ Connecté à MySQL !");
  }
});

module.exports = db;
