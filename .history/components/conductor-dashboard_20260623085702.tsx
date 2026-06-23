'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Zap,
  Calendar,
  Users,
  TrendingUp
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { ConductorIssueReport } from './conductor-issue-report'
import { useToast } from '@/components/ui/use-toast'
import { ProductionTimeline, Team } from '@/lib/supabase'

interface ProductionWithTimeline extends ProductionTimeline {
  production_records?: any
}

export function ConductorDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [currentProduction, setCurrentProduction] = useState<ProductionWithTimeline | null>(null)
  const [teamSchedule, setTeamSchedule] = useState<ProductionWithTimeline[]>([])
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [showIssueDialog, setShowIssueDialog] = useState(false)

  // Déterminer l'équipe du conducteur (supposé depuis son ID ou une préférence)
  const teamId = parseInt(localStorage.getItem('conductor_team_id') || '1')

  useEffect(() => {
    loadTeamData()
    const interval = setInterval(loadTeamData, 30000) // Rafraîchir toutes les 30 secondes
    return () => clearInterval(interval)
  }, [teamId])

  const loadTeamData = async () => {
    try {
      setLoading(true)

      // Charger la production actuelle
      const prodResponse = await fetch('/api/production/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-team-production',
          teamId
        })
      })

      if (prodResponse.ok) {
        const { production } = await prodResponse.json()
        setCurrentProduction(production)
      }

      // Charger le planning complet de l'équipe
      const scheduleResponse = await fetch('/api/production/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-all-timelines' })
      })

      if (scheduleResponse.ok) {
        const { timelines } = await scheduleResponse.json()
        const teamTimelines = timelines
          .filter((t: ProductionWithTimeline) => t.team_id === teamId)
          .sort((a: ProductionWithTimeline, b: ProductionWithTimeline) => 
            new Date(a.time_start).getTime() - new Date(b.time_start).getTime()
          )
        setTeamSchedule(teamTimelines)
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartProduction = async () => {
    if (!currentProduction) return

    try {
      const response = await fetch('/api/production/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-status',
          timelineId: currentProduction.id,
          status: 'en_cours'
        })
      })

      if (response.ok) {
        toast({
          title: 'Production démarrée',
          description: `Production pour l'article ${currentProduction.article_name} en cours`
        })
        loadTeamData()
      }
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive'
      })
    }
  }

  const handleCompleteProduction = async () => {
    if (!currentProduction) return

    try {
      const response = await fetch('/api/production/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-status',
          timelineId: currentProduction.id,
          status: 'terminée'
        })
      })

      if (response.ok) {
        toast({
          title: 'Production terminée',
          description: `Production ${currentProduction.article_name} marquée comme terminée`
        })
        loadTeamData()
      }
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_attente':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> En attente</Badge>
      case 'en_cours':
        return <Badge className="gap-1 bg-blue-600"><Zap className="h-3 w-3" /> En cours</Badge>
      case 'terminée':
        return <Badge className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> Terminée</Badge>
      case 'bloquée':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Bloquée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && !currentProduction) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Zap className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Chargement du planning...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              Dashboard Équipe {teamId}
            </h1>
            <p className="text-blue-100 mt-2">Bienvenue, {user?.email}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Équipe active</p>
            <p className="text-2xl font-bold">Équipe {teamId}</p>
          </div>
        </div>
      </div>

      {/* Production actuelle */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Production actuelle
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentProduction ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Article</p>
                  <p className="text-lg font-semibold">{currentProduction.article_name} mm</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Temps assigné</p>
                  <p className="text-lg font-semibold">{currentProduction.time_used.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Début</p>
                  <p className="text-lg font-semibold">{formatTime(currentProduction.time_start)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fin</p>
                  <p className="text-lg font-semibold">{formatTime(currentProduction.time_end)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>{getStatusBadge(currentProduction.status)}</div>
                <div className="flex gap-2">
                  {currentProduction.status === 'en_attente' && (
                    <Button onClick={handleStartProduction} className="gap-2">
                      <Zap className="h-4 w-4" />
                      Démarrer production
                    </Button>
                  )}
                  {currentProduction.status === 'en_cours' && (
                    <>
                      <Button variant="outline" onClick={() => setShowIssueDialog(true)} className="gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Signaler problème
                      </Button>
                      <Button onClick={handleCompleteProduction} className="gap-2 bg-green-600 hover:bg-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Terminer production
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {currentProduction.setup_time > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    ⚠️ Temps de setup: {currentProduction.setup_time}h avant le démarrage de production
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                ✅ Toutes les productions de votre équipe sont terminées ! Bon travail !
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Planning de l'équipe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Planning de l'équipe
          </CardTitle>
          <CardDescription>
            {teamSchedule.length} production{teamSchedule.length > 1 ? 's' : ''} prévue{teamSchedule.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamSchedule.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {teamSchedule.map((prod) => (
                <div
                  key={prod.id}
                  className={`p-4 border rounded-lg transition-all ${
                    prod.status === 'en_cours'
                      ? 'border-blue-500 bg-blue-50'
                      : prod.status === 'terminée'
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">
                      Article <span className="text-lg text-blue-600">{prod.article_name} mm</span>
                    </div>
                    {getStatusBadge(prod.status)}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Temps</p>
                      <p className="font-medium">{prod.time_used.toFixed(1)}h</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Début</p>
                      <p className="font-medium">{formatDateTime(prod.time_start)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Fin</p>
                      <p className="font-medium">{formatDateTime(prod.time_end)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune production planifiée</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog signalement problème */}
      {currentProduction && (
        <ConductorIssueReport
          open={showIssueDialog}
          onOpenChange={setShowIssueDialog}
          productionTimelineId={currentProduction.id}
          teamId={teamId}
          onSuccess={loadTeamData}
        />
      )}
    </div>
  )
}
