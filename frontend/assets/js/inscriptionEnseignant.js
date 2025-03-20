document.addEventListener("DOMContentLoaded", function () {
  console.log(
    "Document chargé - Initialisation du script d'inscription enseignant"
  );

  // Récupérer le formulaire
  const wizardForm = document.querySelector("#wizardProfile form");
  console.log("Formulaire trouvé:", !!wizardForm);

  // Variables pour stocker les sélections de matières et classes
  let selectedSubjects = [];
  let selectedClasses = [];

  // Prévisualisation de l'image
  const wizardPicture = document.querySelector("#wizard-picture");
  const wizardPicturePreview = document.querySelector("#wizardPicturePreview");
  console.log("Input d'image trouvé:", !!wizardPicture);
  console.log("Prévisualisation d'image trouvée:", !!wizardPicturePreview);

  if (wizardPicture) {
    wizardPicture.addEventListener("change", function () {
      console.log("Changement d'image détecté");
      if (this.files && this.files[0]) {
        const reader = new FileReader();

        reader.onload = function (e) {
          console.log("Image chargée en prévisualisation");
          wizardPicturePreview.src = e.target.result;
        };

        reader.readAsDataURL(this.files[0]);
      }
    });
  }

  // Charger les matières et les classes depuis l'API
  console.log("Début du chargement des matières et classes");
  loadSubjectsAndClasses();

  function loadSubjectsAndClasses() {
    console.log("Fonction loadSubjectsAndClasses appelée");

    // Vérification des conteneurs avant chargement
    const subjectsContainer = document.querySelector("#subjects-container");
    const classesContainer = document.querySelector("#classes-container");

    console.log(
      "Conteneur matières trouvé (#subjects-container):",
      !!subjectsContainer
    );
    console.log(
      "Conteneur classes trouvé (#classes-container):",
      !!classesContainer
    );

    // Matières
    fetch("http://localhost:5000/api/data/subjects")
      .then((response) => response.json())
      .then((subjects) => {
        console.log("Matières reçues:", subjects);
        displaySubjects(subjects);
      })
      .catch((error) => {
        console.error("Erreur lors du chargement des matières:", error);
      });

    // Classes
    fetch("http://localhost:5000/api/data/classes")
      .then((response) => response.json())
      .then((classes) => {
        console.log("Classes reçues:", classes);
        displayClasses(classes);
      })
      .catch((error) => {
        console.error("Erreur lors du chargement des classes:", error);
      });
  }

  function displaySubjects(subjects) {
    console.log(
      "Fonction displaySubjects appelée avec",
      subjects.length,
      "matières"
    );

    // Essayer les deux conteneurs possibles
    let subjectsContainer = document.querySelector("#subjects-container");
    if (!subjectsContainer) {
      console.log(
        "Conteneur #subjects-container non trouvé, essai avec #account .row"
      );
      subjectsContainer = document.querySelector("#account .row");
    }

    if (!subjectsContainer) {
      console.error("ERREUR CRITIQUE: Aucun conteneur de matières trouvé!");
      return;
    }

    console.log("Conteneur pour les matières trouvé:", subjectsContainer);

    // Vider le conteneur et préparer pour afficher les matières
    subjectsContainer.innerHTML = "";

    // Ajouter les matières
    subjects.forEach((subject) => {
      const subjectCol = document.createElement("div");
      subjectCol.className = "col-sm-4 mb-3";
      subjectCol.innerHTML = `
        <div class="custom-choice" data-subject-id="${subject.id}">
          <div class="card card-checkboxes card-hover-effect">
            <i class="ti-book"></i>
            <p>${subject.name}</p>
          </div>
        </div>
      `;
      subjectsContainer.appendChild(subjectCol);

      // Ajouter un gestionnaire de clic DIRECTEMENT
      const choiceElement = subjectCol.querySelector(".custom-choice");
      choiceElement.addEventListener("click", function () {
        const subjectId = parseInt(this.getAttribute("data-subject-id"));

        // Basculer la classe active manuellement
        if (this.classList.contains("active")) {
          this.classList.remove("active");
          this.querySelector(".card").style.backgroundColor = "";
          this.querySelector(".card").style.color = "";

          // Retirer de la sélection
          selectedSubjects = selectedSubjects.filter((id) => id !== subjectId);
        } else {
          this.classList.add("active");
          this.querySelector(".card").style.backgroundColor = "#007bff";
          this.querySelector(".card").style.color = "white";

          // Ajouter à la sélection
          if (!selectedSubjects.includes(subjectId)) {
            selectedSubjects.push(subjectId);
          }
        }

        console.log("Matières sélectionnées:", selectedSubjects);
      });
    });
  }

  function displayClasses(classes) {
    console.log(
      "Fonction displayClasses appelée avec",
      classes.length,
      "classes"
    );

    // Essayer les deux conteneurs possibles
    let classesContainer = document.querySelector("#classes-container");
    if (!classesContainer) {
      console.log(
        "Conteneur #classes-container non trouvé, essai avec #address .row"
      );
      classesContainer = document.querySelector("#address .row");
    }

    if (!classesContainer) {
      console.error("ERREUR CRITIQUE: Aucun conteneur de classes trouvé!");
      return;
    }

    console.log("Conteneur pour les classes trouvé:", classesContainer);

    // Vider le conteneur et préparer pour afficher les classes
    classesContainer.innerHTML = "";

    // Ajouter les classes
    classes.forEach((classItem) => {
      const classCol = document.createElement("div");
      classCol.className = "col-sm-4 mb-3";
      classCol.innerHTML = `
        <div class="custom-choice" data-class-id="${classItem.id}">
          <div class="card card-checkboxes card-hover-effect">
            <i class="ti-user"></i>
            <p>${classItem.className}</p>
          </div>
        </div>
      `;
      classesContainer.appendChild(classCol);

      // Ajouter un gestionnaire de clic DIRECTEMENT
      const choiceElement = classCol.querySelector(".custom-choice");
      choiceElement.addEventListener("click", function () {
        const classId = parseInt(this.getAttribute("data-class-id"));

        // Basculer la classe active manuellement
        if (this.classList.contains("active")) {
          this.classList.remove("active");
          this.querySelector(".card").style.backgroundColor = "";
          this.querySelector(".card").style.color = "";

          // Retirer de la sélection
          selectedClasses = selectedClasses.filter((id) => id !== classId);
        } else {
          this.classList.add("active");
          this.querySelector(".card").style.backgroundColor = "#007bff";
          this.querySelector(".card").style.color = "white";

          // Ajouter à la sélection
          if (!selectedClasses.includes(classId)) {
            selectedClasses.push(classId);
          }
        }

        console.log("Classes sélectionnées:", selectedClasses);
      });
    });
  }

  // Ajouter un CSS pour les éléments personnalisés
  const style = document.createElement("style");
  style.textContent = `
    .custom-choice {
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .custom-choice.active .card {
      background-color: #007bff;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    .card-checkboxes {
      padding: 15px;
      text-align: center;
      border-radius: 6px;
      transition: all 0.3s ease;
    }
    .card-hover-effect:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    }
  `;
  document.head.appendChild(style);

  // Ajouter un événement sur le bouton "Finish"
  const finishButton = document.querySelector(".btn-finish");
  if (finishButton) {
    console.log("Bouton Finish trouvé, ajout de l'écouteur d'événement");

    finishButton.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Bouton Finish cliqué");

      // Récupérer les valeurs du formulaire
      const firstName = wizardForm.querySelector(
        'input[name="firstname"]'
      )?.value;
      const lastName = wizardForm.querySelector(
        'input[name="lastname"]'
      )?.value;
      const email = wizardForm.querySelector('input[name="email"]')?.value;
      const contact = wizardForm.querySelector('input[name="NumTel"]')?.value;
      const password = wizardForm.querySelector(
        'input[name="Motdepasse"]'
      )?.value;
      const confirmPassword = wizardForm.querySelector(
        'input[name="ConfirmMotdepasse"]'
      )?.value;

      console.log("Données collectées:", {
        firstName: firstName || "(vide)",
        lastName: lastName || "(vide)",
        email: email || "(vide)",
        contact: contact || "(vide)",
        password: password ? "***" : "(vide)",
        confirmPassword: confirmPassword ? "***" : "(vide)",
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

      if (selectedSubjects.length === 0 || selectedClasses.length === 0) {
        console.error(
          "Validation échouée: aucune matière ou classe sélectionnée"
        );
        swal({
          title: "Attention!",
          text: "Veuillez sélectionner au moins une matière et une classe.",
          icon: "warning",
          button: "OK",
        });
        return;
      }

      // Vérifier s'il y a une photo sélectionnée
      if (
        wizardPicture &&
        wizardPicture.files &&
        wizardPicture.files.length > 0
      ) {
        console.log("Photo sélectionnée, démarrage de l'upload");
        uploadProfilePhoto(firstName, lastName, email, contact, password);
      } else {
        console.log(
          "Pas de photo sélectionnée, utilisation de l'image par défaut"
        );
        registerTeacher(
          firstName,
          lastName,
          email,
          contact,
          "profiles/defaultPicture.jpg", // CORRECTION: chemin sans le ../
          password
        );
      }
    });
  } else {
    console.error("❌ Bouton Finish introuvable");
  }

  function uploadProfilePhoto(firstName, lastName, email, contact, password) {
    console.log("Fonction uploadProfilePhoto appelée");

    // Créer un FormData pour envoyer le fichier
    const formData = new FormData();
    formData.append("profilePhoto", wizardPicture.files[0]);

    console.log("Téléchargement de la photo de profil...");

    fetch("http://localhost:5000/api/profile/upload-photo-public", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        console.log("Réponse upload photo status:", response.status);
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Photo téléchargée avec succès:", data);

        // CORRECTION: Assurer que le chemin est au bon format
        let photoPath = data.filePath;
        if (photoPath.startsWith("../")) {
          photoPath = photoPath.replace("../", "");
        }

        registerTeacher(
          firstName,
          lastName,
          email,
          contact,
          photoPath,
          password
        );
      })
      .catch((error) => {
        console.error("❌ Erreur lors de l'upload de la photo:", error);
        console.log("Utilisation de l'image par défaut suite à une erreur");
        registerTeacher(
          firstName,
          lastName,
          email,
          contact,
          "profiles/defaultPicture.jpg", // CORRECTION: chemin sans le ../
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
    console.log("Fonction registerTeacher appelée");

    // Préparer les données à envoyer
    const userData = {
      firstName,
      lastName,
      email,
      contact,
      profilPhoto,
      password,
    };

    console.log("Envoi des données d'inscription:", {
      ...userData,
      password: "***",
    });

    // Envoyer la requête à l'API
    fetch("http://localhost:5000/api/auth/register/teacher", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })
      .then((response) => {
        console.log(
          "Réponse API inscription - status:",
          response.status,
          "statusText:",
          response.statusText
        );
        return response.json().then((data) => {
          console.log("Données reçues:", data);
          if (!response.ok) {
            throw new Error(data.error || "Erreur lors de l'inscription");
          }
          return data;
        });
      })
      .then((data) => {
        console.log("✅ Inscription réussie:", data);
        console.log("Démarrage de l'assignation des matières et classes");
        return assignSubjectsAndClasses(data.teacherId);
      })
      .then(() => {
        console.log("✅ Assignation réussie, affichage du message de succès");
        swal({
          title: "Succès!",
          text: "Inscription réussie. Vous pouvez maintenant vous connecter.",
          icon: "success",
          button: "OK",
        }).then(() => {
          console.log("Redirection vers la page de connexion");
          window.location.href = "Connexion.html";
        });
      })
      .catch((error) => {
        console.error("❌ Erreur d'inscription:", error);
        swal({
          title: "Erreur!",
          text: error.message,
          icon: "error",
          button: "OK",
        });
      });
  }

  function assignSubjectsAndClasses(teacherId) {
    console.log(
      "Fonction assignSubjectsAndClasses appelée pour l'enseignant",
      teacherId
    );
    console.log("Matières sélectionnées:", selectedSubjects);
    console.log("Classes sélectionnées:", selectedClasses);

    // Préparer les données à envoyer
    const assignData = {
      teacherId: teacherId,
      subjects: selectedSubjects,
      classes: selectedClasses,
    };

    console.log("Envoi des données d'assignation:", assignData);

    // Envoyer la requête à l'API
    return fetch("http://localhost:5000/api/data/assign-teacher", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(assignData),
    })
      .then((response) => {
        console.log("Réponse API assignation - status:", response.status);
        if (!response.ok) {
          return response.json().then((data) => {
            console.error("Données d'erreur:", data);
            throw new Error(
              data.error ||
                "Erreur lors de l'assignation des matières et classes"
            );
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log("✅ Assignation réussie:", data);
        return data;
      })
      .catch((error) => {
        console.error("❌ Erreur lors de l'assignation:", error);
        throw error;
      });
  }
});
