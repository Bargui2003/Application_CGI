# ✅ Checklist de déploiement - Production Scheduling System

## 📋 Phase 1: Base de données

- [ ] Fichier `scripts/005_production_scheduling.sql` existe
- [ ] SQL exécuté dans Supabase
- [ ] Table `teams` créée avec 3 équipes:
  - [ ] Team 1: 07:00-15:00
  - [ ] Team 2: 15:00-23:00
  - [ ] Team 3: 23:00-07:00
- [ ] Table `production_timeline` créée
- [ ] Table `production_issues` créée
- [ ] RLS policies appliquées
- [ ] Colonnes `article_name`, `order_time`, `team_id`, `total_schedule_time`, `status` ajoutées à `production_records`

### ✅ Vérification SQL
```sql
SELECT COUNT(*) FROM teams;  -- Doit retourner 3
SELECT * FROM teams;        -- Vérifier noms et horaires
```

---

## 🔧 Phase 2: Types TypeScript

- [ ] Fichier `lib/supabase.ts` modifié
- [ ] Interfaces ajoutées:
  - [ ] `Team`
  - [ ] `ProductionTimeline`
  - [ ] `ProductionIssue`
- [ ] Pas d'erreurs de compilation

### ✅ Vérification
```bash
npm run build  # Vérifier pas d'erreur TS
```

---

## 🌐 Phase 3: APIs

### API 1: Timeline

- [ ] Fichier `app/api/production/timeline/route.ts` créé
- [ ] Méthode POST implémentée
- [ ] Actions disponibles:
  - [ ] `schedule` - Assigner production aux équipes
  - [ ] `get-team-production` - Obtenir production actuelle
  - [ ] `get-all-timelines` - Lister tous les plannings
  - [ ] `update-status` - Mettre à jour statut
- [ ] Pas d'erreur 500 sur appels

### API 2: Issues

- [ ] Fichier `app/api/production/issues/route.ts` créé
- [ ] Méthode POST implémentée
- [ ] Actions disponibles:
  - [ ] `report` - Signaler problème
  - [ ] `get-all` - Lister tous les problèmes
  - [ ] `get-by-team` - Lister problèmes par équipe
  - [ ] `correct` - Approuver correction
- [ ] Pas d'erreur 500 sur appels

### API 3: Create & Schedule

- [ ] Fichier `app/api/production/create-and-schedule/route.ts` créé
- [ ] Crée production ET la planifie automatiquement
- [ ] Retour inclut `production` et `timeline`

### ✅ Vérification API
```bash
# Test timeline
curl -X POST http://localhost:3000/api/production/timeline \
  -H "Content-Type: application/json" \
  -d '{"action":"get-all-timelines"}'

# Test issues
curl -X POST http://localhost:3000/api/production/issues \
  -H "Content-Type: application/json" \
  -d '{"action":"get-all"}'
```

---

## 🎨 Phase 4: Composants

### Composant 1: Conductor Dashboard

- [ ] Fichier `components/conductor-dashboard.tsx` créé
- [ ] Affiche production actuelle
- [ ] Bouton "Démarrer production"
- [ ] Bouton "Signaler problème"
- [ ] Bouton "Terminer production"
- [ ] Planning de l'équipe visible
- [ ] Auto-refresh 30s
- [ ] Pas d'erreur console

### Composant 2: Issue Report

- [ ] Fichier `components/conductor-issue-report.tsx` créé
- [ ] Dialog avec form
- [ ] Champs: description + temps réel
- [ ] Validation des inputs
- [ ] Toast sur succès
- [ ] Appel API `report` fonctionne

### Composant 3: Admin Issues Tab

- [ ] Fichier `components/admin-issues-tab.tsx` créé
- [ ] Liste tous les problèmes
- [ ] Filtre par statut (signalée/corrigée)
- [ ] Dialog correction
- [ ] Validation du temps
- [ ] Appel API `correct` fonctionne
- [ ] Pas d'erreur console

### Composant 4: Dashboard Admin

- [ ] Fichier `components/magasinier-dashboard-v2.tsx` modifié
- [ ] Import `AdminIssuesTab` ajouté
- [ ] TabsList 3 colonnes au lieu de 2
- [ ] TabsTrigger "Problèmes" ajouté
- [ ] TabsContent "issues" avec `<AdminIssuesTab />`
- [ ] Onglet visible et cliquable

### ✅ Vérification Composants
```bash
npm run build  # Pas d'erreur
# Tester manuellement dans navigateur
```

---

## 📄 Phase 5: Pages

- [ ] Fichier `app/conductor/page.tsx` créé
- [ ] Importe `ConductorDashboard`
- [ ] Accessible à `/conductor`
- [ ] Pas d'erreur au chargement
- [ ] Dashboard affiche les données

### ✅ Vérification
```bash
# Ouvrir dans navigateur
http://localhost:3000/conductor
# Vérifier pas d'erreur 404 ou d'autres erreurs
```

---

## 🧪 Phase 6: Tests fonctionnels

### Test 1: Création & Planification

- [ ] Admin crée une production (15h)
- [ ] API retourne timeline avec assignations
- [ ] Timeline contient:
  - [ ] Production divisée entre équipes
  - [ ] Temps total correct (15h)
  - [ ] Setup time correct (0h car premier article)
  - [ ] Statuts "en_attente"

### Test 2: Interface Conducteur

- [ ] Conducteur accède à `/conductor`
- [ ] Voit sa production actuelle
- [ ] Voit le planning complet
- [ ] Clique "Démarrer production" → Status devient "en_cours"
- [ ] Clique "Signaler problème" → Dialog apparaît
- [ ] Clique "Terminer production" → Status devient "terminée"

### Test 3: Signalement de Problème

- [ ] Conducteur remplit le form de signalement
- [ ] Clique "Signaler"
- [ ] Toast "Problème signalé"
- [ ] Admin voit le problème dans onglet "Problèmes"
- [ ] Status du problème = "signalée"
- [ ] Timeline status = "bloquée"

### Test 4: Correction Admin

- [ ] Admin voit le problème dans onglet
- [ ] Clique sur le problème → Dialog correction
- [ ] Modifie le temps (ex: 6.5h au lieu de 5h)
- [ ] Clique "Valider correction"
- [ ] Production issue status = "corrigée"
- [ ] Timeline time_used = 6.5
- [ ] Timeline status = "en_attente"

### Test 5: Setup Time

- [ ] Créer production article 25 (10h)
- [ ] Vérifier planification OK
- [ ] Créer production article 32 (5h)
- [ ] Vérifier setup time 2h ajouté
- [ ] Timeline montre: 2h setup + 3h production (= 5h de l'équipe)

---

## 🔐 Phase 7: Sécurité & Permissions

- [ ] RLS policies respectées pour `production_timeline`
- [ ] RLS policies respectées pour `production_issues`
- [ ] Conducteurs ne peuvent pas voir autres équipes
- [ ] Admin peut voir tout
- [ ] Pas d'accès non-autorisé aux données

### ✅ Vérification Supabase
```sql
-- Vérifier les policies
SELECT * FROM pg_policies WHERE tablename IN ('production_timeline', 'production_issues');
```

---

## 📊 Phase 8: Documentation

- [ ] Fichier `PRODUCTION_SCHEDULING_GUIDE.md` créé
- [ ] Fichier `SCHEDULING_EXAMPLES.md` créé
- [ ] Tous les endpoints documentés
- [ ] Exemples d'utilisation clairs
- [ ] Troubleshooting inclus

---

## 🚀 Phase 9: Avant Production

### Code Quality
- [ ] Pas d'erreurs TypeScript (`npm run build`)
- [ ] Pas d'warnings de console
- [ ] Code formaté (Prettier)
- [ ] Pas de `console.log` en production

### Performance
- [ ] Requêtes Supabase optimisées
- [ ] Index créés sur:
  - [ ] `production_timeline.team_id`
  - [ ] `production_timeline.status`
  - [ ] `production_issues.status`
  - [ ] `production_issues.created_at`

### Tests
- [ ] Planification avec 15h OK
- [ ] Planification avec changement article OK
- [ ] Signalement problème OK
- [ ] Correction admin OK
- [ ] Tous les calibres testés (25, 32, 40, 50, 63, 75, 90)

---

## 📱 Phase 10: Configuration User

### Pour chaque Conducteur
- [ ] Créer compte avec rôle `conductor`
- [ ] Assigner numéro d'équipe (1, 2 ou 3)
- [ ] localStorage `conductor_team_id` défini

### Pour chaque Admin
- [ ] Créer compte avec rôle `admin` (ou magasinier = admin)
- [ ] Accès à tous les onglets du dashboard

---

## 🎯 Statuts de Finition

### ✅ COMPLET
- [ ] Toutes les étapes ci-dessus cochées
- [ ] Production prête au déploiement

### ⚠️ EN COURS
- [ ] Certaines étapes non finies
- [ ] Voir la phase qui bloque

### ❌ NON DÉMARRÉ
- [ ] Aucune étape commencée

---

## 🔄 Post-Déploiement

### Monitoring
- [ ] Vérifier les logs des erreurs API
- [ ] Monitorer la performance des requêtes
- [ ] Vérifier la cohérence des données planning

### Optimisations futures
- [ ] [ ] Notifications Realtime via Supabase
- [ ] [ ] Rapports & Analytics
- [ ] [ ] Dashboard Gantt chart
- [ ] [ ] Prédictions de retards
- [ ] [ ] Auto-réassignation intelligente

---

## 📞 Support & Debugging

### Si erreur 500 dans les APIs
1. Vérifier les logs Supabase
2. Vérifier la requête SQL est correcte
3. Vérifier RLS policies permettent l'accès
4. Vérifier les variables d'environnement

### Si interface ne charge pas
1. Vérifier pas d'erreur réseau (F12)
2. Vérifier API répond (curl test)
3. Vérifier imports TypeScript
4. Vérifier localStorage accessible

### Si planification incorrecte
1. Vérifier l'heure actuelle du serveur
2. Vérifier les horaires des équipes
3. Vérifier les calculs de temps
4. Vérifier article_name n'est pas NULL

---

## 🎉 Déploiement terminé quand:

✅ Tous les tests passent
✅ Aucune erreur console
✅ Interface Conducteur fonctionne
✅ Admin peut voir et corriger les problèmes
✅ Équipes voient le bon planning
✅ Signalements fonctionnent correctement
