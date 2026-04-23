'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugSupabase() {
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    const testConnection = async () => {
      try {
        addLog('Testing Supabase connection...')
        
        // Test basic connection
        const { data, error } = await supabase.from('production_records').select('count').single()
        
        if (error) {
          addLog(`Error: ${error.message}`)
          addLog(`Error code: ${error.code}`)
          addLog(`Error details: ${JSON.stringify(error, null, 2)}`)
        } else {
          addLog('Connection successful!')
          addLog(`Data: ${JSON.stringify(data)}`)
        }
      } catch (err) {
        addLog(`Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '1px solid black', 
      padding: '10px', 
      maxWidth: '400px',
      maxHeight: '300px',
      overflow: 'auto',
      zIndex: 9999
    }}>
      <h3>Supabase Debug Logs</h3>
      {logs.map((log, index) => (
        <div key={index} style={{ fontSize: '12px', marginBottom: '5px' }}>
          {log}
        </div>
      ))}
    </div>
  )
}
