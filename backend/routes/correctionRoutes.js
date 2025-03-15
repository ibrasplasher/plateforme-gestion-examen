const express = require("express");
const router = express.Router();
const correctionController = require("../controllers/correctionController");
const authMiddleware = require("../middleware/authMiddleware");

// Endpoint sécurisé pour la soumission de correction
router.post("/", authMiddleware, correctionController.submitCorrection);

module.exports = router;
