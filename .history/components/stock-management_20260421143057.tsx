'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useProduction } from '@/context/production-context-supabase'
import { Plus, Minus, TrendingUp, TrendingDown, AlertTriangle, Lock } from 'lucide-react'

interface StockManagementProps {
  isReadOnly?: boolean
}

export function StockManagement({ isReadOnly = false }: StockManagementProps) {
  const { stockLevels, addToStock, removeFromStock, stockMovements } = useProduction()
  const [selectedMaterial, setSelectedMaterial] = useState<'hd' | 'ld' | 'blackColor' | 'dryer'>('hd')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const materials = [
    { key: 'hd', label: 'HD (Haute Densité)', value: stockLevels.hd },
    { key: 'ld', label: 'LD (Basse Densité)', value: stockLevels.ld },
    { key: 'blackColor', label: 'Couleur Noire', value: stockLevels.blackColor },
    { key: 'dryer', label: 'Sécheur', value: stockLevels.dryer },
  ] as const

  const handleAddStock = async () => {
    if (isReadOnly) {
      setError('Vous n\'avez pas la permission de modifier le stock')
      return
    }

    setError('')
    setSuccess('')

    const qty = parseFloat(quantity)
    if (!quantity || qty <= 0) {
      setError('Veuillez entrer une quantité valide')
      return
    }

    try {
      await addToStock(selectedMaterial, qty, notes || undefined)
      setSuccess(`${qty} kg ajoutés à ${materials.find(m => m.key === selectedMaterial)?.label}`)
      setQuantity('')
      setNotes('')

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Erreur lors de l\'ajout au stock')
      if (err instanceof Error) console.error(err.message)
    }
  }

  const handleRemoveStock = async () => {
    if (isReadOnly) {
      setError('Vous n\'avez pas la permission de modifier le stock')
      return
    }

    setError('')
    setSuccess('')

    const qty = parseFloat(quantity)
    if (!quantity || qty <= 0) {
      setError('Veuillez entrer une quantité valide')
      return
    }

    try {
      const success = await removeFromStock(selectedMaterial, qty, notes || undefined)
      if (!success) {
        setError(`Stock insuffisant. Disponible: ${stockLevels[selectedMaterial]} kg`)
        return
      }

      setSuccess(`${qty} kg retirés de ${materials.find(m => m.key === selectedMaterial)?.label}`)
      setQuantity('')
      setNotes('')

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Erreur lors de la suppression du stock')
      if (err instanceof Error) console.error(err.message)
    }
  }

  const quickAdd = async (amount: number) => {
    if (isReadOnly) return
    try {
      await addToStock(selectedMaterial, amount)
      setSuccess(`${amount} kg ajoutés rapidement`)
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError('Erreur lors de l\'ajout')
      if (err instanceof Error) console.error(err.message)
    }
  }

  const quickRemove = async (amount: number) => {
    if (isReadOnly) return
    try {
      const success = await removeFromStock(selectedMaterial, amount)
      if (success) {
        setSuccess(`${amount} kg retirés rapidement`)
        setTimeout(() => setSuccess(''), 2000)
      } else {
        setError(`Stock insuffisant`)
      }
    } catch (err) {
      setError('Erreur lors de la suppression')
      if (err instanceof Error) console.error(err.message)
    }
  }

  const getStockStatus = (value: number, material: 'hd' | 'ld' | 'blackColor' | 'dryer') => {
    const minimums = { hd: 500, ld: 500, blackColor: 25, dryer: 25 }
    const min = minimums[material]

    if (value < min) return { status: 'critical', color: 'text-destructive', bg: 'bg-destructive/10' }
    if (value < min * 2) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-600/10' }
    return { status: 'normal', color: 'text-green-600', bg: 'bg-green-600/10' }
  }

  return (
    <div className="space-y-6">
      {isReadOnly && (
        <Alert className="bg-blue-50 border-blue-200">
          <Lock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Mode Lecture Seule:</strong> Vous pouvez consulter les stocks et leur historique, mais vous ne pouvez pas les modifier.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {materials.map((material) => {
          const status = getStockStatus(material.value, material.key)
          return (
            <Card key={material.key} className={`cursor-pointer transition ${selectedMaterial === material.key ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedMaterial(material.key)}>
              <CardContent className="pt-6">
                <div className={`rounded-lg p-4 ${status.bg} mb-3`}>
                  <p className="text-sm font-medium mb-1">{material.label}</p>
                  <p className={`text-3xl font-bold ${status.color}`}>{material.value.toFixed(0)} kg</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {status.status === 'critical' && '🔴 Stock critique'}
                  {status.status === 'warning' && '🟡 Stock faible'}
                  {status.status === 'normal' && '🟢 Stock normal'}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!isReadOnly && (
        <Card>
          <CardHeader>
            <CardTitle>Gestion des Stocks</CardTitle>
            <CardDescription>Ajouter ou retirer des matières premières</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-600 bg-green-600/10">
                <AlertDescription className="text-green-600">{success}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label className="mb-4 block">Matériel Sélectionné: <span className="font-bold">{materials.find(m => m.key === selectedMaterial)?.label}</span></Label>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="quantity">Quantité (kg)</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Entrez la quantité"
                  step="0.1"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optionnel)</Label>
                <Input
                  id="notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Livraison fournisseur X, Bon de commande #123"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddStock} className="flex-1 gap-2" size="lg">
                  <Plus className="h-4 w-4" />
                  Ajouter Stock
                </Button>
                <Button onClick={handleRemoveStock} variant="outline" className="flex-1 gap-2" size="lg">
                  <Minus className="h-4 w-4" />
                  Retirer Stock
                </Button>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Ajustements Rapides</h3>
              <div className="grid grid-cols-4 gap-2">
                {[10, 50, 100, 500].map((amount) => (
                  <div key={`add-${amount}`} className="space-y-1">
                    <Button onClick={() => quickAdd(amount)} variant="outline" size="sm" className="w-full" disabled={isReadOnly}>
                      +{amount}
                    </Button>
                    <Button onClick={() => quickRemove(amount)} variant="outline" size="sm" className="w-full" disabled={isReadOnly}>
                      -{amount}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historique des Mouvements</CardTitle>
          <CardDescription>Traçabilité complète des modifications de stock</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stockMovements.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucun mouvement de stock enregistré</p>
            ) : (
              stockMovements.map((movement) => {
                const isAddition = movement.operation === 'ajout'
                return (
                  <div key={movement.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition">
                    <div className="mt-1">
                      {isAddition ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <p className="font-medium truncate">{movement.materialLabel}</p>
                        <p className={`font-bold whitespace-nowrap ${isAddition ? 'text-green-600' : 'text-blue-600'}`}>
                          {isAddition ? '+' : '-'}{movement.quantity.toFixed(2)} kg
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {new Date(movement.date).toLocaleString('fr-FR')}
                      </p>
                      <div className="text-xs space-y-1 bg-muted/50 rounded p-2">
                        <p>Avant: {movement.beforeValue.toFixed(2)} kg → Après: {movement.afterValue.toFixed(2)} kg</p>
                        {movement.notes && <p className="italic">Note: {movement.notes}</p>}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
