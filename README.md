# CV numérique — Naël Ait

CV interactif d’[Naël Ait](https://www.linkedin.com/in/nael-ait), analyste développeur .NET / Angular à Bruxelles.

Ce n’est pas un PDF mis en ligne : c’est une session de debug vivante. Le parcours, les projets et les compétences se lisent dans un shell IDE sombre, avec un chat persona ancré dans les faits, une galaxie Three.js, et un clicker Matrix.

## Fonctionnalités

- Parcours scrollable : intro, à propos, expérience, formation, projets, compétences, contact
- Chat persona à la première personne, grounded (RAG local + Ollama) — pas d’invention de faits CV
- Galaxie de compétences (Three.js desktop) / carte sonar (mobile)
- Matrix clicker comme surface de démo
- PDF téléchargeable (`public/cv.pdf`, synchronisé depuis `knowledge/cv.pdf` au start/build)

## Stack

| Couche | Techno |
| --- | --- |
| Front | Angular 22, TypeScript, CSS |
| 3D | Three.js |
| Chat | Express, retrieval local, [Ollama](https://ollama.com) (`qwen2.5:14b` par défaut) |

Les faits CV vivent dans `src/app/cv.data.ts`. Le corpus du chat est dans `knowledge/` et `src/app/persona.knowledge.ts`.

## Prérequis

- Node.js 20+ (npm)
- Optionnel pour le chat : [Ollama](https://ollama.com) + le modèle `qwen2.5:14b`

## Démarrage

```bash
npm install
npm start
```

Ouvre [http://localhost:4200/](http://localhost:4200/). `npm start` copie `knowledge/cv.pdf` vers `public/cv.pdf` s’il est présent.

### Chat persona (optionnel)

Dans un second terminal :

```bash
ollama serve
ollama pull qwen2.5:14b
cd server && npm install && cd ..
npm run chat
```

Le dev server Angular proxifie `/api` vers `http://localhost:3001` (`proxy.conf.json`).

### Docker (Ollama + chat)

Tu peux lancer Ollama et l’API chat dans des conteneurs tout en gardant `npm start` sur l’hôte. Guide pas à pas : [docker/README.md](docker/README.md).

```bash
docker compose up --build
docker compose exec ollama ollama pull qwen2.5:14b
# Si tu utilises un autre tag (ex. qwen2.5:3b), copie .env.example → .env et aligne OLLAMA_MODEL
```

**Hébergement en ligne** (VPS + domaine + HTTPS) : [docker/HOSTING.md](docker/HOSTING.md).

### GitHub Pages (gratuit, sans chat)

À chaque push sur `main`, le workflow [`.github/workflows/github-pages.yml`](.github/workflows/github-pages.yml) build `npm run build:static` et publie le site.

**Activation (sinon 404 sur le site)** — une seule fois :

1. Ouvre [Settings → Pages](https://github.com/naelait/cv-numerique/settings/pages).
2. **Build and deployment → Source** : choisis **GitHub Actions** (pas « Deploy from a branch »).
3. Onglet [Actions](https://github.com/naelait/cv-numerique/actions/workflows/github-pages.yml) → workflow **GitHub Pages** → **Run workflow** (ou « Re-run all jobs » sur le dernier run).

Quand le job **deploy** est vert : **https://naelait.github.io/cv-numerique/**

Le build static utilise `baseHref: /cv-numerique/` (nom du repo). Domaine perso plus tard : adapter `baseHref` dans `angular.json` (`configuration.static`).

Variables d’environnement (voir `.env.example`) :

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `PORT` | `3001` | Port du serveur chat |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | API Ollama |
| `OLLAMA_MODEL` | `qwen2.5:14b` | Modèle LLM |

## Scripts

| Commande | Action |
| --- | --- |
| `npm start` | Sync PDF + `ng serve` |
| `npm run chat` | API chat locale |
| `npm run build` | Sync PDF + build production (chat inclus) |
| `npm run build:static` | Build pour hébergement statique **sans** chat (Pages, Netlify, etc.) |
| `npm run watch` | Build watch (dev) |
| `npm run sync:cv` | Copie `knowledge/cv.pdf` → `public/cv.pdf` |

## Structure

```
src/app/           UI Angular (shell, chat, connect, galaxie, matrix)
src/app/cv.data.ts Source de vérité du CV
knowledge/         Corpus RAG (TFE, faits) ; cv.pdf local (non versionné)
server/            API Express + retrieval
public/            Assets servis (favicon, cv.pdf)
scripts/           Sync du PDF
```

## Contenu

Ne pas inventer d’employeurs, de métriques, de témoignages ou de faits absents de `cv.data.ts`, de `knowledge/` et du PDF. Le chat reste à la première personne et factuel.

Identité : **Naël Ait**. Contact : `nael.ait@gmail.com` · [LinkedIn](https://www.linkedin.com/in/nael-ait).
