document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const roleButtons = document.querySelectorAll(".role-btn");
  const userRoleInput = document.getElementById("userRole");
  const loginTitle = document.getElementById("loginTitle");
  const inscriptionLink = document.getElementById("inscriptionLink");
  const responseMessage = document.getElementById("responseMessage");

  // Animation GSAP pour les éléments du formulaire
  gsap.from(".input-group", {
    y: 20,
    opacity: 0,
    duration: 0.6,
    stagger: 0.2,
    delay: 0.5,
    ease: "power3.out",
  });

  gsap.from(".btn-theme", {
    y: 20,
    opacity: 0,
    duration: 0.6,
    delay: 1,
    ease: "power3.out",
  });

  // Vérifier s'il y a un message d'erreur d'authentification dans le localStorage
  const authError = localStorage.getItem("authError");
  if (authError) {
    responseMessage.style.color = "red";
    responseMessage.textContent = authError;
    // Animation pour attirer l'attention sur le message d'erreur
    gsap.from(responseMessage, {
      scale: 0.5,
      opacity: 0,
      duration: 0.5,
      ease: "back.out(1.7)",
    });
    // Supprimer le message pour ne pas l'afficher à nouveau
    localStorage.removeItem("authError");
  }

  // Gestion du changement de rôle avec animation
  roleButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // N'effectuer les changements que si le bouton n'est pas déjà actif
      if (!this.classList.contains("active")) {
        // Animer la sortie du formulaire actuel
        gsap.to(".login-box-form", {
          opacity: 0,
          y: 10,
          duration: 0.3,
          onComplete: function () {
            // Modifier le titre après la fin de l'animation de sortie
            const role = button.getAttribute("data-role");

            // Mettre à jour le titre du formulaire
            loginTitle.textContent =
              role === "teacher"
                ? "Connexion Enseignant"
                : "Connexion Étudiant";

            // Mettre à jour l'URL de redirection après inscription
            inscriptionLink.href =
              role === "teacher"
                ? "InscriptionEnseignant.html"
                : "InscriptionEtudiant.html";

            // Mettre à jour la valeur cachée du formulaire
            userRoleInput.value = role;

            // Animer l'entrée du formulaire mis à jour
            gsap.to(".login-box-form", {
              opacity: 1,
              y: 0,
              duration: 0.3,
            });
          },
        });

        // Mettre à jour les boutons de rôle
        roleButtons.forEach((btn) => {
          if (btn === button) {
            // Ajouter la classe active avec animation
            btn.classList.add("active");
            gsap.from(btn, {
              scale: 0.9,
              duration: 0.3,
              ease: "back.out(1.7)",
            });
          } else {
            // Retirer la classe active
            btn.classList.remove("active");
          }
        });
      }
    });
  });

  // Gestion de la soumission du formulaire
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault(); // Empêche le rechargement de la page

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = userRoleInput.value; // Récupérer le rôle depuis l'input caché

    // Validation avec effets visuels
    if (!email || !password) {
      responseMessage.textContent = "Veuillez remplir tous les champs";
      // Animation du message d'erreur
      gsap.from(responseMessage, {
        scale: 0.5,
        opacity: 0,
        duration: 0.5,
        ease: "back.out(1.7)",
      });

      // Animation des champs erronés
      if (!email) {
        gsap.to("#email", {
          x: [0, -10, 10, -10, 10, 0],
          duration: 0.5,
          ease: "power1.inOut",
        });
      }
      if (!password) {
        gsap.to("#password", {
          x: [0, -10, 10, -10, 10, 0],
          duration: 0.5,
          ease: "power1.inOut",
        });
      }
      return;
    }

    // Animation du bouton de connexion pendant la soumission
    const submitButton = document.querySelector(".btn-theme");
    submitButton.innerHTML =
      '<i class="fa fa-circle-notch fa-spin"></i> Connexion...';
    submitButton.disabled = true;

    try {
      // Définir l'URL en fonction du rôle
      const loginURL =
        role === "teacher"
          ? "http://localhost:5000/api/auth/login/teacher"
          : "http://localhost:5000/api/auth/login/student";

      const response = await fetch(loginURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Connexion réussie
        responseMessage.style.color = "green";
        responseMessage.textContent = "Connexion réussie !";

        // Animation de succès
        gsap.to(".login-card", {
          boxShadow: "0 0 30px rgba(0,255,0,0.3)",
          duration: 0.5,
        });

        // Stocker le token et les informations utilisateur dans le localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("userRole", role);

        // Afficher le message de succès avec SweetAlert
        setTimeout(() => {
          swal({
            title: "Connexion réussie!",
            text: `Bienvenue, ${data.user.firstName}!`,
            icon: "success",
            button: "OK",
          }).then(() => {
            // Animation de sortie avant redirection
            gsap.to(".login-box", {
              y: -30,
              opacity: 0,
              duration: 0.5,
              onComplete: () => {
                // Rediriger l'utilisateur vers le dashboard approprié
                if (role === "teacher") {
                  window.location.href = "dashboardEnseignant.html";
                } else {
                  window.location.href = "dashboardEtudiant.html"; // Ou votre page pour les étudiants
                }
              },
            });
          });
        }, 500);
      } else {
        // Erreur de connexion
        submitButton.innerHTML =
          '<i class="fa fa-sign-in-alt mr-2"></i>Se connecter';
        submitButton.disabled = false;

        responseMessage.style.color = "red";
        responseMessage.textContent =
          data.error || "Erreur lors de la connexion.";

        // Animation d'erreur
        gsap.to(".login-card", {
          x: [0, -10, 10, -10, 10, 0],
          duration: 0.5,
          ease: "power1.inOut",
        });

        gsap.from(responseMessage, {
          scale: 0.5,
          opacity: 0,
          duration: 0.5,
          ease: "back.out(1.7)",
        });
      }
    } catch (error) {
      submitButton.innerHTML =
        '<i class="fa fa-sign-in-alt mr-2"></i>Se connecter';
      submitButton.disabled = false;

      responseMessage.style.color = "red";
      responseMessage.textContent = "Erreur de connexion au serveur.";
      console.error("Erreur:", error);

      // Animation d'erreur
      gsap.to(".login-card", {
        x: [0, -10, 10, -10, 10, 0],
        duration: 0.5,
        ease: "power1.inOut",
      });
    }
  });

  // Effet de hover sur les champs du formulaire
  const formElements = document.querySelectorAll(".input-group");
  formElements.forEach((element) => {
    element.addEventListener("mouseenter", function () {
      gsap.to(this, {
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out",
      });
    });

    element.addEventListener("mouseleave", function () {
      gsap.to(this, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    });
  });
});
