'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  Zap,
  AlertTriangle
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/context/auth-context'

interface ProductionIssue {
  id: string
  production_timeline_id: string
  team_id: number
  issue_description: string
  time_actual_used?: number
  status: 'signalée' | 'en_correction' | 'corrigée'
  created_at: string
  corrected_at?: string
  corrected_by?: string
  production_timeline?: {
    time_used: number
    article_name: string
    time_start: string
    time_end: string
    production_records?: any
  }
  teams?: {
    name: string
  }
}

export function AdminIssuesTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [issues, setIssues] = useState<ProductionIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIssue, setSelectedIssue] = useState<ProductionIssue | null>(null)
  const [showCorrectDialog, setShowCorrectDialog] = useState(false)
  const [correctionTime, setCorrectionTime] = useState('')
  const [correcting, setCorrecting] = useState(false)
  const [filter, setFilter] = useState<'all' | 'signalée' | 'corrigée'>('all')

  useEffect(() => {
    loadIssues()
    const interval = setInterval(loadIssues, 60000) // Rafraîchir toutes les minutes
    return () => clearInterval(interval)
  }, [])

  const loadIssues = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/production/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-all' })
      })

      if (response.ok) {
        const { issues } = await response.json()
        setIssues(issues || [])
      }
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les problèmes signalés',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCorrectIssue = async () => {
    if (!selectedIssue || !correctionTime || isNaN(parseFloat(correctionTime))) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un temps valide',
        variant: 'destructive'
      })
      return
    }

    try {
      setCorrecting(true)
      const response = await fetch('/api/production/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'correct',
          issueId: selectedIssue.id,
          timeActualUsed: parseFloat(correctionTime),
          correctedBy: user?.id
        })
      })

      if (response.ok) {
        toast({
          title: 'Correction appliquée',
          description: 'Le temps a été mis à jour et le planning recalculé'
        })
        setShowCorrectDialog(false)
        setCorrectionTime('')
        setSelectedIssue(null)
        loadIssues()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la correction')
      }
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setCorrecting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signalée':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Signalée</Badge>
      case 'en_correction':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> En correction</Badge>
      case 'corrigée':
        return <Badge className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> Corrigée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredIssues = issues.filter(issue => 
    filter === 'all' ? true : issue.status === filter
  )

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && issues.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Chargement des problèmes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* En-tête et filtres */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-orange-500" />
          Problèmes signalés par les équipes
        </h2>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {filteredIssues.length} problème{filteredIssues.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-4">
        {(['all', 'signalée', 'corrigée'] as const).map(status => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            onClick={() => setFilter(status)}
            className="capitalize"
          >
            {status === 'all' ? 'Tous' : status}
          </Button>
        ))}
      </div>

      {/* Liste des problèmes */}
      {filteredIssues.length > 0 ? (
        <div className="grid gap-4">
          {filteredIssues.map((issue) => (
            <Card key={issue.id} className={`${
              issue.status === 'signalée' ? 'border-red-200 bg-red-50' :
              issue.status === 'corrigée' ? 'border-green-200 bg-green-50' :
              'border-gray-200'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Équipe {issue.team_id} • Article {issue.production_timeline?.article_name} mm
                    </CardTitle>
                    <CardDescription>
                      {formatDateTime(issue.created_at)}
                    </CardDescription>
                  </div>
                  {getStatusBadge(issue.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description du problème */}
                <div className="bg-white p-4 rounded border border-gray-200">
                  <p className="text-sm font-medium text-gray-600 mb-1">Description du problème:</p>
                  <p className="text-gray-800">{issue.issue_description}</p>
                </div>

                {/* Infos de temps */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Temps planifié</p>
                    <p className="font-semibold">{issue.production_timeline?.time_used.toFixed(1)}h</p>
                  </div>
                  {issue.time_actual_used && (
                    <div>
                      <p className="text-gray-600">Temps réel</p>
                      <p className="font-semibold text-orange-600">{issue.time_actual_used.toFixed(1)}h</p>
                    </div>
                  )}
                  {issue.time_actual_used && (
                    <div>
                      <p className="text-gray-600">Différence</p>
                      <p className={`font-semibold ${
                        issue.time_actual_used > issue.production_timeline!.time_used 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {(issue.time_actual_used - issue.production_timeline!.time_used).toFixed(1)}h
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Statut</p>
                    <p className="font-semibold capitalize">{issue.status}</p>
                  </div>
                </div>

                {/* Actions */}
                {issue.status === 'signalée' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedIssue(issue)
                        setCorrectionTime(issue.production_timeline?.time_used.toString() || '')
                        setShowCorrectDialog(true)
                      }}
                      className="gap-2 flex-1"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approuver et corriger
                    </Button>
                  </div>
                )}

                {issue.status === 'corrigée' && issue.corrected_at && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      ✅ Problème corrigé le {formatDateTime(issue.corrected_at)}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-gray-600">Aucun problème signalé ✨</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog correction */}
      <Dialog open={showCorrectDialog} onOpenChange={setShowCorrectDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Corriger le problème
            </DialogTitle>
            <DialogDescription>
              Validez le temps réel utilisé pour cette production
            </DialogDescription>
          </DialogHeader>

          {selectedIssue && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm font-medium">Équipe {selectedIssue.team_id} • Article {selectedIssue.production_timeline?.article_name} mm</p>
                <p className="text-sm text-gray-600 mt-1">{selectedIssue.issue_description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-600">Temps planifié</Label>
                  <p className="text-lg font-semibold">{selectedIssue.production_timeline?.time_used.toFixed(1)}h</p>
                </div>
              </div>

              <div>
                <Label htmlFor="correction-time">Temps réel à valider (heures) *</Label>
                <Input
                  id="correction-time"
                  type="number"
                  value={correctionTime}
                  onChange={(e) => setCorrectionTime(e.target.value)}
                  step="0.5"
                  min="0"
                  placeholder="Exemple: 5.5"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCorrectDialog(false)}
                  disabled={correcting}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleCorrectIssue}
                  disabled={correcting}
                  className="gap-2 flex-1"
                >
                  {correcting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {correcting ? 'Correction...' : 'Valider correction'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
