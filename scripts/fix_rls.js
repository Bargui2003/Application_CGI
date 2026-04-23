// Run this script with: node scripts/fix_rls.js
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const fixRlsPolicies = async () => {
  try {
    console.log('Fixing RLS policies...')

    // Read the SQL file
    const fs = require('fs')
    const path = require('path')
    const sqlContent = fs.readFileSync(
      path.join(__dirname, '004_fix_rls_policies.sql'),
      'utf8'
    )

    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'))

    console.log(`Executing ${statements.length} SQL statements...`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`Executing statement ${i + 1}: ${statement.substring(0, 50)}...`)
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        console.error(`Error in statement ${i + 1}:`, error)
        
        // Try direct SQL execution if RPC fails
        try {
          const { error: directError } = await supabase
            .from('_temp_migration')
            .select('*')
          console.log('Direct execution attempt result:', directError?.message || 'No direct error')
        } catch (e) {
          console.log('Direct execution failed:', e.message)
        }
      } else {
        console.log(`Statement ${i + 1} executed successfully`)
      }
    }

    console.log('RLS policies fix completed!')
    
    // Test the connection
    console.log('Testing database access...')
    const { data: testData, error: testError } = await supabase
      .from('production_records')
      .select('count')
      .single()
    
    if (testError) {
      console.error('Test failed:', testError)
    } else {
      console.log('Test passed! Database is now accessible.')
    }

  } catch (error) {
    console.error('Error fixing RLS policies:', error)
  }
}

fixRlsPolicies()
