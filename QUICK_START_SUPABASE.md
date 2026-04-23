# ⚡ Démarrage Éclair Supabase (15 minutes)

## 🎯 Pour les Pressés

### 0️⃣ Prérequis (2 minutes)
```bash
# 1. Node.js installé
node --version

# 2. Vous êtes dans le répertoire du projet
cd "c:\Users\moham\OneDrive\Bureau\KARIM PROJECT\b_Uw2fRioIdvN-1774851100032"

# 3. Installer les dépendances
npm install @supabase/supabase-js
```

---

## 1️⃣ Créer Supabase (3 minutes)

1. Visitez: https://supabase.com
2. Sign Up → Créez un compte
3. **New Project** → Nommez-le `comptoir-production`
4. Attendez qu'il se crée (~3 min)

---

## 2️⃣ Récupérer les Clés (1 minute)

1. Settings (icône engrenage) → **API**
2. Copiez:
   - `Project URL` (ex: `https://xxxxx.supabase.co`)
   - `anon key` (la LONGER)
   - `service_role key` (ne pas partager)

---

## 3️⃣ Configurer `.env.local` (2 minutes)

À la racine du projet, créez un fichier `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Sauvegardez & fermez**

---

## 4️⃣ Créer les Tables (3 minutes)

1. Retournez à Supabase Dashboard
2. **SQL Editor** → **New Query**
3. Copiez-collez ce code (COMPLET):

```sql
-- Table pour les enregistrements de production
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

-- Table pour les niveaux de stock
CREATE TABLE stock_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hd DECIMAL(10, 2) DEFAULT 1000,
  ld DECIMAL(10, 2) DEFAULT 1000,
  black_color DECIMAL(10, 2) DEFAULT 500,
  dryer DECIMAL(10, 2) DEFAULT 500,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Données initiales
INSERT INTO stock_levels (hd, ld, black_color, dryer) 
VALUES (1000, 1000, 500, 500);

-- Table pour les mouvements de stock
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

-- Index pour performance
CREATE INDEX idx_production_records_date ON production_records(date DESC);
CREATE INDEX idx_stock_movements_date ON stock_movements(date DESC);
```

4. Cliquez **Run** → Attendez "Success" ✅

---

## 5️⃣ Activer Supabase dans l'App (2 minutes)

### Option 1 : Garder les deux (TEST)
Fichiers autmatiquement créés:
- `lib/supabase.ts` ✅
- `context/production-context-supabase.tsx` ✅

Pas besoin de modifier quoi que ce soit pour tester!

### Option 2 : Remplacer complètement (PRODUCTION)

Ouvrez `app/layout.tsx` et modifiez:

```typescript
// AVANT
import { ProductionProvider } from '@/context/production-context'

// APRÈS
import { ProductionProvider } from '@/context/production-context-supabase'
```

---

## 6️⃣ Lancer l'App (1 minute)

```bash
npm run dev
```

Ouvrez: http://localhost:3000

---

## 🧪 Test Rapide (2 minutes)

1. **Ajouter une production:**
   - Remplissez le formulaire
   - Cliquez "Calculer"
   - Cliquez "Sauvegarder"

2. **Vérifier dans Supabase:**
   - Settings → API → Copiez anon key
   - Ouvrez: https://app.supabase.com
   - Table Editor → `production_records`
   - Devrait voir la nouvelle ligne! ✅

---

## ✅ Vous Avez Fini!

```
✅ Compte Supabase créé
✅ Tables créées
✅ .env.local configuré
✅ Dépendances installées
✅ App fonctionne avec Supabase
✅ Données persistan en cloud
```

---

## 📚 Guides Complets

Pour plus de détails, consultez:

- **GUIDE_SUPABASE.md** - Guide détaillé (étape-par-étape)
- **CHECKLIST_SUPABASE.md** - Checklist complète
- **GUIDE_TEST_SUPABASE.md** - Cas de test
- **SUPABASE_INTEGRATION.md** - Vue d'ensemble technique

---

## 🆘 Problème?

### "Clés manquantes"
→ Vérifier `.env.local` existe et contient les 3 variables

### "Table not found"
→ Réexécuter le script SQL complet

### "Unauthorized"
→ Vérifier les clés ne sont pas mal copiées

### Autres
→ Consultar **GUIDE_SUPABASE.md** section "Dépannage"

---

## 🎉 Prêt pour la Production?

```bash
# Tester localement
npm run dev

# Build pour production
npm run build

# Deployer sur Vercel
npm install -g vercel
vercel

# Ajouter les variables d'environnement dans Vercel
```

---

**Temps estimé: 15 minutes ⏱️**
**Résultat: Base de données cloud opérationnelle 🚀**
