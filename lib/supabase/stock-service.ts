import { getSupabaseClient } from '../supabase'

export interface StockLevel {
  id: string
  user_id: string
  hd: number
  ld: number
  black_color: number
  dryer: number
  updated_at: string
}

export class StockService {
  private static supabase = getSupabaseClient()

  /**
   * Récupérer les niveaux de stock actuels
   */
  static async getCurrentLevels(): Promise<StockLevel | null> {
    try {
      const { data, error } = await this.supabase
        .from('stock_levels')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code === 'PGRST116') {
        // Aucun enregistrement trouvé, retourner null
        return null
      }

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Erreur récupération niveaux stock:', error)
      return null
    }
  }

  /**
   * Initialiser les niveaux de stock
   */
  static async initializeLevels(userId: string): Promise<StockLevel> {
    try {
      const { data, error } = await this.supabase
        .from('stock_levels')
        .insert([
          {
            user_id: userId,
            hd: 1000,
            ld: 1000,
            black_color: 500,
            dryer: 500,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      throw new Error(error.message || 'Erreur initialisation stock')
    }
  }

  /**
   * Mettre à jour les niveaux de stock
   */
  static async updateLevels(
    userId: string,
    levels: Partial<Omit<StockLevel, 'id' | 'user_id' | 'updated_at'>>
  ): Promise<StockLevel> {
    try {
      const existing = await this.getCurrentLevels()

      let result
      if (existing) {
        // Mise à jour
        const { data, error } = await this.supabase
          .from('stock_levels')
          .update({
            ...levels,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        result = data
      } else {
        // Insertion
        result = await this.initializeLevels(userId)
      }

      return result
    } catch (error: any) {
      throw new Error(error.message || 'Erreur mise à jour stock')
    }
  }

  /**
   * Consommer du matériel (réduire le stock)
   */
  static async consumeMaterial(
    userId: string,
    material: keyof Omit<StockLevel, 'id' | 'user_id' | 'updated_at'>,
    quantity: number,
    notes?: string
  ): Promise<StockLevel> {
    try {
      const current = await this.getCurrentLevels()
      if (!current) throw new Error('Niveaux de stock non initialisés')

      const currentValue = current[material] || 0
      const newValue = Math.max(0, currentValue - quantity)

      const updated = await this.updateLevels(userId, {
        [material]: newValue,
      })

      // Enregistrer le mouvement
      await this.logMovement(userId, material, quantity, 'consume', currentValue, newValue, notes)

      return updated
    } catch (error: any) {
      throw new Error(error.message || 'Erreur consommation matériel')
    }
  }

  /**
   * Ajouter du matériel (augmenter le stock)
   */
  static async addMaterial(
    userId: string,
    material: keyof Omit<StockLevel, 'id' | 'user_id' | 'updated_at'>,
    quantity: number,
    notes?: string
  ): Promise<StockLevel> {
    try {
      const current = await this.getCurrentLevels()
      if (!current) throw new Error('Niveaux de stock non initialisés')

      const currentValue = current[material] || 0
      const newValue = currentValue + quantity

      const updated = await this.updateLevels(userId, {
        [material]: newValue,
      })

      // Enregistrer le mouvement
      await this.logMovement(userId, material, quantity, 'add', currentValue, newValue, notes)

      return updated
    } catch (error: any) {
      throw new Error(error.message || 'Erreur ajout matériel')
    }
  }

  /**
   * Enregistrer un mouvement de stock
   */
  static async logMovement(
    userId: string,
    material: string,
    quantity: number,
    operation: 'add' | 'consume',
    beforeValue: number,
    afterValue: number,
    notes?: string
  ) {
    try {
      const materialLabels: Record<string, string> = {
        hd: 'HD (Haute Densité)',
        ld: 'LD (Basse Densité)',
        black_color: 'Colorant Noir',
        dryer: 'Sécheur',
      }

      await this.supabase
        .from('stock_movements')
        .insert([
          {
            user_id: userId,
            material,
            material_label: materialLabels[material] || material,
            quantity,
            operation,
            before_value: beforeValue,
            after_value: afterValue,
            notes,
          },
        ])
    } catch (error: any) {
      console.error('Erreur enregistrement mouvement:', error)
    }
  }

  /**
   * Récupérer l'historique des mouvements
   */
  static async getMovementHistory(limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Erreur récupération historique:', error)
      return []
    }
  }

  /**
   * S'abonner aux changements de stock en temps réel
   */
  static subscribeToStockChanges(callback: (data: StockLevel) => void) {
    return this.supabase
      .channel('stock_levels_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_levels',
        },
        (payload) => {
          callback(payload.new as StockLevel)
        }
      )
      .subscribe()
  }
}
