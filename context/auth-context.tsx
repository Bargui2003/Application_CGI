'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { getCurrentSession, logoutUser, User, UserRole } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  role: UserRole | null
  logout: () => void
  isAdmin: boolean
  isConducteur: boolean
  refreshSession: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [role, setRole] = useState<UserRole | null>(null)

  // Fonction pour rafraîchir la session
  const refreshSession = useCallback(() => {
    const session = getCurrentSession()
    if (session) {
      setUser(session.user)
      setRole(session.user.role)
    } else {
      setUser(null)
      setRole(null)
    }
  }, [])

  // Récupérer la session au montage du composant
  useEffect(() => {
    refreshSession()
    setIsLoading(false)
  }, [refreshSession])

  const handleLogout = () => {
    logoutUser()
    setUser(null)
    setRole(null)
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    role,
    logout: handleLogout,
    isAdmin: role === 'admin',
    isConducteur: role === 'conducteur',
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
