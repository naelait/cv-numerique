# Docker

Deux modes. Le front en `ng serve` reste le flux de développement ; le profil `full` sert le build de production derrière nginx.

## Développement (Ollama + API)

```bash
docker compose up --build
docker compose exec ollama ollama pull qwen2.5:14b
```

Puis `npm start`. Le proxy Angular pointe `/api` vers le port 3001.

Le modèle doit correspondre à `OLLAMA_MODEL` (défaut `qwen2.5:14b`, surcharge dans `.env`). Santé : [http://localhost:3001/api/health](http://localhost:3001/api/health).

## Site complet

```bash
docker compose --profile full up --build
```

[http://localhost:8080](http://localhost:8080) — nginx sert le build Angular et proxifie `/api` vers le service `chat`.

## Production

Overlay HTTPS (Caddy, ports internes non publiés) : [HOSTING.md](HOSTING.md).

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile full up -d --build
```

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `docker-compose.yml` | Ollama, API chat, front (profil `full`) |
| `docker-compose.prod.yml` | Caddy 80/443, services internes |
| `Dockerfile.chat` | API Express (`tsx index.ts`) |
| `Dockerfile.web` | Build Angular + nginx |
| `nginx.conf` | SPA + proxy `/api` |
| `Caddyfile` | TLS Let's Encrypt |

Le conteneur chat lance `index.ts` directement (pas de libération de port hôte).

## Exploitation

```bash
docker compose ps
docker compose logs -f chat
docker compose up --build chat
docker compose down          # volume des modèles conservé
docker compose down -v       # supprime aussi les modèles Ollama
```

| Symptôme | Piste |
| --- | --- |
| `model: false` sur `/api/health` | `ollama pull` du tag défini dans `OLLAMA_MODEL` |
| Port 3001 occupé | Arrêter un `npm run chat` local, ou changer le mapping |
| Réponse lente | Premier chargement du modèle, ou VPS sous-dimensionné |
