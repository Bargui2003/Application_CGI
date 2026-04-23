'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { UserRole } from '@/lib/auth'

/**
 * Routes protégées avec leurs rôles requis
 */
export const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  '/': ['admin', 'conducteur'], // Dashboard
  '/calculator': ['admin'], // Calculatrice (Admin seulement)
  '/production': ['admin'], // Production (Admin seulement)
  '/history': ['admin'], // Historique (Admin seulement)
  '/stock-management': ['admin'], // Gestion Stock (Admin seulement)
  '/stock': ['admin', 'conducteur'], // Voir Stock (Admin + Conducteur, lecture seule)
  '/alerts': ['admin', 'conducteur'], // Alertes (Admin + Conducteur)
  '/specifications': ['admin', 'conducteur'], // Spécifications (Admin + Conducteur)
  '/records': ['admin'], // Records (Admin seulement)
}

export const PUBLIC_ROUTES = ['/login', '/register']

interface ProtectedPageProps {
  children: ReactNode
  requiredRoles?: UserRole[]
}

/**
 * Composant de protection pour les pages
 */
export function ProtectedPage({ children, requiredRoles = ['admin', 'conducteur'] }: ProtectedPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, role, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    // Rediriger vers login si non authentifié
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Vérifier si l'utilisateur a les permissions
    if (role && !requiredRoles.includes(role)) {
      router.push('/unauthorized')
      return
    }
  }, [isAuthenticated, role, isLoading, router, requiredRoles])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="
            w-12 h-12 border-4 border-blue-200 rounded-full 
            border-t-blue-600
          "></div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

/**
 * Hook pour vérifier si une route est protégée
 */
export function useIsProtectedRoute(): boolean {
  const pathname = usePathname()
  return Object.keys(PROTECTED_ROUTES).some((route) =>
    pathname.startsWith(route)
  )
}

/**
 * Hook pour obtenir les rôles requis pour la route actuelle
 */
export function useRequiredRoles(): UserRole[] {
  const pathname = usePathname()
  for (const [route, roles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      return roles
    }
  }
  return ['admin', 'conducteur']
}
