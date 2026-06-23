'use client'

import { useCallback, useEffect, useState } from 'react'
import { SupabaseAuthService, UserService, StockService, ProductionService } from '@/lib/supabase'
import type { UserProfile } from '@/lib/supabase/user-service'
import type { StockLevel } from '@/lib/supabase/stock-service'
import type { ProductionRecord } from '@/lib/supabase/production-service'

/**
 * Hook pour gérer les utilisateurs
 */
export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async (role?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = role
        ? await UserService.getUsersByRole(role as any)
        : await UserService.getAllUsers()
      setUsers(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateUserRole = useCallback(async (userId: string, role: string) => {
    try {
      await UserService.updateUserRole(userId, role as any)
      // Rafraîchir la liste
      await fetchUsers()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [fetchUsers])

  return { users, isLoading, error, fetchUsers, updateUserRole }
}

/**
 * Hook pour gérer les niveaux de stock
 */
export function useStockLevels() {
  const [stock, setStock] = useState<StockLevel | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStock = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await StockService.getCurrentLevels()
      setStock(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateStock = useCallback(
    async (userId: string, levels: Partial<Omit<StockLevel, 'id' | 'user_id' | 'updated_at'>>) => {
      try {
        const result = await StockService.updateLevels(userId, levels)
        setStock(result)
        return result
      } catch (err: any) {
        setError(err.message)
        throw err
      }
    },
    []
  )

  useEffect(() => {
    fetchStock()
  }, [fetchStock])

  return { stock, isLoading, error, fetchStock, updateStock }
}

/**
 * Hook pour gérer les enregistrements de production
 */
export function useProductionRecords(userId?: string) {
  const [records, setRecords] = useState<ProductionRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecords = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await ProductionService.getAllRecords(userId)
      setRecords(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const createRecord = useCallback(
    async (
      record: Omit<ProductionRecord, 'id' | 'user_id' | 'status' | 'created_at' | 'updated_at'>
    ) => {
      try {
        if (!userId) throw new Error('userId requis')
        const result = await ProductionService.createRecord(userId, record)
        setRecords(prev => [result, ...prev])
        return result
      } catch (err: any) {
        setError(err.message)
        throw err
      }
    },
    [userId]
  )

  const updateRecord = useCallback(async (recordId: string, updates: any) => {
    try {
      const result = await ProductionService.updateRecord(recordId, updates)
      setRecords(prev => prev.map(r => (r.id === recordId ? result : r)))
      return result
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  return {
    records,
    isLoading,
    error,
    fetchRecords,
    createRecord,
    updateRecord,
  }
}

/**
 * Hook pour s'abonner aux changements en temps réel
 */
export function useRealtimeStock(onUpdate: (stock: StockLevel) => void) {
  useEffect(() => {
    const subscription = StockService.subscribeToStockChanges(onUpdate)
    return () => {
      subscription?.unsubscribe?.()
    }
  }, [onUpdate])
}

export function useRealtimeProduction(onUpdate: (record: ProductionRecord) => void) {
  useEffect(() => {
    const subscription = ProductionService.subscribeToProductionChanges(onUpdate)
    return () => {
      subscription?.unsubscribe?.()
    }
  }, [onUpdate])
}
