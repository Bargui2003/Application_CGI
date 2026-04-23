// Script to update users table schema to add missing columns
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const updateUsersSchema = async () => {
  try {
    console.log('=== UPDATING USERS TABLE SCHEMA ===')
    
    // Add missing columns to users table
    const alterQueries = [
      // Add first_name column
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name TEXT;`,
      
      // Add last_name column  
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name TEXT;`,
      
      // Add phone column
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;`,
      
      // Add avatar column
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;`,
      
      // Add updated_at column
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`
    ]
    
    for (const query of alterQueries) {
      console.log(`Executing: ${query}`)
      const { data, error } = await supabase.rpc('exec_sql', { sql: query })
      
      if (error) {
        console.error(`Error: ${error.message}`)
      } else {
        console.log(`✅ Success: ${data}`)
      }
    }
    
    console.log('=== USERS TABLE SCHEMA UPDATED ===')
    
  } catch (error) {
    console.error('Error updating users schema:', error)
  }
}

// Run the update
updateUsersSchema()
