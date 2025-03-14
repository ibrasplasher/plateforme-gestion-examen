const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Accès refusé. Token manquant." });
  }

  const token = authHeader.split(" ")[1];

  // Vérifier si JWT_SECRET est bien défini
  if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET n'est pas défini dans l'environnement !");
    return res
      .status(500)
      .json({ error: "Erreur serveur. Secret JWT manquant." });
  }

  try {
    console.log(
      "🔐 Vérification du token avec le secret :",
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

module.exports = authMiddleware;
