import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Récupérer les niveaux de stock actuels
    const { data, error } = await supabase
      .from('stock_levels')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code === 'PGRST116') {
      // Aucun enregistrement, retourner les valeurs par défaut
      return NextResponse.json(
        {
          id: null,
          hd: 1000,
          ld: 1000,
          black_color: 500,
          dryer: 500,
          updated_at: new Date().toISOString(),
        },
        { status: 200 }
      )
    }

    if (error) throw error

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Stock GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur récupération stock' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { hd, ld, black_color, dryer, user_id } = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Vérifier s'il y a déjà un enregistrement
    const { data: existing } = await supabase
      .from('stock_levels')
      .select('id')
      .limit(1)
      .single()

    let result
    if (existing) {
      // Mise à jour
      const { data, error } = await supabase
        .from('stock_levels')
        .update({
          hd,
          ld,
          black_color,
          dryer,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Insertion (créer un enregistrement avec user_id anonyme)
      const { data, error } = await supabase
        .from('stock_levels')
        .insert([
          {
            user_id: user_id || '00000000-0000-0000-0000-000000000000',
            hd,
            ld,
            black_color,
            dryer,
          },
        ])
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Stock POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur mise à jour stock' },
      { status: 500 }
    )
  }
}
