document.addEventListener("DOMContentLoaded", function () {
  // Récupérer le formulaire
  const wizardForm = document.querySelector("#wizardProfile form");

  // Ajouter un événement sur le bouton "Finish"
  document.querySelector(".btn-finish").addEventListener("click", function (e) {
    e.preventDefault();
    console.log("Bouton Finish cliqué");

    // Récupérer les valeurs du formulaire
    const firstName = wizardForm.querySelector('input[name="firstname"]').value;
    const lastName = wizardForm.querySelector('input[name="lastname"]').value;
    const email = wizardForm.querySelector('input[name="email"]').value;
    const contact = wizardForm.querySelector('input[name="NumTel"]').value;
    const password = wizardForm.querySelector('input[name="Motdepasse"]').value;
    const confirmPassword = wizardForm.querySelector(
      'input[name="ConfirmMotdepasse"]'
    ).value;

    // Définir profilPhoto avec une valeur par défaut
    const profilPhoto = "../profiles/defaultPicture.jpg";

    console.log("Données collectées:", {
      firstName,
      lastName,
      email,
      contact,
      password: "***",
      confirmPassword: "***",
    });

    // Valider le formulaire
    if (!firstName || !lastName || !email || !password) {
      console.error("Validation échouée: champs obligatoires manquants");
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (password !== confirmPassword) {
      console.error("Validation échouée: mots de passe différents");
      alert("Les mots de passe ne correspondent pas");
      return;
    }

    // Préparer les données à envoyer
    const userData = {
      firstName,
      lastName,
      email,
      contact,
      profilPhoto,
      password,
    };

    console.log("Envoi des données:", { ...userData, password: "***" });

    // Envoyer la requête à l'API
    fetch("http://localhost:5000/api/auth/register/teacher", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })
      .then((response) => {
        console.log("Réponse reçue:", response.status, response.statusText);
        return response.json().then((data) => {
          console.log("Données reçues:", data);
          if (!response.ok) {
            throw new Error(data.error || "Erreur lors de l'inscription");
          }
          return data;
        });
      })
      .then((data) => {
        console.log("Inscription réussie:", data);
        // Afficher un message de succès
        swal({
          title: "Succès!",
          text: "Inscription réussie. Vous pouvez maintenant vous connecter.",
          icon: "success",
          button: "OK",
        }).then(() => {
          // Rediriger vers la page de connexion
          window.location.href = "login.html";
        });
      })
      .catch((error) => {
        console.error("Erreur d'inscription:", error);
        // Afficher l'erreur
        swal({
          title: "Erreur!",
          text: error.message,
          icon: "error",
          button: "OK",
        });
      });
  });
});
