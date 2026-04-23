import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { productionId, status } = await request.json()

    if (!productionId || !status) {
      return NextResponse.json(
        { error: 'productionId and status are required' },
        { status: 400 }
      )
    }

    // Update the production record with the new status
    const { data, error } = await supabase
      .from('production_records')
      .update({ status })
      .eq('id', productionId)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to update production status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Production validated and shared with conductors',
      production: data?.[0],
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
