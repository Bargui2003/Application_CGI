import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CALIBRES = ['25', '32', '40', '50', '63', '75', '90']
const SETUP_TIME = 2 // 2 heures

// Calcul de l'équipe actuelle selon l'heure
function getCurrentTeam(date: Date = new Date()): number {
  const hours = date.getHours()
  if (hours >= 7 && hours < 15) return 1
  if (hours >= 15 && hours < 23) return 2
  return 3
}

// Calcul de l'équipe suivante
function getNextTeam(teamId: number): number {
  return teamId === 3 ? 1 : teamId + 1
}

// Obtenir l'heure de début pour une équipe donnée
function getTeamStartTime(teamId: number, date: Date = new Date()): Date {
  const times: { [key: number]: [number, number] } = {
    1: [7, 0],
    2: [15, 0],
    3: [23, 0]
  }
  const [hour, min] = times[teamId]
  const start = new Date(date)
  start.setHours(hour, min, 0, 0)
  
  // Si l'équipe 3 et on est avant 23:00, c'est pour demain
  if (teamId === 3 && date.getHours() < 23) {
    start.setDate(start.getDate() + 1)
  }
  return start
}

// Obtenir le temps disponible pour une équipe
function getTeamAvailableTime(teamId: number): number {
  return 8 // 8 heures par équipe
}

// Assigner une production aux équipes
async function assignProductionToTeams(
  productionId: string,
  totalTime: number,
  articleName: string,
  startTeamId?: number
) {
  let remainingTime = totalTime
  let currentTeamId = startTeamId || getCurrentTeam()
  let currentDate = new Date()
  let previousArticle: string | null = null

  const assignments: any[] = []

  while (remainingTime > 0) {
    const availableTime = getTeamAvailableTime(currentTeamId)
    const teamStartTime = getTeamStartTime(currentTeamId, currentDate)
    
    // Vérifier si changement d'article
    let setupTime = 0
    if (previousArticle && previousArticle !== articleName) {
      setupTime = SETUP_TIME
    }

    const timeToUse = Math.min(remainingTime, availableTime - setupTime)
    const timeEnd = new Date(teamStartTime)
    timeEnd.setHours(timeEnd.getHours() + setupTime + timeToUse)

    assignments.push({
      production_id: productionId,
      team_id: currentTeamId,
      article_name: articleName,
      time_start: teamStartTime.toISOString(),
      time_end: timeEnd.toISOString(),
      time_used: timeToUse,
      setup_time: setupTime,
      status: 'en_attente'
    })

    remainingTime -= timeToUse
    previousArticle = articleName

    if (remainingTime > 0) {
      currentTeamId = getNextTeam(currentTeamId)
      // Avancer la date si on passe à l'équipe 1
      if (currentTeamId === 1) {
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }
  }

  return assignments
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === 'schedule') {
      const { productionId, articleName, totalTime } = await request.json()

      if (!productionId || !articleName || !totalTime) {
        return NextResponse.json(
          { error: 'productionId, articleName, and totalTime are required' },
          { status: 400 }
        )
      }

      // Assigner aux équipes
      const assignments = await assignProductionToTeams(productionId, totalTime, articleName)

      // Insérer dans production_timeline
      const { data, error } = await supabase
        .from('production_timeline')
        .insert(assignments)
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Mettre à jour production_records
      await supabase
        .from('production_records')
        .update({
          article_name: articleName,
          total_schedule_time: totalTime,
          team_id: assignments[0].team_id,
          order_time: new Date().toISOString(),
          status: 'en_attente'
        })
        .eq('id', productionId)

      return NextResponse.json({ success: true, timeline: data })
    }

    if (action === 'get-team-production') {
      const { teamId } = await request.json()

      if (!teamId) {
        return NextResponse.json({ error: 'teamId is required' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('production_timeline')
        .select(`
          *,
          production_records:production_id (*)
        `)
        .eq('team_id', teamId)
        .eq('status', 'en_attente')
        .order('time_start', { ascending: true })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ production: data || null })
    }

    if (action === 'get-all-timelines') {
      const { data, error } = await supabase
        .from('production_timeline')
        .select(`
          *,
          production_records:production_id (*)
        `)
        .order('time_start', { ascending: true })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ timelines: data })
    }

    if (action === 'update-status') {
      const { timelineId, status } = await request.json()

      if (!timelineId || !status) {
        return NextResponse.json(
          { error: 'timelineId and status are required' },
          { status: 400 }
        )
      }

      const { data, error } = await supabase
        .from('production_timeline')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', timelineId)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, timeline: data })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
