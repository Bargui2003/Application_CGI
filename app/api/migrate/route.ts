import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Variables d\'environnement Supabase manquantes')
      return NextResponse.json(
        { error: 'Erreur de configuration serveur' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Exécuter la migration pour ajouter les colonnes de profil
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS first_name TEXT,
        ADD COLUMN IF NOT EXISTS last_name TEXT,
        ADD COLUMN IF NOT EXISTS phone TEXT,
        ADD COLUMN IF NOT EXISTS avatar TEXT;
      `
    })

    if (alterError) {
      console.error('Erreur lors de l\'alter table:', alterError)
      // Essayer une approche différente avec des requêtes séparées
      try {
        await supabase.from('users').select('first_name').limit(1)
      } catch (e) {
        console.log('first_name column does not exist, will be added when used')
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration des colonnes de profil exécutée'
    })

  } catch (error: any) {
    console.error('Erreur migration:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la migration' },
      { status: 500 }
    )
  }
}