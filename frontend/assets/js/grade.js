// Script pour Grade.html
$(document).ready(function () {
  // Vérifier si l'utilisateur est connecté
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  // Vérifier si l'utilisateur est connecté et est un enseignant
  if (!token || !userData || userData.role !== "teacher") {
    swal({
      title: "Erreur !",
      text: "Vous devez être connecté en tant qu'enseignant pour accéder à cette page.",
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
  $("span:contains('PROFFESSION UTILISATEUR')").text("Enseignant");

  // Vérifier si un ID d'examen est spécifié dans l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get("id");
  const submissionId = urlParams.get("submission");

  if (examId) {
    // Charger les soumissions pour cet examen
    loadSubmissionsForExam(examId);
  } else if (submissionId) {
    // Charger une soumission spécifique
    loadSingleSubmission(submissionId);
  } else {
    // Aucun examen ou soumission spécifié, charger toutes les soumissions récentes
    loadRecentSubmissions();
  }

  // Ajouter l'événement de déconnexion
  $("a:contains('Log Out')").click(function (e) {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "Connexion.html";
  });

  // Gérer les événements de notation
  setupGradingEvents();
});

// Fonction pour charger les soumissions pour un examen spécifique
function loadSubmissionsForExam(examId) {
  const token = localStorage.getItem("token");

  $.ajax({
    url: `http://localhost:5000/api/data/exam-submissions/${examId}`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: function (data) {
      if (!data || !data.submissions || data.submissions.length === 0) {
        $("#example tbody").html(
          '<tr><td colspan="7" class="text-center">Aucune soumission pour cet examen</td></tr>'
        );
        return;
      }

      // Mettre à jour le titre de la page avec le nom de l'examen
      if (data.examInfo) {
        $("h5.mb-0 strong").text(`Notes pour: ${data.examInfo.title}`);
      }

      // Remplir le tableau avec les soumissions
      populateSubmissionsTable(data.submissions);
    },
    error: function (xhr) {
      console.error("Erreur lors du chargement des soumissions:", xhr);

      // Utiliser des données fictives pour les tests
      useDemoSubmissions();
    },
  });
}

// Fonction pour charger une soumission spécifique
function loadSingleSubmission(submissionId) {
  const token = localStorage.getItem("token");

  $.ajax({
    url: `http://localhost:5000/api/data/submission/${submissionId}`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: function (data) {
      if (!data) {
        swal({
          title: "Erreur !",
          text: "Impossible de charger la soumission",
          icon: "error",
          button: "OK",
        }).then(() => {
          window.location.href = "Exam.html";
        });
        return;
      }

      // Mettre à jour le titre de la page
      $("h5.mb-0 strong").text(`Notation: ${data.examTitle}`);

      // Créer un tableau avec cette seule soumission
      const submissions = [data];
      populateSubmissionsTable(submissions);
    },
    error: function (xhr) {
      console.error("Erreur lors du chargement de la soumission:", xhr);

      // Utiliser des données fictives pour les tests
      useDemoSubmissions(true);
    },
  });
}

// Fonction pour charger toutes les soumissions récentes
function loadRecentSubmissions() {
  const token = localStorage.getItem("token");

  $.ajax({
    url: "http://localhost:5000/api/data/teacher-recent-submissions",
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: function (submissions) {
      if (!submissions || submissions.length === 0) {
        $("#example tbody").html(
          '<tr><td colspan="7" class="text-center">Aucune soumission récente</td></tr>'
        );
        return;
      }

      // Remplir le tableau avec les soumissions
      populateSubmissionsTable(submissions);
    },
    error: function (xhr) {
      console.error("Erreur lors du chargement des soumissions récentes:", xhr);

      // Utiliser des données fictives pour les tests
      useDemoSubmissions();
    },
  });
}

// Fonction pour remplir le tableau avec les soumissions
function populateSubmissionsTable(submissions) {
  let html = "";

  submissions.forEach((submission) => {
    // Formater la date de soumission
    const submissionDate = new Date(submission.submitted_at);
    const dateString = submissionDate.toLocaleDateString("fr-FR");

    // Préparer les données pour chaque ligne
    html += `
        <tr data-student-id="${submission.student_id}" data-submission-id="${
      submission.id
    }">
            <td>${submission.numCarte || "N/A"}</td>
            <td>${submission.firstName || "N/A"}</td>
            <td>${submission.lastName || "N/A"}</td>
            <td>${submission.examTitle || "N/A"}</td>
            <td>${dateString}</td>
            <td contenteditable="true" class="editable-note">${
              submission.score !== null ? submission.score : "Non noté"
            }</td>
            <td>
                <button type="button" class="btn btn-default icon-round shadow view-submission-btn" data-id="${
                  submission.id
                }" data-path="${submission.file_path}">
                    <i class="fa fa-book"></i> 
                </button>
                <button type="button" class="btn btn-success icon-round shadow auto-grade-btn" data-id="${
                  submission.id
                }">
                    <i class="fa fa-magic"></i> 
                </button>
            </td>
        </tr>
        `;
  });

  $("#example tbody").html(html);

  // Initialiser le DataTable si ce n'est pas déjà fait
  if (!$.fn.DataTable.isDataTable("#example")) {
    $("#example").DataTable({
      language: {
        url: "//cdn.datatables.net/plug-ins/1.11.5/i18n/French.json",
      },
      order: [[4, "desc"]], // Trier par date de soumission, plus récent en premier
    });
  } else {
    // Actualiser le DataTable existant
    $("#example").DataTable().draw();
  }
}

// Fonction pour configurer les événements de notation
function setupGradingEvents() {
  // Événement pour la notation manuelle (sur contenteditable)
  $(document).on("blur", ".editable-note", function () {
    const submissionId = $(this).closest("tr").data("submission-id");
    const newScore = $(this).text().trim();

    // Vérifier si la note est valide
    if (newScore === "Non noté") return;

    // Convertir la note en nombre et vérifier si c'est un nombre valide entre 0 et 20
    const scoreNum = parseFloat(newScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 20) {
      swal({
        title: "Erreur !",
        text: "La note doit être un nombre entre 0 et 20",
        icon: "error",
        button: "OK",
      });

      // Remettre l'ancienne valeur ou "Non noté"
      $(this).text($(this).attr("data-old-value") || "Non noté");
      return;
    }

    // Sauvegarder la nouvelle note
    saveGrade(submissionId, scoreNum);
  });

  // Sauvegarder l'ancienne valeur avant l'édition
  $(document).on("focus", ".editable-note", function () {
    $(this).attr("data-old-value", $(this).text().trim());
  });

  // Événement pour visualiser une soumission
  $(document).on("click", ".view-submission-btn", function () {
    const submissionId = $(this).data("id");
    const filePath = $(this).data("path");

    // Vérifier si le chemin du fichier est valide
    if (!filePath) {
      swal({
        title: "Erreur !",
        text: "Impossible de trouver le fichier de soumission",
        icon: "error",
        button: "OK",
      });
      return;
    }

    // Ouvrir le fichier dans un nouvel onglet ou télécharger
    const token = localStorage.getItem("token");
    window.open(
      `http://localhost:5000/api/data/view-submission/${submissionId}?token=${token}`,
      "_blank"
    );
  });

  // Événement pour la notation automatique
  $(document).on("click", ".auto-grade-btn", function () {
    const submissionId = $(this).data("id");

    swal({
      title: "Notation automatique",
      text: "Voulez-vous lancer la notation automatique de cette soumission?",
      icon: "info",
      buttons: {
        cancel: "Annuler",
        confirm: "Oui, noter automatiquement",
      },
      dangerMode: false,
    }).then((willAutoGrade) => {
      if (willAutoGrade) {
        autoGradeSubmission(submissionId);
      }
    });
  });
}

// Fonction pour sauvegarder une note
function saveGrade(submissionId, score) {
  const token = localStorage.getItem("token");

  // Montrer un indicateur de chargement
  const noteCell = $(`tr[data-submission-id="${submissionId}"] .editable-note`);
  const oldValue = noteCell.text();
  noteCell.html('<i class="fa fa-spinner fa-spin"></i>');

  $.ajax({
    url: "http://localhost:5000/api/data/update-grade",
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      submissionId: submissionId,
      score: score,
    }),
    success: function (response) {
      // Mettre à jour la cellule avec la nouvelle note
      noteCell.text(score);

      // Afficher une notification de succès
      toastr.success("Note mise à jour avec succès");
    },
    error: function (xhr) {
      // Remettre l'ancienne valeur
      noteCell.text(oldValue);

      // Afficher un message d'erreur
      let errorMessage = "Erreur lors de la mise à jour de la note";
      if (xhr.responseJSON && xhr.responseJSON.error) {
        errorMessage = xhr.responseJSON.error;
      }

      swal({
        title: "Erreur !",
        text: errorMessage,
        icon: "error",
        button: "OK",
      });
    },
  });
}

// Fonction pour la notation automatique
function autoGradeSubmission(submissionId) {
  const token = localStorage.getItem("token");

  // Montrer un indicateur de chargement
  const row = $(`tr[data-submission-id="${submissionId}"]`);
  const noteCell = row.find(".editable-note");
  const oldValue = noteCell.text();
  noteCell.html('<i class="fa fa-spinner fa-spin"></i>');

  // Désactiver le bouton de notation automatique
  const autoGradeBtn = row.find(".auto-grade-btn");
  autoGradeBtn.prop("disabled", true);

  $.ajax({
    url: `http://localhost:5000/api/ai/grade-submission/${submissionId}`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    success: function (response) {
      // Mettre à jour la cellule avec la note générée
      noteCell.text(response.score);

      // Réactiver le bouton
      autoGradeBtn.prop("disabled", false);

      // Afficher une notification de succès
      swal({
        title: "Notation terminée",
        text: `Note attribuée: ${response.score}/20\n\nFeedback: ${
          response.feedback || "Aucun commentaire disponible"
        }`,
        icon: "success",
        button: "OK",
      });
    },
    error: function (xhr) {
      // Remettre l'ancienne valeur
      noteCell.text(oldValue);

      // Réactiver le bouton
      autoGradeBtn.prop("disabled", false);

      // Afficher un message d'erreur
      let errorMessage = "Erreur lors de la notation automatique";
      if (xhr.responseJSON && xhr.responseJSON.error) {
        errorMessage = xhr.responseJSON.error;
      }

      swal({
        title: "Erreur !",
        text: errorMessage,
        icon: "error",
        button: "OK",
      });
    },
  });
}

// Fonction pour utiliser des données fictives pour les soumissions
function useDemoSubmissions(singleSubmission = false) {
  const demoSubmissions = [
    {
      id: 1,
      student_id: 101,
      numCarte: "20180AFRD",
      firstName: "Jean",
      lastName: "Dupont",
      examTitle: "Algorithmes et structures de données",
      submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      score: 15,
      file_path: "uploads/submission1.pdf",
    },
    {
      id: 2,
      student_id: 102,
      numCarte: "20190BCDE",
      firstName: "Marie",
      lastName: "Martin",
      examTitle: "Base de données",
      submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      score: null,
      file_path: "uploads/submission2.pdf",
    },
    {
      id: 3,
      student_id: 103,
      numCarte: "20200FGHI",
      firstName: "Pierre",
      lastName: "Dubois",
      examTitle: "Programmation Web",
      submitted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      score: 8.5,
      file_path: "uploads/submission3.pdf",
    },
  ];

  // Si on demande une seule soumission, prendre la première
  const submissions = singleSubmission ? [demoSubmissions[0]] : demoSubmissions;

  // Remplir le tableau avec les soumissions
  populateSubmissionsTable(submissions);
}
