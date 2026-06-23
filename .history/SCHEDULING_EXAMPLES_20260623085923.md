# 🧪 Exemples d'utilisation du Production Scheduling System

## 1️⃣ Créer une production et la planifier automatiquement

### Option A: Utiliser l'API `create-and-schedule` (SIMPLE)

```javascript
const response = await fetch('/api/production/create-and-schedule', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productionData: {
      total_quantity: 1000,
      pieces_count: 500,
      waste_percentage: 5,
      useful_quantity: 950,
      hd_percentage: 70,
      ld_percentage: 30,
      hd_quantity: 665,
      ld_quantity: 285,
      black_color_quantity: 100,
      dryer_quantity: 50,
      weight_per_piece: 2.5,
      diameter: '25',
      pressure: '10',
      speed: 50,
      production_time: 15,  // 15 HEURES
      total_length: 5000,
      user_id: 'user-uuid',
      date: new Date().toISOString(),
      status: 'validated_by_magasinier'
    },
    articleName: '25',  // Calibre: 25, 32, 40, 50, 63, 75, 90
    schedule: true      // Planifier automatiquement
  })
})

const result = await response.json()
console.log(result)
// Résultat:
// {
//   success: true,
//   production: { id, ... },
//   timeline: [
//     { team_id: 2, time_used: 5, ... },
//     { team_id: 3, time_used: 8, ... },
//     { team_id: 1, time_used: 2, ... }
//   ]
// }
```

---

## 2️⃣ Flux complet: Admin crée → Conducteur exécute

### ÉTAPE 1: Admin crée une production (dans dashboard)
```
1. Aller à dashboard magasinier
2. Onglet "Productions"
3. Créer une nouvelle production
4. Valider (elle passe le statut 'draft' → 'validated_by_magasinier')
```

### ÉTAPE 2: Production est automatiquement planifiée
```javascript
// Si vous utilisez create-and-schedule, c'est automatique
// Sinon, appel manuel:
POST /api/production/timeline
{
  action: 'schedule',
  productionId: 'production-uuid',
  articleName: '25',
  totalTime: 15
}
```

### ÉTAPE 3: Conducteur voit dans son dashboard
```
1. Conducteur se connecte à /conductor
2. Voit sa production: "Article 25mm - 5h - Équipe 2"
3. Clique "Démarrer production"
```

### ÉTAPE 4: Production en cours
```
1. Conducteur clique "Démarrer production" 
   → production_timeline.status = 'en_cours'

2. S'il y a un problème:
   - Clique "Signaler problème"
   - Décrit le problème
   - Indique le temps réel (ex: 6.5h au lieu de 5h)
   - Submit
   → production_timeline.status = 'bloquée'
   → production_issues.status = 'signalée'

3. Quand OK, clique "Terminer production"
   → production_timeline.status = 'terminée'
   → Passe à la production suivante
```

### ÉTAPE 5: Admin corrige les problèmes
```
1. Admin voit onglet "Problèmes" (badge rouge si signalée)
2. Clique sur le problème → Dialog correction
3. Valide le temps réel (ex: 6.5h)
4. Clique "Approuver correction"
   → production_issues.status = 'corrigée'
   → production_timeline.time_used = 6.5
   → production_timeline.status = 'en_attente'
```

---

## 3️⃣ Assignation intelligente (Exemple)

### Scénario: Production de 15h ajoutée à 10:00 AM

```
Heure actuelle: 10:00
Article: 25mm
Temps: 15 heures
Pas d'article précédent (pas de setup)

RÉSULTAT DE L'ASSIGNATION:
├─ Équipe 2 (15:00-23:00 = 8h disponibles)
│  ├─ Setup: 0h (premier article)
│  ├─ Production: 5h
│  └─ Status: en_attente
│
├─ Équipe 3 (23:00-07:00 = 8h disponibles)
│  ├─ Setup: 0h (même article)
│  ├─ Production: 8h
│  └─ Status: en_attente (sera en_cours après équipe 2)
│
└─ Équipe 1 (07:00-15:00 +1 jour = 8h disponibles)
   ├─ Setup: 0h (même article)
   ├─ Production: 2h
   └─ Reste: 15h - 5h - 8h = 2h ✅
```

### Scénario 2: Avec changement d'article

```
Équipe 3 termine l'article 25mm
Nouvelle production 32mm arrive: 10h
Pas de conducteur actif (c'est 07:00 AM)

RÉSULTAT:
├─ Équipe 1 (07:00-15:00)
│  ├─ Setup: 2h (changement 25→32)
│  ├─ Production: 6h (8h - 2h setup)
│  └─ Total: 8h utilisé
│
└─ Équipe 2 (15:00-23:00)
   ├─ Setup: 0h (même article)
   ├─ Production: 4h
   └─ Reste: 10h - 6h = 4h ✅
```

---

## 4️⃣ Appels API directs

### GET: Obtenir la production actuelle d'une équipe

```javascript
const response = await fetch('/api/production/timeline', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'get-team-production',
    teamId: 1  // Équipe 1, 2, ou 3
  })
})

const { production } = await response.json()
// production = premier enregistrement en_attente pour l'équipe 1
```

### GET: Lister toutes les timelines

```javascript
const response = await fetch('/api/production/timeline', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'get-all-timelines'
  })
})

const { timelines } = await response.json()
// timelines = tout le planning de production
```

### UPDATE: Marquer une production comme en cours

```javascript
const response = await fetch('/api/production/timeline', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'update-status',
    timelineId: 'timeline-uuid',
    status: 'en_cours'  // 'en_attente' → 'en_cours' → 'terminée'
  })
})
```

---

## 5️⃣ Signalements de problèmes

### SIGNALER un problème

```javascript
const response = await fetch('/api/production/issues', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'report',
    productionTimelineId: 'timeline-uuid',
    teamId: 1,
    issueDescription: 'Panne moteur détectée après 2h. Machine arrêtée 1h pour réparation.'
  })
})

const { issue } = await response.json()
// issue.status = 'signalée'
```

### OBTENIR les problèmes pour l'admin

```javascript
const response = await fetch('/api/production/issues', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'get-all'
  })
})

const { issues } = await response.json()
// issues = tous les problèmes, triés par date DESC
```

### CORRIGER un problème (Admin)

```javascript
const response = await fetch('/api/production/issues', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'correct',
    issueId: 'issue-uuid',
    timeActualUsed: 3.5,  // Temps réel utilisé
    correctedBy: 'admin-user-uuid'
  })
})

const { issue } = await response.json()
// issue.status = 'corrigée'
// production_timeline.time_used = 3.5
// production_timeline.status = 'en_attente'
```

---

## 6️⃣ Stockage persistant: Team ID pour Conducteur

```javascript
// Au login du conducteur, sauvegarder son équipe
localStorage.setItem('conductor_team_id', '1')

// Lire dans le dashboard
const teamId = parseInt(localStorage.getItem('conductor_team_id') || '1')
```

---

## 7️⃣ Tests avec CURL

### Créer et planifier une production

```bash
curl -X POST http://localhost:3000/api/production/create-and-schedule \
  -H "Content-Type: application/json" \
  -d '{
    "productionData": {
      "total_quantity": 1000,
      "pieces_count": 500,
      "waste_percentage": 5,
      "useful_quantity": 950,
      "hd_percentage": 70,
      "ld_percentage": 30,
      "hd_quantity": 665,
      "ld_quantity": 285,
      "black_color_quantity": 100,
      "dryer_quantity": 50,
      "weight_per_piece": 2.5,
      "diameter": "25",
      "pressure": "10",
      "speed": 50,
      "production_time": 15,
      "total_length": 5000,
      "user_id": "00000000-0000-0000-0000-000000000000",
      "date": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
      "status": "validated_by_magasinier"
    },
    "articleName": "25",
    "schedule": true
  }'
```

### Signaler un problème

```bash
curl -X POST http://localhost:3000/api/production/issues \
  -H "Content-Type: application/json" \
  -d '{
    "action": "report",
    "productionTimelineId": "timeline-uuid",
    "teamId": 1,
    "issueDescription": "Problème de calibre"
  }'
```

---

## ⚡ Checklist avant production

- [ ] Migration SQL exécutée dans Supabase
- [ ] Les 3 équipes créées (`teams` table)
- [ ] Types TypeScript importés correctement
- [ ] APIs testées (pas d'erreur 500)
- [ ] Interface Conducteur accessible à `/conductor`
- [ ] Admin onglet "Problèmes" visible et fonctionnel
- [ ] LocalStorage `conductor_team_id` défini
- [ ] Comportement des calibres testé (25, 32, 40, etc.)
- [ ] Setup time 2h appliqué au changement d'article
- [ ] Signalement de problème fonctionnel
- [ ] Correction admin applique les changements

---

## 🚨 Dépannage

### Erreur: "teamId is required"
→ Vérifier que `conductor_team_id` est défini dans localStorage

### Erreur: "Production not found"
→ Vérifier que la production est bien créée dans `production_records`

### Timeline vide pour une équipe
→ Vérifier que `team_id` dans `production_timeline` est correct

### Problème ne s'affiche pas dans admin
→ Vérifier les RLS policies dans Supabase (`production_issues` table)

### Setup time ne s'ajoute pas
→ Vérifier que `article_name` change entre 2 productions consécutives
