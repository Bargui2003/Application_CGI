// Script to add magasinier users to Supabase database
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const magasinierUsers = [
  {
    username: 'magasinier1',
    email: 'magasinier1@example.com',
    password: 'magasinier123',
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '0123456789'
  },
  {
    username: 'magasinier2',
    email: 'magasinier2@example.com',
    password: 'magasinier123',
    firstName: 'Marie',
    lastName: 'Martin',
    phone: '0123456789'
  },
  {
    username: 'magasinier3',
    email: 'magasinier3@example.com',
    password: 'magasinier123',
    firstName: 'Pierre',
    lastName: 'Durand',
    phone: '0123456789'
  }
]

const addMagasinierUsers = async () => {
  try {
    console.log('=== ADDING MAGASINIER USERS ===')
    
    for (const user of magasinierUsers) {
      console.log(`Adding user: ${user.username}`)
      
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', user.username)
        .single()
      
      if (existingUser) {
        console.log(`User ${user.username} already exists, skipping...`)
        continue
      }
      
      // Create the user
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            username: user.username,
            first_name: user.firstName,
            last_name: user.lastName,
            phone: user.phone,
            role: 'magasinier'
          }
        }
      })
      
      if (error) {
        console.error(`Error creating user ${user.username}:`, error)
      } else {
        console.log(`✅ Successfully created user: ${user.username}`)
        
        // Update the user record with the correct role (in case auth doesn't set it properly)
        if (data.user) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              role: 'magasinier',
              updated_at: new Date().toISOString()
            })
            .eq('id', data.user.id)
          
          if (updateError) {
            console.error(`Error updating role for ${user.username}:`, updateError)
          } else {
            console.log(`✅ Role set to 'magasinier' for user: ${user.username}`)
          }
        }
      }
    }
    
    console.log('=== MAGASINIER USERS ADDED SUCCESSFULLY ===')
    console.log('You can now login with:')
    console.log('Usernames: magasinier1, magasinier2, magasinier3')
    console.log('Password: magasinier123')
    console.log('Role: magasinier')
    
  } catch (error) {
    console.error('Error adding magasinier users:', error)
  }
}

// Run the script
addMagasinierUsers()
