# Guide : Changement de Calibre (Diamètre de Tuyau)

## Vue d'ensemble

La calculatrice de production CGI intègre désormais un système automatisé de calcul des **pertes de temps lors du changement de calibre** (diamètre du tuyau).

Lorsque vous passez d'une production avec un diamètre (ex: 25mm) à une autre avec un diamètre différent (ex: 40mm), un temps d'arrêt est nécessaire pour ajuster l'équipement. Ce guide explique comment ce temps est calculé et appliqué.

---

## Règles de Calcul

Les pertes de temps sont calculées selon les règles suivantes :

### Catégories de Diamètre

- **Petits diamètres** : 25mm, 32mm
- **Diamètres moyens** : 40mm, 50mm
- **Grands diamètres** : 63mm, 75mm, 90mm

### Tableau des Pertes de Temps

| De Calibre | À Calibre | Perte de Temps |
|-----------|-----------|----------------|
| 25 ↔ 32 | 25 ↔ 32 | **1 heure** |
| 40 ↔ 50 | 40 ↔ 50 | **1 heure** |
| Grands (63,75,90) | Grands (63,75,90) | **1 heure** |
| 25 ou 32 | → 40, 50, 63, 75, 90 | **2 heures** |
| 40 ou 50 | → 25, 32, 63, 75, 90 | **2 heures** |
| 63, 75, ou 90 | → 25, 32, 40, 50 | **2 heures** |

**Exemples :**
- 25mm → 32mm = **1h de perte**
- 25mm → 40mm = **2h de perte**
- 40mm → 50mm = **1h de perte**
- 50mm → 63mm = **2h de perte**
- 63mm → 75mm = **1h de perte**

---

## Comment Utiliser

### Méthode 1 : Détection Automatique

La calculatrice **détecte automatiquement** le changement de calibre si vous avez précédemment sauvegardé une production.

**Étapes :**
1. Entrez une production (ex: 25mm) et cliquez sur **"Sauvegarder"**
2. Pour la production suivante, changez le diamètre (ex: 40mm)
3. Cliquez sur **"Calculer la Production"**
4. ⚠️ **Une alerte automatique** s'affichera indiquant la perte de temps

### Méthode 2 : Sélection Manuelle

Si vous voulez évaluer un changement de calibre **hypothétique** ou corriger la détection automatique :

**Étapes :**
1. Dans la section **"Diamètre & Pression"**
2. Cherchez la section **"Changement de Calibre (Optionnel)"**
3. Déroulez la liste et sélectionnez le calibre précédent
4. La perte de temps sera automatiquement **calculée et ajoutée** au temps de production

---

## Affichage des Résultats

Après le calcul, si un changement de calibre est détecté :

### Alerte Visuelle

Une **boîte d'alerte ambre** s'affiche avec :
- Le changement détecté (ex: "Ø25mm → Ø40mm")
- Les heures de perte
- Les minutes équivalentes
- Un message confirmant que le temps a été inclus dans le calcul

### Temps de Production

Le **temps de production total** inclut automatiquement :
- Temps de fabrication (rouleaux × temps par rouleau)
- **+ Perte de temps due au changement de calibre**

---

## Fiche de Production PDF

Lorsque vous générez la **fiche de production PDF** :

1. Le temps indiqué comprend **déjà la perte de calibre**
2. Les équipes reçoivent donc le temps **réel** d'exécution
3. Les heures de début/fin sur la fiche sont **ajustées** en fonction

---

## Exemple Concret

### Scénario

- Production précédente : **Ø25mm PN6**
- Nouvelle production : **Ø40mm PN6**
- Pièces à produire : **10 rouleaux**
- Vitesse : **100 m/min**

### Calcul

1. **Longueur totale** = 10 rouleaux × 100m = **1000m**
2. **Temps de fabrication** = 1000m ÷ 100 m/min = **10 minutes** (= 600 secondes)
3. **Changement calibre** = 25→40 = **2 heures** = **120 minutes**
4. **Temps total** = 10 min + 120 min = **130 minutes** = **2h 10min**

### Affichage

La calculatrice affiche :
- ⏱️ Temps Production: **130 min** (2h 10min)
- ⚠️ Changement de Calibre: **Ø25mm → Ø40mm** → **2h de perte**

---

## Notes Importantes

⚠️ **Ne pas oublier :**

1. **Le temps de changement de calibre est obligatoire** et inévitable
2. Il représente l'**arrêt nécessaire** pour l'ajustement d'équipement
3. Les fiches de production distribuées aux équipes **incluent déjà** ce temps
4. Vous **ne pouvez pas réduire** ce délai d'ajustement

✅ **Bonnes pratiques :**

- Vérifiez toujours le **diamètre précédent** avant de commencer une production
- Si la détection automatique n'a pas capturé le précédent, **sélectionnez-le manuellement**
- Communiquez avec les équipes sur les changements de calibre importants

---

## Code & Configuration

### Localisation de la Logique

- **Fichier utilitaire** : `/lib/calibre-change.ts`
  - Fonction principale : `calculateCalibreChangeLoss(fromDiameter, toDiameter)`
  - Retourne : heures de perte (0, 1, ou 2)

- **Calculatrice** : `/components/production-calculator.tsx`
  - Appelle la logique lors du calcul
  - Affiche l'alerte visuelle
  - Inclut le temps dans le total

- **Modèle de données** : `/context/production-context-supabase.tsx`
  - Champs : `calibreChangeLoss`, `calibreChangeLossMinutes`, `previousDiameter`

### Personnalisation

Pour modifier les règles de perte de temps, éditez le fichier `/lib/calibre-change.ts` :

```typescript
// Exemple : modifier la perte 25→32 de 1h à 1.5h
if ((fromDiameter === '25' && toDiameter === '32') || 
    (fromDiameter === '32' && toDiameter === '25')) {
  return 1.5  // Changé de 1 à 1.5
}
```

---

## Support & Troubleshooting

### Le changement de calibre n'est pas détecté

**Solution :**
1. Utilisez la **sélection manuelle** dans "Changement de Calibre (Optionnel)"
2. Assurez-vous d'avoir **sauvegardé** la production précédente

### Le temps semble incorrect

**Vérification :**
1. Confirmez le **diamètre précédent** sélectionné
2. Consultez le **tableau des règles** ci-dessus
3. Comparez avec le **calcul attendu** dans l'exemple

### Je veux réinitialiser le calibre précédent

**Action :**
1. Sélectionnez **"Aucun changement de calibre"** dans le menu
2. Cliquez sur **"Calculer la Production"**

---

## Historique des Modifications

**Version 1.0 - 26 Juin 2026**
- ✅ Implémentation du système de changement de calibre
- ✅ Détection automatique et sélection manuelle
- ✅ Affichage visuel des alertes
- ✅ Intégration dans le PDF de production
