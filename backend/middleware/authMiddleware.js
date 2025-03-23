const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // Vérifier d'abord le token dans l'URL
  const tokenFromQuery = req.query.token;

  // Ensuite vérifier dans les en-têtes
  const authHeader = req.header("Authorization");
  const tokenFromHeader =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  // Utiliser le token trouvé soit dans l'URL, soit dans l'en-tête
  const token = tokenFromQuery || tokenFromHeader;

  // Si aucun token n'est trouvé, renvoyer une erreur
  if (!token) {
    return res.status(401).json({ error: "Accès refusé. Token manquant." });
  }

  // Vérifier si JWT_SECRET est bien défini
  if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET n'est pas défini dans l'environnement !");
    return res
      .status(500)
      .json({ error: "Erreur serveur. Secret JWT manquant." });
  }

  try {
    console.log(
      "Vérification du token avec le secret :",
      process.env.JWT_SECRET
    );
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Erreur de vérification du token :", err.message);
    const message =
      err.name === "TokenExpiredError"
        ? "Token expiré, veuillez vous reconnecter."
        : "Token invalide.";

    res.status(401).json({ error: message });
  }
};

// Middleware spécifique pour restreindre aux enseignants
const TeacherOnlyMiddleware = (req, res, next) => {
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ error: "Accès refusé. Réservé aux enseignants." });
  }
  next();
};

module.exports = { authMiddleware, TeacherOnlyMiddleware };
