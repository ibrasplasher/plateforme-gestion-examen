// backend/middleware/uploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Dossier pour les photos de profil
const profilesDir = path.join(__dirname, "../../frontend/assets/img");
// Dossier pour les examens
const examsDir = path.join(__dirname, "../../frontend/exams");

// Créer les dossiers s'ils n'existent pas
[profilesDir, examsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Déterminer le dossier de destination selon le type de fichier
    const isExam =
      req.originalUrl.includes("/exams") ||
      req.originalUrl.includes("/upload-exam");

    const destination = isExam ? examsDir : profilesDir;
    cb(null, destination);
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique avec timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);

    // Préfixer le nom du fichier selon le type
    const prefix =
      req.originalUrl.includes("/exams") ||
      req.originalUrl.includes("/upload-exam")
        ? "exam-"
        : "profile-";

    cb(null, prefix + uniqueSuffix + ext);
  },
});

// Filtre pour accepter les types de fichiers
const fileFilter = (req, file, cb) => {
  // Types de fichiers acceptés pour les photos de profil
  const imageTypes = ["image/jpeg", "image/png", "image/gif"];

  // Types de fichiers acceptés pour les examens
  const documentTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  // Déterminer quel ensemble de types utiliser
  const isExam =
    req.originalUrl.includes("/exams") ||
    req.originalUrl.includes("/upload-exam");

  const allowedTypes = isExam ? [...imageTypes, ...documentTypes] : imageTypes;

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const errorMessage = isExam
      ? "Type de fichier non supporté! Seuls PDF, DOC, DOCX, TXT et images sont acceptés."
      : "Type de fichier non supporté! Seuls JPEG, PNG et GIF sont acceptés.";

    cb(new Error(errorMessage), false);
  }
};

// Configuration de l'upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10, // Limite à 10MB
  },
  fileFilter: fileFilter,
});

module.exports = { upload };
