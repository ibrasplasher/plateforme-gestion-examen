# Utiliser une image de base avec un serveur Nginx pour servir des fichiers statiques
FROM nginx:alpine

# Copier les fichiers HTML et CSS dans le dossier de Nginx
COPY . /usr/share/nginx/html

# Exposer le port sur lequel Nginx fonctionne
EXPOSE 80

# Lancer Nginx au démarrage
CMD ["nginx", "-g", "daemon off;"]
