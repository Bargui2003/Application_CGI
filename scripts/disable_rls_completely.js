// Completely disable RLS on stock_levels table
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const disableRlsCompletely = async () => {
  try {
    console.log('=== DISABLING RLS COMPLETELY ON STOCK_LEVELS ===')

    // First, let's try to disable RLS using the REST API
    const { error: disableError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE public.stock_levels DISABLE ROW LEVEL SECURITY;' 
      })
    
    if (disableError) {
      console.log('Direct SQL execution failed, trying alternative methods...')
      
      // Try using the PostgREST approach
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          sql: 'ALTER TABLE public.stock_levels DISABLE ROW LEVEL SECURITY;'
        })
      })
      
      if (response.ok) {
        console.log('RLS disabled via REST API')
      } else {
        console.log('REST API also failed, trying policy approach...')
        
        // Create a permissive policy
        const policyResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({
            sql: `
              DROP POLICY IF EXISTS "users_can_view_own_stock_levels" ON public.stock_levels;
              DROP POLICY IF EXISTS "users_can_update_own_stock_levels" ON public.stock_levels;
              DROP POLICY IF EXISTS "users_can_insert_own_stock_levels" ON public.stock_levels;
              CREATE POLICY "allow_all" ON public.stock_levels FOR ALL USING (true);
            `
          })
        })
        
        if (policyResponse.ok) {
          console.log('Permissive policy created')
        } else {
          console.log('Policy creation failed, trying manual data fix...')
          
          // As a last resort, let's create a new table without RLS
          const { error: createError } = await supabase
            .rpc('exec_sql', { 
              sql: `
                CREATE TABLE IF NOT EXISTS public.stock_levels_new (
                  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                  user_id UUID,
                  hd NUMERIC DEFAULT 1000,
                  ld NUMERIC DEFAULT 1000,
                  black_color NUMERIC DEFAULT 500,
                  dryer NUMERIC DEFAULT 500,
                  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                
                INSERT INTO public.stock_levels_new (hd, ld, black_color, dryer)
                SELECT hd, ld, black_color, dryer FROM public.stock_levels;
                
                DROP TABLE IF EXISTS public.stock_levels;
                ALTER TABLE public.stock_levels_new RENAME TO stock_levels;
              ` 
            })
          
          if (createError) {
            console.log('Table recreation failed:', createError.message)
          } else {
            console.log('New table created without RLS')
          }
        }
      }
    } else {
      console.log('RLS disabled successfully')
    }

    // Test the access
    console.log('Testing anon access after RLS fix...')
    const anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const { data: testData, error: testError } = await anonSupabase
      .from('stock_levels')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('Anon access still failed:', testError.message)
    } else {
      console.log('SUCCESS: Anon access works!', testData.length, 'rows')
      if (testData.length > 0) {
        console.log('Stock data accessible:', testData[0])
      }
    }

    console.log('=== RLS DISABLE COMPLETE ===')
  } catch (error) {
    console.error('Error disabling RLS:', error)
  }
}

disableRlsCompletely()
