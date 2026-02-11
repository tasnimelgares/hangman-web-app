# 🎮 Jeu du Pendu – Projet Web (PEIP2 – S4)

## Contexte académique

Projet réalisé en PEIP2 – Semestre 4 (juin 2025).

Le backend (serveur Node.js et API) a été **fourni dans le cadre du module**.

Le travail réalisé dans ce projet concerne principalement :

* le développement du frontend,
* l’intégration avec l’API,
* la gestion des requêtes HTTP,
* la gestion de l’authentification JWT côté client.

La version publique correspond à un snapshot stable du projet.

---

## Description

Application web implémentant un **jeu du pendu en ligne** avec :

* Inscription / connexion utilisateur
* Authentification par JWT
* Gestion de parties avec niveaux de difficulté
* Communication front → API REST
* Affichage dynamique de l’état de la partie

Le serveur gère la logique métier (choix du mot, validation des lettres, gestion des erreurs).
Le frontend communique avec les routes `/api/...`.

---

## Architecture

### Backend (fourni)

* Serveur HTTP Node.js
* API REST
* Authentification JWT
* Gestion des parties en mémoire

### Frontend (réalisé dans le cadre du projet)

* HTML
* CSS
* JavaScript
* Gestion des formulaires
* Envoi du token JWT
* Mise à jour dynamique de l’interface

---

# 🚀 Lancer le projet en local

### 1️⃣ Cloner le dépôt

```bash
git clone https://github.com/TONPSEUDO/jeu-du-pendu.git
cd jeu-du-pendu
```

### 2️⃣ Installer les dépendances

```bash
npm install
```

Cela installe automatiquement les packages nécessaires (`jsonwebtoken`, etc.).

### 3️⃣ Démarrer le serveur

```bash
node index.js
```

Si tout fonctionne, le terminal affiche :

```
Serveur en écoute sur http://localhost:8000
```

### 4️⃣ Ouvrir l’application

Dans votre navigateur :

[http://localhost:8000/index.html](http://localhost:8000/index.html)

---

### ⚠️ Remarques

* Le serveur doit rester lancé pendant l’utilisation.
* Les utilisateurs sont stockés en mémoire (pas de base de données).
* Ce projet est destiné à un usage pédagogique.

---

## Objectifs pédagogiques

* Comprendre le fonctionnement d’une API REST
* Manipuler des requêtes HTTP en JavaScript
* Intégrer une authentification JWT côté client
* Séparer frontend et backend
* Structurer une application web simple

---

## Technologies utilisées

* Node.js
* JavaScript
* HTML / CSS
* JSON Web Token (JWT)

