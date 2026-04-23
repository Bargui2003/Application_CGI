// Simplified script to add magasinier users using service role key
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

const magasinierUsers = [
  {
    username: 'magasinier1',
    email: 'magasinier1@example.com',
    password: 'Magasinier123!',
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '0123456789',
    role: 'magasinier'
  },
  {
    username: 'magasinier2',
    email: 'magasinier2@example.com',
    password: 'Magasinier123!',
    firstName: 'Marie',
    lastName: 'Martin',
    phone: '0123456789',
    role: 'magasinier'
  },
  {
    username: 'magasinier3',
    email: 'magasinier3@example.com',
    password: 'Magasinier123!',
    firstName: 'Pierre',
    lastName: 'Durand',
    phone: '0123456789',
    role: 'magasinier'
  }
]

const addMagasinierUsers = async () => {
  try {
    console.log('=== ADDING MAGASINIER USERS (v2) ===')
    
    for (const user of magasinierUsers) {
      console.log(`Processing user: ${user.username}`)
      
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
      
      // Create user using service role (bypasses RLS)
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          username: user.username,
          email: user.email,
          password_hash: user.password, // In production, use proper hashing
          first_name: user.firstName,
          last_name: user.lastName,
          phone: user.phone,
          role: user.role,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) {
        console.error(`Error creating user ${user.username}:`, error)
      } else {
        console.log(`✅ Successfully created user: ${user.username}`)
        console.log(`  - ID: ${newUser.id}`)
        console.log(`  - Email: ${newUser.email}`)
        console.log(`  - Role: ${newUser.role}`)
      }
    }
    
    console.log('=== MAGASINIER USERS ADDED SUCCESSFULLY ===')
    console.log('You can now login with:')
    console.log('Usernames: magasinier1, magasinier2, magasinier3')
    console.log('Password: Magasinier123!')
    console.log('Role: magasinier')
    
  } catch (error) {
    console.error('Error adding magasinier users:', error)
  }
}

// Run the script
addMagasinierUsers()
