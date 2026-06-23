import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[v0] Supabase env vars missing')
      return NextResponse.json(
        { error: 'Erreur de configuration serveur' },
        { status: 500 }
      )
    }

    // Créer un client Supabase avec la clé de service pour accéder à l'authentification
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Utiliser Supabase Auth pour se connecter
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data?.user) {
      console.error('[v0] Login error:', error)
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('[v0] Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Erreur récupération profil utilisateur' },
        { status: 500 }
      )
    }

    // Retourner l'utilisateur et la session
    return NextResponse.json(
      {
        user: {
          id: data.user.id,
          email: data.user.email,
          role: profile?.role || 'conducteur',
          full_name: profile?.full_name,
        },
        session: {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la connexion' },
      { status: 500 }
    )
  }
}
