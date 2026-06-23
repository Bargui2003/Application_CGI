import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recordId = params.id

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('production_records')
      .select('*')
      .eq('id', recordId)
      .single()

    if (error && error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Enregistrement non trouvé' },
        { status: 404 }
      )
    }

    if (error) throw error

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Production GET by ID error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur récupération enregistrement' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recordId = params.id
    const body = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('production_records')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Production PUT error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur mise à jour enregistrement' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recordId = params.id

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase
      .from('production_records')
      .delete()
      .eq('id', recordId)

    if (error) throw error

    return NextResponse.json(
      { message: 'Enregistrement supprimé' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Production DELETE error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur suppression enregistrement' },
      { status: 500 }
    )
  }
}
