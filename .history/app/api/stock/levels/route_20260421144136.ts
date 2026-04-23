import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Don't throw at module level, check inside functions instead
let supabaseAdmin: any = null

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return supabaseAdmin
}

// GET - Fetch current stock levels
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('stock_levels')
      .select('*')
      .maybeSingle()

    if (error) {
      console.error('Stock levels query error:', error)
      // If table is empty or error occurs, return defaults
      return NextResponse.json({
        id: null,
        hd: 1000,
        ld: 1000,
        black_color: 500,
        dryer: 500,
      })
    }

    // If no data found, return defaults
    if (!data) {
      return NextResponse.json({
        id: null,
        hd: 1000,
        ld: 1000,
        black_color: 500,
        dryer: 500,
      })
    }

    // Return the actual data
    return NextResponse.json(data)
  } catch (error) {
    console.error('Stock levels GET error:', error)
    // Return defaults on error to prevent app from breaking
    return NextResponse.json({
      id: null,
      hd: 1000,
      ld: 1000,
      black_color: 500,
      dryer: 500,
    })
  }
}

// POST - Update/Upsert stock levels
export async function POST(request: NextRequest) {
  try {
    console.log('[Stock API] POST request received')
    
    const body = await request.json()
    console.log('[Stock API] Request body:', body)

    const { hd, ld, black_color, dryer } = body

    if (hd === undefined || ld === undefined || black_color === undefined || dryer === undefined) {
      console.error('[Stock API] Missing required fields:', { hd, ld, black_color, dryer })
      return NextResponse.json(
        { error: 'Missing required fields: hd, ld, black_color, dryer' },
        { status: 400 }
      )
    }

    // Convert to numbers to ensure proper types
    const stockData = {
      hd: Number(hd),
      ld: Number(ld),
      black_color: Number(black_color),
      dryer: Number(dryer),
      updated_at: new Date().toISOString(),
    }

    console.log('[Stock API] Stock data to save:', stockData)

    // First, try to get existing record
    console.log('[Stock API] Checking for existing stock record...')
    const { data: existing, error: getError } = await supabaseAdmin
      .from('stock_levels')
      .select('id')
      .maybeSingle()

    if (getError) {
      console.error('[Stock API] Error fetching existing record:', getError)
      if (getError.code !== 'PGRST116') {
        throw getError
      }
    }

    console.log('[Stock API] Existing record:', existing)

    let result

    if (existing?.id) {
      // Update existing record
      console.log('[Stock API] Updating existing record with ID:', existing.id)
      const { data, error } = await supabaseAdmin
        .from('stock_levels')
        .update(stockData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('[Stock API] Error updating stock:', error)
        throw error
      }
      console.log('[Stock API] Record updated successfully:', data)
      result = data
    } else {
      // Create new record
      console.log('[Stock API] Creating new stock record...')
      const { data, error } = await supabaseAdmin
        .from('stock_levels')
        .insert([stockData])
        .select()
        .single()

      if (error) {
        console.error('[Stock API] Error creating stock:', error)
        throw error
      }
      console.log('[Stock API] Record created successfully:', data)
      result = data
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[Stock API] POST error:', error)
    console.error('[Stock API] Error details:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
    })
    return NextResponse.json(
      { 
        error: 'Failed to update stock levels',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
