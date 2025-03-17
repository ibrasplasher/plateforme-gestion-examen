document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault(); // Empêche le rechargement de la page

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const responseMessage = document.getElementById("responseMessage");

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login/student",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Connexion réussie
        responseMessage.style.color = "green";
        responseMessage.textContent = "Connexion réussie !";

        // Stocker le token dans le localStorage
        localStorage.setItem("token", data.token);

        // Rediriger l'utilisateur vers une autre page (ex: dashboard)
        window.location.href = "dashboard.html";
      } else {
        // Erreur de connexion
        responseMessage.style.color = "red";
        responseMessage.textContent =
          data.error || "Erreur lors de la connexion.";
      }
    } catch (error) {
      responseMessage.style.color = "red";
      responseMessage.textContent = "Erreur de connexion au serveur.";
    }
  });
});
