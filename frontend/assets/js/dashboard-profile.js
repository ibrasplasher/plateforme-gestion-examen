document.addEventListener("DOMContentLoaded", function () {
  console.log("Chargement du script dashboard-profile.js");

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
    fetch("http://localhost:5000/api/profile/get-photo", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Erreur lors de la récupération de la photo de profil"
          );
        }
        return response.json();
      })
      .then((data) => {
        console.log("Photo de profil récupérée:", data);

        // Mettre à jour l'image de profil
        const profileImages = document.querySelectorAll(".avatar img");
        profileImages.forEach((img) => {
          const photoPath = data.photoPath;

          // Utiliser directement l'image par défaut pour simplifier
          if (
            photoPath.includes("defaultPicture.jpg") ||
            photoPath.startsWith("../")
          ) {
            img.src = "assets/img/default-avatar.jpg";
          }
          // Si c'est une photo personnalisée et que le chemin ne commence pas par ../
          else if (photoPath && !photoPath.startsWith("../")) {
            // Si le chemin commence déjà par "profiles/"
            if (photoPath.startsWith("profiles/")) {
              img.src = photoPath;
            } else {
              // Sinon ajouter le préfixe
              img.src = `profiles/${photoPath}`;
            }
          }
          // Dans tous les autres cas, utiliser l'image par défaut
          else {
            img.src = "assets/img/default-avatar.jpg";
          }

          // Ajouter un gestionnaire d'erreur au cas où l'image ne peut pas être chargée
          img.onerror = function () {
            console.log(
              "Erreur de chargement de l'image, utilisation de l'image par défaut"
            );
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
