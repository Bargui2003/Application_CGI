import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et password sont requis' },
        { status: 400 }
      )
    }

    // Utiliser la clé service (côté serveur) pour accéder à la table users
    // Les clés de service ont accès même avec RLS activé
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Variables d\'environnement Supabase manquantes')
      return NextResponse.json(
        { error: 'Erreur de configuration serveur' },
        { status: 500 }
      )
    }

    // Créer un client avec la clé de service
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Récupérer l'utilisateur par email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 401 }
      )
    }

    // Vérifier le mot de passe
    if (user.password_hash !== password) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Créer le token
    const token = btoa(`${user.id}:${user.username}`)

    return NextResponse.json(
      {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
        },
        token,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Erreur login:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la connexion' },
      { status: 500 }
    )
  }
}
