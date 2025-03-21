// backend/routes/aiRoutes.js
const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const router = express.Router();
const axios = require("axios");

// Clé API Gemini
const GEMINI_API_KEY = "AIzaSyB7J_LMWaFJDpluv423Kw9ZsubV4qCS63s";
// URL corrigée avec un modèle disponible
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

// Route pour générer un corrigé type avec l'IA
router.post("/generate-correction", authMiddleware, async (req, res) => {
  try {
    console.log("Début de la génération de correction");

    // Vérification si l'utilisateur est un enseignant
    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ error: "Accès refusé. Vous devez être un enseignant." });
    }

    // Récupération des données d'examen
    const {
      title,
      subject,
      class: className,
      description,
      examContent,
    } = req.body;

    console.log("Données reçues:", { title, subject, className, description });

    // Création du prompt pour l'IA
    const prompt = `
Tu es un enseignant expérimenté spécialisé dans la création de corrigés détaillés. Je vais te fournir des informations sur un examen et tu dois produire un corrigé type.

Informations sur l'examen :
- Titre: ${title || "Non spécifié"}
- Matière: ${subject || "Non spécifiée"}
- Classe: ${className || "Non spécifiée"}
- Description: ${description || "Non spécifiée"}
- Contenu de l'examen: ${examContent || "Non spécifié"}

Génère un corrigé complet avec des explications détaillées pour chaque question.
`;

    console.log("Préparation de la requête à Gemini");
    console.log("URL de l'API:", GEMINI_API_URL);

    // Préparation du payload
    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };

    console.log("Envoi de la requête à Gemini");

    // Appel de l'API Gemini
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      payload
    );

    console.log("Réponse reçue de Gemini:", response.status);

    // Extraction de la réponse
    const generatedText = response.data.candidates[0].content.parts[0].text;

    // Conversion en HTML basique
    const htmlContent = convertTextToHtml(generatedText);

    console.log("HTML généré avec succès");

    // Envoi de la réponse
    res.json({
      generatedCorrection: htmlContent,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la génération avec l'IA:",
      error.response?.data || error.message
    );
    if (error.response) {
      console.error("Données de réponse d'erreur:", error.response.data);
      console.error("Status code:", error.response.status);
    }

    res.status(500).json({
      error: "Erreur lors de la génération du corrigé",
      details: error.message,
    });
  }
});

// Fonction pour convertir le texte en HTML
function convertTextToHtml(text) {
  let html = "";
  const paragraphs = text.split("\n\n");

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === "") continue;

    if (paragraph.startsWith("# ")) {
      html += `<h1>${paragraph.substring(2)}</h1>`;
    } else if (paragraph.startsWith("## ")) {
      html += `<h2>${paragraph.substring(3)}</h2>`;
    } else if (paragraph.startsWith("### ")) {
      html += `<h3>${paragraph.substring(4)}</h3>`;
    } else if (/^\d+\.\s/.test(paragraph)) {
      html += `<p><strong>${paragraph.split(". ")[0]}.</strong> ${paragraph
        .split(". ")
        .slice(1)
        .join(". ")}</p>`;
    } else {
      html += `<p>${paragraph}</p>`;
    }
  }

  return html;
}

module.exports = router;
