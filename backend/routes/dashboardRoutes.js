const express = require("express");
const {
  authMiddleware,
  TeacherOnlyMiddleware,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Route protégée par le middleware
router.get("/dashboard", authMiddleware, TeacherOnlyMiddleware, (req, res) => {
  res.json({ message: `Bienvenue ${req.user.firstName}!`, user: req.user });
});

module.exports = router;
