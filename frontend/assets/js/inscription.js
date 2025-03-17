document.addEventListener("DOMContentLoaded", function () {
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

    // Vérifier si les mots de passe correspondent
    if (password !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas !");
      return;
    }

    // AJOUTEZ CE CODE ICI - Solution 4
    // Vérifier que le numéro de carte est bien un nombre

    // Objet contenant les données
    const userData = {
      numCarte, // Garde le format texte
      firstName,
      lastName,
      email,
      password,
    };

    // Le reste du code reste inchangé...

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
