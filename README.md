# Naël Ait — CV numérique

CV interactif d’[Naël Ait](https://www.linkedin.com/in/nael-ait), analyste développeur .NET / Angular à Bruxelles.

**Démo (sans chat)** : [naelait.github.io/cv-numerique](https://naelait.github.io/cv-numerique/)

Le site n’est pas un PDF collé dans une page. C’est un shell type IDE : parcours, projets, galaxie de compétences (Three.js), démo Matrix, et — en local ou sur un VPS — un chat persona ancré dans les faits du CV (retrieval local + Ollama). Aucun employeur, métrique ou témoignage n’est inventé.

## Stack

| Couche | Techno |
| --- | --- |
| Front | Angular 22, TypeScript, CSS |
| 3D | Three.js |
| Chat | Express, retrieval local, [Ollama](https://ollama.com) |

Source des faits : `src/app/cv.data.ts`. Corpus du chat : `knowledge/` et `src/app/persona.knowledge.ts`.

## Lancer en local

Prérequis : Node.js 22+.

```bash
npm install
npm start
```

[http://localhost:4200](http://localhost:4200) — `npm start` copie `knowledge/cv.pdf` vers `public/cv.pdf` s’il est présent.

### Chat (optionnel)

Ollama en local, modèle `qwen2.5:14b` par défaut (ou un tag plus léger via `.env`) :

```bash
ollama serve
ollama pull qwen2.5:14b
npm install --prefix server
npm run chat
```

Le dev server proxifie `/api` vers `http://localhost:3001` (`proxy.conf.json`).

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `PORT` | `3001` | Port de l’API chat |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | API Ollama |
| `OLLAMA_MODEL` | `qwen2.5:14b` | Modèle |

Voir [`.env.example`](.env.example).

## Déploiement

| Cible | Chat | Commande |
| --- | --- | --- |
| GitHub Pages | Non | workflow [`.github/workflows/github-pages.yml`](.github/workflows/github-pages.yml) sur `main` |
| Docker (site + API + Ollama) | Oui | [`docker/README.md`](docker/README.md) |
| VPS + HTTPS | Oui | [`docker/HOSTING.md`](docker/HOSTING.md) |

`npm run build` conserve le chat. `npm run build:static` le retire (Pages, CDN). Le `baseHref` du build static est `/cv-numerique/`.

Pages : [Settings → Pages](https://github.com/naelait/cv-numerique/settings/pages) → source **GitHub Actions**.

## Scripts

| Commande | Action |
| --- | --- |
| `npm start` | Sync PDF + `ng serve` |
| `npm run chat` | API chat |
| `npm run build` | Build production, chat inclus |
| `npm run build:static` | Build statique, chat masqué |
| `npm run sync:cv` | `knowledge/cv.pdf` → `public/cv.pdf` |

## Structure

```
src/app/     Interface Angular
server/      API Express + retrieval
knowledge/   Corpus du chat
public/      Assets (favicon, PDF)
docker/      Images, nginx, Caddy
```

Contact : `nael.ait@gmail.com` · [LinkedIn](https://www.linkedin.com/in/nael-ait)
