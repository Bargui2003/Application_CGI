-- =====================================================
-- SCRIPT SQL POUR AUTHENTIFICATION SUPABASE
-- Exécutez ce script dans: Supabase Dashboard → SQL Editor
-- =====================================================

-- 1. Créer l'enum pour les rôles
CREATE TYPE user_role AS ENUM ('admin', 'conducteur');

-- 2. Créer la table users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role DEFAULT 'conducteur',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer un index sur username pour les requêtes login
CREATE INDEX idx_users_username ON users(username);

-- 4. Ajouter les utilisateurs de test
-- Admin user: username="admin", password="admin"
INSERT INTO users (email, username, password_hash, role)
VALUES (
  'admin@comptoir.com',
  'admin',
  'admin',  -- ⚠️ EN CLAIR pour la démo - À remplacer par hash en production!
  'admin'
);

-- Conducteur user: username="conducteur", password="conducteur"
INSERT INTO users (email, username, password_hash, role)
VALUES (
  'conducteur@comptoir.com',
  'conducteur',
  'conducteur',  -- ⚠️ EN CLAIR pour la démo
  'conducteur'
);

-- 5. OPTIONNEL: Activer RLS (Row Level Security)
-- Pour la démo, nous désactiverons RLS, mais voici les politiques pour production:

-- Décommenter pour activer RLS:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de lire leurs propres données:
-- CREATE POLICY "Users can view their own data" ON users
--   FOR SELECT
--   USING (auth.uid() = id);

-- Politique pour permettre l'insertion (registration):
-- CREATE POLICY "Allow registration" ON users
--   FOR INSERT
--   WITH CHECK (true);

-- =====================================================
-- VÉRIFICATION: Exécutez cette requête pour tester
-- =====================================================

-- Lister tous les utilisateurs créés:
SELECT id, email, username, role, created_at FROM users;

-- Résultat attendu:
-- +----+-------------------+----------+----------+------------------+
-- | id | email             | username | role     | created_at       |
-- +----+-------------------+----------+----------+------------------+
-- | 1  | admin@comptoir.com| admin    | admin    | 2024-04-02 ...   |
-- | 2  | cond@comptoir.com | conducteur| conductor| 2024-04-02 ...  |
-- +----+-------------------+----------+----------+------------------+

-- =====================================================
-- COMMANDES UTILES
-- =====================================================

-- Voir tous les utilisateurs:
-- SELECT * FROM users;

-- Mettre à jour un rôle (convertir conducteur en admin):
-- UPDATE users SET role = 'admin', updated_at = NOW() WHERE username = 'username_here';

-- Supprimer un utilisateur:
-- DELETE FROM users WHERE username = 'username_here';

-- Réinitialiser les utilisateurs (supprimer tous et recréer):
-- DELETE FROM users;
-- (puis réexécuter les INSERT du haut)

-- Voir la structure de la table:
-- \d users;  (PostgreSQL)

-- =====================================================
-- NOTES IMPORTANTES
-- =====================================================

-- ⚠️ PRODUCTION: Les mots de passe doivent être hachés!
-- Options:
-- 1. Bcryptjs: npm install bcryptjs
-- 2. Supabase Auth: Utiliser signup/signin intégrés
-- 3. jsonwebtokens (JWT): Pour sessions

-- Exemple hash bcrypt (Node.js):
-- const bcrypt = require('bcryptjs');
-- const salt = bcrypt.genSaltSync(10);
-- const hash = bcrypt.hashSync('password', salt);
-- INSERT INTO users VALUES (..., hash, ...);

-- ✅ MAINTENANT:
-- - Allez à http://localhost:3000
-- - Testez avec: admin / admin
-- - Testez avec: conducteur / conducteur
