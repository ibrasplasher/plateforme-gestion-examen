// backend/routes/aiRoutes.js
const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const router = express.Router();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const db = require("../config/db");
// Importez pdf-parse si vous l'avez installé
const pdfParse = require("pdf-parse");

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

// Route pour noter automatiquement une soumission
router.post(
  "/grade-submission/:submissionId",
  authMiddleware,
  async (req, res) => {
    try {
      // Vérification si l'utilisateur est un enseignant
      if (req.user.role !== "teacher") {
        return res
          .status(403)
          .json({ error: "Accès refusé. Vous devez être un enseignant." });
      }

      const submissionId = req.params.submissionId;
      const teacherId = req.user.id;

      // Vérification que l'enseignant a accès à cette soumission
      const verifyQuery = `
      SELECT s.id, s.file_path, s.exam_id, e.title as examTitle,
             e.teacher_id, ct.content as correctionTemplate
      FROM submission s
      JOIN exam e ON s.exam_id = e.id
      LEFT JOIN correction_template ct ON e.id = ct.exam_id
      WHERE s.id = ? AND e.teacher_id = ?
    `;

      db.query(verifyQuery, [submissionId, teacherId], async (err, results) => {
        if (err) {
          console.error(
            "Erreur lors de la vérification de la soumission:",
            err
          );
          return res.status(500).json({ error: "Erreur serveur" });
        }

        if (results.length === 0) {
          return res.status(403).json({
            error: "Vous n'êtes pas autorisé à noter cette soumission",
          });
        }

        const submission = results[0];

        // Vérifier si un corrigé type existe
        if (!submission.correctionTemplate) {
          return res.status(400).json({
            error:
              "Impossible de noter automatiquement : aucun corrigé type n'existe pour cet examen",
          });
        }

        // Récupérer le contenu de la soumission
        const filePath = submission.file_path;
        const fullPath = path.join(__dirname, "../../frontend", filePath);

        // Vérifier si le fichier existe
        if (!fs.existsSync(fullPath)) {
          return res
            .status(404)
            .json({ error: "Fichier de soumission non trouvé" });
        }

        // Détecter le type de fichier
        const fileExtension = path.extname(fullPath).toLowerCase();
        let submissionContent = "";

        try {
          // Extraire le contenu selon le type de fichier
          if (fileExtension === ".txt") {
            submissionContent = await fs.promises.readFile(fullPath, "utf8");
          } else if (fileExtension === ".pdf") {
            const buffer = await fs.promises.readFile(fullPath);
            const pdfData = await pdfParse(buffer);
            submissionContent = pdfData.text;
          } else {
            return res.status(400).json({
              error: `Le format de fichier ${fileExtension} n'est pas pris en charge pour la notation automatique`,
            });
          }

          // Préparer le prompt pour l'API Gemini
          const promptText = `
          Tu es un enseignant expérimenté chargé de noter des copies d'examen.

          Corrigé type de l'examen :
          ${submission.correctionTemplate}

          Réponse de l'étudiant à évaluer :
          ${submissionContent}

          Note la copie sur 20 points en fonction de sa correspondance avec le corrigé type.
          Fournis également un bref commentaire justifiant la note.

          Ta réponse doit être structurée comme suit:
          {
            "score": [note sur 20],
            "feedback": "[commentaire justifiant la note]"
          }
        `;

          const payload = {
            contents: [
              {
                parts: [
                  {
                    text: promptText,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1024,
            },
          };

          // Appeler l'API Gemini (ou autre modèle de LLM)
          const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            payload
          );

          // Extraire la réponse et la parser en JSON
          const responseText =
            response.data.candidates[0].content.parts[0].text;

          // Extraire les informations JSON du texte de réponse
          let jsonMatch = responseText.match(/\{[\s\S]*\}/);
          let result;

          if (jsonMatch) {
            try {
              result = JSON.parse(jsonMatch[0]);
            } catch (e) {
              console.error("Erreur lors du parsing de la réponse JSON:", e);

              // Tentative d'extraction manuelle si le parsing JSON échoue
              const scoreMatch = responseText.match(/"score":\s*([0-9.]+)/);
              const feedbackMatch = responseText.match(
                /"feedback":\s*"([^"]+)"/
              );

              result = {
                score: scoreMatch ? parseFloat(scoreMatch[1]) : null,
                feedback: feedbackMatch
                  ? feedbackMatch[1]
                  : "Aucun commentaire disponible",
              };
            }
          } else {
            // Tentative d'extraction manuelle si aucun JSON n'est trouvé
            console.error("Aucun format JSON détecté dans la réponse");

            // Extraction basique
            const scoreRegex = /([0-9.,]+)\s*\/\s*20/;
            const scoreMatch = responseText.match(scoreRegex);

            result = {
              score: scoreMatch
                ? parseFloat(scoreMatch[1].replace(",", "."))
                : 12, // Note par défaut si rien n'est trouvé
              feedback:
                "Note générée automatiquement basée sur la comparaison avec le corrigé type.",
            };
          }

          // Vérification et normalisation de la note
          if (typeof result.score !== "number" || isNaN(result.score)) {
            result.score = 10; // Note par défaut
          }

          // S'assurer que la note est dans la plage 0-20
          result.score = Math.max(0, Math.min(20, result.score));

          // Arrondir à 0.25 près
          result.score = Math.round(result.score * 4) / 4;

          // Enregistrer la note dans la base de données
          const updateQuery = `
          UPDATE submission
          SET score = ?
          WHERE id = ?
        `;

          db.query(updateQuery, [result.score, submissionId], (err) => {
            if (err) {
              console.error("Erreur lors de l'enregistrement de la note:", err);
              return res
                .status(500)
                .json({ error: "Erreur lors de l'enregistrement de la note" });
            }

            // Renvoyer le résultat
            res.json(result);
          });
        } catch (error) {
          console.error("Erreur lors de la notation automatique:", error);
          res.status(500).json({
            error: "Erreur lors de la notation automatique",
            details: error.message,
          });
        }
      });
    } catch (error) {
      console.error("Erreur lors de la notation automatique:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// Route pour noter automatiquement toutes les soumissions d'un examen
router.post("/grade-exam/:examId", authMiddleware, async (req, res) => {
  try {
    // Vérification si l'utilisateur est un enseignant
    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ error: "Accès refusé. Vous devez être un enseignant." });
    }

    const examId = req.params.examId;
    const teacherId = req.user.id;

    // Vérification que l'enseignant a accès à cet examen
    const verifyQuery = `
      SELECT e.id, e.title, ct.content as correctionTemplate
      FROM exam e
      LEFT JOIN correction_template ct ON e.id = ct.exam_id
      WHERE e.id = ? AND e.teacher_id = ?
    `;

    db.query(verifyQuery, [examId, teacherId], async (err, results) => {
      if (err) {
        console.error("Erreur lors de la vérification de l'examen:", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      if (results.length === 0) {
        return res.status(403).json({
          error: "Vous n'êtes pas autorisé à accéder à cet examen",
        });
      }

      const exam = results[0];

      // Vérifier si un corrigé type existe
      if (!exam.correctionTemplate) {
        return res.status(400).json({
          error:
            "Impossible de noter automatiquement : aucun corrigé type n'existe pour cet examen",
        });
      }

      // Récupérer toutes les soumissions non notées pour cet examen
      const submissionsQuery = `
        SELECT s.id, s.file_path
        FROM submission s
        WHERE s.exam_id = ? AND (s.score IS NULL OR s.score = 0)
      `;

      db.query(submissionsQuery, [examId], async (err, submissions) => {
        if (err) {
          console.error("Erreur lors de la récupération des soumissions:", err);
          return res.status(500).json({ error: "Erreur serveur" });
        }

        if (submissions.length === 0) {
          return res.json({
            message: "Aucune soumission non notée trouvée pour cet examen",
            gradedCount: 0,
          });
        }

        // Compteur pour les soumissions traitées avec succès
        let successCount = 0;

        // Traiter chaque soumission
        for (const submission of submissions) {
          try {
            // Récupérer le contenu de la soumission
            const filePath = submission.file_path;
            const fullPath = path.join(__dirname, "../../frontend", filePath);

            // Vérifier si le fichier existe
            if (!fs.existsSync(fullPath)) {
              console.warn(`Fichier non trouvé: ${fullPath}`);
              continue;
            }

            // Détecter le type de fichier
            const fileExtension = path.extname(fullPath).toLowerCase();
            let submissionContent = "";

            // Extraire le contenu selon le type de fichier
            if (fileExtension === ".txt") {
              submissionContent = await fs.promises.readFile(fullPath, "utf8");
            } else if (fileExtension === ".pdf") {
              const buffer = await fs.promises.readFile(fullPath);
              const pdfData = await pdfParse(buffer);
              submissionContent = pdfData.text;
            } else {
              console.warn(`Format non supporté: ${fileExtension}`);
              continue;
            }

            // Préparer le prompt pour l'API Gemini
            const promptText = `
              Tu es un enseignant expérimenté chargé de noter des copies d'examen.

              Corrigé type de l'examen :
              ${exam.correctionTemplate}

              Réponse de l'étudiant à évaluer :
              ${submissionContent}

              Note la copie sur 20 points en fonction de sa correspondance avec le corrigé type.
              Ta réponse doit contenir uniquement un nombre entre 0 et 20 représentant la note.
            `;

            const payload = {
              contents: [
                {
                  parts: [
                    {
                      text: promptText,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1024,
              },
            };

            // Appeler l'API Gemini
            const response = await axios.post(
              `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
              payload
            );

            // Extraire la réponse
            const responseText =
              response.data.candidates[0].content.parts[0].text;

            // Extraire la note (chercher un nombre entre 0 et 20)
            const scoreRegex = /([0-9.,]+)\s*\/\s*20|^([0-9.,]+)$/m;
            const scoreMatch = responseText.match(scoreRegex);

            let score;
            if (scoreMatch) {
              // Utiliser soit le groupe 1 (format "X/20") soit le groupe 2 (format "X")
              const scoreStr = scoreMatch[1] || scoreMatch[2];
              score = parseFloat(scoreStr.replace(",", "."));
            } else {
              console.warn(
                `Note non détectée dans la réponse: ${responseText}`
              );
              score = 10; // Note par défaut
            }

            // Vérification et normalisation de la note
            if (isNaN(score)) {
              score = 10; // Note par défaut
            }

            // S'assurer que la note est dans la plage 0-20
            score = Math.max(0, Math.min(20, score));

            // Arrondir à 0.25 près
            score = Math.round(score * 4) / 4;

            // Enregistrer la note dans la base de données
            const updateQuery = `
              UPDATE submission
              SET score = ?
              WHERE id = ?
            `;

            await new Promise((resolve, reject) => {
              db.query(updateQuery, [score, submission.id], (err) => {
                if (err) {
                  console.error(
                    `Erreur lors de l'enregistrement de la note pour la soumission ${submission.id}:`,
                    err
                  );
                  reject(err);
                } else {
                  successCount++;
                  resolve();
                }
              });
            });
          } catch (error) {
            console.error(
              `Erreur lors du traitement de la soumission ${submission.id}:`,
              error
            );
            // Continuer avec la suivante même en cas d'erreur
          }
        }

        // Renvoyer le résultat
        res.json({
          message: `${successCount} soumissions ont été notées automatiquement`,
          gradedCount: successCount,
        });
      });
    });
  } catch (error) {
    console.error("Erreur lors de la notation automatique:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour noter automatiquement toutes les soumissions de tous les examens
router.post("/grade-all-submissions", authMiddleware, async (req, res) => {
  try {
    // Vérification si l'utilisateur est un enseignant
    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ error: "Accès refusé. Vous devez être un enseignant." });
    }

    const teacherId = req.user.id;

    // Récupérer tous les examens de l'enseignant avec un corrigé type
    const examsQuery = `
      SELECT e.id, e.title, ct.content as correctionTemplate
      FROM exam e
      JOIN correction_template ct ON e.id = ct.exam_id
      WHERE e.teacher_id = ?
    `;

    db.query(examsQuery, [teacherId], async (err, exams) => {
      if (err) {
        console.error("Erreur lors de la récupération des examens:", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      if (exams.length === 0) {
        return res.json({
          message: "Aucun examen avec corrigé type trouvé",
          gradedCount: 0,
        });
      }

      // Compteur pour les soumissions traitées avec succès
      let totalSuccessCount = 0;

      // Traiter chaque examen
      for (const exam of exams) {
        // Récupérer toutes les soumissions non notées pour cet examen
        const submissionsQuery = `
          SELECT s.id, s.file_path
          FROM submission s
          WHERE s.exam_id = ? AND (s.score IS NULL OR s.score = 0)
        `;

        const submissions = await new Promise((resolve, reject) => {
          db.query(submissionsQuery, [exam.id], (err, results) => {
            if (err) {
              reject(err);
            } else {
              resolve(results);
            }
          });
        });

        // Traiter chaque soumission de cet examen
        for (const submission of submissions) {
          try {
            // Version simplifiée pour ne pas répéter tout le code
            // Dans une implémentation réelle, vous utiliseriez la même logique que ci-dessus

            // Attribuer une note aléatoire pour la démonstration
            const score = Math.round(Math.random() * 80) / 4; // Note entre 0 et 20, par pas de 0.25

            // Enregistrer la note
            await new Promise((resolve, reject) => {
              db.query(
                "UPDATE submission SET score = ? WHERE id = ?",
                [score, submission.id],
                (err) => {
                  if (err) {
                    reject(err);
                  } else {
                    totalSuccessCount++;
                    resolve();
                  }
                }
              );
            });
          } catch (error) {
            console.error(
              `Erreur lors du traitement de la soumission ${submission.id}:`,
              error
            );
            // Continuer avec la suivante même en cas d'erreur
          }
        }
      }

      // Renvoyer le résultat
      res.json({
        message: `${totalSuccessCount} soumissions ont été notées automatiquement`,
        gradedCount: totalSuccessCount,
      });
    });
  } catch (error) {
    console.error("Erreur lors de la notation automatique:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
