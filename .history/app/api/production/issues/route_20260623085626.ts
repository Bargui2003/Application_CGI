import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === 'report') {
      const { productionTimelineId, teamId, issueDescription } = await request.json()

      if (!productionTimelineId || !teamId || !issueDescription) {
        return NextResponse.json(
          { error: 'productionTimelineId, teamId, and issueDescription are required' },
          { status: 400 }
        )
      }

      const { data, error } = await supabase
        .from('production_issues')
        .insert({
          production_timeline_id: productionTimelineId,
          team_id: teamId,
          issue_description: issueDescription,
          status: 'signalée'
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Marquer la timeline comme bloquée
      await supabase
        .from('production_timeline')
        .update({ status: 'bloquée' })
        .eq('id', productionTimelineId)

      return NextResponse.json({ success: true, issue: data })
    }

    if (action === 'get-all') {
      const { data, error } = await supabase
        .from('production_issues')
        .select(`
          *,
          production_timeline:production_timeline_id (
            *,
            production_records:production_id (*)
          ),
          teams:team_id (*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ issues: data })
    }

    if (action === 'get-by-team') {
      const { teamId } = await request.json()

      if (!teamId) {
        return NextResponse.json({ error: 'teamId is required' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('production_issues')
        .select(`
          *,
          production_timeline:production_timeline_id (
            *,
            production_records:production_id (*)
          )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ issues: data })
    }

    if (action === 'correct') {
      const { issueId, timeActualUsed, correctedBy } = await request.json()

      if (!issueId || !timeActualUsed || !correctedBy) {
        return NextResponse.json(
          { error: 'issueId, timeActualUsed, and correctedBy are required' },
          { status: 400 }
        )
      }

      // Récupérer le problème
      const { data: issue, error: issueError } = await supabase
        .from('production_issues')
        .select('production_timeline_id')
        .eq('id', issueId)
        .single()

      if (issueError || !issue) {
        return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
      }

      // Mettre à jour le problème
      const { data: updatedIssue, error: updateError } = await supabase
        .from('production_issues')
        .update({
          status: 'corrigée',
          time_actual_used: timeActualUsed,
          corrected_by: correctedBy,
          corrected_at: new Date().toISOString()
        })
        .eq('id', issueId)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Mettre à jour la timeline
      await supabase
        .from('production_timeline')
        .update({
          time_used: timeActualUsed,
          status: 'en_attente'
        })
        .eq('id', issue.production_timeline_id)

      return NextResponse.json({ success: true, issue: updatedIssue })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
