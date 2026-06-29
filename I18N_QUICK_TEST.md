# 🧪 Guide de Test Rapide i18n

## 30 secondes pour Tester

### 1. Lancer l'App
```bash
npm run dev
```

### 2. Ouvrir dans le Navigateur
```
http://localhost:3000
```

### 3. Chercher les Boutons de Langue
En haut à droite du header : **🇫🇷** et **🇨🇳**

### 4. Cliquer sur les Boutons
- Cliquez sur **🇫🇷** → Page en Français
- Cliquez sur **🇨🇳** → Page en Chinois

### 5. Résultat
✅ L'interface change instantanément !

---

## Checklist de Test Complet

### Test 1 : Démarrage

- [ ] App démarre sans erreurs
- [ ] Header affiche les deux boutons 🇫🇷 🇨🇳
- [ ] Texte par défaut est en Français
- [ ] Console n'affiche pas d'erreurs

```
Erreurs attendues: None
Erreurs non acceptées: "useLanguage must be used within LanguageProvider"
```

### Test 2 : Changement de Langue (Français → Chinois)

- [ ] Clic sur 🇨🇳
- [ ] Page change en chinois
- [ ] "Connexion" → "登录"
- [ ] "Tableau de Bord" → "仪表板"
- [ ] "Production" → "生产"

```
Terminal Output: Aucune erreur
Console Browser: Aucune erreur
```

### Test 3 : Changement de Langue (Chinois → Français)

- [ ] Clic sur 🇫🇷
- [ ] Page change en français
- [ ] "登录" → "Connexion"
- [ ] "仪表板" → "Tableau de Bord"
- [ ] "生产" → "Production"

### Test 4 : Persistance (localStorage)

1. **Définir la langue en Chinois**
   - Cliquez sur 🇨🇳
   - Attendre que la page change

2. **Recharger la Page** (Ctrl+R ou F5)
   - [ ] Page démarre en Chinois
   - [ ] Pas de changement de langue après recharge

3. **Vérifier localStorage**
   ```javascript
   // Dans DevTools Console
   localStorage.getItem('language')
   // Doit retourner: 'zh'
   ```

4. **Effacer localStorage et Recharger**
   ```javascript
   // Dans DevTools Console
   localStorage.removeItem('language')
   ```
   - [ ] Page recharge en Français (défaut)

### Test 5 : Login Page

1. **Aller à la page de Login** (si non loggé)
   - [ ] Voir les deux boutons 🇫🇷 🇨🇳 en haut

2. **Test Français**
   - [ ] Cliquer 🇫🇷
   - [ ] "Email" en français
   - [ ] "Mot de passe" en français
   - [ ] Bouton "Se connecter"

3. **Test Chinois**
   - [ ] Cliquer 🇨🇳
   - [ ] "邮箱" visible
   - [ ] "密码" visible
   - [ ] Bouton "登录"

### Test 6 : Production Calculator (si accès)

1. **Ouvrir le Calculateur de Production**
2. **Test FR**
   - [ ] Cliquer 🇫🇷
   - [ ] "Quantité (kg)" visible
   - [ ] "Diamètre" visible
   - [ ] Labels corrects

3. **Test ZH**
   - [ ] Cliquer 🇨🇳
   - [ ] "数量 (kg)" visible
   - [ ] "直径" visible
   - [ ] Labels traduits

### Test 7 : Multiple Language Switches

- [ ] 🇫🇷 → 🇨🇳 → 🇫🇷 → 🇨🇳
- [ ] Aucune erreur
- [ ] Pas de lag ou ralentissement
- [ ] Interface toujours réactive

### Test 8 : Mobile Responsivité

1. **Ouvrir DevTools** (F12)
2. **Mode Mobile** (Ctrl+Shift+M)
3. **Test sur Mobile**
   - [ ] Boutons visibles
   - [ ] Texte redimensionné correctement
   - [ ] Pas de débordement
   - [ ] Changement fonctionne

### Test 9 : Console Errors

Ouvrir la Console du Navigateur (F12 → Console) et vérifier :

```javascript
// Ne doit PAS afficher
Uncaught Error: useLanguage must be used within LanguageProvider
TypeError: t is not a function
undefined reference

// Ne doit PAS afficher d'avertissements
Warning: Missing translation key 'xyz'
```

### Test 10 : Intégration avec Auth

Si vous avez un compte :
1. Se connecter
2. Aller au dashboard
3. Changer la langue
4. [ ] Voir que ça affecte le dashboard
5. [ ] Pas de déconnexion accidentelle

---

## Tests de Régression

### Avant et Après

**Avant** (sans i18n) :
- App en Français uniquement
- Pas de bouton de langue

**Après** (avec i18n) :
- App en Français ET Chinois
- Boutons de langue fonctionnels
- Persistance via localStorage

### Points à Vérifier

- [ ] App n'est pas plus lente
- [ ] Pas de nouvelles erreurs
- [ ] Authentification toujours fonctionne
- [ ] Production Calculator toujours fonctionne
- [ ] Aucun breaking change

---

## Commandes de Test

### Test Sans Interface (Headless)

```bash
# Vérifier que l'app compile
npm run build

# Lint du code
npm run lint

# Type checking
npx tsc --noEmit

# Vérifier les imports
grep -r "useLanguage" components/ app/ | head -10
```

### Test Avec Navigateur (Manual)

```bash
# Lancer l'app
npm run dev

# Ouvrir DevTools (F12)
# Aller à Console
# Entrer:
localStorage.getItem('language')
// Doit retourner: 'fr' ou 'zh'
```

---

## Vérifications de Traduction

### Tester les Clés de Traduction

```javascript
// Dans la Console du Navigateur

// 1. Vérifier que la langue est chargée
localStorage.getItem('language')
// Résultat: 'fr' ou 'zh'

// 2. Vérifier le DOM
document.body.innerText
// Doit contenir du texte FR ou ZH

// 3. Vérifier les boutons
document.querySelectorAll('button')
// Doit avoir les emojis 🇫🇷 et 🇨🇳
```

### Parcourir les Traductions

```bash
# Vérifier toutes les clés disponibles
grep -o "'[^']*'" lib/i18n/translations.ts | sort | uniq | wc -l
# Doit afficher: >200

# Chercher une clé spécifique
grep "calc.quantity" lib/i18n/translations.ts
# Doit retourner 2 matches (FR + ZH)
```

---

## Dépannage Rapide

### Problème: Texte en anglais ou mélangé

**Solution**:
1. Vérifier que `useLanguage()` est importé
2. Vérifier que la clé existe dans `translations.ts`
3. Vérifier la casse : `'calc.quantity'` ≠ `'Calc.Quantity'`

### Problème: Changement de langue ne fonctionne pas

**Solution**:
1. Vérifier que `LanguageProvider` est dans `layout.tsx`
2. Vérifier la console pour les erreurs
3. Essayer `localStorage.removeItem('language')` et recharger

### Problème: localStorage ne sauvegarde pas

**Solution**:
1. Vérifier que le navigateur ne bloque pas localStorage
2. Essayer un navigateur différent
3. Essayer le mode incognito
4. Vérifier DevTools → Application → localStorage

### Problème: Erreur TypeScript

**Solution**:
```typescript
// Vérifier que la clé est valide
const key = 'dashboard.title' as keyof typeof translations.fr
// ou utiliser le raccourci
const { t } = useLanguage()
t('dashboard.title')  // TypeScript inférera le type
```

---

## Profiling Performance

### Mesurer le Temps de Changement

```javascript
// Dans la Console
const start = performance.now()
// Cliquer sur le bouton de langue
const end = performance.now()
console.log(`Changement de langue: ${end - start}ms`)
// Doit être < 100ms
```

### Vérifier l'Impact sur le Bundle

```bash
# Taille du bundle avant
npm run build | grep "route sizes"

# Les fichiers i18n ajoutent ~20KB
# C'est acceptable pour 200+ traductions
```

---

## Matrix de Test

| Langue | Login | Dashboard | Calc | Persist | Mobile |
|--------|-------|-----------|------|---------|--------|
| FR | ✅ | ✅ | ✅ | ✅ | ✅ |
| ZH | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Résultats Attendus

### ✅ Succès
```
✅ Page démarre en Français
✅ Boutons 🇫🇷 🇨🇳 visibles
✅ Clic sur 🇨🇳 → Chinois
✅ Clic sur 🇫🇷 → Français
✅ Recharge → Maintient la langue
✅ Console propre (pas d'erreurs)
✅ Performance optimale (<100ms)
```

### ❌ Échec
```
❌ Erreur au démarrage
❌ Boutons invisibles
❌ Changement de langue ne fonctionne pas
❌ Texte reste en français après changement
❌ Erreur "useLanguage must be used within..."
❌ localStorage ne sauvegarde pas
❌ Performance lente (>500ms)
```

---

## Rapport de Test Final

Après les 10 tests, complétez :

```
Date: ___________
Testeur: ___________
Navigateur: ___________

Résultats:
- Tests réussis: _____ / 10
- Bugs trouvés: _____ 
- Performance: _____ ms

Notes:
_________________________________
_________________________________
```

---

## Prochaines Étapes Si Tout Fonctionne

1. ✅ Committer les changements
2. ✅ Notifier l'équipe
3. ✅ Ajouter les traductions manquantes
4. ✅ Considérer l'ajout de l'Anglais

---

## Support

Si quelque chose ne fonctionne pas :
1. Consulter `I18N_README.md`
2. Vérifier `I18N_ARCHITECTURE.md`
3. Ouvrir DevTools Console (F12)
4. Chercher l'erreur exacte
5. Consulter la section Dépannage

---

**Happy Testing!** 🧪✨
