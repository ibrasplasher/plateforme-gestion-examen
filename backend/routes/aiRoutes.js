// backend/routes/aiRoutes.js
const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const router = express.Router();
const axios = require("axios");

// URL de l'API Ollama
const OLLAMA_API_URL = "http://host.docker.internal:11434/api/generate";

// Route pour générer un corrigé type avec l'IA
router.post("/generate-correction", authMiddleware, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un enseignant
    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ error: "Accès refusé. Vous devez être un enseignant." });
    }

    // Récupérer les données de l'examen du corps de la requête
    const {
      title,
      subject,
      class: className,
      description,
      examContent,
    } = req.body;

    // Créer un prompt pour l'IA
    const prompt = `
Tu es un enseignant expérimenté spécialisé dans la création de corrigés détaillés. Je vais te fournir des informations sur un examen et tu dois produire un corrigé type pour cet examen.

Informations sur l'examen :
- Titre: ${title}
- Matière: ${subject}
- Classe: ${className}
- Description: ${description}
- Contenu de l'examen: ${examContent}

J'aimerais que tu génères un corrigé type complet et détaillé pour cet examen. Le corrigé doit:
1. Inclure les réponses à toutes les questions ou problèmes posés
2. Fournir des explications claires et des étapes détaillées pour arriver aux réponses
3. Mettre en évidence les concepts importants et les méthodologies utilisées
4. Inclure des notes ou conseils supplémentaires lorsque c'est pertinent

Format souhaité:
- Structure claire avec des titres et sous-titres
- Numérotation correspondant aux questions de l'examen
- Explications détaillées pour chaque réponse

Génère maintenant un corrigé complet en te basant sur ces informations.
`;

    // Appeler l'API Ollama
    const response = await axios.post(OLLAMA_API_URL, {
      model: "deepseek-v2",
      prompt: prompt,
      stream: false,
    });

    // Formater le texte généré en HTML de base
    const generatedText = response.data.response;

    // Convertir le texte brut en HTML basique
    const htmlContent = convertTextToHtml(generatedText);

    // Renvoyer la réponse
    res.json({
      generatedCorrection: htmlContent,
    });
  } catch (error) {
    console.error("Erreur lors de la génération avec l'IA:", error);
    res.status(500).json({
      error: "Erreur lors de la génération du corrigé",
      details: error.message,
    });
  }
});

// Fonction pour convertir le texte brut en HTML basique
function convertTextToHtml(text) {
  // Remplacer les sauts de ligne par des balises <p>
  let html = "";
  const paragraphs = text.split("\n\n");

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === "") continue;

    // Vérifier si c'est un titre
    if (paragraph.startsWith("# ")) {
      html += `<h1>${paragraph.substring(2)}</h1>`;
    } else if (paragraph.startsWith("## ")) {
      html += `<h2>${paragraph.substring(3)}</h2>`;
    } else if (paragraph.startsWith("### ")) {
      html += `<h3>${paragraph.substring(4)}</h3>`;
    } else if (/^\d+\.\s/.test(paragraph)) {
      // Si c'est une liste numérotée (commence par un chiffre suivi d'un point)
      html += `<p><strong>${paragraph.split(". ")[0]}.</strong> ${paragraph
        .split(". ")
        .slice(1)
        .join(". ")}</p>`;
    } else {
      // Paragraphe normal
      html += `<p>${paragraph}</p>`;
    }
  }

  return html;
}

module.exports = router;
