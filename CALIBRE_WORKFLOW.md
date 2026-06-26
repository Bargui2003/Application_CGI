# 🔄 Flux de Travail : Changement de Calibre

## Vue d'ensemble du Flux

```
┌─────────────────────────────────────────────────────────────────┐
│                   CALCULATRICE DE PRODUCTION                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
          ┌───────────────────────────────────┐
          │ Entrer les Paramètres de Production│
          │ - Pièces                          │
          │ - Diamètre (ex: 25mm)             │
          │ - Pression (PN6, PN10)            │
          │ - Vitesse (m/min)                 │
          │ - HD%, LD%, Déchet%               │
          └───────────────────────────────────┘
                              │
                              ▼
          ┌───────────────────────────────────┐
          │ Sélectionner Calibre Précédent    │
          │ (optionnel)                       │
          │ ▼ Changement de Calibre           │
          │   - Aucun changement              │
          │   - Ø25mm → Ø40mm                │
          │   - Ø40mm → Ø63mm                │
          │   ...                             │
          └───────────────────────────────────┘
                              │
                              ▼
          ┌───────────────────────────────────┐
          │ Cliquer "Calculer la Production"  │
          └───────────────────────────────────┘
                              │
                              ▼
          ┌───────────────────────────────────────────┐
          │ LOGIQUE DE CALCUL                         │
          │                                           │
          │ 1. Calculer le temps de production        │
          │    = (rouleaux × 100m) ÷ vitesse         │
          │                                           │
          │ 2. Vérifier changement de calibre         │
          │    IF précédent ≠ actuel:                 │
          │      - Appliquer règles de perte          │
          │      - Retourner: 0, 1, ou 2 heures      │
          │                                           │
          │ 3. Ajouter la perte au temps total        │
          │    temps_total += perte_calibre × 60     │
          │                                           │
          │ 4. Afficher alerte (si perte > 0)        │
          └───────────────────────────────────────────┘
                              │
                              ▼
          ┌─────────────────────────────────────────────┐
          │ RÉSULTAT : Résumé de Production             │
          │                                             │
          │ 📦 Entrée Totale: 275 kg                   │
          │ 🗑️ Perte de Déchet: 14 kg (5%)            │
          │ ✅ Quantité Utilisable: 261 kg             │
          │ ...                                         │
          │ ⏱️ Temps Production: 130 min (2h 10min)    │
          │                                             │
          │ ⚠️ CHANGEMENT DE CALIBRE DÉTECTÉ           │
          │    Ø25mm → Ø40mm                          │
          │    Perte: 2h = 120 min                    │
          │    (Cette perte est incluse dans le temps)│
          │                                             │
          │ ✓ Vérification des Stocks: OK             │
          └─────────────────────────────────────────────┘
                              │
                              ▼
          ┌─────────────────────────────────────────────┐
          │ Actions Disponibles                         │
          │                                             │
          │ [💾 Sauvegarder Production]               │
          │ [📄 Générer PDF]                           │
          │ [🗑️ Supprimer]                             │
          └─────────────────────────────────────────────┘
```

---

## Détail des États

### 1️⃣ Calcul SANS Changement de Calibre

```
Scenario: Production 1 avec Ø25mm
          ↓
    Sauvegarder
          ↓
Production 2 avec Ø25mm (même diamètre)
          ↓
    Cliquer "Calculer"
          ↓
┌─────────────────────────────────┐
│ Changement de Calibre?          │
│ Ø25mm → Ø25mm ?                │
│ → NON (même diamètre)           │
│                                 │
│ Perte = 0 heures               │
│ Pas d'alerte affichée          │
└─────────────────────────────────┘
          ↓
    Temps normal appliqué
    (sans ajout de perte)
```

### 2️⃣ Calcul AVEC Changement de Calibre (1h)

```
Scenario: Production 1 avec Ø25mm
          ↓
    Sauvegarder (setPreviousDiameter('25'))
          ↓
Production 2 avec Ø32mm (petit vers petit)
          ↓
    Cliquer "Calculer"
          ↓
┌─────────────────────────────────┐
│ Changement de Calibre?          │
│ Ø25mm → Ø32mm ?                │
│ → OUI (même catégorie)          │
│                                 │
│ Appliquer règle:                │
│ Petit → Petit = 1 HEURE        │
│                                 │
│ Perte = 1 heure = 60 min       │
│ ✓ Afficher alerte               │
└─────────────────────────────────┘
          ↓
    Temps = Temps fabrication + 60 min
    ↓
    ALERTE AFFICHÉE:
    "Changement Ø25mm → Ø32mm"
    "Perte: 1h = 60 min"
    "Inclus dans le temps total"
```

### 3️⃣ Calcul AVEC Changement de Calibre (2h)

```
Scenario: Production 1 avec Ø25mm
          ↓
    Sauvegarder (setPreviousDiameter('25'))
          ↓
Production 2 avec Ø40mm (petit vers moyen)
          ↓
    Cliquer "Calculer"
          ↓
┌─────────────────────────────────┐
│ Changement de Calibre?          │
│ Ø25mm → Ø40mm ?                │
│ → OUI (catégories différentes)  │
│                                 │
│ Appliquer règle:                │
│ Petit → Moyen = 2 HEURES       │
│                                 │
│ Perte = 2 heures = 120 min     │
│ ✓ Afficher alerte               │
└─────────────────────────────────┘
          ↓
    Temps = Temps fabrication + 120 min
    ↓
    ALERTE AFFICHÉE:
    "Changement Ø25mm → Ø40mm"
    "Perte: 2h = 120 min"
    "Inclus dans le temps total"
```

---

## Diagramme de Décision

```
                    Début: Calculer
                          │
                          ▼
                 Y a-t-il un diamètre
                     précédent?
                    /              \
                  OUI              NON
                  │                 │
                  ▼                 ▼
            Diamètres         Pas de
            différents?        changement
            /        \              │
          OUI         NON           ▼
          │           │      Perte = 0h
          ▼           ▼           │
        Appliquer  Perte = 0h   Afficher
        Règles      │           résultats
        └───┐    ┌──┘           (normal)
            │    │
            ▼    ▼
      Perte = 1h ou 2h
            │
            ▼
      Ajouter au temps
            │
            ▼
      Afficher alerte
            │
            ▼
      Afficher résultats
      (avec changement)
```

---

## Exemple Complet Pas à Pas

### Étape 1: Première Production

```
FORMULAIRE:
├─ Pièces: 10
├─ Diamètre: 25 (mm)
├─ Pression: PN6
├─ Vitesse: 100 (m/min)
├─ HD%: 50
├─ LD%: 50
├─ Déchet%: 5
└─ Changement Calibre: [Aucun changement]

CALCUL:
├─ Longueur: 10 × 100 = 1000m
├─ Temps prod: 1000 ÷ 100 = 10 min
├─ Changement calibre: NON
├─ Temps total: 10 min
└─ Perte: 0h

AFFICHAGE:
├─ Pas d'alerte
└─ Temps Production: 10 min

[💾 Sauvegarder]
→ previousDiameter = '25'
```

### Étape 2: Deuxième Production (DIFFÉRENT)

```
FORMULAIRE:
├─ Pièces: 15
├─ Diamètre: 40 (mm)          ← CHANGÉ
├─ Pression: PN6
├─ Vitesse: 100 (m/min)
├─ HD%: 50
├─ LD%: 50
├─ Déchet%: 5
└─ Changement Calibre: [Ø25mm → Ø40mm]  ← AUTO-REMPLI

[Calculer]

LOGIQUE:
├─ previousDiameter = '25'
├─ currentDiameter = '40'
├─ 25 ≠ 40 ? OUI
├─ Appliquer règle(25 → 40):
│  └─ Petit → Moyen = 2 HEURES
├─ calibreChangeLoss = 2h = 120 min
├─ Longueur: 15 × 100 = 1500m
├─ Temps prod: 1500 ÷ 100 = 15 min
├─ Temps total: 15 + 120 = 135 min (2h 15min)
└─ showCalibreWarning = TRUE

AFFICHAGE:
├─ ⚠️ CHANGEMENT DE CALIBRE DÉTECTÉ
│  ├─ Ø25mm → Ø40mm
│  ├─ Perte: 2h = 120 min
│  └─ (Inclus dans le temps total)
│
├─ ⏱️ Temps Production: 135 min (2h 15min)
└─ ✓ Vérification des Stocks: OK

[💾 Sauvegarder]
→ previousDiameter = '40'
```

### Étape 3: Troisième Production (MÊME)

```
FORMULAIRE:
├─ Pièces: 20
├─ Diamètre: 40 (mm)          ← MÊME
├─ Pression: PN6
├─ Vitesse: 100 (m/min)
├─ HD%: 50
├─ LD%: 50
├─ Déchet%: 5
└─ Changement Calibre: [Aucun changement]

[Calculer]

LOGIQUE:
├─ previousDiameter = '40'
├─ currentDiameter = '40'
├─ 40 ≠ 40 ? NON
├─ calibreChangeLoss = 0h
├─ Longueur: 20 × 100 = 2000m
├─ Temps prod: 2000 ÷ 100 = 20 min
├─ Temps total: 20 min (sans ajout)
└─ showCalibreWarning = FALSE

AFFICHAGE:
├─ (Pas d'alerte)
├─ ⏱️ Temps Production: 20 min
└─ ✓ Vérification des Stocks: OK

[💾 Sauvegarder]
→ previousDiameter = '40' (inchangé)
```

---

## Règles de Sélection Manuelle

```
Diamètre Actuel: 50 (mm)

Menu déroulant - Options:
├─ Aucun changement
├─ Ø25mm → Ø50mm  [Perte: 2h]
├─ Ø32mm → Ø50mm  [Perte: 2h]
├─ Ø40mm → Ø50mm  [Perte: 1h]
└─ Ø63mm → Ø50mm  [Perte: 2h]

Utilisateur sélectionne: Ø25mm → Ø50mm
        ↓
previousDiameter = '25'
        ↓
Cliquer "Calculer"
        ↓
Calcul détecte changement
        ↓
Applique règle (Petit → Moyen)
        ↓
Perte = 2 heures
```

---

## Gestion des Erreurs

```
CAS 1: Diamètre invalide
───────────────────────────
User saisit: Ø200mm
    ↓
Vérification: Est-ce un diamètre valide?
    ↓ NON
Erreur affichée: "Diamètre invalide"
    ↓
Pas de calcul effectué

CAS 2: HD% + LD% ≠ 100%
───────────────────────────
User saisit: HD 60%, LD 50%
    ↓
Calcul: 60 + 50 = 110 ≠ 100
    ↓
Erreur affichée: "HD% + LD% doit = 100%"
    ↓
Pas de calcul effectué

CAS 3: Stock insuffisant
───────────────────────────
Calcul effectué correctement
    ↓
Mais: HD requis (100kg) > Stock (50kg)
    ↓
Alerte affichée dans vérification stocks
    ↓
Bouton Sauvegarder est DÉSACTIVÉ
    ↓
User doit ajuster la production
```

---

## Architecture Technique

```
production-calculator.tsx
├─ Imports:
│  ├─ calculateCalibreChangeLoss()
│  └─ [autres imports]
│
├─ State:
│  ├─ previousDiameter
│  ├─ showCalibreWarning
│  └─ [autres états]
│
├─ Fonction calculate():
│  ├─ Validate inputs
│  ├─ Calculate production time
│  ├─ IF previousDiameter exists:
│  │  ├─ loss = calculateCalibreChangeLoss(...)
│  │  ├─ productionTime += loss × 60
│  │  └─ showCalibreWarning = true
│  ├─ Update result state
│  └─ Check stock levels
│
├─ Rendu:
│  ├─ Input fields
│  ├─ previousDiameter selector
│  ├─ [Calculer button]
│  ├─ IF result:
│  │  ├─ Afficher résultats
│  │  ├─ IF showCalibreWarning:
│  │  │  └─ Afficher alerte calibre
│  │  └─ [Sauvegarder button]
│  └─ Stock check display
│
└─ Sauvegarde:
   └─ setPreviousDiameter(diameter)

calibre-change.ts
├─ SMALL_DIAMETERS
├─ MEDIUM_DIAMETERS
├─ LARGE_DIAMETERS
│
└─ calculateCalibreChangeLoss()
   ├─ Check if same diameter → 0
   ├─ Check small-to-small → 1
   ├─ Check medium-to-medium → 1
   ├─ Check large-to-large → 1
   ├─ Check small-to-other → 2
   ├─ Check medium-to-other → 2
   ├─ Check large-to-other → 2
   └─ Default → 0
```

---

**Flux complet documenté** ✅
