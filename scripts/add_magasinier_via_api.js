// Script to add magasinier user via Supabase Admin API
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
    
    // First, add 'magasinier' to the user_role enum
    console.log('Step 1: Adding magasinier to user_role enum...')
    
    // Use raw SQL to add enum value
    const { data: enumResult, error: enumError } = await supabaseAdmin
      .rpc('exec_sql', { 
        sql: "ALTER TYPE user_role ADD VALUE 'magasinier';" 
      })
    
    if (enumError) {
      console.log('Enum addition result:', enumError)
      // Try alternative approach - might already exist
      if (!enumError.message.includes('already exists')) {
        console.log('Error adding enum value:', enumError)
        return
      }
    } else {
      console.log('✅ Enum value added successfully')
    }
    
    // Wait a moment for enum to be committed
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Create the user
    console.log('Step 2: Creating magasinier user...')
    
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert([{
        username: 'magasinier',
        email: 'magasinier@cgi.com',
        password_hash: 'magasinier',
        first_name: 'Magasinier',
        last_name: 'CGI',
        phone: '0123456789',
        role: 'magasinier',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (userError) {
      console.error('Error creating user:', userError)
      
      // Try workaround: create with existing role then update
      console.log('Trying workaround approach...')
      
      const { data: tempUser, error: tempError } = await supabaseAdmin
        .from('users')
        .insert([{
          username: 'magasinier',
          email: 'magasinier@cgi.com',
          password_hash: 'magasinier',
          first_name: 'Magasinier',
          last_name: 'CGI',
          phone: '0123456789',
          role: 'admin', // Use existing role temporarily
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (tempError) {
        console.error('Workaround also failed:', tempError)
      } else {
        console.log('✅ User created with temporary role')
        
        // Update to correct role
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
        } else {
          console.log('✅ User role updated to magasinier')
        }
      }
    } else {
      console.log('✅ User created successfully!')
      console.log('User details:', {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role
      })
    }
    
    // Verify the user was created
    console.log('Step 3: Verifying user creation...')
    const { data: verifyUser } = await supabaseAdmin
      .from('users')
      .select('id, username, email, role, first_name, last_name, created_at')
      .eq('username', 'magasinier')
      .single()
    
    if (verifyUser) {
      console.log('✅ User verification successful!')
      console.log('Final user data:', verifyUser)
    } else {
      console.log('❌ User verification failed')
    }
    
    // Show all enum values
    console.log('Step 4: Checking enum values...')
    const { data: enumValues } = await supabaseAdmin
      .from('pg_enum')
      .select('enumlabel')
      .eq('enumtypid', supabaseAdmin
        .from('pg_type')
        .select('oid')
        .eq('typname', 'user_role')
        .single()
        .then(({ data }) => data?.oid)
      )
    
    if (enumValues) {
      console.log('Available user roles:', enumValues.map(e => e.enumlabel))
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the function
addMagasinierUser()
