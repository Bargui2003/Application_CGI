// Exporter tous les services Supabase
export { SupabaseAuthService } from './auth-service'
export { UserService, type UserProfile } from './user-service'
export { StockService, type StockLevel } from './stock-service'
export { ProductionService, type ProductionRecord } from './production-service'

// Exporter la fonction pour obtenir le client Supabase
export { getSupabaseClient } from '../supabase'
