const axios = require("axios");
const correctionModel = require("../models/correctionModel");

const submitCorrection = async (req, res) => {
  const { copyId, copyText } = req.body;
  const userId = req.user.id;

  if (!copyText || !copyId) {
    return res.status(400).json({ error: "Texte et ID de la copie requis." });
  }

  try {
    // Appel vers DeepSeek
    const response = await axios.post(
      "https://api.deepseek.com/correct",
      {
        text: copyText,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
      }
    );

    const { score, comments } = response.data;

    // Sauvegarde dans la base de données
    correctionModel.createCorrection(copyId, userId, score, comments, (err) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Erreur SQL", details: err.message });
      }
      res
        .status(200)
        .json({
          message: "Correction enregistrée",
          correction: { score, comments },
        });
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur avec DeepSeek", details: error.message });
  }
};

module.exports = {
  submitCorrection,
};
