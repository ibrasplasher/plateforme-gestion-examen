// Script pour ConsulterNote.html
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

  // Charger les notes de l'étudiant
  loadStudentGrades();

  // Ajouter l'événement de déconnexion
  $("a:contains('Log Out')").click(function (e) {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "Connexion.html";
  });
});

// Fonction pour charger les notes de l'étudiant
function loadStudentGrades() {
  const token = localStorage.getItem("token");

  $.ajax({
    url: "http://localhost:5000/api/data/student-grades",
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: function (grades) {
      if (!grades || grades.length === 0) {
        // Aucune note disponible
        $("#project_table tbody").html(
          '<tr><td colspan="5" class="text-center">Aucune note disponible</td></tr>'
        );
        return;
      }

      // Remplir le tableau avec les notes
      let html = "";
      grades.forEach((grade) => {
        // Déterminer le statut basé sur la note
        let status = "";
        let statusClass = "";

        if (grade.score === null) {
          status = "En attente";
          statusClass = "badge-warning";
        } else if (grade.score >= 10) {
          status = "Réussi";
          statusClass = "badge-success";
        } else {
          status = "Échec";
          statusClass = "badge-danger";
        }

        // Formater la date
        const submissionDate = grade.submitted_at
          ? new Date(grade.submitted_at)
          : null;
        const dateString = submissionDate
          ? submissionDate.toLocaleDateString("fr-FR")
          : "N/A";

        html += `
                <tr>
                    <td>${grade.subjectName || "N/A"}</td>
                    <td>${grade.examTitle || "N/A"}</td>
                    <td>${dateString}</td>
                    <td>${grade.score !== null ? grade.score : "Non noté"}</td>
                    <td><span class="badge ${statusClass}">${status}</span></td>
                </tr>
                `;
      });

      $("#project_table tbody").html(html);

      // Initialiser le DataTable si ce n'est pas déjà fait
      if (!$.fn.DataTable.isDataTable("#project_table")) {
        $("#project_table").DataTable({
          language: {
            url: "//cdn.datatables.net/plug-ins/1.11.5/i18n/French.json",
          },
          order: [[2, "desc"]], // Trier par date de soumission, plus récent en premier
        });
      } else {
        // Actualiser le DataTable existant
        $("#project_table").DataTable().draw();
      }
    },
    error: function (xhr) {
      console.error("Erreur lors du chargement des notes:", xhr);

      // Utiliser des données fictives pour les tests
      useDemoGrades();
    },
  });
}

// Fonction pour utiliser des données fictives pour les notes
function useDemoGrades() {
  const demoGrades = [
    {
      subjectName: "HTML/CSS",
      examTitle: "Web design",
      submitted_at: "2024-02-13",
      score: 10,
      status: "Complete",
    },
    {
      subjectName: "Java",
      examTitle: "App development",
      submitted_at: "2024-07-03",
      score: 18,
      status: "Pending",
    },
    {
      subjectName: "PPP",
      examTitle: "App prototyping",
      submitted_at: "2024-01-31",
      score: 2,
      status: "Suspended",
    },
  ];

  let html = "";
  demoGrades.forEach((grade) => {
    // Déterminer le statut basé sur le champ status
    let statusClass = "";
    switch (grade.status) {
      case "Complete":
        statusClass = "badge-success";
        break;
      case "Pending":
        statusClass = "badge-warning";
        break;
      case "Suspended":
        statusClass = "badge-danger";
        break;
      default:
        statusClass = "badge-secondary";
    }

    // Formater la date
    const submissionDate = new Date(grade.submitted_at);
    const dateString = submissionDate.toLocaleDateString("fr-FR");

    html += `
        <tr>
            <td>${grade.subjectName}</td>
            <td>${grade.examTitle}</td>
            <td>${dateString}</td>
            <td>${grade.score}</td>
            <td><span class="badge ${statusClass}">${grade.status}</span></td>
        </tr>
        `;
  });

  $("#project_table tbody").html(html);

  // Initialiser le DataTable si ce n'est pas déjà fait
  if (!$.fn.DataTable.isDataTable("#project_table")) {
    $("#project_table").DataTable({
      language: {
        url: "//cdn.datatables.net/plug-ins/1.11.5/i18n/French.json",
      },
    });
  } else {
    // Actualiser le DataTable existant
    $("#project_table").DataTable().draw();
  }
}
