# Héberger le CV (site + chat + Ollama)

Objectif : la même expérience que **http://localhost:8080** — site Angular, API `/api`, LLM Ollama — accessible sur **ton domaine** en **HTTPS**.

Tu n’as pas encore de domaine ni de VPS : ce guide part de zéro.

---

## Ce que tu vas acheter / créer

| Élément | Rôle | Ordre de grandeur |
| --- | --- | --- |
| **Nom de domaine** | `cv.tondomaine.be` → ton serveur | ~10–15 €/an |
| **VPS** (serveur Linux) | Docker + Ollama + site | ~8–20 €/mois selon RAM |

### Taille du serveur (important pour Ollama)

Le chat utilise un modèle local. En CPU (sans GPU dédié), prévois :

| Modèle | RAM conseillée sur le VPS | Vitesse |
| --- | --- | --- |
| `qwen2.5:3b` | **8 Go** minimum | Correct pour un CV perso |
| `qwen2.5:14b` | **16 Go** ou plus | Lent en CPU, coûteux |

Recommandation pour démarrer : **8 Go RAM**, modèle **`qwen2.5:3b`** (comme en local).

Fournisseurs courants (UE, facturation simple) : [Hetzner Cloud](https://www.hetzner.com/cloud), [OVH](https://www.ovhcloud.com/), [Scaleway](https://www.scaleway.com/). Choisis **Ubuntu 24.04** à la création.

Registraire de domaine : ton registrar habituel, ou [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/), [Gandi](https://www.gandi.net/), etc.

---

## Vue d’ensemble

```
Internet
   │
   ▼
[VPS]  Caddy :443 ──► nginx (web) ──► fichiers Angular
                    └── /api ──► chat (Express) ──► Ollama
```

- **Caddy** : certificat HTTPS automatique (Let's Encrypt).
- **Ollama** et **chat** ne sont **pas** exposés sur Internet (réseau Docker interne).
- Le front appelle `/api` sur le **même domaine** (déjà le cas dans le code).

---

## Étape 1 — Domaine

1. Achète un domaine (ex. `nael-ait.dev`, `tonnom.be`).
2. Note l’interface DNS du registrar (ou passe les DNS sur Cloudflare).

Tu configureras le DNS à l’**étape 3** (quand tu auras l’IP du VPS).

---

## Étape 2 — Créer le VPS

1. Crée une instance **Ubuntu 24.04**, région **EU** (ex. Falkenstein / Gravelines).
2. Type : au moins **2 vCPU, 8 Go RAM** pour `qwen2.5:3b`.
3. Ajoute ta **clé SSH** (recommandé) ou note le mot de passe root.
4. Note l’**adresse IP publique** (ex. `203.0.113.10`).

### DNS

Chez ton registrar, crée un enregistrement **A** :

| Type | Nom | Valeur |
| --- | --- | --- |
| A | `@` ou `www` ou `cv` | IP du VPS |

Ex. `cv.tondomaine.be` → A → `203.0.113.10`.  
La propagation peut prendre **5 min à 48 h** (souvent < 1 h).

---

## Étape 3 — Préparer le serveur (SSH)

Depuis ton PC :

```bash
ssh root@TON_IP
```

Sur le VPS :

```bash
apt update && apt upgrade -y
apt install -y git ufw

# Docker (script officiel)
curl -fsSL https://get.docker.com | sh

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

Vérifie : `docker compose version`

---

## Étape 4 — Déployer le projet

Toujours sur le VPS :

```bash
git clone https://github.com/naelait/cv-numerique.git
cd cv-numerique
```

Crée le fichier **`.env`** (jamais commité) :

```env
DOMAIN=cv.tondomaine.be
ACME_EMAIL=nael.ait@gmail.com
OLLAMA_MODEL=qwen2.5:3b
```

Remplace `DOMAIN` et l’email par les tiens.  
**Le DNS doit déjà pointer vers ce serveur** avant de lancer Caddy (sinon Let's Encrypt échoue).

Build et démarrage **production** :

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile full up -d --build
```

Télécharge le modèle (une fois, volumineux) :

```bash
docker compose exec ollama ollama pull qwen2.5:3b
```

Vérifications :

```bash
docker compose ps
docker compose exec chat wget -qO- http://localhost:3001/api/health
```

Puis dans ton navigateur : **https://cv.tondomaine.be** — teste le chat.

---

## Étape 5 — Mises à jour

Sur le VPS, dans le repo :

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile full up -d --build
```

Si tu changes de modèle : `ollama pull …` puis mets à jour `OLLAMA_MODEL` dans `.env` et :

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate chat
```

---

## Dépannage

| Problème | Piste |
| --- | --- |
| HTTPS ne se lance pas | DNS pas propagé, ou port 80 fermé (Let's Encrypt HTTP-01) |
| Chat « modèle absent » | `OLLAMA_MODEL` ≠ modèle pull ; refaire `ollama pull` |
| Très lent / timeout | VPS trop petit ou modèle trop gros → reste sur `3b` |
| `DOMAIN` manquant | `.env` sur le serveur avec `DOMAIN=...` |
| Logs Caddy | `docker compose logs -f caddy` |

### Test HTTP avant domaine (avancé)

Sans HTTPS, tu peux temporairement utiliser **uniquement** le compose local et le port 8080, en ouvrant le firewall sur 8080 — **déconseillé en prod** (pas de TLS). Mieux vaut attendre que le DNS soit bon et utiliser `docker-compose.prod.yml`.

---

## Coûts & limites

- **Facture** : domaine + VPS chaque mois.
- **Abus** : un chat LLM public peut être spammé ; pour un CV perso c’est en général acceptable. Surveillance des logs `chat` si besoin.
- **Pas de GPU** sur un petit VPS : le chat répond en quelques secondes, pas en millisecondes.

---

## Alternative plus tard

- **Front seul** sur Cloudflare Pages (gratuit) + **API** sur un petit VPS : plus complexe (CORS, URL d’API).
- **LLM cloud** (OpenAI, etc.) au lieu d’Ollama : moins de RAM, coût à l’usage, changement de code non fait aujourd’hui.

Pour l’instant, **un VPS + ce compose prod** est le chemin le plus aligné avec ce que tu as déjà testé en local.
