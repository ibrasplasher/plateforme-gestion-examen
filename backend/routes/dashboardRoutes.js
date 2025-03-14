const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Route protégée par le middleware
router.get("/dashboard", authMiddleware, (req, res) => {
  res.json({ message: `Bienvenue, utilisateur ${req.user.id}!` });
});

module.exports = router;
