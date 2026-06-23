import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const userId = request.nextUrl.searchParams.get('user_id')
    const status = request.nextUrl.searchParams.get('status')

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let query = supabase
      .from('production_records')
      .select('*')
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data || [], { status: 200 })
  } catch (error: any) {
    console.error('[v0] Production GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur récupération enregistrements' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      total_quantity,
      pieces_count,
      waste_percentage,
      useful_quantity,
      hd_percentage,
      ld_percentage,
      hd_quantity,
      ld_quantity,
      black_color_quantity,
      dryer_quantity,
      weight_per_piece,
      diameter,
      pressure,
      speed,
      production_time,
      total_length,
    } = body

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id est requis' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('production_records')
      .insert([
        {
          user_id,
          total_quantity,
          pieces_count,
          waste_percentage,
          useful_quantity,
          hd_percentage,
          ld_percentage,
          hd_quantity,
          ld_quantity,
          black_color_quantity,
          dryer_quantity,
          weight_per_piece,
          diameter,
          pressure,
          speed,
          production_time,
          total_length,
          status: 'draft',
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('[v0] Production POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur création enregistrement' },
      { status: 500 }
    )
  }
}
