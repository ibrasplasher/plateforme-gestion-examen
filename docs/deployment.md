# Déploiement du Projet

Ce guide explique comment déployer la plateforme de gestion d'examens en utilisant Docker et un service cloud.

## Prérequis

- **Docker** (version 20.10 ou supérieure)
- **Docker Compose** (version 1.29 ou supérieure)
- Un compte sur un service cloud (AWS, Azure, Heroku, etc.)

## Étapes de Déploiement

1. **Construire les images Docker** :
   ```bash
   docker-compose build
   ```

2. **Démarrer les conteneurs** :
   ```bash
   docker-compose up
   ```

3. **Accéder à l'application** :
   - **Frontend** : Ouvrez votre navigateur et accédez à .
   - **Backend** : L'API est disponible à .

## Déploiement sur un Service Cloud

### Option 1 : Déploiement sur Heroku

1. **Installer l'interface CLI de Heroku** :
   ```bash
   npm install -g heroku
   ```

2. **Se connecter à Heroku** :
   ```bash
   heroku login
   ```

3. **Créer une nouvelle application Heroku** :
   ```bash
   heroku create
   ```

4. **Déployer l'application** :
   ```bash
   git push heroku main
   ```

### Option 2 : Déploiement sur AWS (EC2)

1. **Créer une instance EC2** :
   - Connectez-vous à la console AWS.
   - Lancez une instance EC2 avec une image Ubuntu.

2. **Configurer Docker sur l'instance** :
   ```bash
   sudo apt-get update
   sudo apt-get install docker.io
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

3. **Déployer l'application** :
   - Clonez le repository sur l'instance EC2.
   - Construisez et démarrez les conteneurs avec Docker Compose.

## Configuration de Nginx (Optionnel)

Pour configurer Nginx comme reverse proxy, suivez les étapes suivantes :

1. **Installer Nginx** :
   ```bash
   sudo apt-get install nginx
   ```

2. **Configurer Nginx** :
   - Modifiez le fichier de configuration  pour rediriger le trafic vers votre application.

3. **Redémarrer Nginx** :
   ```bash
   sudo systemctl restart nginx
   ```
