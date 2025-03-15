const axios = require("axios");

// Fonction pour envoyer une requête à Ollama
const analyzeWithOllama = async (prompt) => {
  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "deepseek-v2", // Modèle utilisé, vérifie le nom exact
      prompt,
      stream: false,
    });

    return response.data.response;
  } catch (error) {
    console.error("Erreur avec Ollama:", error.message);
    throw error;
  }
};

module.exports = { analyzeWithOllama };
