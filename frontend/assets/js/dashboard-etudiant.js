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
  $(".avatar p strong").text(userData.firstName + " " + userData.lastName);
  $(".avatar span strong").text("ÉTUDIANT");

  // Charger les statistiques de l'étudiant
  loadStudentStatistics();

  // Charger les examens à venir
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
function loadStudentStatistics() {
  const token = localStorage.getItem("token");

  $.ajax({
    url: "http://localhost:5000/api/data/student-statistics",
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: function (data) {
      console.log("Statistiques reçues:", data);

      // Mettre à jour les cartes de statistiques
      if (data.bestGrade) {
        $(".bg-theme .media-body h3 strong").text(data.bestGrade);
        $(".bg-theme .media-body p small").text(
          data.bestCourse || "Best Grade Course"
        );
      }

      if (data.worstGrade) {
        $(".bg-danger .media-body h3 strong").text(data.worstGrade);
        $(".bg-danger .media-body p small").text(
          data.worstCourse || "Worst Grade Course"
        );
      }

      if (data.successRate) {
        $(".bg-theme.border .media-body h3 strong").text(
          data.successRate + "%"
        );
      }

      // Mise à jour du graphique d'avancement si les données sont disponibles
      if (
        data.progressData &&
        data.progressData.labels &&
        data.progressData.values
      ) {
        updateProgressChart(data.progressData.labels, data.progressData.values);
      }
    },
    error: function (xhr) {
      console.error("Erreur lors du chargement des statistiques:", xhr);
      // Garder les données de démonstration en cas d'erreur
    },
  });
}

// Fonction pour charger les examens à venir
function loadUpcomingExams() {
  const token = localStorage.getItem("token");

  $.ajax({
    url: "http://localhost:5000/api/data/student-exams",
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    success: function (exams) {
      console.log("Examens reçus:", exams);

      // Vider le tableau existant
      $("#project_table tbody").empty();

      if (!exams || exams.length === 0) {
        $("#project_table tbody").append(
          '<tr><td colspan="3" class="text-center">Aucun examen à venir</td></tr>'
        );
        return;
      }

      // Remplir le tableau avec les données des examens
      exams.forEach((exam) => {
        const date = new Date(exam.deadline);
        const formattedDate = date.toLocaleDateString();

        const row = `
            <tr>
              <td>${exam.subjectName || "Non spécifié"}</td>
              <td>${exam.title}</td>
              <td>${formattedDate}</td>
            </tr>
          `;

        $("#project_table tbody").append(row);
      });
    },
    error: function (xhr) {
      console.error("Erreur lors du chargement des examens:", xhr);
      // En cas d'erreur, conserver les données de démonstration
    },
  });
}

// Fonction pour mettre à jour le graphique d'avancement
function updateProgressChart(labels, values) {
  // Cette fonction dépend de la bibliothèque de graphiques que vous utilisez
  // Ajustez en fonction d'echarts, chartist, etc.

  // Si vous utilisez echarts pour le donut chart
  if (window.echarts && document.getElementById("donutChartEcharts")) {
    var donutChart = echarts.init(document.getElementById("donutChartEcharts"));

    var option = {
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b}: {c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        x: "left",
        data: labels,
      },
      series: [
        {
          name: "Notes",
          type: "pie",
          radius: ["50%", "70%"],
          avoidLabelOverlap: false,
          label: {
            normal: {
              show: false,
              position: "center",
            },
            emphasis: {
              show: true,
              textStyle: {
                fontSize: "30",
                fontWeight: "bold",
              },
            },
          },
          labelLine: {
            normal: {
              show: false,
            },
          },
          data: labels.map((label, index) => {
            return {
              value: values[index],
              name: label,
            };
          }),
        },
      ],
    };

    donutChart.setOption(option);
  }

  // Si vous utilisez chartist pour le line chart
  if (window.Chartist && document.getElementById("areaChartChartist")) {
    new Chartist.Line(
      "#areaChartChartist",
      {
        labels: labels,
        series: [values],
      },
      {
        low: 0,
        showArea: true,
        fullWidth: true,
        axisY: {
          onlyInteger: true,
          offset: 20,
        },
      }
    );
  }
}
