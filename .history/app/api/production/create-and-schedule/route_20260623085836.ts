import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * API pour créer une production ET l'assigner automatiquement aux équipes
 * 
 * Exemple d'utilisation:
 * POST /api/production/create-and-schedule
 * {
 *   "productionData": {...},
 *   "articleName": "25",
 *   "schedule": true
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productionData, articleName, schedule = true } = body

    if (!productionData) {
      return NextResponse.json(
        { error: 'productionData is required' },
        { status: 400 }
      )
    }

    // 1. Créer la production
    const { data: production, error: prodError } = await supabase
      .from('production_records')
      .insert({
        ...productionData,
        article_name: articleName,
        order_time: new Date().toISOString(),
        status: 'en_attente'
      })
      .select()
      .single()

    if (prodError || !production) {
      return NextResponse.json(
        { error: prodError?.message || 'Failed to create production' },
        { status: 500 }
      )
    }

    // 2. Si schedule = true, assigner aux équipes
    if (schedule && productionData.production_time) {
      try {
        const scheduleResponse = await fetch(
          new URL('/api/production/timeline', request.url).toString(),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'schedule',
              productionId: production.id,
              articleName: articleName,
              totalTime: productionData.production_time
            })
          }
        )

        if (scheduleResponse.ok) {
          const { timeline } = await scheduleResponse.json()
          return NextResponse.json({
            success: true,
            production,
            timeline,
            message: 'Production créée et planifiée avec succès'
          })
        } else {
          console.error('Scheduling failed, but production was created')
          return NextResponse.json({
            success: true,
            production,
            warning: 'Production créée mais scheduling a échoué',
            schedule_error: await scheduleResponse.json()
          })
        }
      } catch (scheduleError: any) {
        console.error('Error scheduling:', scheduleError)
        return NextResponse.json({
          success: true,
          production,
          warning: 'Production créée mais scheduling a échoué',
          schedule_error: scheduleError.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      production,
      message: 'Production créée sans planification automatique'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
