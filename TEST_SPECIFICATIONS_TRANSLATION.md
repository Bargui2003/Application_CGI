# 🧪 Guide de Test - Page Spécifications Traduite

## Prérequis
- Application en cours d'exécution (`npm run dev`)
- Navigateur moderne (Chrome, Firefox, Safari)
- Accès à l'onglet "Spécifications"

---

## ✅ Test 1: Chargement Initial en Français

### Étapes
1. Ouvrir l'application
2. Naviguer vers l'onglet "Spécifications"

### Résultat Attendu
```
Titre: "Spécifications des Produits"
Description: "Exigences de poids pour différentes tailles de tuyaux..."
Sections: "Tuyaux 25mm", "Tuyaux 32mm", etc.
Labels: "Plage de Poids"
Unités: "kg", "mm"
```

### Résultat Réel
✅ [Vérifier que tout est en français]

### Status
- [ ] PASS
- [ ] FAIL

---

## ✅ Test 2: Clic sur le Bouton Chinois 🇨🇳

### Étapes
1. Localiser les boutons 🇫🇷 / 🇨🇳 en haut à droite
2. Cliquer sur 🇨🇳
3. Observer le changement

### Résultat Attendu
```
Titre: "产品规格"
Description: "不同尺寸管道和压力等级的重量要求"
Sections: "管 25毫米", "管 32毫米", etc.
Labels: "重量范围"
Unités: "千克", "毫米"
```

### Temps de Changement
Doit être < 100ms (imperceptible)

### Résultat Réel
✅ [Vérifier que tous les textes sont en chinois]
⏱️  Temps mesuré: _________ ms

### Status
- [ ] PASS
- [ ] FAIL

---

## ✅ Test 3: Retour en Français

### Étapes
1. Cliquer sur 🇫🇷
2. Observer le changement

### Résultat Attendu
```
Tous les textes reviennent au français
```

### Résultat Réel
✅ [Vérifier que tous les textes sont en français]

### Status
- [ ] PASS
- [ ] FAIL

---

## ✅ Test 4: Pas de Rechargement Page

### Étapes
1. Ouvrir DevTools (F12)
2. Onglet "Network"
3. Cliquer sur 🇨🇳
4. Vérifier qu'aucune requête n'est faite

### Résultat Attendu
```
Aucune nouvelle requête HTTP
Aucune nouvelle ressource chargée
Seul le changement de langue se fait en local
```

### Résultat Réel
✅ [Vérifier qu'aucune requête n'apparaît]

### Status
- [ ] PASS
- [ ] FAIL

---

## ✅ Test 5: localStorage Persistent

### Étapes
1. Ouvrir DevTools (F12)
2. Onglet "Application" → "Storage" → "localStorage"
3. Cliquer sur 🇨🇳
4. Vérifier la clé "language"

### Résultat Attendu
```
localStorage['language'] = 'zh'
```

### Étapes Suivantes
5. Rafraîchir la page (F5)
6. La langue doit rester en Chinois

### Résultat Réel
✅ [Vérifier que localStorage contient 'language': 'zh']
✅ [Après rafraîchissement, vérifier que la page est en chinois]

### Status
- [ ] PASS
- [ ] FAIL

---

## ✅ Test 6: Vérification Complète des Traductions

### Textes à Vérifier en Français

| Texte Attendu | Localisation | ✅ |
|---|---|---|
| Spécifications des Produits | Titre principal | [ ] |
| Exigences de poids... | Sous-titre | [ ] |
| Tuyaux 25mm | Section | [ ] |
| Plage de Poids | Label | [ ] |
| kg | Unité de poids | [ ] |
| mm | Unité de diamètre | [ ] |
| Tuyaux 32mm | Autre section | [ ] |
| PN6, PN8, PN10 | Classes de pression | [ ] |

### Textes à Vérifier en Chinois

| Texte Attendu | Localisation | ✅ |
|---|---|---|
| 产品规格 | Titre principal | [ ] |
| 不同尺寸管道... | Sous-titre | [ ] |
| 管 25毫米 | Section | [ ] |
| 重量范围 | Label | [ ] |
| 千克 | Unité de poids | [ ] |
| 毫米 | Unité de diamètre | [ ] |
| 管 32毫米 | Autre section | [ ] |
| PN6, PN8, PN10 | Classes de pression (identiques) | [ ] |

---

## ✅ Test 7: Responsive Design

### Étapes
1. Ouvrir DevTools (F12)
2. Onglet "Device Toolbar" (Ctrl+Shift+M)
3. Tester sur téléphone (iPhone)
4. Tester sur tablette (iPad)
5. Vérifier les changements de langue

### Appareil 1: iPhone
- [ ] Français OK
- [ ] Chinois OK
- [ ] Changement < 100ms

### Appareil 2: iPad
- [ ] Français OK
- [ ] Chinois OK
- [ ] Changement < 100ms

### Appareil 3: Desktop
- [ ] Français OK
- [ ] Chinois OK
- [ ] Changement < 100ms

---

## ✅ Test 8: Console pour Erreurs

### Étapes
1. Ouvrir DevTools (F12)
2. Onglet "Console"
3. Nettoyer la console (Ctrl+L)
4. Cliquer sur 🇨🇳
5. Vérifier qu'il n'y a pas d'erreurs rouge

### Résultat Attendu
```
✅ Aucun message d'erreur
✅ Aucun warning
✅ Console clean
```

### Erreurs Trouvées
```
_________________
_________________
_________________
```

### Status
- [ ] PASS (0 erreurs)
- [ ] FAIL (erreurs présentes)

---

## ✅ Test 9: Performance (Web Vitals)

### Mesure du Temps de Changement

Ouvrir DevTools → Console et exécuter:
```javascript
const startTime = performance.now();
// Cliquer sur 🇨🇳
const endTime = performance.now();
console.log(`Temps: ${endTime - startTime}ms`);
```

### Résultat Attendu
```
Temps: < 100ms
```

### Résultat Mesuré
```
Temps: _________ ms
```

### Status
- [ ] PASS (< 100ms)
- [ ] FAIL (> 100ms)

---

## ✅ Test 10: Comportement au Démarrage

### Étapes
1. Ouvrir DevTools
2. Onglet "Application" → "localStorage"
3. Supprimer la clé "language"
4. Rafraîchir la page
5. Vérifier la langue par défaut

### Résultat Attendu
```
La page s'affiche en FRANÇAIS (langue par défaut)
```

### Résultat Réel
✅ [Vérifier que la page est en français]

### Status
- [ ] PASS
- [ ] FAIL

---

## 📊 Résumé des Tests

| Test | Status | Notes |
|------|--------|-------|
| Test 1: Chargement FR | [ ] | Français par défaut |
| Test 2: Clic 🇨🇳 | [ ] | Changement < 100ms |
| Test 3: Clic 🇫🇷 | [ ] | Retour en français |
| Test 4: Pas reload | [ ] | Zéro requête HTTP |
| Test 5: localStorage | [ ] | Persistence OK |
| Test 6: Traductions | [ ] | Tous textes OK |
| Test 7: Responsive | [ ] | Mobile/Tablet/Desktop |
| Test 8: Console | [ ] | Aucune erreur |
| Test 9: Performance | [ ] | < 100ms |
| Test 10: Démarrage | [ ] | Défaut français |

---

## ✅ Cas d'Erreur Courants

### Erreur 1: Les textes ne changent pas
**Cause possible**: localStorage bloqué
**Solution**: Vérifier que localStorage est activé

### Erreur 2: Console affiche une erreur
**Cause possible**: Clé de traduction manquante
**Solution**: Vérifier que toutes les clés existent

### Erreur 3: Changement lent (> 100ms)
**Cause possible**: App surchargée
**Solution**: Vérifier les performances de l'app

### Erreur 4: Textes mélangés FR/ZH
**Cause possible**: Re-render partiel
**Solution**: Force un rafraîchissement complet

---

## 🎯 Checklist Finale

- [ ] Tous les tests ont passé
- [ ] Aucune erreur en console
- [ ] Performance acceptable
- [ ] localStorage fonctionne
- [ ] Responsive OK
- [ ] Prêt pour production

---

## 📝 Notes et Observations

```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## ✅ Signature de Validation

**Testeur**: ___________________________  
**Date**: ___________________________  
**Résultat**: 🟢 APPROUVÉ / 🔴 REJETER  
**Commentaires**: _________________________________________________________________

---

**Status Final**: ✅ TESTS COMPLETS
