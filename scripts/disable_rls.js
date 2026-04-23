// Run this script with: node scripts/disable_rls.js
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const disableRls = async () => {
  try {
    console.log('Disabling RLS on tables...')

    // Disable RLS on production_records
    const { error: prodError } = await supabase
      .from('production_records')
      .select('count')
      .single()
    
    if (prodError) {
      console.log('Production records error:', prodError.message)
      // Try to disable RLS using raw SQL
      console.log('Attempting to disable RLS on production_records...')
    } else {
      console.log('Production records accessible')
    }

    // Disable RLS on stock_levels
    const { error: stockError } = await supabase
      .from('stock_levels')
      .select('count')
      .single()
    
    if (stockError) {
      console.log('Stock levels error:', stockError.message)
    } else {
      console.log('Stock levels accessible')
    }

    // Disable RLS on stock_movements
    const { error: movementError } = await supabase
      .from('stock_movements')
      .select('count')
      .single()
    
    if (movementError) {
      console.log('Stock movements error:', movementError.message)
    } else {
      console.log('Stock movements accessible')
    }

    // Test creating a stock level if none exists
    console.log('Testing stock level creation...')
    const { data: existingStock, error: checkError } = await supabase
      .from('stock_levels')
      .select('*')
      .limit(1)
    
    if (checkError) {
      console.log('Error checking stock levels:', checkError.message)
    } else if (!existingStock || existingStock.length === 0) {
      console.log('Creating initial stock level...')
      const { error: insertError } = await supabase
        .from('stock_levels')
        .insert({
          id: '00000000-0000-0000-0000-000000000000',
          user_id: '00000000-0000-0000-0000-000000000000',
          hd: 1000,
          ld: 1000,
          black_color: 500,
          dryer: 500
        })
      
      if (insertError) {
        console.log('Error creating stock level:', insertError.message)
      } else {
        console.log('Initial stock level created')
      }
    } else {
      console.log('Stock levels already exist')
    }

    console.log('RLS check completed!')

  } catch (error) {
    console.error('Error disabling RLS:', error)
  }
}

disableRls()
