# Guide de Gestion de Profil Utilisateur

## Vue d'ensemble
Chaque utilisateur du système CGI (Admin, Conducteur, Magasinier) peut maintenant gérer complètement son profil personnel, y compris l'upload de photo de profil et la mise à jour de ses informations de contact.

## Fonctionnalités

### 1. Accès à la page de profil
- **Depuis le dashboard** : Cliquer sur l'avatar utilisateur en haut à droite
- **Menu déroulant** : Sélectionner "Mon Profil"
- **URL directe** : `/profile`

### 2. Informations gérables

#### Champs de profil
- **Prénom** (`first_name`)
- **Nom de famille** (`last_name`)
- **Nom d'utilisateur** (`username`)
- **Email** (`email`)
- **Téléphone** (`phone`)
- **Photo de profil** (`avatar`)

### 3. Upload de photo de profil

#### Fonctionnement
1. Cliquer sur l'icône caméra sur l'avatar
2. Sélectionner une image depuis votre ordinateur
3. La photo s'affiche en aperçu
4. Cliquer sur "Sauvegarder les modifications"

#### Contraintes
- **Formats acceptés** : JPEG, PNG, GIF, WebP, SVG
- **Taille maximale** : 5 MB
- **Stockage** : Supabase Storage (bucket: `user-avatars`)
- **Visibilité** : Publique (URL accessible)

### 4. Sauvegarde des modifications

#### Processus
1. Effectuer les modifications dans les champs souhaités
2. Les boutons "Annuler" et "Sauvegarder" deviennent actifs
3. Cliquer sur "Sauvegarder les modifications"
4. Une notification confirme la mise à jour
5. Les données sont immédiatement persistées en base de données

#### Validation
- **Email** : Format email valide requis
- **Téléphone** : Champ libre (format libre)
- **Username** : Champ libre
- **Prénom/Nom** : Champ libre

### 5. Structure de la base de données

#### Table `users`
```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar TEXT;
```

#### Champs
- `id` : UUID (clé primaire)
- `username` : VARCHAR (unique)
- `email` : VARCHAR (unique)
- `role` : VARCHAR ('admin', 'conducteur', 'magasinier')
- `first_name` : TEXT (optionnel)
- `last_name` : TEXT (optionnel)
- `phone` : TEXT (optionnel)
- `avatar` : TEXT (URL publique, optionnel)
- `created_at` : TIMESTAMP
- `updated_at` : TIMESTAMP

## Routes API

### 1. Mise à jour du profil
**Endpoint** : `PUT /api/user/profile`

**Payload** :
```json
{
  "userId": "string (UUID)",
  "firstName": "string",
  "lastName": "string",
  "username": "string",
  "email": "string",
  "phone": "string",
  "avatar": "string (URL)"
}
```

**Réponse** :
```json
{
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "string",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "avatar": "string",
    "created_at": "ISO 8601"
  },
  "message": "Profil mis à jour avec succès"
}
```

**Codes HTTP** :
- `200` : Mise à jour réussie
- `400` : Données invalides
- `404` : Utilisateur non trouvé
- `500` : Erreur serveur

### 2. Upload d'avatar
**Endpoint** : `POST /api/upload-avatar`

**Contenu** : FormData
```
file: File (image)
userId: string (UUID)
```

**Réponse** :
```json
{
  "url": "string (URL publique de l'image)"
}
```

**Codes HTTP** :
- `200` : Upload réussi
- `400` : Fichier ou userId manquant
- `401` : Utilisateur non trouvé
- `500` : Erreur serveur

**Validations côté serveur** :
- Le fichier doit être une image
- Taille maximale : 5 MB
- L'utilisateur doit exister en base de données

## Composants

### 1. Page de profil
**Fichier** : `/app/profile/page.tsx`

**Caractéristiques** :
- Formulaire réactif
- Gestion d'état locale
- Validation des modifications
- Indicateur de chargement
- Notifications toast
- Redirection si non authentifié
- Responsive design

### 2. Composant UserProfile
**Fichier** : `/components/user-profile.tsx`

**Modifications** :
- Ajout du lien "Mon Profil" pointant vers `/profile`
- Suppression du dialog de profil intégré
- Conservation du dropdown menu utilisateur

## Flux d'authentification

### Accès à la page de profil
1. Vérification de l'authentification (contexte `useAuth`)
2. Si non authentifié : redirection vers `/login`
3. Si authentifié : affichage du formulaire
4. Chargement des données utilisateur depuis le contexte

### Sauvegarde du profil
1. Validation locale des modifications
2. Upload de la photo si présente
3. Envoi des données à l'API
4. Mise à jour du contexte utilisateur
5. Rafraîchissement de la session

## Exemples d'utilisation

### Mise à jour simple du profil
```typescript
const response = await fetch('/api/user/profile', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '+33 6 12 34 56 78'
  })
});
```

### Upload de photo
```typescript
const formData = new FormData();
formData.append('file', selectedFile);
formData.append('userId', user.id);

const response = await fetch('/api/upload-avatar', {
  method: 'POST',
  body: formData
});
```

## Sécurité

### Mesures
- **Authentification requise** : Accès uniquement aux utilisateurs connectés
- **Autorisation** : Chaque utilisateur ne peut modifier que son propre profil
- **Validation du serveur** : Vérification que l'utilisateur existe
- **Limite de fichier** : 5 MB pour les images
- **Stockage sécurisé** : Utilisation de Supabase Storage avec RLS

### Politiques RLS (Row Level Security)

#### Bucket `user-avatars`
```sql
-- SELECT: Accessible à tous les utilisateurs authentifiés
SELECT (auth.role() = 'authenticated'::text)

-- INSERT: L'utilisateur peut uploader son propre avatar
INSERT (auth.uid()::text = object_owner)

-- UPDATE: L'utilisateur peut remplacer son avatar
UPDATE (auth.uid()::text = object_owner)

-- DELETE: L'utilisateur peut supprimer son avatar
DELETE (auth.uid()::text = object_owner)
```

## Tests

### Test d'API via curl
```bash
# Mise à jour du profil
curl -X PUT http://localhost:3000/api/user/profile \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "+216 55 555 555"
  }'

# Upload d'avatar
curl -X POST http://localhost:3000/api/upload-avatar \
  -F "file=@image.jpg" \
  -F "userId=USER_ID"
```

## Limitations et améliorations futures

### Limitations actuelles
- Les champs ne sont validés que côté client
- Pas de confirmation d'email pour les changements d'email
- Pas d'historique des modifications

### Améliorations futures
- Validation backend avec Zod/Yup
- Confirmation d'email pour les changements
- Historique des modifications de profil
- Édition de la visibilité du profil
- Suppression du compte utilisateur
- Changement de mot de passe dans le profil
- Authentification à deux facteurs (2FA)

## Troubleshooting

### L'avatar ne s'affiche pas
- Vérifier la taille du fichier (max 5MB)
- Vérifier le format (images uniquement)
- Vérifier les logs serveur pour les erreurs Supabase

### Les modifications ne sont pas sauvegardées
- Vérifier la connexion Internet
- Vérifier que l'utilisateur est authentifié
- Regarder les logs du navigateur (F12)
- Vérifier les logs serveur

### "Utilisateur non trouvé" lors de la sauvegarde
- S'assurer que l'utilisateur existe en base de données
- Vérifier l'UUID de l'utilisateur
- Vérifier que la session est valide

## Support

Pour toute question ou problème :
1. Vérifier les logs du navigateur (F12 → Console)
2. Vérifier les logs serveur
3. Contacter l'administrateur système
