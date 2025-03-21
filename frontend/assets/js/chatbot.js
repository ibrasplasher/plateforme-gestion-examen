const robot = document.getElementById("robot");
const chatContainer = document.getElementById("chatContainer");
const chatBody = document.getElementById("chatBody");
const userInput = document.getElementById("userInput");
const eyeLeft = document.getElementById("eyeLeft");
const eyeRight = document.getElementById("eyeRight");

// Suivi des yeux du robot
document.addEventListener("mousemove", function (event) {
  let robotRect = robot.getBoundingClientRect();
  let centerX = robotRect.left + robotRect.width / 2;
  let centerY = robotRect.top + robotRect.height / 4;

  let deltaX = event.pageX - centerX;
  let deltaY = event.pageY - centerY;

  let angle = Math.atan2(deltaY, deltaX);
  let distance = Math.min(10, Math.sqrt(deltaX ** 2 + deltaY ** 2) / 5);

  eyeLeft.style.transform = `translate(${Math.cos(angle - 0.3) * distance}px, ${
    Math.sin(angle - 0.3) * distance
  }px)`;
  eyeRight.style.transform = `translate(${
    Math.cos(angle + 0.3) * distance
  }px, ${Math.sin(angle + 0.3) * distance}px)`;
});

// Affichage de la modal au clic sur le robot
robot.addEventListener("click", function () {
  const modal = document.getElementById("thechatbot");
  modal.classList.add("show");
  modal.style.display = "block";
  document.body.classList.add("modal-open");
});

// Fonction pour afficher une bulle de rire du robot
function showLaugh() {
  const laughBubble = document.createElement("div");
  laughBubble.classList.add("laugh-bubble");
  laughBubble.textContent = "Hahaha";
  robot.appendChild(laughBubble);
  setTimeout(() => robot.removeChild(laughBubble), 2000);
}

// Affichage du chat au clic sur le robot
robot.addEventListener(
  "click",
  () => (chatContainer.style.transform = "translateY(0)")
);

// Envoi du message et affichage de la réponse
async function sendMessage() {
  if (userInput.value.trim() === "") return;

  let userMessage = document.createElement("div");
  userMessage.className = "message user-message";
  userMessage.textContent = userInput.value;
  chatBody.appendChild(userMessage);
  chatBody.scrollTop = chatBody.scrollHeight;

  // Message de chargement du bot
  let botMessage = document.createElement("div");
  botMessage.className = "message bot-message";
  botMessage.textContent = "Je réfléchis... 🤖";
  chatBody.appendChild(botMessage);
  chatBody.scrollTop = chatBody.scrollHeight;

  let userText = userInput.value;
  userInput.value = ""; // Efface l'input après envoi

  try {
    let botResponse = await getBotResponse(userText);
    botMessage.textContent = botResponse;
  } catch (error) {
    botMessage.textContent = "Désolé, une erreur s'est produite. 😢";
    console.error("Erreur API:", error);
  }

  chatBody.scrollTop = chatBody.scrollHeight;
}

// Fonction pour récupérer la réponse de l'IA
async function getBotResponse(message) {
  const API_KEY = "AIzaSyB7J_LMWaFJDpluv423Kw9ZsubV4qCS63s"; // Remplace par ta nouvelle clé API
  const API_URL =
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" +
    API_KEY;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: message }],
          },
        ],
      }),
    });

    const data = await response.json();

    if (data?.candidates?.length > 0) {
      return data.candidates[0].content.parts[0].text.trim();
    } else {
      return "Désolé, je n'ai pas pu générer de réponse. 😢";
    }
  } catch (error) {
    console.error("Erreur lors de la requête à l'API:", error);
    return "Une erreur s'est produite en contactant l'IA. 🚨";
  }
}
