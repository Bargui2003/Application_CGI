'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useProduction } from '@/context/production-context-supabase'
import { useAuth } from '@/context/auth-context'
import { Download, Filter, Search, CheckCircle2, Clock, AlertCircle, Printer, XCircle } from 'lucide-react'
import { downloadPDF, generateProductionSheet } from '@/lib/pdf-generator'

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'draft':
      return <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Brouillon
      </Badge>
    case 'validated_by_magasinier':
      return <Badge variant="default" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
        <CheckCircle2 className="h-3 w-3" />
        Validé par magasinier
      </Badge>
    case 'rejected_by_magasinier':
      return <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Refusé par magasinier
      </Badge>
    default:
      return <Badge variant="outline" className="flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Validée
      </Badge>
  }
}

export function ProductionRecords() {
  const { productionHistory } = useProduction()
  const { isAdmin, isConducteur } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDiameter, setFilterDiameter] = useState('')
  const [filterPressure, setFilterPressure] = useState('')
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent')

  // Filtrer les productions validées par magasinier uniquement
  const filteredProductions = useMemo(() => {
    let results = [...(productionHistory || [])].filter(p => p.status === 'validated_by_magasinier')

    // Filtrer par diamètre
    if (filterDiameter) {
      results = results.filter(p => p.diameter === filterDiameter)
    }

    // Filtrer par pression
    if (filterPressure) {
      results = results.filter(p => p.pressure === filterPressure)
    }

    // Filtrer par terme de recherche (date, pièces)
    if (searchTerm) {
      results = results.filter(p => 
        new Date(new Date(p.date).getTime() + 3600000).toLocaleDateString('fr-FR').includes(searchTerm) ||
        p.piecesCount.toString().includes(searchTerm)
      )
    }

    // Trier par date
    if (sortOrder === 'recent') {
      results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } else {
      results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }

    return results
  }, [productionHistory, filterDiameter, filterPressure, searchTerm, sortOrder])

  // Obtenir les options uniques
  const diameterOptions = useMemo(() => {
    return [...new Set(productionHistory?.map(p => p.diameter) || [])].sort()
  }, [productionHistory])

  const pressureOptions = useMemo(() => {
    return [...new Set(productionHistory?.map(p => p.pressure) || [])].sort()
  }, [productionHistory])

  const handleDownloadPDF = (production: any) => {
    try {
      const sheet = generateProductionSheet({
        date: new Date(new Date(production.date).getTime() + 3600000).toLocaleDateString('fr-FR'),
        conductor: 'Conducteur',
        shift: 'À remplir',
        diameter: production.diameter,
        pressure: production.pressure,
        targetQuantity: production.totalQuantity,
        targetPieces: production.piecesCount,
        speed: production.speed,
        productionTime: production.productionTime,
        hdPercentage: production.hdPercentage,
        ldPercentage: production.ldPercentage,
        wastePercentage: production.wastePercentage,
      })
      downloadPDF(sheet.html, `production-${production.id}.pdf`)
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
    }
  }

  if (productionHistory.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Aucune fiche de production</h3>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Créez et validez des productions pour qu'elles apparaissent ici"
              : "Aucune fiche de production n'a encore été créée"}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Fiches de Production</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredProductions.length} fiche{filteredProductions.length > 1 ? 's' : ''} disponible{filteredProductions.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <Card className="bg-muted/40">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Recherche */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par date ou pièces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtre diamètre */}
            <select
              value={filterDiameter}
              onChange={(e) => setFilterDiameter(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="">Tous les diamètres</option>
              {diameterOptions.map(d => (
                <option key={d} value={d}>Ø {d}mm</option>
              ))}
            </select>

            {/* Filtre pression */}
            <select
              value={filterPressure}
              onChange={(e) => setFilterPressure(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="">Toutes les pressions</option>
              {pressureOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Tri par date */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'recent' | 'oldest')}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="recent">Plus récent</option>
              <option value="oldest">Plus ancien</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des productions */}
      {filteredProductions.length === 0 ? (
        <Card>
          <CardContent className="pt-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Aucun résultat</h3>
            <p className="text-muted-foreground">Essayez de modifier vos filtres de recherche</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProductions.map((production) => (
            <Card key={production.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3 bg-linear-to-r from-blue-50 to-purple-50 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-lg">
                        Ø{production.diameter}mm - {production.pressure}
                      </h4>
                      {getStatusBadge(production.status || 'validated')}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(new Date(production.date).getTime() + 3600000).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  {/* Pièces */}
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Pièces</p>
                    <p className="text-lg font-bold text-foreground">{production.piecesCount.toFixed(0)}</p>
                  </div>

                  {/* Quantité totale */}
                  <div className="p-3 rounded-lg bg-blue-50">
                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Total (kg)</p>
                    <p className="text-lg font-bold text-blue-600">{production.totalQuantity.toFixed(2)}</p>
                  </div>

                  {/* Quantité utile */}
                  <div className="p-3 rounded-lg bg-green-50">
                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Utile (kg)</p>
                    <p className="text-lg font-bold text-green-600">{production.usefulQuantity.toFixed(2)}</p>
                  </div>

                  {/* Perte */}
                  <div className="p-3 rounded-lg bg-red-50">
                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Perte</p>
                    <p className="text-lg font-bold text-red-600">{production.wastePercentage.toFixed(1)}%</p>
                  </div>

                  {/* Temps de production */}
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Durée</p>
                    <p className="text-lg font-bold">{production.productionTime.toFixed(1)} min</p>
                  </div>

                  {/* Vitesse */}
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Vitesse</p>
                    <p className="text-lg font-bold">{production.speed.toFixed(0)} m/min</p>
                  </div>
                </div>

                {/* Composition */}
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <h5 className="font-semibold text-sm mb-3">Composition & Matériaux</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* HD */}
                    <div className="p-3 bg-white rounded-lg border border-blue-200">
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">HD</p>
                      <p className="font-bold text-blue-600">{production.hdQuantity.toFixed(2)} kg</p>
                      <p className="text-xs text-muted-foreground mt-1">{production.hdPercentage.toFixed(0)}%</p>
                    </div>

                    {/* LD */}
                    <div className="p-3 bg-white rounded-lg border border-purple-200">
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">LD</p>
                      <p className="font-bold text-purple-600">{production.ldQuantity.toFixed(2)} kg</p>
                      <p className="text-xs text-muted-foreground mt-1">{production.ldPercentage.toFixed(0)}%</p>
                    </div>

                    {/* Couleur noire */}
                    <div className="p-3 bg-white rounded-lg border border-gray-800">
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Couleur</p>
                      <p className="font-bold text-gray-800">{production.blackColorQuantity.toFixed(2)} kg</p>
                    </div>

                    {/* Sécheur */}
                    <div className="p-3 bg-white rounded-lg border border-orange-200">
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Sécheur</p>
                      <p className="font-bold text-orange-600">{production.dryerQuantity.toFixed(2)} kg</p>
                    </div>
                  </div>
                </div>

                {/* Motifs magasinier */}
                {(production.magasinierNotes || production.rejectionReason) && (
                  <div className="space-y-3 mb-6">
                    {production.magasinierNotes && (
                      <Alert className="border-green-200 bg-green-50 text-green-800">
                        <AlertDescription>
                          <span className="font-semibold">Note du magasinier :</span> {production.magasinierNotes}
                        </AlertDescription>
                      </Alert>
                    )}
                    {production.rejectionReason && (
                      <Alert className="border-destructive bg-destructive/10 text-destructive">
                        <AlertDescription>
                          <span className="font-semibold">Raison du refus :</span> {production.rejectionReason}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    className="gap-2"
                    onClick={() => handleDownloadPDF(production)}
                  >
                    <Download className="h-4 w-4" />
                    Télécharger PDF
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-4 w-4" />
                    Imprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
