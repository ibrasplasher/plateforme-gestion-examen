// Script pour dashboardEtudiant.html
$(document).ready(function () {
  // Vérifier si l'utilisateur est connecté
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  // Vérifier si l'utilisateur est connecté et est un étudiant
  if (!token || !userData || userData.role !== "student") {
    swal({
      title: "Erreur !",
      text: "Vous devez être connecté en tant qu'étudiant pour accéder à cette page.",
      icon: "error",
      button: "OK",
    }).then(() => {
      window.location.href = "Connexion.html";
    });
    return;
  }

  // Mettre à jour les informations de l'utilisateur dans l'interface
  $("p:contains('NOM UTILISATEUR')").text(
    userData.firstName + " " + userData.lastName
  );
  // Si le nom est dans un autre élément, adaptez la ligne suivante
  // $("#user-name").text(userData.firstName + " " + userData.lastName);

  // Charger les statistiques
  loadStudentStats();

  // Charger les évaluations à venir
  loadUpcomingExams();

  // Ajouter l'événement de déconnexion
  $("a:contains('Log Out')").click(function (e) {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "Connexion.html";
  });
});

// Fonction pour charger les statistiques de l'étudiant
function loadStudentStats() {
  const token = localStorage.getItem("token");

  // Requête pour obtenir les statistiques
  $.ajax({
    url: "http://localhost:5000/api/data/student-statistics",
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: function (data) {
      // Mise à jour des métriques
      updateMetrics(data);

      // Mise à jour des graphiques
      updateCharts(data);
    },
    error: function (xhr) {
      console.error("Erreur lors du chargement des statistiques:", xhr);
      // Utiliser des données fictives pour les tests
      useDemoData();
    },
  });
}

// Fonction pour mettre à jour les métriques
function updateMetrics(data) {
  // Exemple de mise à jour des métriques (adaptez selon vos données réelles)
  if (!data) return;

  // Meilleure note
  $(".col-lg-4:nth-child(1) .mt-0.mb-0 strong").text(data.bestGrade || "N/A");
  $(".col-lg-4:nth-child(1) .text-muted.bc-description").text(
    data.bestCourse || "Aucun cours"
  );

  // Pire note
  $(".col-lg-4:nth-child(2) .mt-0.mb-0 strong").text(data.worstGrade || "N/A");
  $(".col-lg-4:nth-child(2) .text-muted.bc-description").text(
    data.worstCourse || "Aucun cours"
  );

  // Taux de réussite
  $(".col-lg-4:nth-child(3) .mt-0.mb-0 strong").text(
    data.successRate ? data.successRate + "%" : "N/A"
  );
}

// Fonction pour mettre à jour les graphiques
function updateCharts(data) {
  // Mise à jour du graphique d'évolution (si disponible)
  if (data && data.progressData) {
    if (typeof areaChart !== "undefined" && areaChart) {
      // Si le graphique existe déjà, mettez à jour ses données
      updateAreaChart(data.progressData);
    }
  }

  // Mise à jour du graphique en donut (si disponible)
  if (data && data.distributionData) {
    // Adaptez selon votre implémentation spécifique
    updateDonutChart(data.distributionData);
  }
}

// Fonction pour charger les évaluations à venir
function loadUpcomingExams() {
  const token = localStorage.getItem("token");

  $.ajax({
    url: "http://localhost:5000/api/data/student-exams",
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: function (data) {
      if (!data || data.length === 0) {
        $("#project_table tbody").html(
          '<tr><td colspan="3" class="text-center">Aucune évaluation à venir</td></tr>'
        );
        return;
      }

      let html = "";
      data.forEach((exam) => {
        const date = new Date(exam.deadline);
        const formattedDate = date.toLocaleDateString("fr-FR");

        html += `
                <tr>
                    <td>${exam.subjectName || "N/A"}</td>
                    <td>${exam.title || "N/A"}</td>
                    <td>${formattedDate}</td>
                </tr>
                `;
      });

      $("#project_table tbody").html(html);
    },
    error: function (xhr) {
      console.error("Erreur lors du chargement des évaluations:", xhr);
      // Utiliser des données fictives pour les tests
      useDemoExams();
    },
  });
}

// Fonction pour utiliser des données fictives pour les statistiques
function useDemoData() {
  const demoData = {
    bestGrade: "18",
    bestCourse: "Algorithmes",
    worstGrade: "12",
    worstCourse: "Base de données",
    successRate: "85",
    progressData: [65, 59, 80, 81, 56, 55, 40],
    distributionData: {
      completed: 70,
      pending: 20,
      upcoming: 10,
    },
  };

  updateMetrics(demoData);
  updateCharts(demoData);
}

// Fonction pour utiliser des données fictives pour les évaluations
function useDemoExams() {
  const demoExams = [
    {
      subjectName: "Algorithmes",
      title: "Contrôle Continu",
      deadline: new Date(),
    },
    {
      subjectName: "Base de données",
      title: "Examen Final",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      subjectName: "Programmation Web",
      title: "TP Noté",
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  ];

  let html = "";
  demoExams.forEach((exam) => {
    const formattedDate = exam.deadline.toLocaleDateString("fr-FR");

    html += `
        <tr>
            <td>${exam.subjectName}</td>
            <td>${exam.title}</td>
            <td>${formattedDate}</td>
        </tr>
        `;
  });

  $("#project_table tbody").html(html);
}
