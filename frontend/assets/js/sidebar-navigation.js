// Mettre à jour sidebar-navigation.js
document.addEventListener("DOMContentLoaded", function () {
  console.log(
    "Initialisation de la navigation de la sidebar - version améliorée"
  );

  // Fonction pour nettoyer le texte en supprimant les espaces et retours à la ligne excessifs
  function cleanText(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  // Fonction pour déconnecter l'utilisateur
  function logoutUser() {
    console.log("Déconnexion de l'utilisateur");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "Connexion.html";
  }

  // Configuration des liens de la sidebar
  const sidebarLinks = {
    dashboard: "dashboardEnseignant.html",
    "creer-evaluation": "CreateExam.html",
    "deposer-evaluation": "DeposerEtManagerExam.html",
    "gestion-notes": "Grade.html",
    examxpert: "Exam.html",
    logout: logoutUser,
  };

  // Gérer tous les liens dans la sidebar
  const allSidebarLinks = document.querySelectorAll(".sidebar-menu a");
  console.log("Nombre total de liens trouvés:", allSidebarLinks.length);

  allSidebarLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      // Ne pas empêcher le comportement par défaut pour les toggle_menu
      if (
        this.hasAttribute("onclick") &&
        this.getAttribute("onclick").includes("toggle_menu")
      ) {
        return; // Laisser le comportement par défaut de toggle_menu
      }

      const rawLinkText = link.textContent;
      const linkText = cleanText(rawLinkText);

      console.log("Lien cliqué (nettoyé):", linkText);

      // Vérifier chaque possibilité avec une approche simplifiée
      if (linkText.includes("Dashboard")) {
        e.preventDefault();
        console.log("Redirection vers Dashboard");
        window.location.href = sidebarLinks["dashboard"];
      } else if (linkText.includes("Creer Evaluation")) {
        e.preventDefault();
        console.log("Redirection vers Creer Evaluation");
        window.location.href = sidebarLinks["creer-evaluation"];
      } else if (linkText.includes("Deposer Evaluation")) {
        e.preventDefault();
        console.log("Redirection vers Deposer Evaluation");
        window.location.href = sidebarLinks["deposer-evaluation"];
      } else if (linkText.includes("Gestion Notes")) {
        e.preventDefault();
        console.log("Redirection vers Gestion Notes");
        window.location.href = sidebarLinks["gestion-notes"];
      } else if (linkText.includes("ExamXpert")) {
        e.preventDefault();
        console.log("Redirection vers ExamXpert");
        window.location.href = sidebarLinks["examxpert"];
      } else if (linkText.includes("Log Out")) {
        e.preventDefault();
        console.log("Déconnexion...");
        sidebarLinks["logout"]();
      }
    });
  });

  // Configurer les liens dans le menu déroulant du profil également
  const profileDropdownItems = document.querySelectorAll(".dropdown-menu a");
  profileDropdownItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      const itemText = cleanText(item.textContent);
      console.log("Option du profil cliquée:", itemText);

      if (itemText === "Dashboard") {
        e.preventDefault();
        window.location.href = sidebarLinks["dashboard"];
      } else if (itemText === "ChatBot") {
        e.preventDefault();
        window.location.href = sidebarLinks["examxpert"];
      } else if (itemText === "Log Out") {
        e.preventDefault();
        sidebarLinks["logout"]();
      }
    });
  });

  // Charger les informations de l'utilisateur depuis localStorage
  function updateUserInfo() {
    const userDataStr = localStorage.getItem("user");
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);

        // Mettre à jour le nom d'utilisateur dans la sidebar
        const userNameElements = document.querySelectorAll(".avatar p strong");
        userNameElements.forEach((el) => {
          el.textContent = `${userData.firstName} ${userData.lastName}`;
        });

        // Mettre à jour la profession utilisateur
        const userRoleElements = document.querySelectorAll(
          ".avatar span strong"
        );
        userRoleElements.forEach((el) => {
          el.textContent =
            userData.role === "teacher" ? "Enseignant" : "Étudiant";
        });
      } catch (error) {
        console.error(
          "Erreur lors du traitement des données utilisateur:",
          error
        );
      }
    }
  }

  // Exécuter la fonction d'information utilisateur
  updateUserInfo();

  console.log("Configuration de la navigation terminée");
});
