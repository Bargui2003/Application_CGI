'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

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
  addProduction: (record: Omit<ProductionRecord, 'id' | 'date'>) => void
  updateStockLevels: (stocks: StockLevels) => void
  addToStock: (material: 'hd' | 'ld' | 'blackColor' | 'dryer', quantity: number, notes?: string) => void
  removeFromStock: (material: 'hd' | 'ld' | 'blackColor' | 'dryer', quantity: number, notes?: string) => boolean
  clearHistory: () => void
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

  // Load from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('productionHistory')
    const savedStocks = localStorage.getItem('stockLevels')
    const savedMovements = localStorage.getItem('stockMovements')

    if (savedHistory) {
      try {
        setProductionHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.error('Erreur lors du chargement de l\'historique:', e)
      }
    }

    if (savedStocks) {
      try {
        setStockLevels(JSON.parse(savedStocks))
      } catch (e) {
        console.error('Erreur lors du chargement des stocks:', e)
      }
    }

    if (savedMovements) {
      try {
        setStockMovements(JSON.parse(savedMovements))
      } catch (e) {
        console.error('Erreur lors du chargement des mouvements:', e)
      }
    }
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('productionHistory', JSON.stringify(productionHistory))
  }, [productionHistory])

  useEffect(() => {
    localStorage.setItem('stockLevels', JSON.stringify(stockLevels))
  }, [stockLevels])

  useEffect(() => {
    localStorage.setItem('stockMovements', JSON.stringify(stockMovements))
  }, [stockMovements])

  const addProduction = (record: Omit<ProductionRecord, 'id' | 'date'>) => {
    const newRecord: ProductionRecord = {
      ...record,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    }

    setProductionHistory([newRecord, ...productionHistory])

    // Update stock levels
    const newStocks = {
      hd: stockLevels.hd - record.hdQuantity,
      ld: stockLevels.ld - record.ldQuantity,
      blackColor: stockLevels.blackColor - record.blackColorQuantity,
      dryer: stockLevels.dryer - record.dryerQuantity,
    }
    setStockLevels(newStocks)
  }

  const updateStockLevels = (stocks: StockLevels) => {
    setStockLevels(stocks)
  }

  const addToStock = (material: 'hd' | 'ld' | 'blackColor' | 'dryer', quantity: number, notes?: string) => {
    const materialLabels = {
      hd: 'HD (Haute Densité)',
      ld: 'LD (Basse Densité)',
      blackColor: 'Couleur Noire',
      dryer: 'Sécheur',
    }

    const beforeValue = stockLevels[material]
    const newStocks = { ...stockLevels, [material]: beforeValue + quantity }
    setStockLevels(newStocks)

    const movement: StockMovement = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      material,
      materialLabel: materialLabels[material],
      quantity,
      operation: 'ajout',
      beforeValue,
      afterValue: beforeValue + quantity,
      notes,
    }

    setStockMovements([movement, ...stockMovements])
  }

  const removeFromStock = (material: 'hd' | 'ld' | 'blackColor' | 'dryer', quantity: number, notes?: string): boolean => {
    const beforeValue = stockLevels[material]
    if (beforeValue - quantity < 0) {
      return false // Not enough stock
    }

    const materialLabels = {
      hd: 'HD (Haute Densité)',
      ld: 'LD (Basse Densité)',
      blackColor: 'Couleur Noire',
      dryer: 'Sécheur',
    }

    const newStocks = { ...stockLevels, [material]: beforeValue - quantity }
    setStockLevels(newStocks)

    const movement: StockMovement = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      material,
      materialLabel: materialLabels[material],
      quantity,
      operation: 'consommation',
      beforeValue,
      afterValue: beforeValue - quantity,
      notes,
    }

    setStockMovements([movement, ...stockMovements])
    return true
  }

  const clearHistory = () => {
    setProductionHistory([])
  }

  return (
    <ProductionContext.Provider value={{ productionHistory, stockLevels, stockMovements, addProduction, updateStockLevels, addToStock, removeFromStock, clearHistory }}>
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
