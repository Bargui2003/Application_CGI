import { getSupabaseClient } from '../supabase'

export interface ProductionRecord {
  id: string
  user_id: string
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
  status?: 'draft' | 'validated' | 'validated_by_magasinier' | 'rejected_by_magasinier'
  created_at: string
  updated_at: string
}

export class ProductionService {
  private static supabase = getSupabaseClient()

  /**
   * Créer un nouvel enregistrement de production
   */
  static async createRecord(
    userId: string,
    record: Omit<ProductionRecord, 'id' | 'user_id' | 'status' | 'created_at' | 'updated_at'>
  ): Promise<ProductionRecord> {
    try {
      const { data, error } = await this.supabase
        .from('production_records')
        .insert([
          {
            user_id: userId,
            ...record,
            status: 'draft',
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      throw new Error(error.message || 'Erreur création enregistrement production')
    }
  }

  /**
   * Récupérer tous les enregistrements de production
   */
  static async getAllRecords(userId?: string): Promise<ProductionRecord[]> {
    try {
      let query = this.supabase
        .from('production_records')
        .select('*')
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Erreur récupération enregistrements production:', error)
      return []
    }
  }

  /**
   * Récupérer un enregistrement par ID
   */
  static async getRecordById(recordId: string): Promise<ProductionRecord | null> {
    try {
      const { data, error } = await this.supabase
        .from('production_records')
        .select('*')
        .eq('id', recordId)
        .single()

      if (error && error.code === 'PGRST116') {
        return null
      }

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Erreur récupération enregistrement:', error)
      return null
    }
  }

  /**
   * Mettre à jour un enregistrement
   */
  static async updateRecord(
    recordId: string,
    updates: Partial<Omit<ProductionRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<ProductionRecord> {
    try {
      const { data, error } = await this.supabase
        .from('production_records')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recordId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      throw new Error(error.message || 'Erreur mise à jour enregistrement')
    }
  }

  /**
   * Valider un enregistrement (conducteur)
   */
  static async validateRecord(recordId: string): Promise<ProductionRecord> {
    try {
      return await this.updateRecord(recordId, {
        status: 'validated',
      })
    } catch (error: any) {
      throw new Error(error.message || 'Erreur validation enregistrement')
    }
  }

  /**
   * Valider un enregistrement par le magasinier
   */
  static async validateByMagasinier(recordId: string): Promise<ProductionRecord> {
    try {
      return await this.updateRecord(recordId, {
        status: 'validated_by_magasinier',
      })
    } catch (error: any) {
      throw new Error(error.message || 'Erreur validation magasinier')
    }
  }

  /**
   * Rejeter un enregistrement
   */
  static async rejectRecord(recordId: string): Promise<ProductionRecord> {
    try {
      return await this.updateRecord(recordId, {
        status: 'rejected_by_magasinier',
      })
    } catch (error: any) {
      throw new Error(error.message || 'Erreur rejet enregistrement')
    }
  }

  /**
   * Supprimer un enregistrement
   */
  static async deleteRecord(recordId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('production_records')
        .delete()
        .eq('id', recordId)

      if (error) throw error
    } catch (error: any) {
      throw new Error(error.message || 'Erreur suppression enregistrement')
    }
  }

  /**
   * Récupérer les statistiques de production
   */
  static async getProductionStats(userId?: string): Promise<{
    totalRecords: number
    totalQuantity: number
    averageWaste: number
    averageSpeed: number
  }> {
    try {
      let query = this.supabase
        .from('production_records')
        .select('total_quantity, waste_percentage, speed', { count: 'exact' })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, count, error } = await query

      if (error) throw error

      const stats = {
        totalRecords: count || 0,
        totalQuantity: data?.reduce((sum: number, r: any) => sum + (r.total_quantity || 0), 0) || 0,
        averageWaste: data?.length
          ? data.reduce((sum: number, r: any) => sum + (r.waste_percentage || 0), 0) / data.length
          : 0,
        averageSpeed: data?.length
          ? data.reduce((sum: number, r: any) => sum + (r.speed || 0), 0) / data.length
          : 0,
      }

      return stats
    } catch (error: any) {
      console.error('Erreur récupération stats:', error)
      return {
        totalRecords: 0,
        totalQuantity: 0,
        averageWaste: 0,
        averageSpeed: 0,
      }
    }
  }

  /**
   * S'abonner aux changements de production en temps réel
   */
  static subscribeToProductionChanges(
    callback: (record: ProductionRecord) => void
  ) {
    return this.supabase
      .channel('production_records_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'production_records',
        },
        (payload) => {
          callback(payload.new as ProductionRecord)
        }
      )
      .subscribe()
  }

  /**
   * Récupérer les enregistrements en attente de validation
   */
  static async getPendingRecords(): Promise<ProductionRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('production_records')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Erreur récupération enregistrements en attente:', error)
      return []
    }
  }
}
