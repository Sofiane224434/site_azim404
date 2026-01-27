# Instructions pour l'IA - Projet Azim404

## Contexte du Projet

Ce projet gère **deux sites web distincts** avec une seule infrastructure Docker :

1. **azim404.com** (site principal) - Ce dossier
2. **sofiane-kherarfa.azim404.com** (portfolio personnel)

## Structure Actuelle

Les deux sites partagent actuellement **le même code React** (dupliqué depuis le portfolio). 

**Ce qui est déjà fait :**
- ✅ Configuration Traefik pour gérer SSL automatique (Let's Encrypt)
- ✅ Routage des domaines configuré
- ✅ Code React complet avec tous les composants (Header, Hero, About, Projects, Contact, Footer)
- ✅ Tailwind CSS configuré
- ✅ Docker setup complet

## Ce Qu'il Faut Faire

### Objectif Principal
Transformer ce site (azim404.com) en **site principal/landing page** différent du portfolio, tout en gardant un lien vers le portfolio.

### Modifications Recommandées

1. **Modifier le Hero (src/components/Hero.jsx)**
   - Changer le titre pour mettre "AZIM404" ou un nom d'entreprise
   - Ajouter un bouton/lien vers `https://sofiane-kherarfa.azim404.com/`
   - Adapter le contenu pour présenter l'entreprise/organisation

2. **Section About (src/components/About.jsx)**
   - Présenter l'entreprise/l'équipe plutôt qu'une personne
   - Lister les services offerts
   - Modifier les compétences pour refléter l'expertise de l'entreprise

3. **Section Projects (src/components/Projects.jsx)**
   - Lister les projets de l'entreprise/équipe
   - Ajouter un projet qui pointe vers le portfolio de Sofiane Kherarfa

4. **Header (src/components/Header.jsx)**
   - Changer le logo/nom de "Portfolio" à "Azim404"
   - Adapter les liens de navigation si nécessaire

5. **Contact (src/components/Contact.jsx)**
   - Mettre les coordonnées de l'entreprise
   - Email générique (ex: contact@azim404.com)

## Architecture des Domaines

```
docker-compose.yml gère :
├── traefik (port 80, 443)
│   ├── SSL/HTTPS automatique
│   └── Routage des domaines
├── react-app (ce site)
│   ├── azim404.com
│   ├── www.azim404.com
│   └── sofiane-kherarfa.azim404.com
```

**Important** : Les 3 domaines pointent actuellement vers le même conteneur. Pour avoir deux sites différents, il faudrait soit :
- Séparer en deux services Docker différents
- OU garder un seul service et différencier le contenu via routing côté React

## Déploiement

Sur le VPS (après modifications) :

```bash
cd ~/apps/azim
git pull
docker compose down
docker compose up -d --build
```

## Fichiers Clés à Modifier

- `src/App.jsx` - Structure principale
- `src/components/Hero.jsx` - Section d'accueil
- `src/components/Header.jsx` - Navigation
- `src/components/About.jsx` - Présentation
- `src/components/Projects.jsx` - Projets (ajouter lien vers portfolio)
- `src/components/Contact.jsx` - Informations de contact
- `docker-compose.yml` - Configuration des domaines

## Notes Importantes

- Le portfolio de Sofiane Kherarfa doit rester sur `sofiane-kherarfa.azim404.com`
- Le site principal sur `azim404.com` doit avoir un lien vers le portfolio
- Traefik gère automatiquement les certificats SSL
- Les deux sites utilisent React + Vite + Tailwind CSS

## Exemple de Modification Simple

Pour commencer, dans `src/components/Hero.jsx`, remplacer :
```jsx
<h2>Bonjour, je suis <span>Votre Nom</span></h2>
```

Par :
```jsx
<h2>Bienvenue sur <span>AZIM404</span></h2>
```

Et ajouter un bouton :
```jsx
<a href="https://sofiane-kherarfa.azim404.com" className="...">
  Portfolio Sofiane Kherarfa
</a>
```
