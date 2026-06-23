import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from './supabase'

/**
 * Middleware pour protéger les routes et vérifier l'authentification
 */
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  try {
    // Récupérer le token du header Authorization
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7) // Enlever "Bearer "

    // Vérifier le token avec Supabase
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      )
    }

    // Passer l'utilisateur au handler
    const requestWithUser = request.clone()
    ;(requestWithUser as any).user = data.user

    return handler(requestWithUser)
  } catch (error: any) {
    console.error('[v0] Auth middleware error:', error)
    return NextResponse.json(
      { error: 'Erreur authentification' },
      { status: 500 }
    )
  }
}

/**
 * Middleware pour vérifier les rôles
 */
export async function withRole(
  request: NextRequest,
  allowedRoles: string[],
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  try {
    const userRole = (request as any).user?.user_metadata?.role
    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      )
    }

    return handler(request)
  } catch (error: any) {
    console.error('[v0] Role middleware error:', error)
    return NextResponse.json(
      { error: 'Erreur vérification rôle' },
      { status: 500 }
    )
  }
}

/**
 * Middleware pour loguer les activités utilisateur
 */
export async function withAudit(
  request: NextRequest,
  action: string,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  const startTime = Date.now()
  const response = await handler(request)

  try {
    const userId = (request as any).user?.id
    if (userId) {
      const supabase = getSupabaseClient()
      await supabase
        .from('user_activity')
        .insert([
          {
            user_id: userId,
            action,
            details: {
              method: request.method,
              path: request.nextUrl.pathname,
              duration: Date.now() - startTime,
              status: response.status,
            },
          },
        ])
    }
  } catch (error) {
    console.error('[v0] Audit logging error:', error)
  }

  return response
}

/**
 * Middleware pour rate limiting (simple, en mémoire)
 */
const requestCounts = new Map<string, number[]>()

export function withRateLimit(
  windowMs: number = 60000, // 1 minute par défaut
  maxRequests: number = 100
) {
  return (request: NextRequest) => {
    const ip = request.ip || 'unknown'
    const now = Date.now()

    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, [])
    }

    const timestamps = requestCounts.get(ip)!
    const recentRequests = timestamps.filter(t => now - t < windowMs)

    if (recentRequests.length >= maxRequests) {
      return NextResponse.json(
        { error: 'Trop de requêtes' },
        { status: 429 }
      )
    }

    recentRequests.push(now)
    requestCounts.set(ip, recentRequests)

    return null // Continuer
  }
}
