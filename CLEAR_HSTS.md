# COMMENT NETTOYER HSTS DANS BRAVE

## Étape par étape :

1. **Ouvrir la page HSTS dans Brave**
   - Copiez-collez cette adresse dans votre barre d'adresse :
   ```
   brave://net-internals/#hsts
   ```

2. **Supprimer le domaine azim404.com**
   - Scrollez jusqu'à la section "Delete domain security policies"
   - Dans le champ "Domain:", tapez : `azim404.com`
   - Cliquez sur le bouton **Delete**

3. **Supprimer aussi www**
   - Dans le même champ, tapez : `www.azim404.com`
   - Cliquez sur **Delete**

4. **Vérifier la suppression**
   - Scrollez jusqu'à la section "Query HSTS/PKP domain"
   - Tapez `azim404.com` et cliquez sur **Query**
   - Vous devriez voir "Not found"

5. **Tester l'accès HTTP**
   - Ouvrez un nouvel onglet
   - Tapez explicitement : `http://azim404.com` (avec http://)
   - Appuyez sur Entrée

## Alternative : Mode navigation privée

Si ça ne fonctionne pas :
1. Ouvrez une fenêtre de **navigation privée** (Ctrl + Shift + N)
2. Allez sur `http://azim404.com`

## Alternative : Vider tout le cache

1. Paramètres → Confidentialité et sécurité
2. Effacer les données de navigation
3. Cochez "Cookies et autres données de sites"
4. Période : "Toutes les périodes"
5. Cliquez sur "Effacer les données"
