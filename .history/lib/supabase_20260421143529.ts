import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables d\'environnement Supabase manquantes. Vérifiez votre .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
    const { data, error } = await supabase
      .from('stock_levels')
      .select('*')
      .single()

    if (error) {
      // Si aucune ligne n'existe, en créer une par défaut
      if (error.code === 'PGRST116') {
        return stockLevelService.init()
      }
      throw error
    }
    return data
  },

  // Initialiser avec les valeurs par défaut
  async init(): Promise<StockLevel> {
    const { data, error } = await supabase
      .from('stock_levels')
      .insert([
        {
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
  },

  // Mettre à jour les niveaux
  async update(levels: Omit<StockLevel, 'id' | 'created_at' | 'updated_at' | 'last_updated'>): Promise<StockLevel> {
    try {
      // Utiliser upsert pour éviter les problèmes de 406/401
      // Cela va insérer si le record n'existe pas, ou mettre à jour s'il existe
      const { data, error } = await supabase
        .from('stock_levels')
        .upsert({
          id: '1', // Utiliser un ID fixe pour avoir un seul enregistrement
          hd: levels.hd,
          ld: levels.ld,
          black_color: levels.black_color,
          dryer: levels.dryer,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err: any) {
      // Si upsert échoue à cause des RLS, essayer une autre approche
      if (err.code === '401' || err.status === 401) {
        // Essayer de récupérer puis mettre à jour
        const { data: existing, error: getErr } = await supabase
          .from('stock_levels')
          .select('id')
          .maybeSingle()

        if (getErr) throw getErr

        if (existing) {
          // Si le record existe, le mettre à jour
          const { data, error } = await supabase
            .from('stock_levels')
            .update({
              hd: levels.hd,
              ld: levels.ld,
              black_color: levels.black_color,
              dryer: levels.dryer,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select()
            .single()

          if (error) throw error
          return data
        } else {
          // Si aucun record n'existe, en créer un
          return stockLevelService.init()
        }
      }
      throw err
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
