// backend/middleware/uploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Dossier pour les photos de profil
const profilesDir = path.join(__dirname, "../../frontend/assets/img");
// Dossier pour les examens
const examsDir = path.join(__dirname, "../../frontend/exams");
// Dossier pour les soumissions d'étudiants
const submissionsDir = path.join(__dirname, "../../frontend/submissions");

// Créer les dossiers s'ils n'existent pas
[profilesDir, examsDir, submissionsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Déterminer le dossier de destination selon le type de fichier
    if (req.originalUrl.includes("/submit-exam")) {
      // Pour les soumissions d'étudiants
      cb(null, submissionsDir);
    } else if (
      req.originalUrl.includes("/exams") ||
      req.originalUrl.includes("/upload-exam")
    ) {
      // Pour les examens créés par les enseignants
      cb(null, examsDir);
    } else {
      // Pour les photos de profil
      cb(null, profilesDir);
    }
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique avec timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);

    // Préfixer le nom du fichier selon le type
    let prefix = "profile-";

    if (req.originalUrl.includes("/submit-exam")) {
      prefix = "submission-";
    } else if (
      req.originalUrl.includes("/exams") ||
      req.originalUrl.includes("/upload-exam")
    ) {
      prefix = "exam-";
    }

    cb(null, prefix + uniqueSuffix + ext);
  },
});

// Filtre pour accepter les types de fichiers
const fileFilter = (req, file, cb) => {
  // Types de fichiers acceptés pour les photos de profil
  const imageTypes = ["image/jpeg", "image/png", "image/gif"];

  // Types de fichiers acceptés pour les examens et soumissions
  const documentTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  // Déterminer quel ensemble de types utiliser
  const isDocumentUpload =
    req.originalUrl.includes("/exams") ||
    req.originalUrl.includes("/upload-exam") ||
    req.originalUrl.includes("/submit-exam");

  const allowedTypes = isDocumentUpload
    ? [...documentTypes, ...imageTypes]
    : imageTypes;

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const errorMessage = isDocumentUpload
      ? "Type de fichier non supporté! Seuls PDF, DOC, DOCX, TXT et images sont acceptés."
      : "Type de fichier non supporté! Seuls JPEG, PNG et GIF sont acceptés.";

    cb(new Error(errorMessage), false);
  }
};

// Configuration de l'upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 50, // Limite augmentée à 50MB pour les documents
  },
  fileFilter: fileFilter,
});

module.exports = { upload };
