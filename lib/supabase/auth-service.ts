'use client'

import { getSupabaseClient } from '../supabase'
import type { AuthSession, UserRole, User } from '../auth'

export class SupabaseAuthService {
  private static supabase = getSupabaseClient()

  /**
   * S'inscrire avec email et mot de passe
   */
  static async signUp(
    email: string,
    password: string,
    userData: { full_name?: string; role?: UserRole }
  ) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name || '',
            role: userData.role || 'conducteur',
          },
        },
      })

      if (error) throw error

      return {
        session: data.session,
        user: data.user,
      }
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de l\'inscription')
    }
  }

  /**
   * Se connecter avec email et mot de passe
   */
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return {
        session: data.session,
        user: data.user,
      }
    } catch (error: any) {
      throw new Error(error.message || 'Erreur de connexion')
    }
  }

  /**
   * Se déconnecter
   */
  static async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut()
      if (error) throw error
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de la déconnexion')
    }
  }

  /**
   * Obtenir la session actuelle
   */
  static async getSession() {
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession()

      if (error) throw error
      return session
    } catch (error: any) {
      console.error('Erreur récupération session:', error)
      return null
    }
  }

  /**
   * Écouter les changements d'authentification
   */
  static onAuthStateChange(
    callback: (event: any, session: any) => void
  ) {
    return this.supabase.auth.onAuthStateChange(callback)
  }

  /**
   * Récupérer les informations utilisateur du profil
   */
  static async getUserProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      return {
        id: data.id,
        username: data.username || data.email.split('@')[0],
        email: data.email,
        role: data.role || 'conducteur',
        firstName: data.full_name?.split(' ')[0],
        lastName: data.full_name?.split(' ')[1],
        created_at: data.created_at,
      }
    } catch (error: any) {
      console.error('Erreur récupération profil:', error)
      return null
    }
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  static async updateUserProfile(
    userId: string,
    updates: Partial<User>
  ) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          full_name: updates.firstName ? `${updates.firstName} ${updates.lastName || ''}` : undefined,
          email: updates.email,
          role: updates.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      throw new Error(error.message || 'Erreur mise à jour profil')
    }
  }

  /**
   * Réinitialiser le mot de passe
   */
  static async resetPassword(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error
    } catch (error: any) {
      throw new Error(error.message || 'Erreur réinitialisation mot de passe')
    }
  }

  /**
   * Mettre à jour le mot de passe
   */
  static async updatePassword(newPassword: string) {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error
    } catch (error: any) {
      throw new Error(error.message || 'Erreur mise à jour mot de passe')
    }
  }

  /**
   * Récupérer le JWT actuel
   */
  static async getToken() {
    try {
      const {
        data: { session },
      } = await this.supabase.auth.getSession()

      return session?.access_token || null
    } catch (error: any) {
      console.error('Erreur récupération token:', error)
      return null
    }
  }
}
