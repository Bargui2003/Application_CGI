'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { productionService, stockLevelService, stockMovementService } from '@/lib/supabase'

export interface ProductionRecord {
  id: string
  date: string
  totalQuantity: number
  piecesCount: number
  wastePercentage: number
  usefulQuantity: number
  hdPercentage: number
  ldPercentage: number
  hdQuantity: number
  ldQuantity: number
  blackColorQuantity: number
  dryerQuantity: number
  weightPerPiece: number
  diameter: string
  pressure: string
  speed: number
  productionTime: number
  totalLength: number
  status?: 'draft' | 'validated' | 'validated_by_magasinier' | 'rejected_by_magasinier'
  magasinierNotes?: string
  rejectionReason?: string
}

export interface StockLevels {
  hd: number
  ld: number
  blackColor: number
  dryer: number
}

export interface StockMovement {
  id: string
  date: string
  material: 'hd' | 'ld' | 'blackColor' | 'dryer'
  materialLabel: string
  quantity: number
  operation: 'ajout' | 'consommation'
  beforeValue: number
  afterValue: number
  notes?: string
}

interface ProductionContextType {
  productionHistory: ProductionRecord[]
  stockLevels: StockLevels
  stockMovements: StockMovement[]
  isLoading: boolean
  error: string | null
  addProduction: (record: Omit<ProductionRecord, 'id' | 'date'>) => Promise<ProductionRecord>
  updateProduction: (id: string, record: Partial<Omit<ProductionRecord, 'id' | 'date'>>) => Promise<ProductionRecord>
  deleteProduction: (id: string) => Promise<void>
  updateStockLevels: (stocks: StockLevels) => Promise<void>
  addToStock: (material: 'hd' | 'ld' | 'blackColor' | 'dryer', quantity: number, notes?: string) => Promise<void>
  removeFromStock: (material: 'hd' | 'ld' | 'blackColor' | 'dryer', quantity: number, notes?: string) => Promise<boolean>
  clearHistory: () => Promise<void>
  refreshData: () => Promise<void>
}

const ProductionContext = createContext<ProductionContextType | undefined>(undefined)

export function ProductionProvider({ children }: { children: React.ReactNode }) {
  const [productionHistory, setProductionHistory] = useState<ProductionRecord[]>([])
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [stockLevels, setStockLevels] = useState<StockLevels>({
    hd: 1000,
    ld: 1000,
    blackColor: 500,
    dryer: 500,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les données au montage
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Charger la production
      const prodData = await productionService.getAll()
      const formattedProd: ProductionRecord[] = prodData.map((p: any) => ({
        id: p.id,
        date: p.date,
        totalQuantity: p.total_quantity,
        piecesCount: p.pieces_count,
        wastePercentage: p.waste_percentage,
        usefulQuantity: p.useful_quantity,
        hdPercentage: p.hd_percentage,
        ldPercentage: p.ld_percentage,
        hdQuantity: p.hd_quantity,
        ldQuantity: p.ld_quantity,
        blackColorQuantity: p.black_color_quantity,
        dryerQuantity: p.dryer_quantity,
        weightPerPiece: p.weight_per_piece,
        diameter: p.diameter,
        pressure: p.pressure,
        speed: p.speed,
        productionTime: p.production_time,
        totalLength: p.total_length,
        status: p.status || 'draft',
        magasinierNotes: p.magasinier_notes || '',
        rejectionReason: p.rejection_reason || '',
      }))
      setProductionHistory(formattedProd)

      // Charger les niveaux de stock
      try {
        const stockData = await stockLevelService.get()
        if (stockData) {
          setStockLevels({
            hd: stockData.hd || 1000,
            ld: stockData.ld || 1000,
            blackColor: stockData.black_color || 500,
            dryer: stockData.dryer || 500,
          })
        }
      } catch (err) {
        console.error('Erreur lors du chargement des niveaux de stock:', err)
        // Utiliser les valeurs par défaut en cas d'erreur
        setStockLevels({
          hd: 1000,
          ld: 1000,
          blackColor: 500,
          dryer: 500,
        })
      }

      // Charger les mouvements de stock
      const movementsData = await stockMovementService.getAll()
      const formattedMovements: StockMovement[] = movementsData.map((m: any) => ({
        id: m.id,
        date: m.date,
        material: m.material,
        materialLabel: m.material_label,
        quantity: m.quantity,
        operation: m.operation,
        beforeValue: m.before_value,
        afterValue: m.after_value,
        notes: m.notes,
      }))
      setStockMovements(formattedMovements)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors du chargement des données'
      setError(errorMsg)
      console.error('Erreur Supabase:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Charger les données au montage
  useEffect(() => {
    loadData()
  }, [loadData])

  const refreshData = useCallback(async () => {
    await loadData()
  }, [loadData])

  const addProduction = async (record: Omit<ProductionRecord, 'id' | 'date'>) => {
    try {
      setError(null)

      // Ajouter à la production
      const newProduction = await productionService.create({
        date: new Date().toISOString(),
        total_quantity: record.totalQuantity,
        pieces_count: record.piecesCount,
        waste_percentage: record.wastePercentage,
        useful_quantity: record.usefulQuantity,
        hd_percentage: record.hdPercentage,
        ld_percentage: record.ldPercentage,
        hd_quantity: record.hdQuantity,
        ld_quantity: record.ldQuantity,
        black_color_quantity: record.blackColorQuantity,
        dryer_quantity: record.dryerQuantity,
        weight_per_piece: record.weightPerPiece,
        diameter: record.diameter,
        pressure: record.pressure,
        speed: record.speed,
        production_time: record.productionTime,
        total_length: record.totalLength,
        status: 'draft',
      })

      // Mettre à jour l'état local
      const formattedProd: ProductionRecord = {
        id: newProduction.id,
        date: newProduction.date,
        totalQuantity: newProduction.total_quantity,
        piecesCount: newProduction.pieces_count,
        wastePercentage: newProduction.waste_percentage,
        usefulQuantity: newProduction.useful_quantity,
        hdPercentage: newProduction.hd_percentage,
        ldPercentage: newProduction.ld_percentage,
        hdQuantity: newProduction.hd_quantity,
        ldQuantity: newProduction.ld_quantity,
        blackColorQuantity: newProduction.black_color_quantity,
        dryerQuantity: newProduction.dryer_quantity,
        weightPerPiece: newProduction.weight_per_piece,
        diameter: newProduction.diameter,
        pressure: newProduction.pressure,
        speed: newProduction.speed,
        productionTime: newProduction.production_time,
        totalLength: newProduction.total_length,
        status: (newProduction as any).status || 'draft',
        magasinierNotes: (newProduction as any).magasinier_notes || '',
        rejectionReason: (newProduction as any).rejection_reason || '',
      }

      setProductionHistory((prev) => [formattedProd, ...prev])
      // Note: Stock levels are NOT updated here - only magasinier should update stocks
      // setStockLevels(newStocks)

      // Retourner la production formatée
      return formattedProd
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de l\'ajout de la production'
      setError(errorMsg)
      throw err
    }
  }

  const updateProduction = async (id: string, record: Partial<Omit<ProductionRecord, 'id' | 'date'>>) => {
    try {
      setError(null)

      // Mettre à jour la production
      const updatedProduction = await productionService.update(id, {
        total_quantity: record.totalQuantity,
        pieces_count: record.piecesCount,
        waste_percentage: record.wastePercentage,
        useful_quantity: record.usefulQuantity,
        hd_percentage: record.hdPercentage,
        ld_percentage: record.ldPercentage,
        hd_quantity: record.hdQuantity,
        ld_quantity: record.ldQuantity,
        black_color_quantity: record.blackColorQuantity,
        dryer_quantity: record.dryerQuantity,
        weight_per_piece: record.weightPerPiece,
        diameter: record.diameter,
        pressure: record.pressure,
        speed: record.speed,
        production_time: record.productionTime,
        total_length: record.totalLength,
        ...(record.status && { status: record.status }),
      })

      // Mettre à jour l'état local
      const formattedProd: ProductionRecord = {
        id: updatedProduction.id,
        date: updatedProduction.date,
        totalQuantity: updatedProduction.total_quantity,
        piecesCount: updatedProduction.pieces_count,
        wastePercentage: updatedProduction.waste_percentage,
        usefulQuantity: updatedProduction.useful_quantity,
        hdPercentage: updatedProduction.hd_percentage,
        ldPercentage: updatedProduction.ld_percentage,
        hdQuantity: updatedProduction.hd_quantity,
        ldQuantity: updatedProduction.ld_quantity,
        blackColorQuantity: updatedProduction.black_color_quantity,
        dryerQuantity: updatedProduction.dryer_quantity,
        weightPerPiece: updatedProduction.weight_per_piece,
        diameter: updatedProduction.diameter,
        pressure: updatedProduction.pressure,
        speed: updatedProduction.speed,
        productionTime: updatedProduction.production_time,
        totalLength: updatedProduction.total_length,
        status: (updatedProduction as any).status || 'draft',
        magasinierNotes: (updatedProduction as any).magasinier_notes || '',
        rejectionReason: (updatedProduction as any).rejection_reason || '',
      }

      setProductionHistory((prev) => prev.map(p => p.id === id ? formattedProd : p))

      return formattedProd
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la production'
      setError(errorMsg)
      throw err
    }
  }

  const deleteProduction = async (id: string) => {
    try {
      setError(null)

      // Trouver la production à supprimer pour ajuster les stocks
      const productionToDelete = productionHistory.find(p => p.id === id)
      if (!productionToDelete) {
        throw new Error('Production non trouvée')
      }

      // Supprimer la production
      await productionService.delete(id)

      // Restaurer les stocks (ajouter les quantités consommées)
      const newStocks = {
        hd: stockLevels.hd + productionToDelete.hdQuantity,
        ld: stockLevels.ld + productionToDelete.ldQuantity,
        blackColor: stockLevels.blackColor + productionToDelete.blackColorQuantity,
        dryer: stockLevels.dryer + productionToDelete.dryerQuantity,
      }

      // Sauvegarder les nouveaux niveaux
      await stockLevelService.update({
        hd: newStocks.hd,
        ld: newStocks.ld,
        black_color: newStocks.blackColor,
        dryer: newStocks.dryer,
      })

      // Mettre à jour l'état local
      setProductionHistory((prev) => prev.filter(p => p.id !== id))
      setStockLevels(newStocks)

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la suppression de la production'
      setError(errorMsg)
      throw err
    }
  }

  const updateStockLevels = async (stocks: StockLevels) => {
    try {
      setError(null)
      await stockLevelService.update({
        hd: stocks.hd,
        ld: stocks.ld,
        black_color: stocks.blackColor,
        dryer: stocks.dryer,
      })
      setStockLevels(stocks)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la mise à jour des stocks'
      setError(errorMsg)
      throw err
    }
  }

  const addToStock = async (material: 'hd' | 'ld' | 'blackColor' | 'dryer', quantity: number, notes?: string) => {
    try {
      setError(null)

      const materialMap = {
        hd: 'hd',
        ld: 'ld',
        blackColor: 'black_color',
        dryer: 'dryer',
      }

      const materialLabels = {
        hd: 'HD (Haute Densité)',
        ld: 'LD (Basse Densité)',
        blackColor: 'Couleur Noire',
        dryer: 'Sécheur',
      }

      const beforeValue = stockLevels[material]
      const newValue = beforeValue + quantity

      // Ajouter le mouvement
      await stockMovementService.create({
        date: new Date().toISOString(),
        material,
        material_label: materialLabels[material],
        quantity,
        operation: 'ajout',
        before_value: beforeValue,
        after_value: newValue,
        notes,
      })

      // Mettre à jour les niveaux
      const newStocks = { ...stockLevels, [material]: newValue }
      await updateStockLevels(newStocks)

      // Mettre à jour les mouvements localement
      setStockMovements((prev) => [
        {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          material,
          materialLabel: materialLabels[material],
          quantity,
          operation: 'ajout',
          beforeValue,
          afterValue: newValue,
          notes,
        },
        ...prev,
      ])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de l\'ajout au stock'
      setError(errorMsg)
      throw err
    }
  }

  const removeFromStock = async (
    material: 'hd' | 'ld' | 'blackColor' | 'dryer',
    quantity: number,
    notes?: string
  ): Promise<boolean> => {
    try {
      setError(null)

      const beforeValue = stockLevels[material]
      if (beforeValue - quantity < 0) {
        setError('Stock insuffisant')
        return false
      }

      const materialLabels = {
        hd: 'HD (Haute Densité)',
        ld: 'LD (Basse Densité)',
        blackColor: 'Couleur Noire',
        dryer: 'Sécheur',
      }

      const newValue = beforeValue - quantity

      // Ajouter le mouvement
      await stockMovementService.create({
        date: new Date().toISOString(),
        material,
        material_label: materialLabels[material],
        quantity,
        operation: 'consommation',
        before_value: beforeValue,
        after_value: newValue,
        notes,
      })

      // Mettre à jour les niveaux
      const newStocks = { ...stockLevels, [material]: newValue }
      await updateStockLevels(newStocks)

      // Mettre à jour les mouvements localement
      setStockMovements((prev) => [
        {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          material,
          materialLabel: materialLabels[material],
          quantity,
          operation: 'consommation',
          beforeValue,
          afterValue: newValue,
          notes,
        },
        ...prev,
      ])

      return true
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la suppression du stock'
      setError(errorMsg)
      throw err
    }
  }

  const clearHistory = async () => {
    try {
      setError(null)
      await productionService.deleteAll()
      await stockMovementService.deleteAll()
      setProductionHistory([])
      setStockMovements([])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'historique'
      setError(errorMsg)
      throw err
    }
  }

  return (
    <ProductionContext.Provider
      value={{
        productionHistory,
        stockLevels,
        stockMovements,
        isLoading,
        error,
        addProduction,
        updateProduction,
        deleteProduction,
        updateStockLevels,
        addToStock,
        removeFromStock,
        clearHistory,
        refreshData,
      }}
    >
      {children}
    </ProductionContext.Provider>
  )
}

export function useProduction() {
  const context = useContext(ProductionContext)
  if (!context) {
    throw new Error('useProduction doit être utilisé dans ProductionProvider')
  }
  return context
}
