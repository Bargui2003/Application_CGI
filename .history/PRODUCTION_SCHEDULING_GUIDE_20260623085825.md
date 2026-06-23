# 🏭 Production Scheduling System - Guide d'intégration

## ✅ Étapes d'implémentation complètes

### **1. Migration SQL ✓**
Fichier créé: `scripts/005_production_scheduling.sql`

**Actions à faire:**
1. Accédez à Supabase SQL Editor
2. Copiez le contenu de `scripts/005_production_scheduling.sql`
3. Exécutez le script
4. Vérifiez les tables créées:
   - `teams` (3 équipes)
   - `production_timeline` (planifications)
   - `production_issues` (problèmes signalés)

---

### **2. Interface TypeScript ✓**
Fichier modifié: `lib/supabase.ts`

Nouvelles interfaces ajoutées:
- `Team`
- `ProductionTimeline`
- `ProductionIssue`

---

### **3. APIs créées ✓**

#### **API 1: Timeline de Production**
Fichier: `app/api/production/timeline/route.ts`

Actions disponibles:
- `schedule` - Assigner une production aux équipes
- `get-team-production` - Obtenir la production actuelle d'une équipe
- `get-all-timelines` - Lister tous les planifications
- `update-status` - Mettre à jour le statut (en_attente → en_cours → terminée)

#### **API 2: Gestion des problèmes**
Fichier: `app/api/production/issues/route.ts`

Actions disponibles:
- `report` - Signaler un problème
- `get-all` - Lister tous les problèmes
- `get-by-team` - Lister les problèmes d'une équipe
- `correct` - Approuver la correction

---

### **4. Composants créés ✓**

#### **Composant 1: Interface Conducteur**
Fichier: `components/conductor-dashboard.tsx`

Fonctionnalités:
- Affiche la production actuelle de l'équipe
- Bouton "Démarrer production"
- Bouton "Signaler problème"
- Bouton "Terminer production"
- Planning complet de l'équipe
- Auto-refresh toutes les 30 secondes

#### **Composant 2: Signalement de problème**
Fichier: `components/conductor-issue-report.tsx`

Dialog permettant au conducteur de:
- Décrire le problème rencontré
- Indiquer le temps réel utilisé
- Envoyer au serveur pour validation admin

#### **Composant 3: Admin Issues Tab**
Fichier: `components/admin-issues-tab.tsx`

Fonctionnalités:
- Affiche tous les problèmes signalés par les équipes
- Filtrage par statut (signalée, corrigée)
- Dialog de correction avec validation du temps
- Application immédiate des corrections au planning

#### **Composant 4: Intégration Admin**
Fichier modifié: `components/magasinier-dashboard-v2.tsx`

Changements:
- Ajout de 3ème onglet "Problèmes"
- Import du composant `AdminIssuesTab`
- TabsList modifiée de 2 à 3 colonnes

---

### **5. Page Conducteur ✓**
Fichier: `app/conductor/page.tsx`

Accès: `/conductor`

---

## 🚀 Intégration avec votre flux existant

### **Quand une nouvelle production est créée:**

1. **Admin/Magasinier crée une production** dans le dashboard
2. **Appel API pour planifier:**
```javascript
POST /api/production/timeline
{
  action: 'schedule',
  productionId: 'uuid-production',
  articleName: '25',  // ou 32, 40, 50, 63, 75, 90
  totalTime: 15       // en heures
}
```

3. **Réponse API retourne** les assignations par équipe
4. **Conducteurs voient** leur production dans le dashboard `/conductor`

---

## 🔧 Configuration de l'équipe pour Conducteur

Chaque conducteur doit définir son numéro d'équipe (1, 2, ou 3) au premier login:

```javascript
// Dans conductor-dashboard.tsx
const teamId = parseInt(localStorage.getItem('conductor_team_id') || '1')
```

**À améliorer:** Ajouter une sélection d'équipe au login des conducteurs

---

## 📊 Flux du Signalement de Problème

```
Conducteur signale problème
    ↓
production_timeline.status = 'bloquée'
    ↓
Admin voit le problème dans l'onglet "Problèmes"
    ↓
Admin approuve correction + temps réel
    ↓
production_timeline.time_used = temps réel
production_timeline.status = 'en_attente'
    ↓
Conducteur peut continuer
```

---

## 🎯 Prochaines améliorations à faire

### **1. Authentification Conducteur**
- Créer un système d'assignation équipe au login
- Ajouter un sélecteur d'équipe au profil conducteur

### **2. Recalcul intelligent du Planning**
- Quand une correction est appliquée, recalculer automatiquement les assignations suivantes
- Ajouter une fonction de "réplanification" intelligente

### **3. Notifications Real-time**
- Utiliser Supabase Realtime pour notifier les conducteurs de changements
- Notifier l'admin quand un problème est signalé

### **4. Rapports & Analytics**
- Voir le temps moyen par article
- Identifier les goulets d'étranglement (articles qui dépassent le temps)
- Dashboard de performance par équipe

### **5. Interface Planning Admin**
- Visualiser le calendrier complet de production
- Drag-drop pour réassigner des productions
- Vue Gantt chart

---

## 📋 Calibres configurés

Tous les calibres disponibles:
```
25, 32, 40, 50, 63, 75, 90 (mm)
```

Temps de setup entre articles différents: **2 heures**

---

## 🧪 Test rapide

### **Test du scheduling:**
```bash
# 1. Créer une production (via API ou interface magasinier)
# 2. Exécuter le scheduling avec 15 heures
# 3. Vérifier que la production est divisée entre les équipes

# Exemple: Production de 15h ajoutée à 10:00
# Équipe 1: Pas applicable (démarre à 07:00, déjà terminée)
# Équipe 2: 5h (15:00-20:00)
# Équipe 3: 8h (23:00-07:00)
# Équipe 1: 2h (07:00-09:00 +1)
```

### **Test du signalement:**
```bash
# 1. Se connecter comme conducteur
# 2. Cliquer sur "Signaler problème"
# 3. Remplir et soumettre
# 4. Vérifier dans admin onglet "Problèmes"
# 5. Approuver la correction
# 6. Vérifier que le time_used est mis à jour
```

---

## ⚠️ Points importants

1. **Les équipes sont fixes** (1, 2, 3) avec horaires définis
2. **Le setup time de 2h** s'ajoute automatiquement au changement d'article
3. **Quand une production n'a pas de setup initial**, pas de temps setup ajouté
4. **Les conducteurs voient que LEUR équipe** dans le dashboard
5. **L'admin voit TOUS les problèmes** et peut tous les corriger

---

## 📞 Support

Pour chaque onglet/feature, vérifier:
- ✅ Les APIs répondent correctement (200, pas d'erreur 500)
- ✅ Les données Supabase sont créées
- ✅ Les RLS policies permettent l'accès
- ✅ Les imports TypeScript sont corrects

Fichiers clés à vérifier:
- `scripts/005_production_scheduling.sql` (migration)
- `lib/supabase.ts` (types)
- `app/api/production/timeline/route.ts` (scheduling)
- `app/api/production/issues/route.ts` (problèmes)
- `components/conductor-dashboard.tsx` (interface conducteur)
- `components/admin-issues-tab.tsx` (admin corrections)
