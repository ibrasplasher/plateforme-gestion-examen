document.addEventListener("DOMContentLoaded", function () {
  const examTableBody = document.getElementById("examTableBody");
  const examFileInput = document.getElementById("examFileInput");
  const submitExamButton = document.getElementById("submitExamButton");
  const examSubmissionForm = document.getElementById("examSubmissionForm");
  const examSubmissionModal = $("#examSubmissionModal");

  let selectedExamId = null;

  // Function to load exams dynamically
  function loadExams() {
    fetch("/api/student-exams", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Assuming JWT authentication
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Impossible de charger les examens");
        }
        return response.json();
      })
      .then((exams) => {
        // Clear existing table rows
        examTableBody.innerHTML = "";

        // Populate table with exams
        exams.forEach((exam) => {
          // Determine submission status
          const status = exam.submitted
            ? '<span class="badge badge-success">Soumis</span>'
            : '<span class="badge badge-warning">À soumettre</span>';

          const row = document.createElement("tr");
          row.innerHTML = `
                    <td>${exam.title}</td>
                    <td>${exam.subject || "Non spécifié"}</td>
                    <td>${exam.description || "Aucune description"}</td>
                    <td>${new Date(exam.deadline).toLocaleString()}</td>
                    <td>${status}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary download-exam" 
                                data-exam-id="${exam.id}">
                            <i class="fa fa-download"></i> Télécharger
                        </button>
                        <button class="btn btn-sm btn-outline-success submit-exam" 
                                data-exam-id="${exam.id}"
                                data-exam-title="${exam.title}"
                                data-toggle="modal" 
                                data-target="#examSubmissionModal">
                            <i class="fa fa-upload"></i> Soumettre
                        </button>
                    </td>
                `;
          examTableBody.appendChild(row);
        });

        // Reinitialize DataTable
        $("#examTable").DataTable({
          language: {
            url: "//cdn.datatables.net/plug-ins/1.11.5/i18n/French.json",
          },
          destroy: true, // Allow reinitialization
        });

        // Attach event listeners
        attachEventListeners();
      })
      .catch((error) => {
        console.error("Erreur de chargement des examens:", error);
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: "Impossible de charger les examens. Veuillez réessayer.",
          confirmButtonText: "OK",
        });
      });
  }

  // Attach event listeners to dynamic elements
  function attachEventListeners() {
    // Download exam buttons
    document.querySelectorAll(".download-exam").forEach((button) => {
      button.addEventListener("click", function () {
        const examId = this.dataset.examId;
        downloadExam(examId);
      });
    });

    // Submit exam modal trigger
    document.querySelectorAll(".submit-exam").forEach((button) => {
      button.addEventListener("click", function () {
        // Set selected exam details
        selectedExamId = this.dataset.examId;
        const examTitle = this.dataset.examTitle;

        // Update modal title
        document.getElementById(
          "examTitle"
        ).textContent = `Soumettre : ${examTitle}`;

        // Reset file input
        examFileInput.value = "";
        submitExamButton.disabled = true;
        submitExamButton.classList.remove("btn-primary");
        submitExamButton.classList.add("btn-secondary");
      });
    });
  }

  // Download exam function
  function downloadExam(examId) {
    fetch(`/api/download-exam/${examId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Téléchargement impossible");
        }
        return response.blob();
      })
      .then((blob) => {
        // Create a link to download the file
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `exam_${examId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error("Erreur de téléchargement:", error);
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: "Impossible de télécharger l'examen. Veuillez réessayer.",
          confirmButtonText: "OK",
        });
      });
  }

  // File input change event
  examFileInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (allowedTypes.includes(file.type)) {
        if (file.size <= 50 * 1024 * 1024) {
          // 50MB max
          submitExamButton.disabled = false;
          submitExamButton.classList.remove("btn-secondary");
          submitExamButton.classList.add("btn-primary");
        } else {
          Swal.fire({
            icon: "error",
            title: "Fichier trop volumineux",
            text: "Le fichier ne doit pas dépasser 50 Mo.",
            confirmButtonText: "OK",
          });
          this.value = ""; // Clear file input
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Type de fichier non autorisé",
          text: "Seuls les fichiers PDF et DOC sont autorisés.",
          confirmButtonText: "OK",
        });
        this.value = ""; // Clear file input
      }
    }
  });

  // Submit exam button event
  submitExamButton.addEventListener("click", function () {
    const file = examFileInput.files[0];

    if (file && selectedExamId) {
      const formData = new FormData();
      formData.append("examFile", file);
      formData.append("examId", selectedExamId);

      fetch("/api/submit-exam", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Soumission échouée");
          }
          return response.json();
        })
        .then((data) => {
          // Success notification
          Swal.fire({
            icon: "success",
            title: "Soumission réussie",
            text: "Votre examen a été soumis avec succès.",
            confirmButtonText: "OK",
          });

          // Close modal
          examSubmissionModal.modal("hide");

          // Reload exams to update status
          loadExams();
        })
        .catch((error) => {
          console.error("Erreur de soumission:", error);
          Swal.fire({
            icon: "error",
            title: "Erreur",
            text: "La soumission de l'examen a échoué. Veuillez réessayer.",
            confirmButtonText: "OK",
          });
        });
    }
  });

  // Initial load of exams
  loadExams();
});
