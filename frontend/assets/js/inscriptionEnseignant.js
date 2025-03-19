document.addEventListener("DOMContentLoaded", function () {
  console.log(
    "Document chargé - Initialisation du script d'inscription enseignant"
  );

  // Debug: Inspecter les éléments clés
  console.log("Inspection du DOM au démarrage:");
  console.log("- wizardProfile:", document.querySelector("#wizardProfile"));
  console.log(
    "- subjects-container:",
    document.querySelector("#subjects-container")
  );
  console.log(
    "- classes-container:",
    document.querySelector("#classes-container")
  );
  console.log("- jQuery disponible:", typeof $ !== "undefined");

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
      .then((response) => {
        console.log("Réponse API matières - status:", response.status);
        return response.json();
      })
      .then((subjects) => {
        console.log("Matières reçues:", subjects);
        displaySubjects(subjects);
      })
      .catch((error) => {
        console.error("Erreur lors du chargement des matières:", error);
      });

    // Classes
    fetch("http://localhost:5000/api/data/classes")
      .then((response) => {
        console.log("Réponse API classes - status:", response.status);
        return response.json();
      })
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

    // DEBUG: Tester les deux possibilités de sélecteurs
    console.log("Test de sélecteurs:");
    console.log(
      "- #subjects-container:",
      document.querySelector("#subjects-container")
    );
    console.log("- #account .row:", document.querySelector("#account .row"));

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

    // Vider le conteneur et insérer les matières
    subjectsContainer.innerHTML = "";
    console.log(
      "Conteneur matières vidé, ajout de",
      subjects.length,
      "matières"
    );

    subjects.forEach((subject) => {
      console.log(
        "Ajout de la matière:",
        subject.name,
        "(ID:",
        subject.id,
        ")"
      );

      const subjectCol = document.createElement("div");
      subjectCol.className = "col-sm-4 mb-3";
      subjectCol.innerHTML = `
        <div class="choice" data-toggle="wizard-checkbox" data-subject-id="${subject.id}">
          <input type="checkbox" name="subject[]" value="${subject.id}">
          <div class="card card-checkboxes card-hover-effect">
            <i class="ti-book"></i>
            <p>${subject.name}</p>
          </div>
        </div>
      `;
      subjectsContainer.appendChild(subjectCol);
    });

    // Configurer le suivi des sélections APRÈS que tous les éléments sont ajoutés
    console.log(
      "Configuration des gestionnaires d'événements pour les matières"
    );
    setupSubjectSelection();
  }

  function displayClasses(classes) {
    console.log(
      "Fonction displayClasses appelée avec",
      classes.length,
      "classes"
    );

    // DEBUG: Tester les deux possibilités de sélecteurs
    console.log("Test de sélecteurs:");
    console.log(
      "- #classes-container:",
      document.querySelector("#classes-container")
    );
    console.log("- #address .row:", document.querySelector("#address .row"));

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

    // Vider le conteneur et insérer les classes
    classesContainer.innerHTML = "";
    console.log("Conteneur classes vidé, ajout de", classes.length, "classes");

    classes.forEach((classItem) => {
      console.log(
        "Ajout de la classe:",
        classItem.className,
        "(ID:",
        classItem.id,
        ")"
      );

      const classCol = document.createElement("div");
      classCol.className = "col-sm-4 mb-3";
      classCol.innerHTML = `
        <div class="choice" data-toggle="wizard-checkbox" data-class-id="${classItem.id}">
          <input type="checkbox" name="class[]" value="${classItem.id}">
          <div class="card card-checkboxes card-hover-effect">
            <i class="ti-user"></i>
            <p>${classItem.className}</p>
          </div>
        </div>
      `;
      classesContainer.appendChild(classCol);
    });

    // Configurer le suivi des sélections APRÈS que tous les éléments sont ajoutés
    console.log(
      "Configuration des gestionnaires d'événements pour les classes"
    );
    setupClassSelection();
  }

  // Fonction pour configurer les gestionnaires d'événements des matières
  function setupSubjectSelection() {
    console.log("Début de setupSubjectSelection");

    // Attendre que jQuery et le wizard soient prêts
    setTimeout(() => {
      if (typeof $ === "undefined") {
        console.error("jQuery non disponible!");
        return;
      }

      console.log(
        "Nombre d'éléments .choice pour les matières:",
        $(".choice[data-subject-id]").length
      );

      // Observer les clics sur les éléments de matière
      $(".choice[data-subject-id]").on("click", function () {
        const subjectId = parseInt($(this).attr("data-subject-id"));
        console.log("Clic sur matière ID:", subjectId);

        // Vérifier après un bref délai pour laisser le wizard appliquer ses changements
        setTimeout(() => {
          const isActive = $(this).hasClass("active");
          console.log(`Matière ${subjectId} - état actif: ${isActive}`);

          if (isActive) {
            if (!selectedSubjects.includes(subjectId)) {
              selectedSubjects.push(subjectId);
              console.log(`Matière ${subjectId} ajoutée à la sélection`);
            }
          } else {
            selectedSubjects = selectedSubjects.filter(
              (id) => id !== subjectId
            );
            console.log(`Matière ${subjectId} retirée de la sélection`);
          }

          console.log("Matières sélectionnées:", selectedSubjects);
        }, 50);
      });

      console.log("Gestionnaires d'événements pour les matières configurés");
    }, 1000);
  }

  // Fonction pour configurer les gestionnaires d'événements des classes
  function setupClassSelection() {
    console.log("Début de setupClassSelection");

    // Attendre que jQuery et le wizard soient prêts
    setTimeout(() => {
      if (typeof $ === "undefined") {
        console.error("jQuery non disponible!");
        return;
      }

      console.log(
        "Nombre d'éléments .choice pour les classes:",
        $(".choice[data-class-id]").length
      );

      // Observer les clics sur les éléments de classe
      $(".choice[data-class-id]").on("click", function () {
        const classId = parseInt($(this).attr("data-class-id"));
        console.log("Clic sur classe ID:", classId);

        // Vérifier après un bref délai pour laisser le wizard appliquer ses changements
        setTimeout(() => {
          const isActive = $(this).hasClass("active");
          console.log(`Classe ${classId} - état actif: ${isActive}`);

          if (isActive) {
            if (!selectedClasses.includes(classId)) {
              selectedClasses.push(classId);
              console.log(`Classe ${classId} ajoutée à la sélection`);
            }
          } else {
            selectedClasses = selectedClasses.filter((id) => id !== classId);
            console.log(`Classe ${classId} retirée de la sélection`);
          }

          console.log("Classes sélectionnées:", selectedClasses);
        }, 50);
      });

      console.log("Gestionnaires d'événements pour les classes configurés");
    }, 1000);
  }

  // Ajouter un événement sur le bouton "Finish"
  const finishButton = document.querySelector(".btn-finish");
  if (finishButton) {
    console.log("Bouton Finish trouvé, ajout de l'écouteur d'événement");

    finishButton.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Bouton Finish cliqué");

      // Faire un dernier scan de l'état des sélections
      if (typeof $ !== "undefined") {
        console.log(
          "Scan final des éléments actifs au moment de la soumission"
        );

        // Vérifier et collecter les matières sélectionnées
        let currentSubjects = [];
        $(".choice[data-subject-id].active").each(function () {
          const id = parseInt($(this).attr("data-subject-id"));
          currentSubjects.push(id);
          console.log(`Matière active trouvée: ${id}`);
        });

        // Vérifier et collecter les classes sélectionnées
        let currentClasses = [];
        $(".choice[data-class-id].active").each(function () {
          const id = parseInt($(this).attr("data-class-id"));
          currentClasses.push(id);
          console.log(`Classe active trouvée: ${id}`);
        });

        // Mettre à jour nos listes de sélection
        selectedSubjects = currentSubjects;
        selectedClasses = currentClasses;

        console.log("Matières sélectionnées (final):", selectedSubjects);
        console.log("Classes sélectionnées (final):", selectedClasses);
      }

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
          "../profiles/defaultPicture.jpg",
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
        console.error("❌ Erreur lors de l'upload de la photo:", error);
        console.log("Utilisation de l'image par défaut suite à une erreur");
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

  // Vérification périodique de l'état des sélections (utile pour le débogage)
  setInterval(() => {
    if (typeof $ !== "undefined") {
      console.log("Vérification périodique des éléments actifs");
      console.log(
        "Matières actives:",
        $(".choice[data-subject-id].active").length
      );
      console.log(
        "Classes actives:",
        $(".choice[data-class-id].active").length
      );
    }
  }, 5000);
});
