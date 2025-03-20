document.addEventListener("DOMContentLoaded", function () {
  console.log("Chargement du script dashboard-profile.js avec débogage");

  // Récupérer les informations de l'utilisateur connecté depuis localStorage
  const token = localStorage.getItem("token");
  const userDataStr = localStorage.getItem("user");

  if (!token || !userDataStr) {
    console.log(
      "Utilisateur non connecté, redirection vers la page de connexion"
    );
    window.location.href = "Connexion.html";
    return;
  }

  try {
    // Extraire les informations de l'utilisateur
    const userData = JSON.parse(userDataStr);
    console.log("Données utilisateur trouvées:", userData);

    // Mettre à jour le nom d'utilisateur dans la sidebar
    const userNameElements = document.querySelectorAll(".avatar p strong");
    userNameElements.forEach((el) => {
      el.textContent = `${userData.firstName} ${userData.lastName}`;
    });

    // Mettre à jour la profession utilisateur
    const userRoleElements = document.querySelectorAll(".avatar span strong");
    userRoleElements.forEach((el) => {
      el.textContent = userData.role === "teacher" ? "Enseignant" : "Étudiant";
    });

    // Récupérer la photo de profil
    console.log("Récupération de la photo de profil...");
    fetch("http://localhost:5000/api/profile/get-photo", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        console.log("Réponse reçue:", response.status);
        if (!response.ok) {
          throw new Error(
            "Erreur lors de la récupération de la photo de profil"
          );
        }
        return response.json();
      })
      .then((data) => {
        console.log("Photo de profil récupérée:", data);
        const photoPath = data.photoPath;
        console.log("Chemin de photo:", photoPath);

        // Mettre à jour l'image de profil
        const profileImages = document.querySelectorAll(".avatar img");
        console.log(
          "Nombre d'images de profil trouvées:",
          profileImages.length
        );

        profileImages.forEach((img, index) => {
          console.log(`Traitement de l'image ${index + 1}...`);

          // SOLUTION CORRIGÉE: utiliser l'URL complète du backend
          if (photoPath && photoPath.startsWith("assets/img/")) {
            const fullImageUrl = `http://localhost:5000/${photoPath}`;
            console.log(`Définition de src à: ${fullImageUrl}`);
            img.src = fullImageUrl;
          } else {
            console.log("Utilisation de l'image par défaut");
            img.src = "assets/img/default-avatar.jpg";
          }

          // Ajouter un gestionnaire d'erreur au cas où l'image ne peut pas être chargée
          img.onerror = function () {
            console.log("Image non trouvée, utilisation de l'image par défaut");
            this.src = "assets/img/default-avatar.jpg";
          };
        });
      })
      .catch((error) => {
        console.error("Erreur:", error);
        // En cas d'erreur, afficher l'image par défaut
        const profileImages = document.querySelectorAll(".avatar img");
        profileImages.forEach((img) => {
          img.src = "assets/img/default-avatar.jpg";
        });
      });
  } catch (error) {
    console.error("Erreur lors du traitement des données utilisateur:", error);
  }
});
