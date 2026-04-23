import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase environment variables are not configured')
}

// Create client with service role key (server-side only)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// GET - Fetch current stock levels
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('stock_levels')
      .select('*')
      .maybeSingle()

    if (error) {
      // If table is empty, return defaults
      if (error.code === 'PGRST116' || !data) {
        return NextResponse.json({
          id: null,
          hd: 1000,
          ld: 1000,
          black_color: 500,
          dryer: 500,
        })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Stock levels GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock levels' },
      { status: 500 }
    )
  }
}

// POST - Update/Upsert stock levels
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { hd, ld, black_color, dryer } = body

    if (hd === undefined || ld === undefined || black_color === undefined || dryer === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // First, try to get existing record
    const { data: existing, error: getError } = await supabaseAdmin
      .from('stock_levels')
      .select('id')
      .maybeSingle()

    if (getError && getError.code !== 'PGRST116') {
      throw getError
    }

    let result

    if (existing?.id) {
      // Update existing record
      const { data, error } = await supabaseAdmin
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
      // Create new record
      const { data, error } = await supabaseAdmin
        .from('stock_levels')
        .insert([
          {
            hd,
            ld,
            black_color,
            dryer,
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Stock levels POST error:', error)
    return NextResponse.json(
      { error: 'Failed to update stock levels' },
      { status: 500 }
    )
  }
}
