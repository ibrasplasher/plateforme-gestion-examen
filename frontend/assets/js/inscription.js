document.addEventListener("DOMContentLoaded", function () {
  console.log(
    "Document chargé - Initialisation du script d'inscription étudiant"
  );

  // Charger les classes au chargement de la page
  loadClasses();

  const form = document.querySelector("form"); // Sélectionne le formulaire
  form.addEventListener("submit", async function (event) {
    event.preventDefault(); // Empêche le rechargement de la page

    // Récupérer les valeurs des champs du formulaire
    const numCarte = document.querySelector(
      'input[aria-label="cardNumber"]'
    ).value;
    const firstName = document.querySelector(
      'input[aria-label="FirstName"]'
    ).value;
    const lastName = document.querySelector(
      'input[aria-label="LastName"]'
    ).value;
    const email = document.querySelector('input[aria-label="email"]').value;
    const password = document.querySelector(
      'input[aria-label="Password"]'
    ).value;
    const confirmPassword = document.querySelector(
      'input[aria-label="Confirme Password"]'
    ).value;
    const classId = document.getElementById("class").value;

    // Vérifier si tous les champs sont remplis, y compris la classe
    if (
      !numCarte ||
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !classId
    ) {
      alert("Veuillez remplir tous les champs, y compris la classe !");
      return;
    }

    // Vérifier si les mots de passe correspondent
    if (password !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas !");
      return;
    }

    // Objet contenant les données
    const userData = {
      numCarte,
      firstName,
      lastName,
      email,
      password,
      classId, // Ajout de la classe sélectionnée
    };

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register/student",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      const contentType = response.headers.get("Content-Type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json(); // Si la réponse est un JSON
      } else {
        data = await response.text(); // Sinon, récupérer la réponse sous forme de texte brut
      }

      if (response.ok) {
        alert("Inscription réussie !");
        window.location.href = "Connexion.html"; // Redirection vers la page de connexion
      } else {
        // Loguer le message d'erreur du serveur
        console.error("Erreur du serveur:", data);
        if (data.errors && Array.isArray(data.errors)) {
          // Afficher les erreurs de validation
          const errorMessages = data.errors.map((err) => err.msg).join("\n");
          alert("Erreurs de validation:\n" + errorMessages);
        } else {
          // Afficher l'erreur générale
          alert("Erreur : " + (data.error || "Erreur inconnue"));
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error);
      alert("Une erreur s'est produite. Veuillez réessayer. " + error.message);
    }
  });
});

// Fonction pour charger les classes depuis le serveur
function loadClasses() {
  console.log("Chargement des classes...");
  fetch("http://localhost:5000/api/data/classes")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des classes");
      }
      return response.json();
    })
    .then((classes) => {
      console.log("Classes reçues:", classes);
      const classSelect = document.getElementById("class");

      // Vérifier que l'élément existe
      if (!classSelect) {
        console.error(
          "Le champ de sélection de classe n'existe pas dans le DOM"
        );
        return;
      }

      // Ajouter les options de classe
      classes.forEach((cls) => {
        const option = document.createElement("option");
        option.value = cls.id;
        option.textContent = cls.className;
        classSelect.appendChild(option);
      });
    })
    .catch((error) => {
      console.error("Erreur lors du chargement des classes:", error);
    });
}
