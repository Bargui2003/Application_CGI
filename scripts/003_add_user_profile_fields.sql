-- =====================================================
-- SCRIPT SQL POUR AJOUTER LES CHAMPS PROFIL UTILISATEUR
-- Exécutez ce script dans: Supabase Dashboard → SQL Editor
-- =====================================================

-- Ajouter les colonnes pour le profil utilisateur
ALTER TABLE users
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Créer le bucket de stockage pour les avatars si nécessaire
-- (À créer manuellement dans Supabase Dashboard → Storage)
-- Nom du bucket: user-avatars
-- Politiques RLS à ajouter pour le bucket user-avatars:
-- - SELECT: true pour tous les utilisateurs authentifiés
-- - INSERT: true pour les utilisateurs authentifiés (ils peuvent uploader leur propre avatar)
-- - UPDATE: true pour les utilisateurs authentifiés (ils peuvent remplacer leur avatar)
-- - DELETE: true pour les utilisateurs authentifiés (ils peuvent supprimer leur avatar)