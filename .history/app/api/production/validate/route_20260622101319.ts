import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { productionId, status, validatedBy, notes, isMagasinierValidation, action } = await request.json()

    if (!productionId || (!status && !action)) {
      return NextResponse.json(
        { error: 'productionId and status/action are required' },
        { status: 400 }
      )
    }

    // Get production record first
    const { data: production, error: fetchError } = await supabase
      .from('production_records')
      .select('*')
      .eq('id', productionId)
      .single()

    if (fetchError || !production) {
      return NextResponse.json(
        { error: 'Production not found' },
        { status: 404 }
      )
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Handle magasinier validation/rejection
    if (isMagasinierValidation) {
      if (production.status !== 'draft') {
        return NextResponse.json({ error: 'Production can only be validated/rejected from draft status' }, { status: 400 })
      }
      
      if (!notes || !notes.trim()) {
        return NextResponse.json({ error: 'Notes are required for validation/rejection' }, { status: 400 })
      }

      if (action === 'reject') {
        // Handle rejection
        updateData = {
          ...updateData,
          status: 'rejected_by_magasinier',
          rejected_by_magasinier: validatedBy,
          rejected_at_magasinier: new Date().toISOString(),
          rejection_reason: notes.trim(),
        }
      } else {
        // Handle validation
        updateData = {
          ...updateData,
          status: 'validated_by_magasinier',
          validated_by_magasinier: validatedBy,
          validated_at_magasinier: new Date().toISOString(),
          magasinier_notes: notes.trim(),
        }

        // Update stock levels only for validation
        const { data: stockLevels } = await supabase
          .from('stock_levels')
          .select('*')
          .single()

        if (stockLevels) {
          const newStocks = {
            hd: Math.max(0, stockLevels.hd - production.hd_quantity),
            ld: Math.max(0, stockLevels.ld - production.ld_quantity),
            black_color: Math.max(0, stockLevels.black_color - production.black_color_quantity),
            dryer: Math.max(0, stockLevels.dryer - production.dryer_quantity),
          }

          await supabase
            .from('stock_levels')
            .update(newStocks)
            .eq('id', stockLevels.id)

          // Create stock movements
          const movements = []
          if (production.hd_quantity > 0) {
            movements.push({
              user_id: production.user_id,
              material: 'hd',
              material_label: 'HD',
              quantity: production.hd_quantity,
              operation: 'subtract',
              before_value: stockLevels.hd,
              after_value: newStocks.hd,
              notes: `Validation production ${productionId}`,
              date: new Date().toISOString()
            })
          }
          if (production.ld_quantity > 0) {
            movements.push({
              user_id: production.user_id,
              material: 'ld',
              material_label: 'LD',
              quantity: production.ld_quantity,
              operation: 'subtract',
              before_value: stockLevels.ld,
              after_value: newStocks.ld,
              notes: `Validation production ${productionId}`,
              date: new Date().toISOString()
            })
          }
          if (production.black_color_quantity > 0) {
            movements.push({
              user_id: production.user_id,
              material: 'black_color',
              material_label: 'Couleur Noire',
              quantity: production.black_color_quantity,
              operation: 'subtract',
              before_value: stockLevels.black_color,
              after_value: newStocks.black_color,
              notes: `Validation production ${productionId}`,
              date: new Date().toISOString()
            })
          }
          if (production.dryer_quantity > 0) {
            movements.push({
              user_id: production.user_id,
              material: 'dryer',
              material_label: 'Sécheur',
              quantity: production.dryer_quantity,
              operation: 'subtract',
              before_value: stockLevels.dryer,
              after_value: newStocks.dryer,
              notes: `Validation production ${productionId}`,
              date: new Date().toISOString()
            })
          }

          if (movements.length > 0) {
            await supabase
              .from('stock_movements')
              .insert(movements)
          }
        }
      }
    } else {
      // Admin cannot finalize production before magasinier approval.
      if (status === 'validated') {
        return NextResponse.json(
          { error: 'La production ne peut pas être validée avant approbation du magasinier' },
          { status: 400 }
        )
      }

      // Keep admin-created production in draft state until magasinier accepts it.
      updateData = {
        ...updateData,
        status: status || production.status,
      }
    }

    // Update production record
    const { data, error } = await supabase
      .from('production_records')
      .update(updateData)
      .eq('id', productionId)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to update production status' },
        { status: 500 }
      )
    }

    const message = action === 'reject' 
      ? 'Production refusée avec succès' 
      : isMagasinierValidation 
        ? 'Production validée avec succès' 
        : 'Production mise à jour'

    return NextResponse.json({
      success: true,
      production: data,
      message
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get productions pending validation by magasinier
export async function GET(request: NextRequest) {
  try {
    console.log('Fetching productions with draft status...')
    
    const { data: productions, error } = await supabase
      .from('production_records')
      .select('*')
      .eq('status', 'draft')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending productions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Found ${productions?.length || 0} productions with draft status`)
    
    return NextResponse.json(productions || [])

  } catch (error: any) {
    console.error('Get pending productions error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pending productions' },
      { status: 500 }
    )
  }
}
