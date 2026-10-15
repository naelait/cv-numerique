# Mise en production

Stack identique au profil Docker `full` : Angular, API chat, Ollama, HTTPS via Caddy.

Prévoir un VPS Ubuntu 24.04 en Europe, **8 Go de RAM** pour `qwen2.5:3b` (16 Go ou plus pour `qwen2.5:14b` en CPU), un nom de domaine, et les ports 22, 80 et 443 ouverts. Ollama et l’API ne sont pas exposés : seul Caddy publie 80/443.

## DNS

Enregistrement **A** du domaine vers l’IP du VPS, propagé avant le premier démarrage (Let's Encrypt).

## Serveur

```bash
apt update && apt upgrade -y
apt install -y git ufw
curl -fsSL https://get.docker.com | sh
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

git clone https://github.com/naelait/cv-numerique.git
cd cv-numerique
```

`.env` (non versionné) :

```env
DOMAIN=cv.example.com
ACME_EMAIL=nael.ait@gmail.com
OLLAMA_MODEL=qwen2.5:3b
```

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile full up -d --build
docker compose exec ollama ollama pull qwen2.5:3b
```

Vérifier `docker compose ps`, puis `https://$DOMAIN`.

## Mises à jour

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile full up -d --build
```

Changement de modèle : `ollama pull`, mettre à jour `OLLAMA_MODEL`, puis `docker compose … up -d --force-recreate chat`.

## Dépannage

| Symptôme | Piste |
| --- | --- |
| Certificat refusé | DNS pas encore propagé, ou port 80 fermé |
| Persona indisponible | Tag `OLLAMA_MODEL` absent du volume Ollama |
| Timeouts | Modèle trop lourd pour la RAM du VPS |
| Logs TLS | `docker compose logs -f caddy` |

Alternative sans LLM : GitHub Pages via `npm run build:static` (chat masqué). Voir le README.
