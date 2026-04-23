// Alternative approach: Use Supabase REST API to add missing columns
// Use built-in fetch in Node.js 18+
const fetch = (...args) => require('node-fetch').default(...args)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const addMissingColumns = async () => {
  try {
    console.log('=== ADDING MISSING COLUMNS TO USERS TABLE ===')
    
    const columnsToAdd = [
      { name: 'first_name', type: 'text' },
      { name: 'last_name', type: 'text' },
      { name: 'phone', type: 'text' },
      { name: 'avatar', type: 'text' }
    ]
    
    for (const column of columnsToAdd) {
      console.log(`Adding column: ${column.name}`)
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/alter_table`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          sql: `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ${column.name} ${column.type.toUpperCase()};`
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Added ${column.name}:`, result)
      } else {
        console.error(`❌ Failed to add ${column.name}:`, response.status, response.statusText)
      }
    }
    
    console.log('=== MISSING COLUMNS ADDED ===')
    
  } catch (error) {
    console.error('Error adding columns:', error)
  }
}

// Run the function
addMissingColumns()
