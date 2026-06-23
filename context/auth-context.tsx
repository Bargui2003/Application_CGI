'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import type { User, UserRole } from '@/lib/auth'

// Lazy load services only when needed
let SupabaseAuthService: any = null
let UserService: any = null

function getAuthService() {
  if (!SupabaseAuthService) {
    try {
      const module = require('@/lib/supabase/auth-service')
      SupabaseAuthService = module.SupabaseAuthService
    } catch (e) {
      console.error('[v0] Failed to load SupabaseAuthService:', e)
      return null
    }
  }
  return SupabaseAuthService
}

function getUserService() {
  if (!UserService) {
    try {
      const module = require('@/lib/supabase/user-service')
      UserService = module.UserService
    } catch (e) {
      console.error('[v0] Failed to load UserService:', e)
      return null
    }
  }
  return UserService
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  role: UserRole | null
  logout: () => Promise<void>
  isAdmin: boolean
  isConducteur: boolean
  isMagasinier: boolean
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [role, setRole] = useState<UserRole | null>(null)

  // Fonction pour rafraîchir la session depuis Supabase
  const refreshSession = useCallback(async () => {
    try {
      const AuthService = getAuthService()
      const UserSvc = getUserService()

      if (!AuthService || !UserSvc) {
        console.error('[v0] Auth services not available')
        return
      }

      const session = await AuthService.getSession()
      if (session?.user) {
        // Récupérer les informations du profil
        const profile = await UserSvc.getUserById(session.user.id)
        if (profile) {
          const userData: User = {
            id: session.user.id,
            username: profile.full_name?.split(' ')[0] || profile.email.split('@')[0],
            email: profile.email,
            role: profile.role as UserRole,
            firstName: profile.full_name?.split(' ')[0],
            lastName: profile.full_name?.split(' ')[1],
            created_at: profile.created_at,
          }
          setUser(userData)
          setRole(profile.role as UserRole)
        }
      } else {
        setUser(null)
        setRole(null)
      }
    } catch (error) {
      console.error('[v0] Erreur récupération session:', error)
      setUser(null)
      setRole(null)
    }
  }, [])

  // Écouter les changements d'authentification
  useEffect(() => {
    setIsLoading(true)
    refreshSession().then(() => setIsLoading(false))

    // S'abonner aux changements d'authentification
    const AuthService = getAuthService()
    let unsubscribeData: any = null
    
    if (AuthService) {
      const subscription = AuthService.onAuthStateChange(async (event: any, session: any) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await refreshSession()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setRole(null)
        }
      })
      unsubscribeData = subscription
    }

    return () => {
      unsubscribeData?.data?.subscription?.unsubscribe?.()
    }
  }, [refreshSession])

  const handleLogout = async () => {
    try {
      const AuthService = getAuthService()
      if (AuthService) {
        await AuthService.signOut()
      }
      setUser(null)
      setRole(null)
    } catch (error) {
      console.error('[v0] Erreur déconnexion:', error)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    role,
    logout: handleLogout,
    isAdmin: role === 'admin',
    isConducteur: role === 'conducteur',
    isMagasinier: role === 'magasinier',
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans AuthProvider')
  }
  return context
}
