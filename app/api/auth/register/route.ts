import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, role } = await request.json()

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Créer l'utilisateur avec Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: full_name || email.split('@')[0],
        role: role || 'conducteur',
      },
      email_confirm: true, // Auto-confirm email for development
    })

    if (error) {
      console.error('[v0] Registration error:', error)
      return NextResponse.json(
        { error: error.message || 'Erreur lors de l\'inscription' },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Erreur création utilisateur' },
        { status: 500 }
      )
    }

    // Le profil devrait être créé automatiquement par le trigger Supabase
    // Mais on peut le créer ici pour être sûr
    await supabase
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          email: data.user.email,
          full_name: full_name || email.split('@')[0],
          role: role || 'conducteur',
        },
      ])
      .select()

    return NextResponse.json(
      {
        user: {
          id: data.user.id,
          email: data.user.email,
          role: role || 'conducteur',
          full_name: full_name,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[v0] Register error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'inscription' },
      { status: 500 }
    )
  }
}
