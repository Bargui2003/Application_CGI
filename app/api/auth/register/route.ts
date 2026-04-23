import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email et password sont requis' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Variables d\'environnement Supabase manquantes')
      return NextResponse.json(
        { error: 'Erreur de configuration serveur' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet utilisateur existe déjà' },
        { status: 409 }
      )
    }

    // Créer l'utilisateur
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          username,
          email,
          password_hash: password, // À remplacer par hash en production
          role: 'conducteur', // Rôle par défaut
        },
      ])
      .select()
      .single()

    if (insertError) throw insertError

    // Créer le token
    const token = btoa(`${newUser.id}:${newUser.username}`)

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          created_at: newUser.created_at,
        },
        token,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erreur register:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'inscription' },
      { status: 500 }
    )
  }
}
