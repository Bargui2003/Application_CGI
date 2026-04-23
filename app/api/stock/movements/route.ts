import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables are not configured')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// GET - Fetch stock movements
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Stock movements query error:', error)
      return NextResponse.json([])
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Stock movements GET error:', error)
    return NextResponse.json([])
  }
}

// POST - Add stock movement
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()

    const { material, material_label, quantity, operation, before_value, after_value, notes } = body

    if (!material || !material_label || quantity === undefined || !operation || before_value === undefined || after_value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const movementData = {
      material,
      material_label,
      quantity: Number(quantity),
      operation,
      before_value: Number(before_value),
      after_value: Number(after_value),
      notes: notes || null,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin
      .from('stock_movements')
      .insert([movementData])
      .select()
      .single()

    if (error) {
      console.error('Error creating stock movement:', error)
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Stock movements POST error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create stock movement',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
