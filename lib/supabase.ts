import { createClient } from '@supabase/supabase-js'

let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Variables d\'environnement Supabase manquantes. Vérifiez votre .env.local')
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }

  return supabaseClient
}

// Deprecated: Use getSupabaseClient() instead
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    return getSupabaseClient()[prop as keyof ReturnType<typeof createClient>]
  },
})

// Interfaces pour les types de données
export interface ProductionRecord {
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
  status?: 'draft' | 'validated' | 'validated_by_magasinier' | 'rejected_by_magasinier'
  created_at: string
  updated_at: string
}

export interface StockLevel {
  id: string
  hd: number
  ld: number
  black_color: number
  dryer: number
  last_updated: string
  updated_at: string
}

export interface StockMovement {
  id: string
  date: string
  material: string
  material_label: string
  quantity: number
  operation: string
  before_value: number
  after_value: number
  notes?: string
  created_at: string
}

// Fonctions utilitaires pour Supabase
export const productionService = {
  // Récupérer tous les enregistrements
  async getAll(): Promise<ProductionRecord[]> {
    const { data, error } = await supabase
      .from('production_records')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Ajouter un enregistrement
  async create(record: Omit<ProductionRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ProductionRecord> {
    const { data, error } = await supabase
      .from('production_records')
      .insert([record])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Mettre à jour un enregistrement
  async update(id: string, record: Partial<Omit<ProductionRecord, 'id' | 'created_at' | 'updated_at'>>): Promise<ProductionRecord> {
    const { data, error } = await supabase
      .from('production_records')
      .update(record)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Supprimer un enregistrement
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('production_records')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Supprimer tous les enregistrements
  async deleteAll(): Promise<void> {
    const { error } = await supabase
      .from('production_records')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Trick pour supprimer tout

    if (error) throw error
  },
}

export const stockLevelService = {
  // Récupérer les niveaux de stock actuels
  async get(): Promise<StockLevel> {
    try {
      const response = await fetch('/api/stock/levels', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error(`Stock levels API error: ${response.status} ${response.statusText}`)
        // Return defaults on error
        return {
          id: null as any,
          hd: 1000,
          ld: 1000,
          black_color: 500,
          dryer: 500,
          last_updated: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }

      const data = await response.json()
      
      // Ensure we have valid data
      if (!data) {
        return {
          id: null as any,
          hd: 1000,
          ld: 1000,
          black_color: 500,
          dryer: 500,
          last_updated: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }

      return data
    } catch (error) {
      console.error('Error fetching stock levels:', error)
      // Return defaults on error
      return {
        id: null as any,
        hd: 1000,
        ld: 1000,
        black_color: 500,
        dryer: 500,
        last_updated: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
  },

  // Initialiser avec les valeurs par défaut
  async init(): Promise<StockLevel> {
    try {
      const response = await fetch('/api/stock/levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hd: 1000,
          ld: 1000,
          black_color: 500,
          dryer: 500,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to initialize stock levels: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error initializing stock levels:', error)
      throw error
    }
  },

  // Mettre à jour les niveaux
  async update(levels: Omit<StockLevel, 'id' | 'created_at' | 'updated_at' | 'last_updated'>): Promise<StockLevel> {
    try {
      const response = await fetch('/api/stock/levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hd: levels.hd,
          ld: levels.ld,
          black_color: levels.black_color,
          dryer: levels.dryer,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data?.details || data?.error || response.statusText
        throw new Error(`Failed to update stock levels: ${errorMsg}`)
      }

      return data
    } catch (error) {
      console.error('Error updating stock levels:', error)
      throw error
    }
  },
}

export const stockMovementService = {
  // Récupérer tous les mouvements
  async getAll(): Promise<StockMovement[]> {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Ajouter un mouvement
  async create(
    movement: Omit<StockMovement, 'id' | 'created_at'>
  ): Promise<StockMovement> {
    const { data, error } = await supabase
      .from('stock_movements')
      .insert([movement])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Supprimer tous les mouvements
  async deleteAll(): Promise<void> {
    const { error } = await supabase
      .from('stock_movements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) throw error
  },
}
