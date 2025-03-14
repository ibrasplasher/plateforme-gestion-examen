const express = require("express");
const router = express.Router();
const correctionController = require("../controllers/correctionController");
const authMiddleware = require("../middleware/authMiddleware");

// Endpoint de soumission de copie pour correction
router.post(
  "/corrections",
  authMiddleware,
  correctionController.submitCorrection
);

module.exports = router;
