// Ajoutez ou mettez à jour cette route dans votre fichier backend/routes/authRoutes.js

// Route pour l'inscription des étudiants
router.post("/register/student", async (req, res) => {
  try {
    const { numCarte, firstName, lastName, email, password, classId } =
      req.body;

    // Validation des données
    if (
      !numCarte ||
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !classId
    ) {
      return res
        .status(400)
        .json({ error: "Veuillez remplir tous les champs" });
    }

    // Vérifier si l'email existe déjà
    const emailCheckQuery = "SELECT * FROM student WHERE email = ?";
    db.query(emailCheckQuery, [email], async (err, results) => {
      if (err) {
        console.error("Erreur lors de la vérification de l'email:", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      if (results.length > 0) {
        return res.status(400).json({ error: "Cet email est déjà utilisé" });
      }

      // Vérifier si le numéro de carte existe déjà
      const numCarteCheckQuery = "SELECT * FROM student WHERE numCarte = ?";
      db.query(numCarteCheckQuery, [numCarte], async (err, results) => {
        if (err) {
          console.error(
            "Erreur lors de la vérification du numéro de carte:",
            err
          );
          return res.status(500).json({ error: "Erreur serveur" });
        }

        if (results.length > 0) {
          return res
            .status(400)
            .json({ error: "Ce numéro de carte est déjà utilisé" });
        }

        // Vérifier si la classe existe
        const classCheckQuery = "SELECT * FROM class WHERE id = ?";
        db.query(classCheckQuery, [classId], async (err, results) => {
          if (err) {
            console.error("Erreur lors de la vérification de la classe:", err);
            return res.status(500).json({ error: "Erreur serveur" });
          }

          if (results.length === 0) {
            return res.status(400).json({ error: "Classe invalide" });
          }

          // Hashage du mot de passe (utiliser votre méthode de hashage actuelle)
          const hashedPassword = await bcrypt.hash(password, 10);

          // Insertion dans la base de données avec le champ class_id
          const insertQuery =
            "INSERT INTO student (firstName, lastName, numCarte, email, password_hash, class_id) VALUES (?, ?, ?, ?, ?, ?)";
          db.query(
            insertQuery,
            [firstName, lastName, numCarte, email, hashedPassword, classId],
            (err, result) => {
              if (err) {
                console.error("Erreur lors de l'inscription:", err);
                return res
                  .status(500)
                  .json({ error: "Erreur serveur lors de l'inscription" });
              }

              res.status(201).json({
                message: "Inscription réussie",
                userId: result.insertId,
              });
            }
          );
        });
      });
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
