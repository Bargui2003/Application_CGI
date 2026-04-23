import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('[Stock Test] Checking environment variables...')
    console.log('[Stock Test] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ NOT SET')
    console.log('[Stock Test] SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓ Set' : '✗ NOT SET')

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        status: 'error',
        message: 'Missing environment variables',
        env: {
          url_set: !!supabaseUrl,
          service_key_set: !!supabaseServiceKey,
        },
      }, { status: 500 })
    }

    // Try to create client
    console.log('[Stock Test] Creating Supabase admin client...')
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Try to query the table
    console.log('[Stock Test] Querying stock_levels table...')
    const { data, error } = await supabaseAdmin
      .from('stock_levels')
      .select('*')
      .maybeSingle()

    if (error) {
      console.error('[Stock Test] Query error:', error)
      return NextResponse.json({
        status: 'error',
        message: 'Failed to query stock_levels table',
        error: {
          code: error.code,
          message: error.message,
        },
      }, { status: 500 })
    }

    return NextResponse.json({
      status: 'success',
      message: 'Supabase connection working',
      data: data || { message: 'No stock levels record found' },
      env: {
        url: supabaseUrl,
        service_key_length: supabaseServiceKey?.length,
      },
    })
  } catch (error: any) {
    console.error('[Stock Test] Error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Test failed',
      error: {
        message: error?.message,
        stack: error?.stack,
      },
    }, { status: 500 })
  }
}
