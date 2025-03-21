// backend/routes/plagiarismRoutes.js
const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");
const router = express.Router();
const pdfParse = require("pdf-parse");

// Créer le dossier pour les rapports de plagiat s'il n'existe pas
const reportsDir = path.join(__dirname, "../../frontend/reports");
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Route pour détecter le plagiat dans les soumissions d'un examen
router.post("/detect/:examId", authMiddleware, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un enseignant
    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ error: "Accès refusé. Vous devez être un enseignant." });
    }

    const examId = req.params.examId;
    const teacherId = req.user.id;

    // Vérifier que l'enseignant a accès à cet examen
    const verifyQuery = `
      SELECT e.*, s.name as subjectName, c.className 
      FROM exam e
      JOIN subject s ON e.subject_id = s.id
      JOIN class c ON e.class_id = c.id
      WHERE e.id = ? AND e.teacher_id = ?
    `;

    db.query(verifyQuery, [examId, teacherId], (err, results) => {
      if (err) {
        console.error("Erreur lors de la vérification de l'examen:", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      if (results.length === 0) {
        return res.status(403).json({
          error: "Vous n'êtes pas autorisé à accéder à cet examen",
        });
      }

      const examInfo = results[0];

      // Récupérer toutes les soumissions pour cet examen
      const submissionsQuery = `
        SELECT s.id, s.file_path, s.submitted_at, st.firstName, st.lastName, st.id as student_id
        FROM submission s
        JOIN student st ON s.student_id = st.id
        WHERE s.exam_id = ?
      `;

      db.query(submissionsQuery, [examId], async (err, submissions) => {
        if (err) {
          console.error("Erreur lors de la récupération des soumissions:", err);
          return res.status(500).json({ error: "Erreur serveur" });
        }

        if (submissions.length < 2) {
          // Pas assez de soumissions pour comparer
          const reportFileName = `plagiarism_report_${examId}_${Date.now()}.html`;
          const reportPath = path.join(reportsDir, reportFileName);

          // Génération d'un rapport de base
          const reportContent = `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Rapport de plagiat - Examen #${examId}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1, h2 { color: #2c3e50; }
                .report-header { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                .info-message { background-color: #e1f5fe; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 5px solid #03a9f4; }
              </style>
            </head>
            <body>
              <div class="report-header">
                <h1>Rapport de détection de plagiat</h1>
                <p>Examen: ${examInfo.title}</p>
                <p>Matière: ${examInfo.subjectName}</p>
                <p>Classe: ${examInfo.className}</p>
                <p>Date de génération: ${new Date().toLocaleString()}</p>
              </div>
              
              <div class="info-message">
                <h2>Analyse impossible</h2>
                <p>Il n'y a pas assez de soumissions pour effectuer une analyse de plagiat. Un minimum de deux soumissions est nécessaire.</p>
                <p>Nombre de soumissions actuelles: ${submissions.length}</p>
              </div>
            </body>
            </html>
          `;

          // Écrire le contenu du rapport dans un fichier
          fs.writeFileSync(reportPath, reportContent);

          // Renvoyer l'URL du rapport
          const reportUrl = `reports/${reportFileName}`;
          return res.json({
            message:
              "Pas assez de soumissions pour effectuer une analyse de plagiat",
            reportUrl: reportUrl,
          });
        }

        // Extraire le contenu des soumissions
        const submissionContents = [];

        for (const submission of submissions) {
          try {
            const filePath = submission.file_path;
            const fullPath = path.join(__dirname, "../../frontend", filePath);

            if (!fs.existsSync(fullPath)) {
              console.warn(`Fichier non trouvé: ${fullPath}`);
              continue;
            }

            const fileExtension = path.extname(fullPath).toLowerCase();
            let content = "";

            if (fileExtension === ".txt") {
              content = await fs.promises.readFile(fullPath, "utf8");
            } else if (fileExtension === ".pdf") {
              try {
                const buffer = await fs.promises.readFile(fullPath);
                const pdfData = await pdfParse(buffer);
                content = pdfData.text;
              } catch (pdfError) {
                console.error(
                  `Erreur lors de l'extraction du PDF ${filePath}:`,
                  pdfError
                );
                // Si l'extraction échoue, utiliser un contenu vide
                content = "";
              }
            } else {
              // Format non supporté, sauter cette soumission
              console.warn(`Format non supporté: ${fileExtension}`);
              continue;
            }

            submissionContents.push({
              student: submission,
              content: content,
            });
          } catch (error) {
            console.error(
              `Erreur lors de l'extraction du contenu de la soumission ${submission.id}:`,
              error
            );
            // Continuer avec la soumission suivante
          }
        }

        if (submissionContents.length < 2) {
          return res.json({
            message:
              "Pas assez de soumissions avec un contenu lisible pour effectuer une analyse de plagiat",
            reportUrl: null,
          });
        }

        // Calculer la similarité entre les soumissions
        const similarityResults = [];

        for (let i = 0; i < submissionContents.length; i++) {
          for (let j = i + 1; j < submissionContents.length; j++) {
            const student1 = submissionContents[i].student;
            const student2 = submissionContents[j].student;
            const content1 = submissionContents[i].content;
            const content2 = submissionContents[j].content;

            // Calculer le taux de similarité
            const similarityRate = calculateSimilarity(content1, content2);

            similarityResults.push({
              student1: student1,
              student2: student2,
              similarityRate: similarityRate,
            });
          }
        }

        // Trier les résultats par taux de similarité décroissant
        similarityResults.sort((a, b) => b.similarityRate - a.similarityRate);

        // Générer le rapport HTML
        const reportFileName = `plagiarism_report_${examId}_${Date.now()}.html`;
        const reportPath = path.join(reportsDir, reportFileName);

        let reportContent = `
          <!DOCTYPE html>
          <html lang="fr">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Rapport de plagiat - Examen #${examId}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1, h2 { color: #2c3e50; }
              .report-header { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
              .similarity-high { background-color: #ffcccc; }
              .similarity-medium { background-color: #fff2cc; }
              .similarity-low { background-color: #e6ffcc; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              table, th, td { border: 1px solid #ddd; }
              th, td { padding: 12px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <div class="report-header">
              <h1>Rapport de détection de plagiat</h1>
              <p>Examen: ${examInfo.title}</p>
              <p>Matière: ${examInfo.subjectName}</p>
              <p>Classe: ${examInfo.className}</p>
              <p>Date de génération: ${new Date().toLocaleString()}</p>
              <p>Nombre de soumissions analysées: ${
                submissionContents.length
              }</p>
            </div>
            
            <h2>Résultats de l'analyse</h2>
            <table>
              <tr>
                <th>Étudiant 1</th>
                <th>Étudiant 2</th>
                <th>Taux de similarité</th>
                <th>Niveau</th>
              </tr>
        `;

        // Ajouter les résultats au rapport
        similarityResults.forEach((result) => {
          let similarityClass = "similarity-low";
          let similarityLevel = "Faible";

          if (result.similarityRate > 70) {
            similarityClass = "similarity-high";
            similarityLevel = "Élevé";
          } else if (result.similarityRate > 40) {
            similarityClass = "similarity-medium";
            similarityLevel = "Moyen";
          }

          reportContent += `
            <tr class="${similarityClass}">
              <td>${result.student1.firstName} ${result.student1.lastName}</td>
              <td>${result.student2.firstName} ${result.student2.lastName}</td>
              <td>${result.similarityRate.toFixed(2)}%</td>
              <td>${similarityLevel}</td>
            </tr>
          `;
        });

        reportContent += `
            </table>
            
            <h2>Détails des soumissions</h2>
            <table>
              <tr>
                <th>ID</th>
                <th>Étudiant</th>
                <th>Date de soumission</th>
                <th>Fichier</th>
              </tr>
        `;

        // Ajouter les détails des soumissions
        submissionContents.forEach((submission) => {
          const submissionDate = new Date(
            submission.student.submitted_at
          ).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          reportContent += `
            <tr>
              <td>${submission.student.id}</td>
              <td>${submission.student.firstName} ${submission.student.lastName}</td>
              <td>${submissionDate}</td>
              <td>${submission.student.file_path}</td>
            </tr>
          `;
        });

        reportContent += `
            </table>
            
            <div>
              <h2>Note importante</h2>
              <p>Ce rapport est généré automatiquement et sert d'indicateur. Un taux de similarité élevé n'est pas nécessairement une preuve de plagiat. Veuillez examiner attentivement les soumissions avant de prendre une décision.</p>
              <p>L'algorithme de détection compare le contenu textuel des documents et mesure leur similarité. Plusieurs facteurs peuvent influencer ces résultats, y compris l'utilisation de termes spécifiques à la matière, des citations communes, ou des consignes strictes de formatage.</p>
            </div>
          </body>
          </html>
        `;

        // Écrire le contenu du rapport dans un fichier
        fs.writeFileSync(reportPath, reportContent);

        // Renvoyer l'URL du rapport
        const reportUrl = `reports/${reportFileName}`;
        res.json({
          message: "Analyse de plagiat terminée avec succès",
          reportUrl: reportUrl,
        });
      });
    });
  } catch (error) {
    console.error("Erreur lors de la détection de plagiat:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour détecter le plagiat dans toutes les soumissions
router.post("/detect-all", authMiddleware, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un enseignant
    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ error: "Accès refusé. Vous devez être un enseignant." });
    }

    const teacherId = req.user.id;

    // Récupérer tous les examens de l'enseignant
    const examsQuery = `
      SELECT e.id, e.title, s.name as subjectName, c.className
      FROM exam e
      JOIN subject s ON e.subject_id = s.id
      JOIN class c ON e.class_id = c.id
      WHERE e.teacher_id = ?
    `;

    db.query(examsQuery, [teacherId], async (err, exams) => {
      if (err) {
        console.error("Erreur lors de la récupération des examens:", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      if (exams.length === 0) {
        return res.json({
          message: "Aucun examen trouvé pour cet enseignant",
          reportUrl: null,
        });
      }

      // Générer le rapport HTML global
      const reportFileName = `plagiarism_report_all_${Date.now()}.html`;
      const reportPath = path.join(reportsDir, reportFileName);

      let reportContent = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Rapport global de plagiat</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2, h3 { color: #2c3e50; }
            .report-header { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .exam-section { border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin-bottom: 30px; }
            .similarity-high { background-color: #ffcccc; }
            .similarity-medium { background-color: #fff2cc; }
            .similarity-low { background-color: #e6ffcc; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            table, th, td { border: 1px solid #ddd; }
            th, td { padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="report-header">
            <h1>Rapport global de détection de plagiat</h1>
            <p>Enseignant: ${req.user.firstName} ${req.user.lastName}</p>
            <p>Date de génération: ${new Date().toLocaleString()}</p>
            <p>Nombre d'examens analysés: ${exams.length}</p>
          </div>
      `;

      // Pour chaque examen, analyser les soumissions
      for (const exam of exams) {
        // Récupérer les soumissions pour cet examen
        const submissionsQuery = `
          SELECT s.id, s.file_path, s.submitted_at, st.firstName, st.lastName, st.id as student_id
          FROM submission s
          JOIN student st ON s.student_id = st.id
          WHERE s.exam_id = ?
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

        reportContent += `
          <div class="exam-section">
            <h2>Examen: ${exam.title}</h2>
            <p>Matière: ${exam.subjectName}</p>
            <p>Classe: ${exam.className}</p>
            <p>Nombre de soumissions: ${submissions.length}</p>
        `;

        if (submissions.length < 2) {
          reportContent += `
            <p><em>Pas assez de soumissions pour effectuer une analyse de plagiat.</em></p>
          </div>
          `;
          continue;
        }

        // Extraire le contenu des soumissions
        const submissionContents = [];

        for (const submission of submissions) {
          try {
            const filePath = submission.file_path;
            const fullPath = path.join(__dirname, "../../frontend", filePath);

            if (!fs.existsSync(fullPath)) {
              console.warn(`Fichier non trouvé: ${fullPath}`);
              continue;
            }

            const fileExtension = path.extname(fullPath).toLowerCase();
            let content = "";

            if (fileExtension === ".txt") {
              content = await fs.promises.readFile(fullPath, "utf8");
            } else if (fileExtension === ".pdf") {
              try {
                const buffer = await fs.promises.readFile(fullPath);
                const pdfData = await pdfParse(buffer);
                content = pdfData.text;
              } catch (pdfError) {
                console.error(
                  `Erreur lors de l'extraction du PDF ${filePath}:`,
                  pdfError
                );
                // Si l'extraction échoue, utiliser un contenu vide
                content = "";
              }
            } else {
              // Format non supporté, sauter cette soumission
              continue;
            }

            submissionContents.push({
              student: submission,
              content: content,
            });
          } catch (error) {
            console.error(
              `Erreur lors de l'extraction du contenu de la soumission ${submission.id}:`,
              error
            );
            // Continuer avec la soumission suivante
          }
        }

        if (submissionContents.length < 2) {
          reportContent += `
            <p><em>Pas assez de soumissions avec un contenu lisible pour effectuer une analyse de plagiat.</em></p>
          </div>
          `;
          continue;
        }

        // Calculer la similarité entre les soumissions
        const similarityResults = [];

        for (let i = 0; i < submissionContents.length; i++) {
          for (let j = i + 1; j < submissionContents.length; j++) {
            const student1 = submissionContents[i].student;
            const student2 = submissionContents[j].student;
            const content1 = submissionContents[i].content;
            const content2 = submissionContents[j].content;

            // Calculer le taux de similarité
            const similarityRate = calculateSimilarity(content1, content2);

            similarityResults.push({
              student1: student1,
              student2: student2,
              similarityRate: similarityRate,
            });
          }
        }

        // Trier les résultats par taux de similarité décroissant
        similarityResults.sort((a, b) => b.similarityRate - a.similarityRate);

        reportContent += `
          <h3>Résultats de l'analyse</h3>
          <table>
            <tr>
              <th>Étudiant 1</th>
              <th>Étudiant 2</th>
              <th>Taux de similarité</th>
              <th>Niveau</th>
            </tr>
        `;

        // Ajouter les résultats au rapport
        similarityResults.forEach((result) => {
          let similarityClass = "similarity-low";
          let similarityLevel = "Faible";

          if (result.similarityRate > 70) {
            similarityClass = "similarity-high";
            similarityLevel = "Élevé";
          } else if (result.similarityRate > 40) {
            similarityClass = "similarity-medium";
            similarityLevel = "Moyen";
          }

          reportContent += `
            <tr class="${similarityClass}">
              <td>${result.student1.firstName} ${result.student1.lastName}</td>
              <td>${result.student2.firstName} ${result.student2.lastName}</td>
              <td>${result.similarityRate.toFixed(2)}%</td>
              <td>${similarityLevel}</td>
            </tr>
          `;
        });

        reportContent += `
            </table>
          </div>
        `;
      }

      reportContent += `
          <div>
            <h2>Note importante</h2>
            <p>Ce rapport est généré automatiquement et sert d'indicateur. Un taux de similarité élevé n'est pas nécessairement une preuve de plagiat. Veuillez examiner attentivement les soumissions avant de prendre une décision.</p>
            <p>L'algorithme de détection compare le contenu textuel des documents et mesure leur similarité. Plusieurs facteurs peuvent influencer ces résultats, y compris l'utilisation de termes spécifiques à la matière, des citations communes, ou des consignes strictes de formatage.</p>
          </div>
        </body>
        </html>
      `;

      // Écrire le contenu du rapport dans un fichier
      fs.writeFileSync(reportPath, reportContent);

      // Renvoyer l'URL du rapport
      const reportUrl = `reports/${reportFileName}`;
      res.json({
        message: "Analyse globale de plagiat terminée avec succès",
        reportUrl: reportUrl,
      });
    });
  } catch (error) {
    console.error("Erreur lors de la détection de plagiat:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Fonction pour calculer la similarité entre deux textes
function calculateSimilarity(text1, text2) {
  // Simplifier les textes
  text1 = preprocessText(text1);
  text2 = preprocessText(text2);

  // Si l'un des textes est vide, retourner 0
  if (!text1 || !text2) return 0;

  // Diviser les textes en mots
  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);

  // Créer des ensembles de n-grammes (séquences de n mots consécutifs)
  const n = 3; // Taille des n-grammes
  const ngrams1 = createNgrams(words1, n);
  const ngrams2 = createNgrams(words2, n);

  // Calculer le coefficient de Jaccard (taille de l'intersection / taille de l'union)
  const intersection = new Set([...ngrams1].filter((x) => ngrams2.has(x)));
  const union = new Set([...ngrams1, ...ngrams2]);

  const similarity = intersection.size / union.size;

  // Retourner le taux de similarité en pourcentage
  return similarity * 100;
}

// Prétraiter le texte pour la comparaison
function preprocessText(text) {
  if (!text) return "";

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Supprimer la ponctuation
    .replace(/\s+/g, " ") // Normaliser les espaces
    .trim();
}

// Créer des n-grammes à partir d'une liste de mots
function createNgrams(words, n) {
  const ngrams = new Set();

  for (let i = 0; i <= words.length - n; i++) {
    const ngram = words.slice(i, i + n).join(" ");
    ngrams.add(ngram);
  }

  return ngrams;
}

module.exports = router;
