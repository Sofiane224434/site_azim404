# site_azim404

Site principal servi sur azim404.com et www.azim404.com.

## Stack

- React + Vite
- Docker + Docker Compose
- Nginx sur le VPS comme reverse proxy hote
- GitHub Actions pour le deploiement automatique

## Developpement local

```bash
npm install
npm run dev
```

## Production reelle

Ce repo ne publie pas directement sur 80 ou 443.

- Le conteneur expose seulement 127.0.0.1:3001:80
- Nginx sur le VPS route azim404.com et www.azim404.com vers ce port
- Le certificat TLS est gere par Certbot cote hote, pas par Docker

## Deploiement GitHub Actions

Le workflow pousse le code sur le VPS dans ~/apps/azim404 puis execute:

```bash
git fetch origin
git reset --hard origin/main
git clean -fd -e letsencrypt/ -e .env
docker compose down || true
docker compose up -d --build
```

Secrets GitHub requis:

- VPS_HOST
- VPS_USERNAME
- VPS_SSH_KEY
- VPS_PORT

## Commandes utiles sur le VPS

```bash
cd ~/apps/azim404
docker compose ps
docker compose logs --tail=100
```

## Regle importante

Ne pas reintroduire Traefik, Caddy ou une publication directe sur 80/443 dans ce repo sans migration volontaire de toute l'infra.
