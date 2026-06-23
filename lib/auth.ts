import { getSupabaseClient } from './supabase'

export type UserRole = 'admin' | 'conducteur' | 'magasinier'

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
  created_at: string
}

export interface AuthSession {
  user: User
  token: string
}

/**
 * Enregistrer un nouvel utilisateur
 * Utilise la route API pour éviter les problèmes RLS avec Supabase
 */
export async function registerUser(
  username: string,
  email: string,
  password: string
): Promise<AuthSession> {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erreur lors de l\'inscription')
    }

    const { user, token } = await response.json()

    // Stocker le token dans localStorage
    localStorage.setItem('auth_token', token)
    localStorage.setItem('user_role', user.role)
    localStorage.setItem('user_id', user.id)

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        avatar: user.avatar,
        created_at: user.created_at,
      },
      token,
    }
  } catch (error: any) {
    throw new Error(error.message || 'Erreur lors de l\'inscription')
  }
}

/**
 * Connexion utilisateur
 * Utilise la route API pour éviter les problèmes RLS avec Supabase
 */
export async function loginUser(email: string, password: string): Promise<AuthSession> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erreur de connexion')
    }

    const { user, token } = await response.json()

    // Stocker le token dans localStorage
    localStorage.setItem('auth_token', token)
    localStorage.setItem('user_role', user.role)
    localStorage.setItem('user_id', user.id)

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        avatar: user.avatar,
        created_at: user.created_at,
      },
      token,
    }
  } catch (error: any) {
    throw new Error(error.message || 'Erreur de connexion')
  }
}

/**
 * Récupérer la session actuelle depuis localStorage
 */
export function getCurrentSession(): AuthSession | null {
  if (typeof window === 'undefined') return null

  const token = localStorage.getItem('auth_token')
  const role = localStorage.getItem('user_role') as UserRole
  const userId = localStorage.getItem('user_id')

  if (!token || !userId) return null

  const [id, username] = atob(token).split(':')

  return {
    user: {
      id,
      username,
      email: '',
      role: role || 'conducteur',
      created_at: '',
    },
    token,
  }
}

/**
 * Déconnexion
 */
export function logoutUser(): void {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user_role')
  localStorage.removeItem('user_id')
}

/**
 * Obtenir le rôle de l'utilisateur actuel
 */
export function getCurrentUserRole(): UserRole | null {
  if (typeof window === 'undefined') return null
  return (localStorage.getItem('user_role') as UserRole) || null
}

/**
 * Vérifier si l'utilisateur est admin
 */
export function isAdmin(): boolean {
  return getCurrentUserRole() === 'admin'
}

/**
 * Vérifier si l'utilisateur est conducteur
 */
export function isConducteur(): boolean {
  return getCurrentUserRole() === 'conducteur'
}

/**
 * Vérifier si l'utilisateur est magasinier
 */
export function isMagasinier(): boolean {
  return getCurrentUserRole() === 'magasinier'
}

/**
 * Vérifier si l'utilisateur a accès à une page
 */
export function hasAccess(requiredRoles: UserRole[]): boolean {
  const role = getCurrentUserRole()
  if (!role) return false
  return requiredRoles.includes(role)
}

/**
 * Vérifier et décoder un token JWT
 */
export async function verifyToken(token: string): Promise<User | null> {
  try {
    // Pour cet exemple, nous allons utiliser une vérification simple
    // Dans un environnement de production, vous devriez utiliser une bibliothèque JWT
    // et vérifier la signature du token

    // Récupérer l'utilisateur depuis Supabase en utilisant le token
    const supabase = getSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return null
    }

    // Récupérer les informations supplémentaires depuis la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return null
    }

    return {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      role: userData.role,
      firstName: userData.first_name,
      lastName: userData.last_name,
      phone: userData.phone,
      avatar: userData.avatar,
      created_at: userData.created_at,
    }
  } catch (error) {
    console.error('Erreur vérification token:', error)
    return null
  }
}
