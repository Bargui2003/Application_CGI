# 🔧 Configuration Supabase - Erreur 406

## Problème
Erreur **406 (Not Acceptable)** lors de la connexion au formulaire de login.

## Cause
Les routes API utilisent maintenant la clé de service Supabase pour contourner les problèmes RLS (Row Level Security). Sans cette clé configurée, les requêtes échouent.

## Solution

### 1. Créer le fichier `.env.local`

À la racine du projet, créez un fichier `.env.local` avec les variables suivantes:

```env
# Variables existantes (à garder)
NEXT_PUBLIC_SUPABASE_URL=https://moxxhqfiwjxvwzacgmrf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon_ici

# Nouvelle variable requise (TRÈS IMPORTANT)
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role_ici
```

### 2. Obtenir vos clés Supabase

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **API** 
4. Copez:
   - **URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service role key**: `SUPABASE_SERVICE_ROLE_KEY` (⚠️ NE JAMAIS partager!)

### 3. Permissions RLS (optionnel mais recommandé)

Si vous souhaitez aussi que l'enregistrement/login fonctionne sans la clé service, configurez les RLS sur votre table `users`:

```sql
-- Permettre l'insertion anonyme (pour l'enregistrement)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON users
  FOR INSERT WITH CHECK (true);

-- Permettre la lecture anonyme par username
CREATE POLICY "Allow select by username" ON users
  FOR SELECT USING (true);
```

### 4. Redémarrer le serveur

Après avoir ajouté le fichier `.env.local`, redémarrez votre serveur Next.js:

```bash
npm run dev
# ou
pnpm dev
```

## Vérification

- [ ] Fichier `.env.local` créé avec les 3 variables
- [ ] `SUPABASE_SERVICE_ROLE_KEY` renseigné
- [ ] Serveur redémarré
- [ ] Réessayez de vous connecter

## Comptes de test

```
Admin:
- Username: admin
- Password: admin

Conducteur:
- Username: conducteur  
- Password: conducteur
```

## Notes
- La clé service `SUPABASE_SERVICE_ROLE_KEY` est sensible - ne la commitez pas!
- Elle reste sécurisée car utilisée uniquement côté serveur (variables d'environnement backend)
- Le fichier `.env.local` doit être dans `.gitignore`
