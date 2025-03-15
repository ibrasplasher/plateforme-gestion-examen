const axios = require("axios");
const correctionModel = require("../models/correctionModel");

const submitCorrection = async (req, res) => {
  const { copyId, copyText } = req.body;
  const userId = req.user.id;

  if (!copyText || !copyId) {
    return res.status(400).json({ error: "Texte et ID de la copie requis." });
  }

  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "deepseek-v2",
      prompt: `Corrige ce texte d'examen et donne une note sur 20 avec des commentaires : ${copyText}`,
    });

    const result = response.data.response || "Pas de réponse d'Ollama.";
    const score = parseFloat(result.match(/\d+/)?.[0]) || 0;

    correctionModel.createCorrection(copyId, userId, score, result, (err) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Erreur SQL", details: err.message });
      }
      res.status(200).json({
        message: "Correction enregistrée",
        correction: { score, comments: result },
      });
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur avec Ollama", details: error.message });
  }
};

module.exports = {
  submitCorrection,
};
