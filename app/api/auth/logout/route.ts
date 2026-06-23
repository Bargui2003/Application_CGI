import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // La déconnexion Supabase est gérée côté client via le service d'authentification
    // Cette route peut être utilisée pour nettoyer les cookies ou faire d'autres opérations
    return NextResponse.json(
      {
        message: 'Déconnexion réussie',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Logout error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la déconnexion' },
      { status: 500 }
    )
  }
}
