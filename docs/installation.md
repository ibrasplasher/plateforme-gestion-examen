# Installation du Projet

Ce guide explique comment installer et configurer la plateforme de gestion d'examens localement.

## Prérequis

- **Node.js** (version 16 ou supérieure)
- **npm** (gestionnaire de paquets Node.js)
- **MySQL** (version 5.7 ou supérieure)
- **Docker** (optionnel, pour le déploiement en conteneurs)

## Étapes d'Installation

1. **Cloner le repository** :
   ```bash
   git clone https://github.com/votre-username/plateforme-gestion-examens.git
   cd plateforme-gestion-examens
   ```

2. **Installer les dépendances du backend** :
   ```bash
   cd backend
   npm install
   ```

3. **Installer les dépendances du frontend** :
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configurer la base de données** :
   - Créez une base de données MySQL nommée .
   - Configurez les informations de connexion dans le fichier  :
     ```javascript
     module.exports = {
       host: 'localhost',
       user: 'root',
       password: 'votre_mot_de_passe',
       database: 'exam_platform',
     };
     ```

5. **Lancer le backend** :
   ```bash
   cd ../backend
   npm start
   ```

6. **Lancer le frontend** :
   ```bash
   cd ../frontend
   npm start
   ```

## Accéder à l'Application

- **Frontend** : Ouvrez votre navigateur et accédez à .
- **Backend** : L'API est disponible à .

## Configuration Optionnelle avec Docker

Si vous utilisez Docker, suivez les instructions dans [deployment.md](deployment.md).
