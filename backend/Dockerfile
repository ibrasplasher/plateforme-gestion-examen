# Utiliser une image Node.js comme base
FROM node:16-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers de l'application
COPY . .

# Exposer le port sur lequel l'application fonctionne
EXPOSE 5000

# La commande de démarrage sera définie dans docker-compose.yml