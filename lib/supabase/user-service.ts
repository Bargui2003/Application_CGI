import { getSupabaseClient } from '../supabase'
import type { UserRole } from '../auth'

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

export class UserService {
  private static supabase = getSupabaseClient()

  /**
   * Récupérer tous les utilisateurs (admin seulement)
   */
  static async getAllUsers(): Promise<UserProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Erreur récupération utilisateurs:', error)
      return []
    }
  }

  /**
   * Récupérer un utilisateur par ID
   */
  static async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Erreur récupération utilisateur:', error)
      return null
    }
  }

  /**
   * Mettre à jour le rôle d'un utilisateur (admin seulement)
   */
  static async updateUserRole(userId: string, role: UserRole) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      throw new Error(error.message || 'Erreur mise à jour rôle')
    }
  }

  /**
   * Supprimer un utilisateur (admin seulement)
   */
  static async deleteUser(userId: string) {
    try {
      const { error } = await this.supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error
    } catch (error: any) {
      throw new Error(error.message || 'Erreur suppression utilisateur')
    }
  }

  /**
   * Chercher des utilisateurs par email ou nom
   */
  static async searchUsers(query: string): Promise<UserProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Erreur recherche utilisateurs:', error)
      return []
    }
  }

  /**
   * Récupérer les utilisateurs par rôle
   */
  static async getUsersByRole(role: UserRole): Promise<UserProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('role', role)

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Erreur récupération utilisateurs par rôle:', error)
      return []
    }
  }

  /**
   * Compter les utilisateurs par rôle
   */
  static async countUsersByRole(): Promise<Record<UserRole, number>> {
    try {
      const roles: UserRole[] = ['admin', 'conducteur', 'magasinier']
      const counts: Record<UserRole, number> = {
        admin: 0,
        conducteur: 0,
        magasinier: 0,
      }

      for (const role of roles) {
        const { count, error } = await this.supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', role)

        if (!error && count !== null) {
          counts[role] = count
        }
      }

      return counts
    } catch (error: any) {
      console.error('Erreur comptage utilisateurs:', error)
      return { admin: 0, conducteur: 0, magasinier: 0 }
    }
  }
}
