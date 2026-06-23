'use client'

import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect } from 'react'
import type { UserRole } from '@/lib/auth'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: UserRole[]
  fallback?: ReactNode
}

/**
 * Composant pour protéger les routes et vérifier l'authentification
 */
export function ProtectedRoute({
  children,
  requiredRoles,
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Vérifier les rôles requis
  if (requiredRoles && role && !requiredRoles.includes(role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Accès refusé</h1>
          <p className="text-muted-foreground">
            Vous n&apos;avez pas accès à cette page
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
