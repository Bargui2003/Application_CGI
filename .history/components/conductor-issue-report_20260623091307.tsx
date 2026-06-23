'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface ConductorIssueReportProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productionTimelineId: string
  teamId: number
  onSuccess?: () => void
}

export function ConductorIssueReport({
  open,
  onOpenChange,
  productionTimelineId,
  teamId,
  onSuccess
}: ConductorIssueReportProps) {
  const [issueDescription, setIssueDescription] = useState('')
  const [timeActualUsed, setTimeActualUsed] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!issueDescription.trim()) {
      setError('Veuillez décrire le problème')
      return
    }

    if (!timeActualUsed || isNaN(parseFloat(timeActualUsed))) {
      setError('Veuillez entrer le temps réel utilisé (en heures)')
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/production/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report',
          productionTimelineId,
          teamId,
          issueDescription: issueDescription.trim()
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors du signalement')
      }

      toast({
        title: 'Problème signalé',
        description: 'Le problème a été signalé à l\'administrateur. Le temps réel sera corrigé après vérification.',
        variant: 'default'
      })

      setIssueDescription('')
      setTimeActualUsed('')
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Signaler un problème
          </DialogTitle>
          <DialogDescription>
            Décrivez le problème rencontré pendant la production et le temps réel utilisé
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="issue">Description du problème *</Label>
            <Textarea
              id="issue"
              placeholder="Décrivez le problème rencontré (panne, calibre incorrect, temps insuffisant, etc.)"
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              className="min-h-30"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Temps réel utilisé (heures) *</Label>
            <Input
              id="time"
              type="number"
              placeholder="Exemple: 5.5"
              value={timeActualUsed}
              onChange={(e) => setTimeActualUsed(e.target.value)}
              step="0.5"
              min="0"
              disabled={loading}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">📝 Note:</p>
            <p>L'administrateur recevra ce signalement et ajustera le temps du planning en fonction de votre correction.</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Envoi...' : 'Signaler'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
