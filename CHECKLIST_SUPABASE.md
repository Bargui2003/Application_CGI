# ✅ Checklist d'Intégration Supabase

Suivez cette checklist pour intégrer Supabase étape par étape.

## 🎯 PHASE 1 : Configuration Supabase

### Étape 1 : Créer un Compte
- [ ] Visitez https://supabase.com
- [ ] Créez un compte gratuit
- [ ] Confirmez votre email

### Étape 2 : Créer un Projet
- [ ] Créez un "New Project"
- [ ] Nommez-le `comptoir-production`
- [ ] Sauvegardez le mot de passe de base de données
- [ ] Choisissez votre région
- [ ] Attendez 3-5 minutes pour que le projet soit créé

### Étape 3 : Récupérer les Clés
- [ ] Allez à Settings → API
- [ ] Copiez l'URL du projet (Project URL)
- [ ] Copiez la clé `anon` (NEXT_PUBLIC_SUPABASE_ANON_KEY)
- [ ] Copiez la clé `service_role` (SUPABASE_SERVICE_ROLE_KEY)

---

## 🔧 PHASE 2 : Configuration Locale

### Étape 4 : Créer .env.local
À la racine du projet, créez un fichier `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://yourrproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

- [ ] Fichier `.env.local` créé
- [ ] Variables remplies correctement
- [ ] `.env.local` n'est PAS dans Git

### Étape 5 : Installer les Dépendances

Option A - Avec npm:
```bash
npm install @supabase/supabase-js
```

Option B - Avec pnpm:
```bash
pnpm add @supabase/supabase-js
```

Option C - Avec le script:
```bash
bash scripts/setup-supabase.sh
```

- [ ] `@supabase/supabase-js` installé
- [ ] `package.json` mis à jour

---

## 📊 PHASE 3 : Créer les Tables

### Étape 6 : Créer les Tables dans Supabase

1. Allez à **SQL Editor** dans le Dashboard Supabase
2. Cliquez sur **New Query**
3. Copiez-collez les scripts ci-dessous
4. Cliquez **Run** après chaque script

#### Script 1 : Table `production_records`
```sql
CREATE TABLE production_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_quantity DECIMAL(10, 2),
  pieces_count INTEGER,
  waste_percentage DECIMAL(5, 2),
  useful_quantity DECIMAL(10, 2),
  hd_percentage DECIMAL(5, 2),
  ld_percentage DECIMAL(5, 2),
  hd_quantity DECIMAL(10, 2),
  ld_quantity DECIMAL(10, 2),
  black_color_quantity DECIMAL(10, 2),
  dryer_quantity DECIMAL(10, 2),
  weight_per_piece DECIMAL(10, 2),
  diameter VARCHAR(10),
  pressure VARCHAR(10),
  speed DECIMAL(10, 2),
  production_time DECIMAL(10, 2),
  total_length DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_production_records_date ON production_records(date DESC);
```

- [ ] Table `production_records` créée

#### Script 2 : Table `stock_levels`
```sql
CREATE TABLE stock_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hd DECIMAL(10, 2) DEFAULT 1000,
  ld DECIMAL(10, 2) DEFAULT 1000,
  black_color DECIMAL(10, 2) DEFAULT 500,
  dryer DECIMAL(10, 2) DEFAULT 500,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO stock_levels (hd, ld, black_color, dryer) 
VALUES (1000, 1000, 500, 500);
```

- [ ] Table `stock_levels` créée
- [ ] Données initiales insérées

#### Script 3 : Table `stock_movements`
```sql
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  material VARCHAR(20),
  material_label VARCHAR(50),
  quantity DECIMAL(10, 2),
  operation VARCHAR(20),
  before_value DECIMAL(10, 2),
  after_value DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_movements_date ON stock_movements(date DESC);
```

- [ ] Table `stock_movements` créée

---

## 📁 PHASE 4 : Vérifier les Fichiers Créés

- [ ] Fichier `lib/supabase.ts` existe
- [ ] Fichier `context/production-context-supabase.tsx` existe
- [ ] Fichier `.env.local` existe avec les clés
- [ ] Fichier `GUIDE_SUPABASE.md` pour référence

---

## 🎨 PHASE 5 : Integration dans l'Application

### Étape 7 : Remplacer le Contexte

Vous avez **2 options**:

#### Option A : Remplacer complètement
Remplacez le contenu de `context/production-context.tsx` par le contenu de `production-context-supabase.tsx`

#### Option B : Garder les deux (recommandé pour commencer)
- Gardez `production-context.tsx` avec localStorage
- Utilisez `production-context-supabase.tsx` en parallèle

### Étape 8 : Mettre à Jour `app/layout.tsx`

Modifiez le import dans `app/layout.tsx`:

**Avant:**
```typescript
import { ProductionProvider } from '@/context/production-context'
```

**Après:**
```typescript
import { ProductionProvider } from '@/context/production-context-supabase'
```

- [ ] Import mis à jour dans `layout.tsx`

---

## 🧪 PHASE 6 : Test

### Étape 9 : Tester la Connexion

1. Démarrez l'application:
```bash
npm run dev
```

2. Testez les fonctionnalités:
   - [ ] Ajouter de la production → Voir dans Supabase
   - [ ] Ajouter au stock → Voir dans Supabase
   - [ ] Consulter l'historique → Charger depuis Supabase

3. Vérifiez dans Supabase:
   - Allez à **Table Editor**
   - Vérifiez `production_records` → Doit avoir des enregistrements
   - Vérifiez `stock_levels` → Doit être mis à jour
   - Vérifiez `stock_movements` → Doit avoir un historique

---

## 🆘 Dépannage

### Erreur: "Clés Supabase manquantes"
```
✅ Vérififier .env.local existe
✅ Vérifier NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Erreur: "Table not found"
```
✅ Vérifier que les scripts SQL ont bien été exécutés
✅ Aller à Table Editor dans Supabase
✅ Réexécuter les scripts SQL si nécessaire
```

### Erreur: "Unauthorized"
```
✅ Vérifi les clés ne sont pas expirées
✅ Vérifier les RLS policies (si activées)
✅ Régénérer les clés si nécessaire
```

### Les données ne se sauvegardent pas
```
✅ Vérifier la console navigateur (F12) pour les erreurs
✅ Vérifier les logs Supabase (Logs dans le Dashboard)
✅ Tester avec une nouvelle clé
```

---

## 📚 Fichiers de Référence

- **`GUIDE_SUPABASE.md`** - Guide détaillé complet
- **`lib/supabase.ts`** - Client Supabase et services
- **`.env.example`** - Template des variables d'environnement
- **`context/production-context-supabase.tsx`** - Contexte avec Supabase

---

## ✨ Fonctionnalités Habilitées

Une fois configuré, vous avez:

✅ **Sauvegarde en cloud** - Les données persisten en Supabase
✅ **Sync temps réel** - Supabase a des realtime subscriptions
✅ **Accès multi-utilisateur** - Plusieurs personnes peuvent utiliser l'app
✅ **Historique complet** - Tous les mouvements de stock tracés
✅ **Backup automatique** - Supabase assure la sécurité des données
✅ **API gratuite** - 500 MB gratuit pour commencer

---

## 🎓 Prochaines Étapes

Après avoir terminé cette checklist:

1. En option: Ajouter l'authentification utilisateur (Auth Supabase)
2. En option: Activer RLS (Row Level Security) pour plus de sécurité
3. En option: Créer un dashboard avec des statistiques
4. En option: Configurer les backups automatiques

---

**Besoin d'aide?** Consultez `GUIDE_SUPABASE.md` ou la [documentation Supabase](https://supabase.com/docs)
