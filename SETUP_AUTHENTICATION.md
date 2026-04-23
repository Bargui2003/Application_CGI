# 🚀 Deployment Guide - Authentification + Rôles

## 📋 Checklist de Déploiement

### Phase 1: Configuration Supabase

- [ ] **Étape 1**: Aller à https://app.supabase.com
- [ ] **Étape 2**: Sélectionner le projet `comptoir-production`
- [ ] **Étape 3**: Cliquer sur `SQL Editor` (à gauche)
- [ ] **Étape 4**: Créer une nouvelle query
- [ ] **Étape 5**: Copier le contenu de `scripts/002_create_users_table.sql`
- [ ] **Étape 6**: Coller dans l'éditeur SQL
- [ ] **Étape 7**: Cliquer sur `RUN` (ou Cmd+Enter)
- [ ] **Étape 8**: Attendre le message de succès ✅

### Phase 2: Vérifier la Table Users

```sql
-- Dans Supabase SQL Editor, exécutez:
SELECT username, role, created_at FROM users;

-- Vous devriez voir:
-- username    | role      | created_at
-- ------------|-----------|----------
-- admin       | admin     | 2024-...
-- conducteur  | conducteur| 2024-...
```

### Phase 3: Vérifier le Fichier .env.local

Dans la racine du projet, vérifier que `.env.local` contient:

```env
NEXT_PUBLIC_SUPABASE_URL=https://moxxhqfiwjxvwzacgmrf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

Si absent, créer le fichier avec les valeurs de Supabase Settings → API → Keys

### Phase 4: Démarrer l'Application

```bash
# Terminal 1: Démarrer le serveur
npm run dev

# Attendre:
# ✓ Ready in 2.5s
# ▲ Next.js 16.2.0
# Local: http://localhost:3000
```

### Phase 5: Tester l'Authentification

**Test 1: Redirection Login**
- [ ] Ouvrir http://localhost:3000
- [ ] ✅ Redirection automatique vers http://localhost:3000/login

**Test 2: Login Admin**
- [ ] Entrer: `admin` / `admin`
- [ ] Cliquer "Se connecter"
- [ ] ✅ Dashboard avec 5 onglets visibles
- [ ] ✅ Profil en haut à droite affiche "admin"

**Test 3: Voir les Onglets Admin**
- [ ] Onglets visibles:
  - ✅ Calculatrice
  - ✅ Stocks
  - ✅ Alertes
  - ✅ Historique
  - ✅ Spécifications

**Test 4: Logout**
- [ ] Cliquer sur l'avatar (haut droit)
- [ ] Cliquer "Se déconnecter"
- [ ] ✅ Redirection vers /login

**Test 5: Login Conducteur**
- [ ] Entrer: `conducteur` / `conducteur`
- [ ] Cliquer "Se connecter"
- [ ] ✅ Dashboard avec 3 onglets SEULEMENT:
  - ✅ Stocks
  - ✅ Alertes
  - ✅ Spécifications
- [ ] ❌ Calculatrice et Historique MASQUÉS

**Test 6: Mode Lecture Seule Stock**
- [ ] Voir le message "Mode Lecture Seule" en haut
- [ ] Boutons "Ajouter Stock" / "Retirer Stock" → Désactivés
- [ ] Boutons "±10", "±50", etc. → Désactivés
- [ ] ✅ Historique visible (lecture seule)

**Test 7: Inscription**
- [ ] Logout puis aller à http://localhost:3000/register
- [ ] Remplir:
  - Username: `test123`
  - Email: `test@test.com`
  - Password: `password123`
  - Confirmer: `password123`
- [ ] Cliquer "S'inscrire"
- [ ] ✅ Accès au dashboard (rôle: Conducteur)
- [ ] ✅ Profil affiche "test123"

---

## 🔍 Troubleshooting

### ❌ Problème: "Cannot find module '@supabase/supabase-js'"

**Solution**:
```bash
npm install
npm run dev
```

### ❌ Problème: "RLS policy violation on stock_movements"

**Cause**: Tables toujours avec RLS activé

**Solution 1** (Rapide - Démo):
```sql
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE production_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels DISABLE ROW LEVEL SECURITY;
```

**Solution 2** (Production):
```sql
-- Voir GUIDE_SUPABASE.md pour RLS policies
```

### ❌ Problème: Login échoue "Utilisateur non trouvé"

**Vérifier**:
1. Aller à Supabase → Table Editor
2. Sélectionner table `users`
3. Vérifier "admin" et "conducteur" existent
4. Si absent, exécuter le script SQL à nouveau

### ❌ Problème: "Cannot GET /login"

**Cause**: Le fichier n'existe pas

**Vérifier**:
- Fichier existe: `app/login/page.tsx` ✅
- Fichier existe: `app/register/page.tsx` ✅
- Redémarrer: `npm run dev`

### ❌ Problème: Stock page affiche "Add/Remove Stock" même en conducteur

**Cause**: AuthProvider pas chargé ou localStorage incorrect

**Solution**:
1. Ouvrir DevTools (F12)
2. Application → LocalStorage
3. Vérifier `user_role` = "conducteur"
4. Supprimer tout le localStorage
5. Se reconnecter

---

## 📱 Interface Utilisateur

### Page Login
```
┌─────────────────────────┐
│     Comptoir            │
│     Production System   │
├─────────────────────────┤
│   Login                 │
│                         │
│ 👤 Nom d'utilisateur    │
│   [         ]           │
│                         │
│ 🔒 Mot de passe         │
│   [         ]           │
│                         │
│  [SE CONNECTER]         │
│                         │
│ S'inscrire →            │
├─────────────────────────┤
│ Demo: admin/admin       │
│ Demo: conducteur/...    │
└─────────────────────────┘
```

### Page Register
```
┌─────────────────────────┐
│     Comptoir            │
├─────────────────────────┤
│ Créer un compte         │
│                         │
│ [Nom d'utilisateur]     │
│ [Email]                 │
│ [Mot de passe]          │
│ [Confirmer]             │
│                         │
│  [S'INSCRIRE]           │
│                         │
│ Connexion →             │
└─────────────────────────┘
```

### Header (Connecté)
```
┌─────────────────────────────────────┐
│ [LOGO] Comptoir... | [Avatar] admin ↓│
│                     │ admin@...      │
│                     │ [🛡️ Admin]    │
│                     │ ─────────────  │
│                     │ Profil(soon)   │
│                     │ Settings(soon) │
│                     │ ─────────────  │
│                     │ ❌ Se déconnecter│
└─────────────────────────────────────┘
```

### Dashboard (Admin)
```
Onglets: [Calculatrice] [Stocks] [Alertes] [Historique] [Specs]
```

### Dashboard (Conducteur)
```
Onglets: [Stocks] [Alertes] [Specs]

⚠️ Mode Lecture Seule: Vous pouvez consulter les stocks et leur 
historique, mais vous ne pouvez pas les modifier.
```

---

## 📊 Flux d'Authentification

```
┌─ Non-Authentifié
│  GET /               → Redirection /login
│  GET /login          ← Can access
│  GET /register       ← Can access
│  GET /anything-else  → Redirection /login
│
└─ Authentifié + Admin
   GET /               ← Dashboard complet
   GET /stock          ← Accès + Modifier
   GET /alerts         ← Accès
   GET /history        ← Accès
   GET /calculator     ← Accès
   
└─ Authentifié + Conducteur
   GET /               ← Dashboard limité
   GET /stock          ← Accès lecture seule
   GET /alerts         ← Accès
   GET /specs          ← Accès
   GET /calculator     ❌ → Redirection /unauthorized
   GET /history        ❌ → Redirection /unauthorized
```

---

## 🗂️ Structure Fichiers Créés

```
✅ CRÉÉS (Session)
├── app/
│   ├── login/page.tsx                 # Page connexion
│   ├── register/page.tsx              # Page inscription
│   ├── unauthorized/page.tsx          # Page erreur 401
│   └── page.tsx                       # Dashboard protégé
│
├── context/
│   └── auth-context.tsx               # Hook useAuth()
│
├── lib/
│   ├── auth.ts                        # login/register/logout
│   └── protected-page.tsx             # Middleware rôles
│
├── components/
│   ├── user-profile.tsx               # Menu profil + logout
│   ├── header.tsx                     # Modifié (ajout avatar)
│   ├── app-tabs.tsx                   # Rôles + permissions
│   └── stock-management.tsx           # Mode lecture seule
│
├── scripts/
│   └── 002_create_users_table.sql     # Script SQL Supabase
│
└── GUIDE_AUTHENTICATION.md            # Cette documentation

✅ MODIFIÉS
├── app/layout.tsx                     # Ajout AuthProvider
└── components/header.tsx              # Ajout UserProfile
```

---

## 🎯 Validation Finale

**Checklist Complétion:**

- [ ] Table `users` créée dans Supabase
- [ ] Utilisateurs `admin` et `conducteur` existent
- [ ] App démarre sans erreur
- [ ] Login page accessible
- [ ] Login admin → Dashboard 5 onglets
- [ ] Login conducteur → Dashboard 3 onglets
- [ ] Stock conducteur → Mode lecture seule
- [ ] Logout → Redirection login
- [ ] Registration → Nouveau compte créé
- [ ] Non-authentifié → Redirection login

**Si tout ✅ → Authentification Prête en Production!**

---

## 📞 Commandes Rapides

```bash
# Démarrer l'app
npm run dev

# Installer dépendances
npm install

# Build production
npm run build

# Jest tests (optionnel)
npm test

# Exécuter migration SQL
# → Copier le contenu de scripts/002_create_users_table.sql
# → Supabase SQL Editor → RUN
```

---

**Félicitations! Votre système d'authentification est opérationnel! 🎉**
