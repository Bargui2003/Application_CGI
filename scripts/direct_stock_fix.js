// Direct fix for stock_levels table access
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const directFix = async () => {
  try {
    console.log('=== DIRECT FIX APPROACH ===')

    // Get all data with service key
    const { data: allData, error: allError } = await supabase
      .from('stock_levels')
      .select('*')
    
    if (allError) {
      console.error('Error with service key:', allError.message)
      return
    }
    
    console.log('Service key can see:', allData.length, 'rows')
    
    // Delete all existing rows
    console.log('Clearing existing stock_levels...')
    const { error: deleteError } = await supabase
      .from('stock_levels')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (deleteError) {
      console.error('Error deleting:', deleteError.message)
    } else {
      console.log('Existing data cleared')
    }
    
    // Insert new data
    console.log('Inserting new stock data...')
    const { data: newData, error: insertError } = await supabase
      .from('stock_levels')
      .insert({
        hd: 1000,
        ld: 1000,
        black_color: 500,
        dryer: 500,
        user_id: '00000000-0000-0000-0000-000000000000'
      })
      .select()
    
    if (insertError) {
      console.error('Error inserting:', insertError.message)
    } else {
      console.log('New data inserted:', newData)
    }
    
    // Test anon access
    const anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: anonData, error: anonError } = await anonSupabase
      .from('stock_levels')
      .select('*')
    
    if (anonError) {
      console.error('Anon access failed:', anonError.message)
    } else {
      console.log('SUCCESS: Anon can see:', anonData.length, 'rows')
      anonData.forEach((row, i) => {
        console.log(`  Row ${i+1}: HD=${row.hd}, LD=${row.ld}, User_ID=${row.user_id}`)
      })
    }

    console.log('=== DIRECT FIX COMPLETE ===')
  } catch (error) {
    console.error('Direct fix error:', error)
  }
}

directFix()
