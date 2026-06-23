'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Store,
  Package,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  CheckSquare
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { isMagasinier } from '@/lib/auth'

interface ProductionRecord {
  id: string
  date: string
  total_quantity: number
  pieces_count: number
  waste_percentage: number
  useful_quantity: number
  hd_percentage: number
  ld_percentage: number
  hd_quantity: number
  ld_quantity: number
  black_color_quantity: number
  dryer_quantity: number
  weight_per_piece: number
  diameter: string
  pressure: string
  speed: number
  production_time: number
  total_length: number
  status: string
  created_at: string
}

export function MagasinierDashboard() {
  const [allProductions, setAllProductions] = useState<ProductionRecord[]>([])
  const [pendingProductions, setPendingProductions] = useState<ProductionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('productions')
  
  // Stock management states
  const [stockLevels, setStockLevels] = useState({
    hd: 0,
    ld: 0,
    blackColor: 0,
    dryer: 0
  })
  const [stockInputs, setStockInputs] = useState({
    hd: '',
    ld: '',
    blackColor: '',
    dryer: ''
  })
  const [updatingStock, setUpdatingStock] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    loadAllProductions()
    loadStockLevels()
  }, [])

  const loadStockLevels = async () => {
    try {
      const response = await fetch('/api/stock/levels')
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des stocks')
      }
      const data = await response.json()
      setStockLevels({
        hd: data.hd || 0,
        ld: data.ld || 0,
        blackColor: data.black_color || 0,
        dryer: data.dryer || 0
      })
      setStockInputs({
        hd: data.hd?.toString() || '',
        ld: data.ld?.toString() || '',
        blackColor: data.black_color?.toString() || '',
        dryer: data.dryer?.toString() || ''
      })
    } catch (err: any) {
      console.error('Error loading stock levels:', err)
      setError(err.message || 'Erreur lors du chargement des stocks')
    }
  }

  const updateStockLevels = async () => {
    try {
      setUpdatingStock(true)
      setError('')

      const response = await fetch('/api/stock/levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hd: parseFloat(stockInputs.hd) || 0,
          ld: parseFloat(stockInputs.ld) || 0,
          black_color: parseFloat(stockInputs.blackColor) || 0,
          dryer: parseFloat(stockInputs.dryer) || 0,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour des stocks')
      }

      const data = await response.json()
      toast({
        title: 'Succès',
        description: 'Stocks mis à jour avec succès',
      })

      // Reload stock levels
      await loadStockLevels()
    } catch (err: any) {
      console.error('Error updating stock levels:', err)
      setError(err.message || 'Erreur lors de la mise à jour des stocks')
    } finally {
      setUpdatingStock(false)
    }
  }

  const checkStockAvailability = (production: ProductionRecord) => {
    const hasEnoughStock = 
      stockLevels.hd >= production.hd_quantity &&
      stockLevels.ld >= production.ld_quantity &&
      stockLevels.blackColor >= production.black_color_quantity &&
      stockLevels.dryer >= production.dryer_quantity

    return hasEnoughStock
  }

  const loadAllProductions = async () => {
    try {
      setLoading(true)
      // Charger toutes les productions
      const response = await fetch('/api/production')
      if (!response.ok) {
        // Fallback: charger seulement les drafts si l'endpoint complet n'existe pas
        const pendingResponse = await fetch('/api/production/validate')
        if (!pendingResponse.ok) {
          throw new Error('Erreur lors du chargement des productions')
        }
        const data = await pendingResponse.json()
        setAllProductions(data)
        setPendingProductions(data.filter((p: ProductionRecord) => p.status === 'draft'))
        return
      }
      const data = await response.json()
      setAllProductions(data)
      setPendingProductions(data.filter((p: ProductionRecord) => p.status === 'draft'))
    } catch (err: any) {
      console.error('Error loading productions:', err)
      setError(err.message || 'Erreur lors du chargement des productions')
    } finally {
      setLoading(false)
    }
  }

  const loadPendingProductions = async () => {
    await loadAllProductions()
  }

  const handleProductionAction = async (productionId: string, action: 'validate' | 'reject') => {
    if (!notes.trim()) {
      setError(`Veuillez ajouter des notes pour la ${action === 'validate' ? 'validation' : 'refus'}`)
      return
    }

    try {
      setValidating(productionId)
      setError('')

      const response = await fetch('/api/production/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productionId,
          action,
          validatedBy: 'magasinier',
          notes: notes.trim(),
          isMagasinierValidation: true
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erreur lors de la ${action === 'validate' ? 'validation' : 'refus'}`)
      }

      const data = await response.json()
      toast({
        title: 'Succès',
        description: data.message || `Production ${action === 'validate' ? 'validée' : 'refusée'} avec succès`,
      })

      // Reset notes and reload productions
      setNotes('')
      loadAllProductions()
    } catch (err: any) {
      console.error('Error handling production action:', err)
      setError(err.message || `Erreur lors de la ${action === 'validate' ? 'validation' : 'refus'}`)
    } finally {
      setValidating(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Brouillon
        </Badge>
      case 'validated_by_magasinier':
        return <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Validé par magasinier
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isMagasinier()) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Accès réservé au rôle magasinier. Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-lg bg-linear-to-br from-green-500 to-green-600 shadow-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Tableau de Bord Magasinier
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Validez les productions en attente et gérez les stocks
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{pendingProductions.length}</p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {allProductions.filter(p => p.status === 'validated_by_magasinier').length}
                </p>
                <p className="text-sm text-muted-foreground">Validées aujourd'hui</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  {allProductions.filter(p => p.status === 'validated_by_magasinier').reduce((sum, p) => sum + ((p.hd_quantity || 0) + (p.ld_quantity || 0)), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total matière utilisée</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {allProductions.filter(p => p.status === 'validated_by_magasinier').reduce((sum, p) => sum + (p.pieces_count || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Pièces produites</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Productions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Productions en Attente de Validation
          </CardTitle>
          <CardDescription>
            Liste des productions en statut "Brouillon" prêtes à être validées
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Chargement des productions...</p>
            </div>
          ) : pendingProductions.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquare className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune production en attente</h3>
              <p className="text-muted-foreground">
                Toutes les productions ont été validées. Revenez plus tard pour de nouvelles productions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingProductions.map((production) => (
                <div key={production.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(production.status)}
                        <span className="text-sm text-muted-foreground">
                          {formatDate(production.created_at)}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">Production #{production.id.slice(-8)}</h3>
                        <p className="text-sm text-muted-foreground">
                          Diamètre: {production.diameter} | Pression: {production.pressure}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Pièces:</span> {production.pieces_count}
                        </div>
                        <div>
                          <span className="font-medium">HD:</span> {production.hd_quantity}kg
                        </div>
                        <div>
                          <span className="font-medium">LD:</span> {production.ld_quantity}kg
                        </div>
                        <div>
                          <span className="font-medium">Total:</span> {production.total_quantity}kg
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleProductionAction(production.id, 'validate')}
                        disabled={validating === production.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {validating === production.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Validation...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Valider
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleProductionAction(production.id, 'reject')}
                        disabled={validating === production.id}
                        variant="destructive"
                      >
                        {validating === production.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Traitement...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Refuser
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Notes Section */}
                  <div className="space-y-2">
                    <Label htmlFor={`notes-${production.id}`}>Notes de validation</Label>
                    <Textarea
                      id={`notes-${production.id}`}
                      placeholder="Ajoutez des notes pour cette validation ou ce refus..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-20"
                      disabled={validating !== null}
                    />
                    <p className="text-xs text-muted-foreground">
                      Les commentaires sont obligatoires pour valider ou refuser une production
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
