'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Header } from '@/components/header'
import { AppTabs } from '@/components/app-tabs'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-blue-200 rounded-full border-t-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-8 pt-2">
          <div className="inline-flex items-center gap-2 bg-linear-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300 rounded-lg px-4 py-2 text-sm font-semibold mb-4">
            <span className="flex h-2 w-2 rounded-full bg-current opacity-75">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 opacity-75"></span>
            </span>
            Système en temps réel
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
              Tableau de Bord Production
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
              Optimisez votre production de tuyaux en polyéthylène avec des calculs de matériaux automatisés et un suivi des stocks en temps réel.
            </p>
          </div>
        </div>

        <AppTabs />
      </main>
    </div>
  )
}
