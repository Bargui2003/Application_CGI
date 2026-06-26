'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle2, Save, FileText, Share2, Zap, Calculator, Edit, Trash2 } from 'lucide-react'
import { useProduction, ProductionRecord, StockLevels } from '@/context/production-context-supabase'
import { useToast } from '@/components/ui/use-toast'
import { generateProductionSheet, downloadPDF, ProductionStatus } from '@/lib/pdf-generator'
import { calculateCalibreChangeLoss } from '@/lib/calibre-change'

interface CalculationResult {
  totalQuantity: number
  wastePercentage: number
  usefulQuantity: number
  hdQuantity: number
  ldQuantity: number
  blackColorQuantity: number
  dryerQuantity: number
  piecesCount: number
  weightPerPiece: number
  speed: number
  productionTime: number
  totalLength: number
  calibreChangeLoss?: number // Time loss in hours due to diameter change
  calibreChangeLossMinutes?: number // Time loss in minutes
  previousDiameter?: string // Previous diameter for reference
}

interface StockStatus {
  item: string
  required: number
  available: number
  hasEnough: boolean
}

const PRODUCT_SPECS: Record<string, Record<string, { min: number; max: number }>> = {
  '25': { 'PN6': { min: 11, max: 12 }, 'PN10': { min: 13, max: 14 }, 'PN10F': { min: 15, max: 16 } },
  '32': { 'PN6': { min: 20, max: 21 }, 'PN8': { min: 21, max: 22 }, 'PN10': { min: 24, max: 25 } },
  '40': { 'PN6': { min: 29, max: 30 }, 'PN8': { min: 34, max: 35 }, 'PN10': { min: 39, max: 40 } },
  '50': { 'PN6': { min: 39, max: 40 }, 'PN8': { min: 49, max: 50 }, 'PN10': { min: 58, max: 60 } },
  '63': { 'PN6': { min: 60, max: 62 }, 'PN8': { min: 70, max: 72 }, 'PN10': { min: 84, max: 85 } },
  '75': { 'PN6': { min: 84, max: 85 }, 'PN8': { min: 95, max: 97 }, 'PN10': { min: 110, max: 112 } },
  '90': { 'PN6': { min: 130, max: 135 }, 'PN8': { min: 150, max: 155 } },
}

export function ProductionCalculator() {
  const [piecesCount, setPiecesCount] = useState('')
  const [hdPercentage, setHdPercentage] = useState('50')
  const [ldPercentage, setLdPercentage] = useState('50')
  const [wastePercentage, setWastePercentage] = useState('5')
  const [diameter, setDiameter] = useState('25')
  const [pressure, setPressure] = useState('PN6')
  const [speed, setSpeed] = useState('100')
  const [conductor, setConductor] = useState('')
  const [shift, setShift] = useState('')
  const [previousDiameter, setPreviousDiameter] = useState<string | null>(null)
  const [showCalibreWarning, setShowCalibreWarning] = useState(false)
  
  const [stockHd, setStockHd] = useState('500')
  const [stockLd, setStockLd] = useState('500')
  const [stockBlackColor, setStockBlackColor] = useState('50')
  const [stockDryer, setStockDryer] = useState('50')

  const [result, setResult] = useState<CalculationResult | null>(null)
  const [stockStatus, setStockStatus] = useState<StockStatus[]>([])
  const [validationError, setValidationError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [lastProductionId, setLastProductionId] = useState<string | null>(null)
  const [productionState, setProductionState] = useState<ProductionStatus>({
    lastShiftIndex: 0,
    remainingMinutes: 480,
    totalPiecesProduced: 0,
  })
  const [editingProduction, setEditingProduction] = useState<ProductionRecord | null>(null)
  const { addProduction, updateProduction, deleteProduction, productionHistory, stockLevels } = useProduction()
  const { toast } = useToast()

  // Initialize stock inputs from context on mount
  useEffect(() => {
    setStockHd(stockLevels.hd.toString())
    setStockLd(stockLevels.ld.toString())
    setStockBlackColor(stockLevels.blackColor.toString())
    setStockDryer(stockLevels.dryer.toString())
  }, [])

  const loadProductionForEdit = (production: ProductionRecord) => {
    setEditingProduction(production)
    setPiecesCount(production.piecesCount.toString())
    setHdPercentage(production.hdPercentage.toString())
    setLdPercentage(production.ldPercentage.toString())
    setWastePercentage(production.wastePercentage.toString())
    setDiameter(production.diameter)
    setPressure(production.pressure)
    setSpeed(production.speed.toString())
    setResult(null)
    setStockStatus([])
    setValidationError('')
  }

  const calculate = () => {
    setValidationError('')
    
    if (!piecesCount) {
      setValidationError('Veuillez entrer le nombre de pièces')
      return
    }

    const hdPct = parseFloat(hdPercentage)
    const ldPct = parseFloat(ldPercentage)
    
    if (hdPct + ldPct !== 100) {
      setValidationError('HD% + LD% doit égaler 100%')
      return
    }

    // Get weight per piece from product specs (average of min and max)
    const specs = PRODUCT_SPECS[diameter]?.[pressure]
    if (!specs) {
      setValidationError('Spécifications de produit invalides')
      return
    }

    const waste = parseFloat(wastePercentage)
    const pieces = parseFloat(piecesCount)

    // Calculate total quantity automatically: pieces × average weight per piece
    const weightPerPiece = (specs.min + specs.max) / 2
    const total = pieces * weightPerPiece

    const usefulQty = total * (1 - waste / 100)
    const hdQty = usefulQty * (hdPct / 100)
    const ldQty = usefulQty * (ldPct / 100)
    const blackColorQty = usefulQty / 100
    const dryerQty = usefulQty / 100

    // Calculate production time based on speed
    const speedValue = parseFloat(speed)
    if (speedValue <= 0) {
      setValidationError('La vitesse doit être supérieure à 0')
      return
    }

    // Calculate total length: 1 pièce = 1 rouleau = 100 mètres
    const totalLength = pieces * 100 // meters (chaque rouleau = 100m)
    let productionTime = totalLength / speedValue // minutes

    // Calculate calibre change loss if there's a previous diameter
    let calibreChangeLoss = 0
    let calibreChangeLossMinutes = 0
    if (previousDiameter && previousDiameter !== diameter) {
      calibreChangeLoss = calculateCalibreChangeLoss(previousDiameter, diameter)
      calibreChangeLossMinutes = calibreChangeLoss * 60
      productionTime += calibreChangeLossMinutes // Add the lost time to production time
      setShowCalibreWarning(true)
    } else {
      setShowCalibreWarning(false)
    }

    const calculation: CalculationResult = {
      totalQuantity: total,
      wastePercentage: waste,
      usefulQuantity: usefulQty,
      hdQuantity: hdQty,
      ldQuantity: ldQty,
      blackColorQuantity: blackColorQty,
      dryerQuantity: dryerQty,
      piecesCount: pieces,
      weightPerPiece,
      speed: speedValue,
      productionTime,
      totalLength,
      calibreChangeLoss,
      calibreChangeLossMinutes,
      previousDiameter: previousDiameter || undefined,
    }

    setResult(calculation)

    // Check stock levels
    const hdStock = parseFloat(stockHd)
    const ldStock = parseFloat(stockLd)
    const blackColorStock = parseFloat(stockBlackColor)
    const dryerStock = parseFloat(stockDryer)

    const stocks: StockStatus[] = [
      { item: 'HD (Haute Densité)', required: hdQty, available: hdStock, hasEnough: hdStock >= hdQty },
      { item: 'LD (Basse Densité)', required: ldQty, available: ldStock, hasEnough: ldStock >= ldQty },
      { item: 'Couleur Noire', required: blackColorQty, available: blackColorStock, hasEnough: blackColorStock >= blackColorQty },
      { item: 'Sécheur', required: dryerQty, available: dryerStock, hasEnough: dryerStock >= dryerQty },
    ]

    setStockStatus(stocks)
  }

  const diameters = Object.keys(PRODUCT_SPECS)
  const pressures = diameter ? Object.keys(PRODUCT_SPECS[diameter]) : []

  function resetForm() {
    throw new Error('Function not implemented.')
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="mb-8 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 shadow-lg">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Calculatrice de Production
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Calculez et validez vos productions facilement</p>
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-md bg-linear-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
        <CardHeader className="pb-4">
          <CardTitle>Paramètres de Production</CardTitle>
          <CardDescription>Entrez les paramètres et matériaux pour générer votre calcul</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pieces" className="text-base font-semibold">Nombre de Pièces</Label>
              <Input
                id="pieces"
                type="number"
                value={piecesCount}
                onChange={(e) => setPiecesCount(e.target.value)}
                placeholder="Entrez le nombre de pièces/rouleaux"
                className="border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <p className="text-xs text-muted-foreground">Rouleaux à produire</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="waste" className="text-base font-semibold">Taux de Déchet</Label>
              <Input
                id="waste"
                type="number"
                value={wastePercentage}
                onChange={(e) => setWastePercentage(e.target.value)}
                placeholder="Pourcentage de déchet"
                className="border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <p className="text-xs text-muted-foreground">% de matériau perdu</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="diameter" className="text-base font-semibold">Diamètre & Pression</Label>
              <div className="space-y-3">
                <select
                  id="diameter"
                  value={diameter}
                  onChange={(e) => {
                    setDiameter(e.target.value)
                    setPressure(Object.keys(PRODUCT_SPECS[e.target.value])[0])
                  }}
                  className="w-full px-3 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                >
                  {diameters.map((d) => (
                    <option key={d} value={d}>
                      Ø {d} mm
                    </option>
                  ))}
                </select>
                
                <div className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-bold text-blue-900 dark:text-blue-200 mb-3 uppercase tracking-wider">Classes de Pression Disponibles</p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {Object.keys(PRODUCT_SPECS[diameter]).map((pn) => (
                      <button
                        key={pn}
                        type="button"
                        onClick={() => setPressure(pn)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                          pressure === pn
                            ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                            : 'bg-white dark:bg-slate-700 border-2 border-blue-200 dark:border-blue-700 text-foreground hover:bg-blue-50 dark:hover:bg-slate-600'
                        }`}
                      >
                        {pn}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    💡 Poids/pièce: <span className="font-bold">{PRODUCT_SPECS[diameter][pressure].min}-{PRODUCT_SPECS[diameter][pressure].max} kg</span>
                  </p>
                </div>
                
                {/* Previous Diameter Selection for Calibre Change */}
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-700">
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-2 uppercase">⚙️ Changement de Calibre (Optionnel)</p>
                  <select
                    value={previousDiameter || ''}
                    onChange={(e) => setPreviousDiameter(e.target.value || null)}
                    className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-md bg-white dark:bg-slate-800 text-sm text-foreground focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  >
                    <option value="">Aucun changement de calibre</option>
                    {diameters.filter(d => d !== diameter).map((d) => (
                      <option key={d} value={d}>
                        Ø {d} mm → Ø {diameter} mm
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1.5">
                    Sélectionnez le calibre précédent pour calculer automatiquement la perte de temps
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="speed" className="text-base font-semibold">Vitesse de Production</Label>
              <Input
                id="speed"
                type="number"
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
                placeholder="Vitesse en m/min"
                className="border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <p className="text-xs text-muted-foreground">Mètres par minute</p>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-linear-to-b from-purple-500 to-pink-500 rounded-full"></div>
              Composition des Matériaux
            </h3>
            
            <div className="mb-6 p-4 bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-3">⚡ Présets Rapides</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={hdPercentage === '50' && ldPercentage === '50' ? 'default' : 'outline'}
                  onClick={() => {
                    setHdPercentage('50')
                    setLdPercentage('50')
                  }}
                  className="text-sm font-medium transition-all hover:scale-105"
                >
                  HD 50% / LD 50%
                </Button>
                <Button
                  type="button"
                  variant={hdPercentage === '60' && ldPercentage === '40' ? 'default' : 'outline'}
                  onClick={() => {
                    setHdPercentage('60')
                    setLdPercentage('40')
                  }}
                  className="text-sm font-medium transition-all hover:scale-105"
                >
                  HD 60% / LD 40%
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hd" className="font-semibold">HD (Haute Densité) %</Label>
                <Input
                  id="hd"
                  type="number"
                  value={hdPercentage}
                  onChange={(e) => setHdPercentage(e.target.value)}
                  placeholder="Pourcentage HD"
                  className="border-2 border-purple-200 dark:border-purple-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <div className="text-xs bg-purple-50 dark:bg-purple-950/30 p-2 rounded border border-purple-200 dark:border-purple-700">
                  <p className="text-purple-700 dark:text-purple-300 font-medium">
                    {hdPercentage}% + {ldPercentage}% = <span className={`font-bold ${Math.abs(parseFloat(hdPercentage) + parseFloat(ldPercentage) - 100) > 0.1 ? 'text-red-600' : 'text-green-600'}`}>{(parseFloat(hdPercentage) + parseFloat(ldPercentage)).toFixed(0)}%</span>
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ld" className="font-semibold">LD (Basse Densité) %</Label>
                <Input
                  id="ld"
                  type="number"
                  value={ldPercentage}
                  onChange={(e) => setLdPercentage(e.target.value)}
                  placeholder="Pourcentage LD"
                  className="border-2 border-purple-200 dark:border-purple-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-linear-to-b from-green-500 to-emerald-500 rounded-full"></div>
              Niveaux de Stock Actuels (kg)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock-hd" className="font-medium">Stock HD</Label>
                <Input
                  id="stock-hd"
                  type="number"
                  value={stockHd}
                  onChange={(e) => setStockHd(e.target.value)}
                  placeholder="Stock HD en kg"
                  className="border-2 border-green-200 dark:border-green-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock-ld" className="font-medium">Stock LD</Label>
                <Input
                  id="stock-ld"
                  type="number"
                  value={stockLd}
                  onChange={(e) => setStockLd(e.target.value)}
                  placeholder="Stock LD en kg"
                  className="border-2 border-green-200 dark:border-green-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock-color" className="font-medium">Stock Couleur Noire</Label>
                <Input
                  id="stock-color"
                  type="number"
                  value={stockBlackColor}
                  onChange={(e) => setStockBlackColor(e.target.value)}
                  placeholder="Stock couleur noire en kg"
                  className="border-2 border-green-200 dark:border-green-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock-dryer" className="font-medium">Stock Sécheur</Label>
                <Input
                  id="stock-dryer"
                  type="number"
                  value={stockDryer}
                  onChange={(e) => setStockDryer(e.target.value)}
                  placeholder="Stock sécheur en kg"
                  className="border-2 border-green-200 dark:border-green-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {validationError && (
            <Alert variant="destructive" className="border-2 border-red-300 bg-red-50 dark:bg-red-950/30">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="font-medium text-red-800 dark:text-red-200">{validationError}</AlertDescription>
            </Alert>
          )}
          <Button 
            onClick={calculate} 
            size="lg" 
            className="w-full font-bold text-base bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 py-3"
          >
            <Zap className="h-5 w-5 mr-2" />
            Calculer la Production
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card className="border-0 shadow-md bg-linear-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 overflow-hidden">
            <CardHeader className="pb-4 bg-linear-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-b border-blue-200 dark:border-blue-800">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-linear-to-br from-blue-500 to-blue-600">
                  <Calculator className="h-5 w-5 text-white" />
                </div>
                Résumé de Production
              </CardTitle>
              <CardDescription>Matériaux et quantités calculés</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 rounded-lg p-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold uppercase tracking-wider">📦 Entrée Totale</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{result.totalQuantity.toFixed(2)} <span className="text-lg">kg</span></p>
                </div>
                <div className="bg-linear-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 rounded-lg p-4 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
                  <p className="text-sm text-red-700 dark:text-red-300 font-semibold uppercase tracking-wider">🗑️ Perte de Déchet</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{(result.totalQuantity - result.usefulQuantity).toFixed(2)} <span className="text-lg">kg</span></p>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">({result.wastePercentage}%)</p>
                </div>
                <div className="bg-linear-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 rounded-lg p-4 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                  <p className="text-sm text-green-700 dark:text-green-300 font-semibold uppercase tracking-wider">✅ Quantité Utilisable</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{result.usefulQuantity.toFixed(2)} <span className="text-lg">kg</span></p>
                </div>
                <div className="bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 rounded-lg p-4 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
                  <p className="text-sm text-purple-700 dark:text-purple-300 font-semibold uppercase tracking-wider">🔵 HD Requis</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{result.hdQuantity.toFixed(2)} <span className="text-lg">kg</span></p>
                </div>
                <div className="bg-linear-to-br from-pink-50 to-pink-100 dark:from-pink-950/50 dark:to-pink-900/50 rounded-lg p-4 border-l-4 border-pink-500 hover:shadow-lg transition-shadow">
                  <p className="text-sm text-pink-700 dark:text-pink-300 font-semibold uppercase tracking-wider">🔴 LD Requis</p>
                  <p className="text-3xl font-bold text-pink-600 dark:text-pink-400 mt-2">{result.ldQuantity.toFixed(2)} <span className="text-lg">kg</span></p>
                </div>
                <div className="bg-linear-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/50 rounded-lg p-4 border-l-4 border-amber-500 hover:shadow-lg transition-shadow">
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-semibold uppercase tracking-wider">📊 Pièces Produites</p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">{result.piecesCount.toFixed(0)}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">{result.weightPerPiece.toFixed(3)} kg/pièce</p>
                </div>
                <div className="bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 rounded-lg p-4 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
                  <p className="text-sm text-orange-700 dark:text-orange-300 font-semibold uppercase tracking-wider">⚫ Couleur Noire</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{result.blackColorQuantity.toFixed(2)} <span className="text-lg">kg</span></p>
                </div>
                <div className="bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800/50 dark:to-slate-700/50 rounded-lg p-4 border-l-4 border-slate-500 hover:shadow-lg transition-shadow">
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider">💨 Sécheur</p>
                  <p className="text-3xl font-bold text-slate-600 dark:text-slate-400 mt-2">{result.dryerQuantity.toFixed(2)} <span className="text-lg">kg</span></p>
                </div>
                <div className="bg-linear-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/50 dark:to-cyan-900/50 rounded-lg p-4 border-l-4 border-cyan-500 hover:shadow-lg transition-shadow">
                  <p className="text-sm text-cyan-700 dark:text-cyan-300 font-semibold uppercase tracking-wider">⚙️ Vitesse</p>
                  <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">{result.speed.toFixed(2)} <span className="text-lg">m/min</span></p>
                </div>
                <div className="bg-linear-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/50 dark:to-indigo-900/50 rounded-lg p-4 border-l-4 border-indigo-500 hover:shadow-lg transition-shadow">
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 font-semibold uppercase tracking-wider">⏱️ Temps Production</p>
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{result.productionTime.toFixed(0)} <span className="text-lg">min</span></p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-1">{Math.floor(result.productionTime / 60)}h {Math.round(result.productionTime % 60)}min</p>
                </div>
                <div className="bg-linear-to-br from-teal-50 to-teal-100 dark:from-teal-950/50 dark:to-teal-900/50 rounded-lg p-4 border-l-4 border-teal-500 hover:shadow-lg transition-shadow">
                  <p className="text-sm text-teal-700 dark:text-teal-300 font-semibold uppercase tracking-wider">📏 Longueur Totale</p>
                  <p className="text-3xl font-bold text-teal-600 dark:text-teal-400 mt-2">{result.totalLength.toFixed(0)} <span className="text-lg">m</span></p>
                </div>
              </div>

              {/* Calibre Change Warning */}
              {showCalibreWarning && result.calibreChangeLoss && result.calibreChangeLoss > 0 && (
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-2">⚙️ Changement de Calibre Détecté</h4>
                      <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                        Passage de Ø{result.previousDiameter}mm à Ø{diameter}mm
                      </p>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="bg-white dark:bg-slate-800 p-2 rounded border border-amber-200 dark:border-amber-700">
                          <p className="text-xs text-amber-600 dark:text-amber-300 font-semibold uppercase">Perte de Temps</p>
                          <p className="text-lg font-bold text-amber-700 dark:text-amber-200">{result.calibreChangeLoss}h</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-2 rounded border border-amber-200 dark:border-amber-700">
                          <p className="text-xs text-amber-600 dark:text-amber-300 font-semibold uppercase">Soit</p>
                          <p className="text-lg font-bold text-amber-700 dark:text-amber-200">{result.calibreChangeLossMinutes} min</p>
                        </div>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 italic">
                        Cette perte de temps a été automatiquement ajoutée au temps de production.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-linear-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
            <CardHeader className="pb-4 bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b border-green-200 dark:border-green-800">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-linear-to-br from-green-500 to-green-600">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                Vérification des Stocks
              </CardTitle>
              <CardDescription>Vérifiez si le stock actuel est suffisant pour la production</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {stockStatus.map((stock) => (
                <div 
                  key={stock.item} 
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    stock.hasEnough 
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700' 
                      : 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700'
                  }`}
                >
                  <div className="flex-1">
                    <p className={`font-bold ${stock.hasEnough ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                      {stock.item}
                    </p>
                    <p className={`text-sm ${stock.hasEnough ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      <span className="font-semibold">Requis:</span> {stock.required.toFixed(2)} kg | <span className="font-semibold">Disponible:</span> {stock.available.toFixed(2)} kg
                    </p>
                  </div>
                  {stock.hasEnough ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0" />
                  )}
                </div>
              ))}
              
              <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  onClick={async () => {
                    setIsSaving(true)
                    try {
                      if (editingProduction) {
                        // Mise à jour
                        await updateProduction(editingProduction.id, {
                          totalQuantity: result.totalQuantity,
                          piecesCount: result.piecesCount,
                          wastePercentage: result.wastePercentage,
                          usefulQuantity: result.usefulQuantity,
                          hdPercentage: parseFloat(hdPercentage),
                          ldPercentage: parseFloat(ldPercentage),
                          hdQuantity: result.hdQuantity,
                          ldQuantity: result.ldQuantity,
                          blackColorQuantity: result.blackColorQuantity,
                          dryerQuantity: result.dryerQuantity,
                          weightPerPiece: result.weightPerPiece,
                          diameter,
                          pressure,
                          speed: result.speed,
                          productionTime: result.productionTime,
                          totalLength: result.totalLength,
                        })
                        toast({
                          title: '✅ Succès',
                          description: 'Production mise à jour avec succès',
                        })
                      } else {
                        // Nouvelle production
                        const production = await addProduction({
                          totalQuantity: result.totalQuantity,
                          piecesCount: result.piecesCount,
                          wastePercentage: result.wastePercentage,
                          usefulQuantity: result.usefulQuantity,
                          hdPercentage: parseFloat(hdPercentage),
                          ldPercentage: parseFloat(ldPercentage),
                          hdQuantity: result.hdQuantity,
                          ldQuantity: result.ldQuantity,
                          blackColorQuantity: result.blackColorQuantity,
                          dryerQuantity: result.dryerQuantity,
                          weightPerPiece: result.weightPerPiece,
                          diameter,
                          pressure,
                          speed: result.speed,
                          productionTime: result.productionTime,
                          totalLength: result.totalLength,
                        })
                        if (production?.id) {
                          setLastProductionId(production.id)
                          // Update previous diameter for next production
                          setPreviousDiameter(diameter)
                          toast({
                            title: '✅ Succès',
                            description: 'Production sauvegardée avec succès',
                          })
                        }
                      }
                      resetForm()
                    } catch (error) {
                      toast({
                        title: '❌ Erreur',
                        description: editingProduction ? 'Erreur lors de la mise à jour' : 'Erreur lors de la sauvegarde',
                        variant: 'destructive',
                      })
                      console.error('Erreur lors de la sauvegarde:', error)
                    } finally {
                      setIsSaving(false)
                    }
                  }}
                  className="flex-1 gap-2 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-bold text-base shadow-lg hover:shadow-xl transition-all"
                  disabled={stockStatus.some(s => !s.hasEnough) || isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {editingProduction ? 'Mise à jour...' : 'Sauvegarde...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {editingProduction ? 'Mettre à Jour' : 'Sauvegarder'}
                    </>
                  )}
                </Button>
                
                {lastProductionId && (
                  <Button
                    onClick={async () => {
                      setIsValidating(true)
                      try {
                        const response = await fetch('/api/production/validate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            productionId: lastProductionId,
                            status: 'validated',
                          }),
                        })
                        if (response.ok) {
                          toast({
                            title: '✅ Succès',
                            description: 'Production validée et partagée',
                          })
                          setLastProductionId(null)
                        } else {
                          toast({
                            title: '❌ Erreur',
                            description: 'Erreur lors de la validation',
                            variant: 'destructive',
                          })
                        }
                      } catch (error) {
                        toast({
                          title: '❌ Erreur',
                          description: 'Erreur lors de la validation',
                          variant: 'destructive',
                        })
                        console.error('Erreur lors de la validation:', error)
                      } finally {
                        setIsValidating(false)
                      }
                    }}
                    className="flex-1 gap-2 bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                    disabled={isValidating}
                  >
                    {isValidating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Validation...
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4" />
                        Valider & Partager
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  onClick={() => {
                    const today = new Date().toLocaleDateString('fr-FR')
                    const productionResult = generateProductionSheet({
                      date: today,
                      conductor: conductor || 'À remplir',
                      shift: shift || 'À remplir',
                      diameter,
                      pressure,
                      targetQuantity: result.totalQuantity,
                      targetPieces: result.piecesCount,
                      speed: result.speed,
                      productionTime: result.productionTime,
                      hdPercentage: parseFloat(hdPercentage),
                      ldPercentage: parseFloat(ldPercentage),
                      wastePercentage: parseFloat(wastePercentage),
                      startingShiftIndex: productionState.lastShiftIndex,
                      availableMinutesForFirstShift: productionState.remainingMinutes,
                    })
                    downloadPDF(productionResult.html, 'fiche-production.pdf')
                    // Update production state for next order
                    setProductionState(productionResult.status)
                  }}
                  variant="outline"
                  className="gap-2 font-bold border-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <FileText className="h-4 w-4" />
                  Télécharger
                </Button>
                
                <Button
                  onClick={() => {
                    setProductionState({
                      lastShiftIndex: 0,
                      remainingMinutes: 480,
                      totalPiecesProduced: 0,
                    })
                  }}
                  variant="ghost"
                  className="gap-2 text-muted-foreground hover:text-foreground font-medium"
                  title="Réinitialise la boucle d'équipes pour commencer une nouvelle séquence"
                >
                  ↻ Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Section Gestion des Productions */}
      {productionHistory.length > 0 && (
        <Card className="border-0 shadow-md bg-linear-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
          <CardHeader className="pb-4 bg-linear-to-r from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30 border-b border-slate-200 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-linear-to-br from-slate-500 to-gray-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              Gestion des Productions
            </CardTitle>
            <CardDescription>Gérer vos productions existantes - modifier ou supprimer</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {productionHistory.slice(0, 10).map((production) => (
                <div
                  key={production.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-lg">{production.diameter} {production.pressure}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(production.date).toLocaleDateString('fr-FR')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        production.status === 'validated'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {production.status === 'validated' ? 'Validée' : 'Brouillon'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Pièces:</span>
                        <span className="font-semibold ml-1">{production.piecesCount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quantité:</span>
                        <span className="font-semibold ml-1">{production.totalQuantity.toFixed(1)} kg</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Temps:</span>
                        <span className="font-semibold ml-1">{production.productionTime.toFixed(0)} min</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Déchet:</span>
                        <span className="font-semibold ml-1">{production.wastePercentage}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => loadProductionForEdit(production)}
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Modifier
                    </Button>
                    <Button
                      onClick={async () => {
                        if (confirm('Êtes-vous sûr de vouloir supprimer cette production ?')) {
                          try {
                            await deleteProduction(production.id)
                            toast({
                              title: '✅ Succès',
                              description: 'Production supprimée avec succès',
                            })
                          } catch (error) {
                            toast({
                              title: '❌ Erreur',
                              description: 'Erreur lors de la suppression',
                              variant: 'destructive',
                            })
                          }
                        }
                      }}
                      variant="destructive"
                      size="sm"
                      className="gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
              {productionHistory.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  Et {productionHistory.length - 10} autres productions...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
