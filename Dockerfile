# ═══════════════════════════════════════════════════════════════════════
# DOCKERFILE POUR REACT + VITE - MULTI-STAGE BUILD
# ═══════════════════════════════════════════════════════════════════════

# ───────────────────────────────────────────────────────────────────────
# ÉTAPE 1 : BUILD
# ───────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le reste du code source
COPY . .

# Builder l'application pour la production
RUN npm run build

# ───────────────────────────────────────────────────────────────────────
# ÉTAPE 2 : PRODUCTION (image finale légère)
# ───────────────────────────────────────────────────────────────────────
FROM nginx:alpine

# Supprimer la config nginx par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Copier notre config nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/

# Copier les fichiers buildés depuis l'étape précédente
# Note: Vite génère dans /dist (pas /build comme CRA)
COPY --from=builder /app/dist /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]