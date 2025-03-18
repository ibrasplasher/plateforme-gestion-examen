document.addEventListener("DOMContentLoaded", function () {
  // Récupérer le formulaire
  const wizardForm = document.querySelector("#wizardProfile form");

  // Prévisualisation de l'image
  const wizardPicture = document.querySelector("#wizard-picture");
  const wizardPicturePreview = document.querySelector("#wizardPicturePreview");

  if (wizardPicture) {
    wizardPicture.addEventListener("change", function () {
      if (this.files && this.files[0]) {
        const reader = new FileReader();

        reader.onload = function (e) {
          wizardPicturePreview.src = e.target.result;
        };

        reader.readAsDataURL(this.files[0]);
      }
    });
  }

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

    // Vérifier s'il y a une photo sélectionnée
    if (
      wizardPicture &&
      wizardPicture.files &&
      wizardPicture.files.length > 0
    ) {
      // Si une photo est sélectionnée, d'abord l'uploader puis créer l'utilisateur
      uploadProfilePhoto(firstName, lastName, email, contact, password);
    } else {
      // Sinon, créer l'utilisateur avec la photo par défaut
      registerTeacher(
        firstName,
        lastName,
        email,
        contact,
        "../profiles/defaultPicture.jpg",
        password
      );
    }
  });

  function uploadProfilePhoto(firstName, lastName, email, contact, password) {
    // Créer un FormData pour envoyer le fichier
    const formData = new FormData();
    formData.append("profilePhoto", wizardPicture.files[0]);

    console.log("Téléchargement de la photo de profil...");

    fetch("http://localhost:5000/api/profile/upload-photo-public", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        console.log("Réponse upload photo:", response.status);
        return response.json();
      })
      .then((data) => {
        console.log("Photo téléchargée:", data);
        // Une fois la photo téléchargée, utiliser le chemin retourné pour créer l'utilisateur
        registerTeacher(
          firstName,
          lastName,
          email,
          contact,
          data.filePath,
          password
        );
      })
      .catch((error) => {
        console.error("Erreur lors de l'upload de la photo:", error);
        // En cas d'erreur, utiliser la photo par défaut
        registerTeacher(
          firstName,
          lastName,
          email,
          contact,
          "../profiles/defaultPicture.jpg",
          password
        );
      });
  }

  function registerTeacher(
    firstName,
    lastName,
    email,
    contact,
    profilPhoto,
    password
  ) {
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
          window.location.href = "Connexion.html";
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
  }
});
