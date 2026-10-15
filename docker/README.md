# Docker sur ce projet — guide pas à pas

Ce dossier t’accompagne pour comprendre Docker **en t’en servant sur cv-numerique** (chat persona + Ollama, optionnellement le site en prod).

## 0. Installer Docker (Windows)

Sur ta machine, la commande `docker` n’est pas encore disponible. Installe **Docker Desktop** :

1. Télécharge [Docker Desktop pour Windows](https://www.docker.com/products/docker-desktop/).
2. Installe, redémarre si demandé, lance Docker Desktop (icône baleine dans la barre des tâches).
3. Vérifie dans PowerShell :

```powershell
docker --version
docker compose version
```

Le backend Linux tourne en général via **WSL 2** (l’installateur peut te le proposer). C’est normal sur Windows.

> **Ressources** : Ollama + un modèle 14B demande beaucoup de RAM/VRAM. Pour tester léger, tu peux utiliser un modèle plus petit (voir plus bas).

---

## 1. Vocabulaire en 30 secondes

| Terme | Ici, concrètement |
| --- | --- |
| **Image** | Modèle figé (Node 22 + ton code chat). Comme une « photo » d’un disque. |
| **Conteneur** | Instance en cours d’exécution d’une image (un process isolé). |
| **Dockerfile** | Recette pour **construire** une image (`docker/Dockerfile.chat`). |
| **Compose** | Fichier `docker-compose.yml` qui lance **plusieurs** conteneurs ensemble (Ollama + chat + optionnellement le site). |
| **Volume** | Disque persistant (`ollama_data`) : les modèles Ollama restent après `docker compose down`. |
| **Port publié** | `3001:3001` = port sur **ton PC** → port **dans** le conteneur. |

---

## 2. Parcours recommandé (hybride dev)

Tu gardes Angular en local (`npm start`) et tu mets seulement **Ollama + l’API chat** dans Docker. C’est le flux le plus confortable pour coder le front.

### Étape A — Lancer Ollama et le chat

À la racine du repo :

```powershell
docker compose up --build
```

Au premier lancement, Docker **télécharge** les images (Ollama, Node). Ça peut prendre plusieurs minutes.

Dans un **autre** terminal, télécharge le modèle **une fois** (gros fichier) :

```powershell
docker compose exec ollama ollama pull qwen2.5:14b
```

Modèle plus léger pour apprendre (moins de RAM) :

```powershell
docker compose exec ollama ollama pull qwen2.5:3b
```

Puis dans `.env` à la racine (ou variable d’environnement) aligne le modèle si tu changes :

```env
OLLAMA_MODEL=qwen2.5:3b
```

Redémarre le service chat après changement : `docker compose up -d --build chat`.

### Étape B — Vérifier que tout répond

- Santé du chat : [http://localhost:3001/api/health](http://localhost:3001/api/health)  
  (`ok: true` quand Ollama a le modèle).
- Ollama depuis l’hôte : [http://localhost:11434](http://localhost:11434)

### Étape C — Front Angular comme d’habitude

```powershell
npm install
npm start
```

Ouvre [http://localhost:4200](http://localhost:4200). Le proxy Angular envoie `/api` vers `localhost:3001` — ton conteneur `chat` écoute déjà sur ce port.

---

## 3. Tout le site en conteneurs (profil `full`)

Build de production Angular + **nginx** qui sert le site et proxy `/api` vers le service `chat` :

```powershell
docker compose --profile full up --build
```

- Site : [http://localhost:8080](http://localhost:8080)  
- Pas besoin de `npm start` pour cette démo.

Fichiers concernés :

- `docker/Dockerfile.web` — build Angular puis image nginx
- `docker/nginx.conf` — `try_files` pour le SPA + `proxy_pass` vers `http://chat:3001`

---

## 4. Commandes utiles (à mémoriser)

```powershell
# Voir les conteneurs du projet
docker compose ps

# Logs en direct (tous les services)
docker compose logs -f

# Logs d’un seul service
docker compose logs -f chat

# Arrêter les conteneurs (volume Ollama conservé)
docker compose down

# Arrêter et supprimer le volume des modèles (réinstall propre)
docker compose down -v

# Reconstruire seulement le chat après changement de code server/
docker compose up --build chat

# Shell dans le conteneur chat (debug)
docker compose exec chat sh
```

---

## 5. Ce que fait chaque fichier

```
docker-compose.yml      Orchestration : ollama, chat, web (profil full)
docker/Dockerfile.chat  Image API Express (tsx + corpus knowledge/)
docker/Dockerfile.web   Multi-stage : npm run build → nginx
docker/nginx.conf       Reverse proxy /api pour le profil full
.dockerignore           Exclut node_modules, .git, etc. du contexte de build
```

Le serveur chat lit aussi `src/app/cv.data.ts` et `persona.*` : le Dockerfile copie ces fichiers, comme en dev local.

**Différence avec `npm run chat`** : en local, `server/start.ts` libère le port sous Windows. Dans Docker on lance `index.ts` directement (pas de `taskkill`).

---

## 6. Dépannage rapide

| Symptôme | Piste |
| --- | --- |
| `ok: false` sur `/api/health` | Modèle pas pull : `docker compose exec ollama ollama pull …` |
| Port 3001 déjà pris | Arrête un `npm run chat` local ou change le mapping dans `docker-compose.yml` (`3002:3001`). |
| Build lent / disque | Normal au premier `pull` ; les layers Docker sont réutilisés ensuite. |
| Docker Desktop ne démarre pas | Vérifie WSL 2 et virtualisation dans le BIOS. |

---

## 7. Prochaines étapes (quand tu seras à l’aise)

- Monter le code en **volume** pour le hot-reload du serveur (dev avancé).
- Image GPU pour Ollama (NVIDIA Container Toolkit) si tu as une carte dédiée.
- CI : `docker build` sur chaque push pour valider que les Dockerfiles restent valides.

Pour toute question sur le projet hors Docker, voir le [README](../README.md) à la racine.
