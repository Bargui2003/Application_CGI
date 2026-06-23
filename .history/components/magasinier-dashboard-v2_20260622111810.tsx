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
  const [productions, setProductions] = useState<ProductionRecord[]>([])
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
    loadPendingProductions()
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

  const loadPendingProductions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/production/validate')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors du chargement des productions')
      }
      const data = await response.json()
      setProductions(data)
    } catch (err: any) {
      console.error('Error loading productions:', err)
      setError(err.message || 'Erreur lors du chargement des productions en attente')
    } finally {
      setLoading(false)
    }
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
      loadPendingProductions()
      loadStockLevels() // Reload stocks after validation
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
      case 'rejected_by_magasinier':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Refusé par magasinier
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!isMagasinier()) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Accès non autorisé. Cette page est réservée aux magasiniers.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Tableau de Bord Magasinier
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gérez les validations de production et les stocks
          </p>
        </div>
        <div className="p-3 rounded-lg bg-linear-to-br from-green-500 to-emerald-600 shadow-lg">
          <Store className="h-8 w-8 text-white" />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="productions">Productions</TabsTrigger>
          <TabsTrigger value="stocks">Stocks</TabsTrigger>
        </TabsList>

        {/* Productions Tab */}
        <TabsContent value="productions" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {productions.filter(p => p.status === 'draft').length}
                    </p>
                    <p className="text-sm text-muted-foreground">En attente</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {productions.filter(p => p.status === 'validated_by_magasinier').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Validées aujourd'hui</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {productions.filter(p => p.status === 'rejected_by_magasinier').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Refusées</p>
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
                      {productions.reduce((sum, p) => sum + ((p.hd_quantity || 0) + (p.ld_quantity || 0)), 0)}
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
                      {productions.reduce((sum, p) => sum + (p.pieces_count || 0), 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Pièces produites</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Productions List */}
          <Card>
            <CardHeader>
              <CardTitle>Productions en attente de validation</CardTitle>
              <CardDescription>
                Validez ou refusez les productions en attente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Chargement...</span>
                </div>
              ) : productions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune production en attente de validation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {productions.map((production) => {
                    const hasEnoughStock = checkStockAvailability(production)
                    return (
                      <div key={production.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">Production #{production.id.slice(-8)}</h3>
                            <p className="text-sm text-muted-foreground">
                              Diamètre: {production.diameter} | Pression: {production.pressure}
                            </p>
                            {!hasEnoughStock && (
                              <Alert className="mt-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  Stock insuffisant pour cette production. Vérifiez les stocks avant de valider.
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Pièces:</span> {production.pieces_count}
                            </div>
                            <div>
                              <span className="font-medium">HD:</span> {production.hd_quantity}kg
                              <span className={`ml-1 ${stockLevels.hd < production.hd_quantity ? 'text-red-500' : 'text-green-500'}`}>
                                ({stockLevels.hd} disponible)
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">LD:</span> {production.ld_quantity}kg
                              <span className={`ml-1 ${stockLevels.ld < production.ld_quantity ? 'text-red-500' : 'text-green-500'}`}>
                                ({stockLevels.ld} disponible)
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Total:</span> {production.total_quantity}kg
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleProductionAction(production.id, 'validate')}
                            disabled={validating === production.id || !hasEnoughStock}
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
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stocks Tab */}
        <TabsContent value="stocks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Stocks</CardTitle>
              <CardDescription>
                Ajoutez ou réduisez les niveaux de stocks actuels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="stock-hd">Stock HD (kg)</Label>
                  <Input
                    id="stock-hd"
                    type="number"
                    value={stockInputs.hd}
                    onChange={(e) => setStockInputs(prev => ({ ...prev, hd: e.target.value }))}
                    placeholder="Stock HD en kg"
                  />
                  <p className="text-sm text-muted-foreground">Actuel: {stockLevels.hd}kg</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stock-ld">Stock LD (kg)</Label>
                  <Input
                    id="stock-ld"
                    type="number"
                    value={stockInputs.ld}
                    onChange={(e) => setStockInputs(prev => ({ ...prev, ld: e.target.value }))}
                    placeholder="Stock LD en kg"
                  />
                  <p className="text-sm text-muted-foreground">Actuel: {stockLevels.ld}kg</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stock-color">Stock Couleur Noire (kg)</Label>
                  <Input
                    id="stock-color"
                    type="number"
                    value={stockInputs.blackColor}
                    onChange={(e) => setStockInputs(prev => ({ ...prev, blackColor: e.target.value }))}
                    placeholder="Stock couleur noire en kg"
                  />
                  <p className="text-sm text-muted-foreground">Actuel: {stockLevels.blackColor}kg</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stock-dryer">Stock Sécheur (kg)</Label>
                  <Input
                    id="stock-dryer"
                    type="number"
                    value={stockInputs.dryer}
                    onChange={(e) => setStockInputs(prev => ({ ...prev, dryer: e.target.value }))}
                    placeholder="Stock sécheur en kg"
                  />
                  <p className="text-sm text-muted-foreground">Actuel: {stockLevels.dryer}kg</p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={updateStockLevels}
                  disabled={updatingStock}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updatingStock ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Mettre à jour les stocks
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
