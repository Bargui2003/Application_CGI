'use client'

import React, { useEffect } from 'react'

export default function EnvCheck() {
  useEffect(() => {
    console.log('=== Environment Variables Check ===')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')
    console.log('Full URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Full Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0)
    console.log('===================================')
  }, [])

  return null
}
