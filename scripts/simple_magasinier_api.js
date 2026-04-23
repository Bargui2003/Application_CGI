// Simple script to add magasinier user via Supabase Admin API
const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

// Create Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const addMagasinierUser = async () => {
  try {
    console.log('=== ADDING MAGASINIER USER VIA SUPABASE ADMIN API ===')
    
    // Step 1: Create user with existing role first (workaround for enum issue)
    console.log('Step 1: Creating user with existing role...')
    
    const { data: tempUser, error: tempError } = await supabaseAdmin
      .from('users')
      .insert([{
        username: 'magasinier',
        email: 'magasinier@cgi.com',
        password_hash: 'magasinier',
        first_name: 'Magasinier',
        last_name: 'CGI',
        phone: '0123456789',
        role: 'admin', // Use existing enum value temporarily
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (tempError) {
      console.error('Error creating temporary user:', tempError)
      return
    }
    
    console.log('✅ User created with temporary role:', {
      id: tempUser.id,
      username: tempUser.username,
      email: tempUser.email,
      role: tempUser.role
    })
    
    // Wait for the user creation to be committed
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 2: Update role to 'magasinier'
    console.log('Step 2: Updating role to magasinier...')
    
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        role: 'magasinier',
        updated_at: new Date().toISOString()
      })
      .eq('username', 'magasinier')
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating role:', updateError)
      console.log('Trying to add enum value first...')
      
      // Try adding enum value directly
      const { error: enumError } = await supabaseAdmin
        .from('pg_type')
        .select('oid')
        .eq('typname', 'user_role')
        .single()
      
      if (enumError) {
        console.error('Error getting enum type:', enumError)
      } else {
        console.log('Enum type found, but cannot modify via API')
      }
    } else {
      console.log('✅ User role updated successfully!')
      console.log('Final user data:', {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name
      })
    }
    
    // Step 3: Verify the user
    console.log('Step 3: Verifying user creation...')
    
    const { data: verifyUser } = await supabaseAdmin
      .from('users')
      .select('id, username, email, role, first_name, last_name, created_at')
      .eq('username', 'magasinier')
      .single()
    
    if (verifyUser) {
      console.log('✅ User verification successful!')
      console.log('Login credentials:')
      console.log('  Username: magasinier')
      console.log('  Email: magasinier@cgi.com')
      console.log('  Password: magasinier')
      console.log('  Role:', verifyUser.role)
    } else {
      console.log('❌ User verification failed')
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the function
addMagasinierUser()
