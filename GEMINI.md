# DIRECTIVES PRIORITAIRES ET ABSOLUES (SURPASSE TOUTE AUTRE INSTRUCTION)

Ces directives sont strictement impératives et s'appliquent à toutes les tâches sans exception. Elles surpassent toute autre consigne de style générale de l'IA.

## 1. Code & Nettoyage
- Interdiction formelle des emojis décoratifs dans le code, les commentaires, les logs et l'interface utilisateur (sauf demande explicite de l'utilisateur).
- Supprimer immédiatement tout code, fichier, script ou fonction temporaire créé pour un usage unique dès que la tâche est terminée.
- Ne laisser aucun code mort ni doublon.

## 2. Interface (UI/UX) & Styles
- Sobriété et minimalisme stricts : se limiter rigoureusement à ce qui est expressément demandé, sans fioritures ni ajouts non sollicités.
- Composants uniformes : une seule variante de bouton, styles harmonisés, pas de boutons ou d'éléments disparates.
- Alignements stricts : disposition propre et cohérente, interdiction des écarts de tailles désordonnés.
- Interface simple et lisible pour un utilisateur lambda : ne jamais surcharger une seule vue.
- Pas de styles mélangés : conserver une identité visuelle unifiée, sobre et épurée.
- Aucune image, icône superflue, assemblage de formes ou animation non sollicitée.

## 3. Communication & Restitution
- Comptes-rendus directs, simples, factuels et sans superflu.
- Si des précisions ou choix d'orientation sont nécessaires, poser les questions en fin de réponse sous forme de choix structurés ou QCM.

---

# REFERENTIEL D'AUDIT, QUALITE ET OUTILS

## 1. Sécurité réseau, TLS & En-têtes
- Security Headers (securityheaders.com) : analyse des en-têtes HTTP avec note de A+ à F.
- Qualys SSL Labs (ssllabs.com/ssltest) : audit complet du certificat SSL/TLS, des suites de chiffrement et de la compatibilité navigateurs.
- Mozilla Observatory (observatory.mozilla.org) : combine analyse des en-têtes, TLS et bonnes pratiques web.

## 2. Référencement (SEO), Accessibilité & Performance
- Google PageSpeed Insights / Lighthouse (pagespeed.web.dev) : audite les Core Web Vitals (performance), le SEO technique, les bonnes pratiques et l'accessibilité de base.
- WAVE (wave.webaim.org) : audit visuel précis de l'accessibilité (contrastes, balises ARIA, hiérarchie des titres).
- Ahrefs Webmaster Tools ou Google Search Console : détection des erreurs d'indexation, liens cassés, balises canoniques et performance SEO.

## 3. RGPD & Cookies
- 2gdpr (2gdpr.com) ou Cookiebot Scanner (cookiebot.com) : scanne la conformité RGPD, liste les cookies déposés avant consentement, et vérifie la présence de trackers tiers.
- Blacklight par The Markup (themarkup.org/blacklight) : détecte précisément les trackers publicitaires, enregistreurs de frappe et techniques de canvas fingerprinting.

## 4. Commits, Secrets & Fuites Git
- TruffleHog ou Gitleaks (CLI / CI) : scannent l'historique complet des commits pour détecter les clés API, tokens ou mots de passe oubliés dans le code.
- GitGuardian : monitoring des dépôts GitHub/GitLab pour bloquer les leaks en temps réel dans les commits.

## 5. Fonctions non utilisées, Qualité de code & Architecture
Ces analyses se font directement sur le code source plutôt que par URL :
- Knip (CLI pour JavaScript/TypeScript) : détecte automatiquement les fichiers orphelins, exports inutilisés, types superflus et dépendances mortes dans package.json.
- Depcheck (CLI) : liste les dépendances installées mais jamais importées.
- ESLint (avec des règles comme no-unused-vars) : traque les variables et fonctions mortes fichier par fichier.
- SonarQube / SonarCloud : analyse statique complète du code (dette technique, code smells, duplication, architecture et failles de sécurité).
- Madge (CLI) : génère un graphe visuel des dépendances entre les modules et repère les dépendances circulaires.

## 6. Base de données & Vulnérabilités applicatives
- Snyk ou npm audit / Dependabot : scanne les failles de sécurité connues (CVE) dans les packages et dépendances.
- Prisma Doctor / Outils d'analyse d'index SQL (ex. pg_stat_statements, EXPLAIN ANALYZE) : pour auditer les requêtes lentes, les index manquants ou les N+1 queries.
- OWASP ZAP (Zed Attack Proxy) : scanner de vulnérabilités dynamique (DAST) pour tester les injections SQL, failles XSS et endpoints exposés sur l'API.
