'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface TestResult {
  table: string
  status: 'loading' | 'success' | 'error'
  message: string
  data?: any
}

export default function DatabaseTest() {
  const [results, setResults] = useState<TestResult[]>([
    { table: 'production_records', status: 'loading', message: 'Testing...' },
    { table: 'stock_levels', status: 'loading', message: 'Testing...' },
    { table: 'stock_movements', status: 'loading', message: 'Testing...' }
  ])

  const testTable = async (tableName: string): Promise<TestResult> => {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (error) {
        return {
          table: tableName,
          status: 'error',
          message: `${error.code}: ${error.message}`,
          data: { code: error.code, details: error.details }
        }
      }

      return {
        table: tableName,
        status: 'success',
        message: `Accessible (${count || 0} records)`,
        data: { count }
      }
    } catch (err) {
      return {
        table: tableName,
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
        data: err
      }
    }
  }

  useEffect(() => {
    const testAllTables = async () => {
      const tables = ['production_records', 'stock_levels', 'stock_movements']
      const testResults = await Promise.all(tables.map(testTable))
      setResults(testResults)
    }

    testAllTables()
  }, [])

  return (
    <div style={{ 
      position: 'fixed', 
      top: '320px', 
      right: '10px', 
      background: 'white', 
      border: '1px solid black', 
      padding: '10px', 
      maxWidth: '400px',
      maxHeight: '200px',
      overflow: 'auto',
      zIndex: 9999
    }}>
      <h3>Database Tables Test</h3>
      {results.map((result, index) => (
        <div key={index} style={{ 
          fontSize: '12px', 
          marginBottom: '8px',
          padding: '5px',
          backgroundColor: result.status === 'success' ? '#d4edda' : result.status === 'error' ? '#f8d7da' : '#fff3cd'
        }}>
          <strong>{result.table}:</strong> {result.message}
          {result.status === 'error' && result.data && (
            <div style={{ fontSize: '10px', marginTop: '3px' }}>
              Details: {JSON.stringify(result.data)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
