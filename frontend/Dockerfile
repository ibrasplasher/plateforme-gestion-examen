# Utiliser une image de base Node.js
FROM node:16-alpine

# Définir le répertoire de travail
WORKDIR /app

# Installer http-server globalement
RUN npm install -g http-server

# Créer le dossier pour les photos de profil
RUN mkdir -p profiles && chmod -R 777 profiles

# Copier les fichiers en plusieurs étapes pour éviter les problèmes
COPY assets ./assets/
COPY *.html ./
COPY *.js ./
COPY *.css ./

# Si vous avez d'autres dossiers, ajoutez-les ici
# COPY other-folder ./other-folder/

# Exposer le port que http-server va utiliser
EXPOSE 8080

# Commande par défaut pour démarrer http-server
CMD ["http-server", ".", "-p", "8080"]