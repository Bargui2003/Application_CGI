# Implémentation Supabase - Guide Complet

## Vue d'ensemble

Ce document explique l'implémentation complète de Supabase pour l'application CGI Production Management.

## Architecture

### 1. Authentification (Phase 2)

#### Services d'authentification
- **`lib/supabase/auth-service.ts`** - Service principal pour l'authentification Supabase
  - `signUp()` - Inscription avec email/password
  - `signIn()` - Connexion
  - `signOut()` - Déconnexion
  - `getSession()` - Récupérer la session actuelle
  - `onAuthStateChange()` - Écouter les changements d'authentification

#### Routes API
- **`app/api/auth/login/route.ts`** - Connexion via Supabase Auth
- **`app/api/auth/register/route.ts`** - Inscription via Supabase Auth
- **`app/api/auth/logout/route.ts`** - Déconnexion

#### Contexte d'authentification
- **`context/auth-context.tsx`** - Contexte React pour l'état d'authentification
  - Utilise `SupabaseAuthService`
  - Gère les changements d'état d'authentification en temps réel
  - Fournit les hooks `useAuth()`

### 2. Services CRUD (Phase 3)

#### Services métier
- **`lib/supabase/user-service.ts`** - Gestion des utilisateurs
  - `getAllUsers()` - Récupérer tous les utilisateurs
  - `getUserById()` - Récupérer un utilisateur par ID
  - `updateUserRole()` - Changer le rôle d'un utilisateur
  - `getUsersByRole()` - Filtrer par rôle
  - `searchUsers()` - Rechercher des utilisateurs

- **`lib/supabase/stock-service.ts`** - Gestion des stocks
  - `getCurrentLevels()` - Récupérer les niveaux actuels
  - `updateLevels()` - Mettre à jour les stocks
  - `consumeMaterial()` - Consommer du matériel
  - `addMaterial()` - Ajouter du matériel
  - `logMovement()` - Enregistrer un mouvement
  - `subscribeToStockChanges()` - S'abonner aux changements en temps réel

- **`lib/supabase/production-service.ts`** - Gestion de la production
  - `createRecord()` - Créer un enregistrement
  - `getAllRecords()` - Récupérer les enregistrements
  - `updateRecord()` - Mettre à jour
  - `validateRecord()` - Valider (conducteur)
  - `validateByMagasinier()` - Valider (magasinier)
  - `rejectRecord()` - Rejeter
  - `subscribeToProductionChanges()` - S'abonner aux changements

#### Routes API
- **`app/api/stock/current/route.ts`** - GET/POST niveaux de stock
- **`app/api/stock/movements/route.ts`** - GET/POST mouvements de stock
- **`app/api/production/records/route.ts`** - GET/POST enregistrements
- **`app/api/production/records/[id]/route.ts`** - GET/PUT/DELETE par ID
- **`app/api/users/route.ts`** - GET utilisateurs
- **`app/api/users/[id]/route.ts`** - GET/PUT/DELETE utilisateur par ID

### 3. Sécurité RLS (Phase 4)

#### Politiques de sécurité
- **`scripts/005_production_rls_policies.sql`** - Politiques RLS pour production
  - ADMIN : Accès complet
  - CONDUCTEUR : Accès aux propres enregistrements
  - MAGASINIER : Accès lecture/validation

### 4. Middleware et Protection (Phase 5)

#### Middleware
- **`lib/middleware.ts`** - Middleware de protection des routes
  - `withAuth()` - Vérifier l'authentification
  - `withRole()` - Vérifier les rôles
  - `withAudit()` - Logger les activités
  - `withRateLimit()` - Limiter le taux de requêtes

#### Composants de protection
- **`components/auth/protected-route.tsx`** - Composant pour protéger les pages
  - Vérifiie l'authentification
  - Vérifiie les rôles requis
  - Redirige vers login si nécessaire

#### Hooks
- **`lib/hooks/use-supabase.ts`** - Hooks pour accéder aux services
  - `useUsers()` - Gérer les utilisateurs
  - `useStockLevels()` - Gérer les stocks
  - `useProductionRecords()` - Gérer la production
  - `useRealtimeStock()` - S'abonner aux changements de stock
  - `useRealtimeProduction()` - S'abonner aux changements de production

## Flux d'authentification

### Inscription
```
1. Utilisateur remplit le formulaire d'inscription
2. POST /api/auth/register
3. Supabase Auth crée l'utilisateur
4. Trigger crée le profil dans profiles table
5. Réponse avec user et session
```

### Connexion
```
1. Utilisateur entre email/password
2. POST /api/auth/login
3. Supabase Auth valide les identifiants
4. Session JWT retournée
5. AuthContext met à jour l'état
6. Composants utilisent useAuth() pour accéder aux données
```

### Déconnexion
```
1. Utilisateur clique sur "Déconnecter"
2. SupabaseAuthService.signOut()
3. Supabase invalide la session
4. AuthContext efface l'utilisateur
5. Redirection vers login
```

## Utilisation des Services

### Exemple : Créer un enregistrement de production

```typescript
// Dans un composant
import { useProductionRecords } from '@/lib/hooks/use-supabase'

export function ProductionForm() {
  const { createRecord, isLoading, error } = useProductionRecords(userId)

  const handleSubmit = async (data) => {
    try {
      const record = await createRecord({
        total_quantity: 100,
        pieces_count: 50,
        waste_percentage: 10,
        // ... autres champs
      })
      console.log('Enregistrement créé:', record)
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* formulaire */}
    </form>
  )
}
```

### Exemple : S'abonner aux changements en temps réel

```typescript
import { useRealtimeStock } from '@/lib/hooks/use-supabase'

export function StockMonitor() {
  const [stock, setStock] = useState(null)

  useRealtimeStock((updatedStock) => {
    setStock(updatedStock)
    console.log('Stock mis à jour:', updatedStock)
  })

  return <div>Stock actuel: {stock?.hd}</div>
}
```

### Exemple : Protéger une page

```typescript
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={['admin']}>
      {/* Contenu admin */}
    </ProtectedRoute>
  )
}
```

## Variables d'environnement requises

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

## Migrations SQL à exécuter

1. **`scripts/001_create_tables.sql`** - Tables de base
2. **`scripts/002_create_users_table.sql`** - Table utilisateurs (optionnel, Auth est préféré)
3. **`scripts/003_add_user_profile_fields.sql`** - Champs profil
4. **`scripts/004_fix_rls_policies.sql`** - Politiques de développement (temporaire)
5. **`scripts/005_production_rls_policies.sql`** - Politiques production (à utiliser en production)

## Activation des politiques RLS

### Pour développement (temporaire)
```sql
-- Exécuter scripts/004_fix_rls_policies.sql
-- Cela désactive RLS pour le développement
```

### Pour production
```sql
-- Exécuter scripts/005_production_rls_policies.sql
-- Cela active RLS avec les politiques d'accès appropriées
```

## Checklist de déploiement

- [ ] Variables d'environnement configurées
- [ ] Migrations SQL exécutées
- [ ] RLS activé avec les bonnes politiques
- [ ] Service d'authentification testé (inscription/connexion)
- [ ] Hooks de données testés
- [ ] Abonnements en temps réel testés
- [ ] Protection des routes vérifiée
- [ ] Rôles et accès vérifiés
- [ ] Audit logging testé

## Troubleshooting

### Erreur : "Supabase env vars missing"
→ Vérifier que `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont définis

### Erreur : "RLS policy violation"
→ Vérifier que l'utilisateur a les bonnes permissions pour la table

### Erreur : "User not found"
→ Vérifier que le profil a été créé correctement après l'inscription

### Abonnements en temps réel ne fonctionnent pas
→ Vérifier que Realtime est activé dans Supabase Dashboard

## Support et ressources

- Supabase Docs: https://supabase.com/docs
- Guide d'authentification: https://supabase.com/docs/guides/auth
- RLS Policies: https://supabase.com/docs/guides/auth/row-level-security
- Realtime: https://supabase.com/docs/guides/realtime
