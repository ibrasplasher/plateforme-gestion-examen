// Script pour RendreExamen.html
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
  $("p:contains('Jonathan Clarke')").text(
    userData.firstName + " " + userData.lastName
  );

  // Charger la liste des examens disponibles
  loadAvailableExams();

  // Gérer l'événement de soumission de fichier
  setupFileUpload();

  // Ajouter l'événement de déconnexion
  $("a:contains('Log Out')").click(function (e) {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "Connexion.html";
  });
});

// Fonction pour charger les examens disponibles pour l'étudiant
function loadAvailableExams() {
  const token = localStorage.getItem("token");

  $.ajax({
    url: "http://localhost:5000/api/data/student-available-exams",
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: function (exams) {
      if (!exams || exams.length === 0) {
        // Aucun examen disponible
        $("#examTable tbody").html(
          '<tr><td colspan="6" class="text-center">Aucun examen disponible</td></tr>'
        );
        return;
      }

      // Remplir le tableau avec les examens
      let html = "";
      exams.forEach((exam) => {
        // Formater la date et l'heure
        const deadline = new Date(exam.deadline);
        const dateString = deadline.toLocaleDateString("fr-FR");
        const timeString = deadline.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        // Déterminer si l'examen a déjà été soumis
        const isSubmitted = exam.isSubmitted;
        const buttonDisabled = isSubmitted ? "disabled" : "";
        const buttonTitle = isSubmitted
          ? "Déjà soumis"
          : "Soumettre une réponse";

        html += `
                <tr data-exam-id="${exam.id}">
                    <td>${exam.title}</td>
                    <td>${exam.type || "Non spécifié"}</td>
                    <td>${exam.description || "Aucune description"}</td>
                    <td>${dateString}</td>
                    <td>${timeString}</td>
                    <td>
                        <button class="btn btn-outline-danger btn-sm1 download-exam-btn" data-exam-id="${
                          exam.id
                        }" aria-label="Télécharger sujet">
                            <i class="fa fa-cloud-download"></i>
                        </button>
                        <button class="btn btn-outline-success btn-sm1 submit-exam-btn ${buttonDisabled}" data-exam-id="${
          exam.id
        }" data-toggle="modal" data-target="#orderInfo" aria-label="${buttonTitle}">
                            <i class="fa fa-cloud-upload"></i>
                        </button>
                    </td>
                </tr>
                `;
      });

      $("#examTable tbody").html(html);

      // Initialiser le DataTable
      if ($.fn.DataTable.isDataTable("#examTable")) {
        $("#examTable").DataTable().destroy();
      }

      $("#examTable").DataTable({
        language: {
          url: "//cdn.datatables.net/plug-ins/1.11.5/i18n/French.json",
        },
      });

      // Ajouter les événements aux boutons
      addButtonEvents();
    },
    error: function (xhr) {
      console.error("Erreur lors du chargement des examens:", xhr);

      // Utiliser des données fictives pour les tests
      useDemoExams();
    },
  });
}

// Fonction pour ajouter les événements aux boutons
function addButtonEvents() {
  // Télécharger le sujet d'examen
  $(".download-exam-btn").click(function () {
    const examId = $(this).data("exam-id");
    downloadExam(examId);
  });

  // Préparer la soumission d'examen
  $(".submit-exam-btn").click(function () {
    if ($(this).hasClass("disabled")) return;

    const examId = $(this).data("exam-id");
    // Stocker l'ID de l'examen dans le formulaire de soumission
    $("#file").data("exam-id", examId);
  });
}

// Fonction pour télécharger le sujet d'examen
function downloadExam(examId) {
  const token = localStorage.getItem("token");

  // Rediriger vers l'URL de téléchargement
  window.location.href = `http://localhost:5000/api/data/download-exam/${examId}?token=${token}`;
}

// Fonction pour configurer l'upload de fichier
function setupFileUpload() {
  // Gérer l'événement de clic sur le bouton de sélection de fichier
  $(".select-image").click(function (e) {
    e.preventDefault();
    const examId = $("#file").data("exam-id");

    if (!examId) {
      swal({
        title: "Erreur !",
        text: "Aucun examen sélectionné",
        icon: "error",
        button: "OK",
      });
      return;
    }

    const fileInput = $("#file")[0];
    if (!fileInput.files || fileInput.files.length === 0) {
      swal({
        title: "Erreur !",
        text: "Veuillez sélectionner un fichier",
        icon: "error",
        button: "OK",
      });
      return;
    }

    // Créer un FormData et ajouter le fichier
    const formData = new FormData();
    formData.append("submissionFile", fileInput.files[0]);
    formData.append("examId", examId);

    // Envoyer la requête
    const token = localStorage.getItem("token");

    $.ajax({
      url: "http://localhost:5000/api/data/submit-exam",
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: formData,
      processData: false,
      contentType: false,
      beforeSend: function () {
        // Afficher un indicateur de chargement
        $(".select-image").prop("disabled", true).text("Envoi en cours...");
      },
      success: function (response) {
        // Fermer le modal
        $("#orderInfo").modal("hide");

        // Réinitialiser le formulaire
        $("#file").val("").data("exam-id", "");
        $(".select-image").prop("disabled", false).text("Upload File");

        // Afficher un message de succès
        swal({
          title: "Succès !",
          text: "Votre réponse a été soumise avec succès",
          icon: "success",
          button: "OK",
        }).then(() => {
          // Recharger la liste des examens
          loadAvailableExams();
        });
      },
      error: function (xhr) {
        // Réinitialiser le bouton
        $(".select-image").prop("disabled", false).text("Upload File");

        // Afficher un message d'erreur
        let errorMessage = "Une erreur est survenue lors de la soumission";
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
  });
}

// Fonction pour utiliser des données fictives pour les examens
function useDemoExams() {
  const demoExams = [
    {
      id: 1,
      title: "Examen de Mathématiques",
      type: "Contrôle Continu",
      description: "Évaluation semestrielle",
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      isSubmitted: false,
    },
    {
      id: 2,
      title: "TP Programmation Web",
      type: "Travaux Pratiques",
      description: "Développement d'une application web",
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      isSubmitted: true,
    },
    {
      id: 3,
      title: "Examen Base de Données",
      type: "Examen Final",
      description: "SQL et NoSQL",
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      isSubmitted: false,
    },
  ];

  let html = "";
  demoExams.forEach((exam) => {
    // Formater la date et l'heure
    const dateString = exam.deadline.toLocaleDateString("fr-FR");
    const timeString = exam.deadline.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Déterminer si l'examen a déjà été soumis
    const buttonDisabled = exam.isSubmitted ? "disabled" : "";
    const buttonTitle = exam.isSubmitted
      ? "Déjà soumis"
      : "Soumettre une réponse";

    html += `
        <tr data-exam-id="${exam.id}">
            <td>${exam.title}</td>
            <td>${exam.type}</td>
            <td>${exam.description}</td>
            <td>${dateString}</td>
            <td>${timeString}</td>
            <td>
                <button class="btn btn-outline-danger btn-sm1 download-exam-btn" data-exam-id="${exam.id}" aria-label="Télécharger sujet">
                    <i class="fa fa-cloud-download"></i>
                </button>
                <button class="btn btn-outline-success btn-sm1 submit-exam-btn ${buttonDisabled}" data-exam-id="${exam.id}" data-toggle="modal" data-target="#orderInfo" aria-label="${buttonTitle}">
                    <i class="fa fa-cloud-upload"></i>
                </button>
            </td>
        </tr>
        `;
  });

  $("#examTable tbody").html(html);

  // Initialiser le DataTable
  if ($.fn.DataTable.isDataTable("#examTable")) {
    $("#examTable").DataTable().destroy();
  }

  $("#examTable").DataTable({
    language: {
      url: "//cdn.datatables.net/plug-ins/1.11.5/i18n/French.json",
    },
  });

  // Ajouter les événements aux boutons
  addButtonEvents();
}
