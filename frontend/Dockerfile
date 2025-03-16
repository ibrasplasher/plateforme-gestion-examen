# Utiliser une image de base Node.js
FROM node:16

# Définir le répertoire de travail
WORKDIR /app

# Installer http-server globalement
RUN npm install -g http-server

# Copier les fichiers frontend dans le container
COPY . .

# Exposer le port que http-server va utiliser
EXPOSE 8080

# Commande par défaut pour démarrer http-server
CMD ["http-server", ".", "-p", "8080"]
