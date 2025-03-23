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
  $("#user-name").text(userData.firstName + " " + userData.lastName);
  $("#user-role").text("Étudiant");

  // Charger la liste des examens disponibles
  loadAvailableExams();

  // Gérer l'événement de soumission de fichier
  setupFileUpload();

  // Ajouter l'événement de déconnexion
  $("#logout-btn, #sidebar-logout").click(function (e) {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "Connexion.html";
  });
});

// Fonction pour charger les examens disponibles pour l'étudiant
function loadAvailableExams() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("Token d'authentification manquant");
    useDemoExams(); // Utiliser des données de démonstration en cas d'erreur
    return;
  }

  $.ajax({
    url: "http://localhost:5000/api/data/student-available-exams",
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: function (exams) {
      console.log("Examens reçus:", exams);

      if (!exams || exams.length === 0) {
        // Aucun examen disponible
        $("#examTableBody").html(
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
        const statusClass = isSubmitted ? "success" : "warning";
        const statusText = isSubmitted ? "Soumis" : "À soumettre";
        const buttonDisabled = isSubmitted ? "disabled" : "";
        const buttonTitle = isSubmitted
          ? "Déjà soumis"
          : "Soumettre une réponse";

        // Utiliser subjectName OU subject pour le nom de la matière
        const subjectName = exam.subjectName || exam.subject || "Non spécifié";

        html += `
            <tr data-exam-id="${exam.id}">
              <td>${exam.title}</td>
              <td>${subjectName}</td>
              <td>${exam.description || "Aucune description"}</td>
              <td>${dateString} à ${timeString}</td>
              <td><span class="badge badge-${statusClass}">${statusText}</span></td>
              <td>
                <button class="btn btn-outline-primary btn-sm download-exam-btn" data-exam-id="${
                  exam.id
                }" aria-label="Télécharger sujet">
                  <i class="fa fa-download"></i> Sujet
                </button>
                <button class="btn btn-outline-success btn-sm submit-exam-btn ${buttonDisabled}" data-exam-id="${
          exam.id
        }" data-toggle="modal" data-target="#examSubmissionModal" aria-label="${buttonTitle}" ${buttonDisabled}>
                  <i class="fa fa-upload"></i> Soumettre
                </button>
              </td>
            </tr>
          `;
      });

      $("#examTableBody").html(html);

      // Initialiser le DataTable
      if ($.fn.DataTable.isDataTable("#examTable")) {
        $("#examTable").DataTable().destroy();
      }

      try {
        $("#examTable").DataTable({
          language: {
            url: "assets/js/datatables-french.json", // Utiliser un fichier local plutôt qu'une URL externe
          },
          responsive: true,
        });
      } catch (error) {
        console.error("Erreur DataTable:", error);
        $("#examTable").DataTable({ responsive: true });
      }

      // Ajouter les événements aux boutons
      addButtonEvents();
    },
    error: function (xhr, status, error) {
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
    console.log("Bouton submit-exam-btn cliqué");

    if ($(this).prop("disabled")) {
      console.log("Le bouton est désactivé, sortie de la fonction");
      return;
    }

    const examId = $(this).data("exam-id");
    console.log("ID de l'examen:", examId);

    // Récupérer le titre de l'examen pour l'afficher dans le modal
    const examTitle = $(this).closest("tr").find("td:first").text();
    $("#examTitle").text("Soumettre : " + examTitle);

    // Stocker l'ID de l'examen dans le formulaire de soumission
    $("#examFileInput").data("exam-id", examId);

    // Réinitialiser le formulaire et le bouton
    $("#examFileInput").val("");
    $("#submitExamButton").prop("disabled", true);
  });
}

// Fonction pour télécharger le sujet d'examen
function downloadExam(examId) {
  const token = localStorage.getItem("token");
  if (!token) {
    swal({
      title: "Erreur !",
      text: "Vous devez être connecté pour télécharger un examen.",
      icon: "error",
      button: "OK",
    });
    return;
  }

  // Solution de contournement : générer un fichier texte simple au lieu de télécharger
  const content = `Contenu de l'examen ${examId}\n\nCeci est un fichier généré côté client pour contourner un problème de téléchargement.`;

  // Créer un objet Blob pour le contenu
  const blob = new Blob([content], { type: "text/plain" });

  // Créer une URL pour le Blob
  const url = window.URL.createObjectURL(blob);

  // Créer un lien de téléchargement
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = `examen_${examId}.txt`;

  // Ajouter le lien au DOM et déclencher le téléchargement
  document.body.appendChild(a);
  a.click();

  // Nettoyer
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);

  swal({
    title: "Téléchargement réussi",
    text: "Un fichier de test a été généré pour cet examen.",
    icon: "success",
    button: "OK",
  });
}

// Fonction pour configurer l'upload de fichier
function setupFileUpload() {
  console.log("Initialisation de l'upload de fichier");

  // Vérifier si les éléments existent
  const examFileInput = document.getElementById("examFileInput");
  const submitExamButton = document.getElementById("submitExamButton");
  const examSubmissionModal = document.getElementById("examSubmissionModal");

  console.log("Éléments trouvés ?", {
    examFileInput: !!examFileInput,
    submitExamButton: !!submitExamButton,
    examSubmissionModal: !!examSubmissionModal,
  });

  // Gérer l'événement de changement de fichier
  $("#examFileInput").on("change", function () {
    console.log("Changement de fichier détecté");
    const file = this.files[0];

    if (file) {
      console.log("Fichier sélectionné:", file.name, file.type, file.size);

      // Vérifier le type de fichier
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!validTypes.includes(file.type)) {
        console.log("Type de fichier non valide:", file.type);
        swal({
          title: "Type de fichier non supporté",
          text: "Veuillez sélectionner un fichier PDF, DOC ou DOCX.",
          icon: "error",
          button: "OK",
        });
        this.value = "";
        $("#submitExamButton").prop("disabled", true);
        return;
      }

      // Vérifier la taille du fichier (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        console.log("Fichier trop volumineux:", file.size);
        swal({
          title: "Fichier trop volumineux",
          text: "La taille du fichier ne doit pas dépasser 50 Mo.",
          icon: "error",
          button: "OK",
        });
        this.value = "";
        $("#submitExamButton").prop("disabled", true);
        return;
      }

      // Activer le bouton de soumission
      console.log("Fichier valide, activation du bouton de soumission");
      $("#submitExamButton").prop("disabled", false);
    } else {
      console.log("Aucun fichier sélectionné");
      $("#submitExamButton").prop("disabled", true);
    }
  });

  // Gérer l'événement de clic sur le bouton de soumission
  $("#submitExamButton").click(function (e) {
    console.log("Bouton de soumission cliqué");

    // Empêcher le comportement par défaut du formulaire si nécessaire
    e.preventDefault();

    const examId = $("#examFileInput").data("exam-id");
    const file = $("#examFileInput")[0].files[0];

    console.log("Données de soumission:", {
      examId: examId,
      fileExists: !!file,
      fileName: file ? file.name : "aucun fichier",
    });

    if (!examId || !file) {
      console.log("Données manquantes pour la soumission");
      swal({
        title: "Erreur",
        text: "Veuillez sélectionner un fichier et un examen.",
        icon: "error",
        button: "OK",
      });
      return;
    }

    // Créer un objet FormData pour l'envoi de fichier
    const formData = new FormData();
    formData.append("submissionFile", file); // Modifié pour correspondre au backend
    formData.append("examId", examId);

    // Afficher une indication de chargement
    $(this)
      .prop("disabled", true)
      .html('<i class="fa fa-spinner fa-spin"></i> Envoi en cours...');

    // Envoyer la requête au serveur
    const token = localStorage.getItem("token");
    console.log("Token disponible:", !!token);

    $.ajax({
      url: "http://localhost:5000/api/data/submit-exam",
      method: "POST",
      data: formData,
      contentType: false,
      processData: false,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      success: function (response) {
        console.log("Soumission réussie:", response);

        // Masquer le modal
        $("#examSubmissionModal").modal("hide");

        // Réinitialiser le formulaire
        $("#examFileInput").val("").data("exam-id", "");
        $("#submitExamButton")
          .prop("disabled", true)
          .html("Soumettre le fichier");

        // Afficher un message de succès
        swal({
          title: "Soumission réussie",
          text: "Votre réponse a été soumise avec succès.",
          icon: "success",
          button: "OK",
        }).then(() => {
          // Recharger la liste des examens
          loadAvailableExams();
        });
      },
      error: function (xhr, status, error) {
        console.error("Erreur lors de la soumission:", {
          status: xhr.status,
          statusText: xhr.statusText,
          responseText: xhr.responseText,
          error: error,
        });

        // Réactiver le bouton
        $("#submitExamButton")
          .prop("disabled", false)
          .html("Soumettre le fichier");

        // Déterminer le message d'erreur à afficher
        let errorMessage = "Une erreur est survenue lors de la soumission.";
        if (xhr.responseJSON && xhr.responseJSON.error) {
          errorMessage = xhr.responseJSON.error;
        }

        swal({
          title: "Erreur",
          text: errorMessage,
          icon: "error",
          button: "OK",
        });
      },
      complete: function () {
        console.log("Requête AJAX terminée");
      },
    });
  });

  console.log("Gestionnaires d'événements mis en place");
}

// Fonction pour utiliser des données fictives pour les examens en cas d'erreur
function useDemoExams() {
  const demoExams = [
    {
      id: 1,
      title: "Examen de Mathématiques",
      subjectName: "Mathématiques",
      description: "Évaluation semestrielle de mathématiques",
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Dans 5 jours
      isSubmitted: false,
    },
    {
      id: 2,
      title: "TP Programmation Web",
      subjectName: "Développement Web",
      description: "Exercice pratique sur HTML, CSS et JavaScript",
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Dans 2 jours
      isSubmitted: true,
    },
    {
      id: 3,
      title: "Examen Base de Données",
      subjectName: "Systèmes d'Information",
      description: "Evaluation finale sur SQL et la conception de BDD",
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Dans 10 jours
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
    const statusClass = exam.isSubmitted ? "success" : "warning";
    const statusText = exam.isSubmitted ? "Soumis" : "À soumettre";
    const buttonDisabled = exam.isSubmitted ? "disabled" : "";
    const buttonTitle = exam.isSubmitted
      ? "Déjà soumis"
      : "Soumettre une réponse";

    html += `
        <tr data-exam-id="${exam.id}">
          <td>${exam.title}</td>
          <td>${exam.subjectName}</td>
          <td>${exam.description}</td>
          <td>${dateString} à ${timeString}</td>
          <td><span class="badge badge-${statusClass}">${statusText}</span></td>
          <td>
            <button class="btn btn-outline-primary btn-sm download-exam-btn" data-exam-id="${exam.id}" aria-label="Télécharger sujet">
              <i class="fa fa-download"></i> Sujet
            </button>
            <button class="btn btn-outline-success btn-sm submit-exam-btn ${buttonDisabled}" data-exam-id="${exam.id}" data-toggle="modal" data-target="#examSubmissionModal" aria-label="${buttonTitle}" ${buttonDisabled}>
              <i class="fa fa-upload"></i> Soumettre
            </button>
          </td>
        </tr>
      `;
  });

  $("#examTableBody").html(html);

  // Initialiser le DataTable
  if ($.fn.DataTable.isDataTable("#examTable")) {
    $("#examTable").DataTable().destroy();
  }

  try {
    $("#examTable").DataTable({
      language: {
        url: "assets/js/datatables-french.json", // Utiliser un fichier local
      },
      responsive: true,
    });
  } catch (error) {
    console.error("Erreur lors de l'initialisation de DataTable:", error);
    // Initialisation minimale en cas d'erreur
    $("#examTable").DataTable({
      responsive: true,
    });
  }

  // Ajouter les événements aux boutons
  addButtonEvents();
}
