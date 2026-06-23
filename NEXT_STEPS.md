# Prochaines Étapes - Implémentation Supabase

Félicitations! L'implémentation Supabase est maintenant **complète et fonctionnelle**. Voici comment procéder:

## 1. Configuration Supabase (Immédiat)

### Créer un projet Supabase
1. Allez sur https://supabase.com
2. Cliquez "Create New Project"
3. Configurez les paramètres:
   - Project Name: "CGI Production" (ou votre nom)
   - Database Password: (Générez un mot de passe fort)
   - Region: (Choisissez proche de vous)
4. Attendez la création (~2 minutes)

### Copier les credentials
1. Dans Supabase Dashboard → Settings → API
2. Copier:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
3. Dans Settings → Database → JWT Secret copier → `SUPABASE_JWT_SECRET`

### Ajouter les env vars à Vercel
```bash
# Dans Vercel Dashboard → Settings → Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your_jwt_secret
```

### Ajouter localement pour développement
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your_jwt_secret
```

## 2. Configuration de la Base de Données

### Exécuter les migrations
1. Dans Supabase Dashboard → SQL Editor
2. Créer une nouvelle requête pour chaque script SQL:
   - Copier contenu de `scripts/001_create_tables.sql` → Execute
   - Copier contenu de `scripts/002_create_users_table.sql` → Execute (optionnel)
   - Copier contenu de `scripts/003_add_user_profile_fields.sql` → Execute
   - Copier contenu de `scripts/004_fix_rls_policies.sql` → Execute (pour dev)

### Vérifier les tables
```bash
# Supabase Dashboard → Table Editor
- profiles ✓
- stock_levels ✓
- production_records ✓
- stock_movements ✓
- user_activity ✓
```

### Activer Realtime (pour les mises à jour en temps réel)
1. Supabase Dashboard → Replication
2. Pour chaque table (stock_levels, production_records):
   - Cliquer sur le toggle pour activer
   - Choisir "All" pour les changements

## 3. Tester Localement

### Démarrer le serveur
```bash
npm run dev
# http://localhost:3000
```

### Tester l'authentification
1. Aller à `/register`
2. Créer un compte avec:
   - Email: test@example.com
   - Password: test123456
   - Name: Test User
   - Role: conducteur
3. Cliquer "S'inscrire"
4. Vous devriez être redirigé vers le dashboard

### Tester les données
1. Créer un enregistrement de production
2. Vérifier les stocks changent
3. Vérifier les mouvements sont enregistrés

## 4. Déploiement sur Vercel

### Pousser le code
```bash
git add .
git commit -m "feat: Complete Supabase implementation"
git push origin main
```

### Vercel auto-déploie
- Allez sur https://vercel.com
- Votre projet devrait se déployer automatiquement
- Vérifiez que les build/deploy réussissent

### Tester en production
1. Allez sur votre URL Vercel
2. Testez l'authentification
3. Testez une opération CRUD

## 5. Activation RLS Production (Important!)

⚠️ **AVANT de donner accès à des utilisateurs réels**, vous DEVEZ activer le RLS proper:

### Exécuter les politiques production
1. Supabase Dashboard → SQL Editor
2. Copier contenu de `scripts/005_production_rls_policies.sql`
3. Execute
4. Vérifier: Supabase Dashboard → Authentication → Policies
   - Il devrait y avoir des politiques pour chaque rôle

### Tester les permissions
1. Créer 3 utilisateurs avec rôles différents:
   - admin@test.com (admin)
   - conductor@test.com (conducteur)
   - magasin@test.com (magasinier)

2. Tester l'accès de chaque rôle:
   - Admin: Accès complet
   - Conducteur: Propres enregistrements uniquement
   - Magasinier: Peut valider les enregistrements

## 6. Monitoring et Maintenance

### Surveillance Supabase
- Supabase Dashboard → Monitoring
- Vérifier:
  - Database health
  - Realtime connections
  - API usage

### Logs Vercel
- Vercel Dashboard → Deployments
- Cliquer sur un deployment
- Aller dans "Runtime logs"
- Vérifier les erreurs

### Backup Supabase
- Supabase → Backups (Pro plan)
- Configurer les sauvegardes quotidiennes

## 7. Fonctionnalités Avancées (Futur)

### À implémenter après:
- [ ] OAuth (Google, GitHub, etc.)
- [ ] Magic Links (connexion sans password)
- [ ] 2FA (Authentification à deux facteurs)
- [ ] SSO (Single Sign-On)
- [ ] File Upload (Avatars, documents)
- [ ] Email Templates (Notifications)
- [ ] Webhooks (Événements)

## 8. Troubleshooting

### "403 - Supabase Error"
→ Vérifier que les env vars sont correctes

### "User not found"
→ Vérifier que le trigger a créé le profil dans Supabase

### "Real-time not working"
→ Vérifier que Realtime est activé pour la table

### "RLS policy violation"
→ Vérifier que l'utilisateur a les bons rôles et permissions

## 9. Documentation

Lire:
- `SUPABASE_IMPLEMENTATION.md` - Guide complet technique
- `SUPABASE_SETUP_CHECKLIST.md` - Checklist détaillée

## 10. Support

### Ressources:
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.io
- Next.js Docs: https://nextjs.org/docs

### Issues Courantes:
- **Build fails**: `npm run build` localement pour déboguer
- **Auth not working**: Vérifier .env.local et Supabase credentials
- **Performance**: Utiliser Supabase Monitoring pour identifier les goulots

## Timeline Recommandé

```
Day 1:
- ✓ Créer projet Supabase
- ✓ Ajouter env vars
- ✓ Exécuter migrations

Day 2:
- ✓ Tester auth localement
- ✓ Tester CRUD operations
- ✓ Tester real-time updates

Day 3:
- ✓ Tester permissions RLS
- ✓ Déployer sur Vercel
- ✓ Tester en production

Day 4+:
- ✓ Formation des utilisateurs
- ✓ Monitoring et maintenance
- ✓ Optimisations de performance
```

## Prochaine Phase

Une fois que tout fonctionne:
1. Former les utilisateurs
2. Importer les données existantes (si applicable)
3. Configurer les backups
4. Monitorer les performances
5. Recueillir les feedback

Bon déploiement! 🚀
