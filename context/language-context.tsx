'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Language, translations } from '@/lib/i18n/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof typeof translations.fr, variables?: Record<string, string>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr')
  const [isMounted, setIsMounted] = useState(false)

  // Load language from localStorage on mount
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('language') as Language | null
      if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'zh')) {
        setLanguageState(savedLanguage)
      }
    } catch (e) {
      // localStorage might not be available
      console.error('[v0] localStorage error:', e)
    }
    setIsMounted(true)
  }, [])

  // Save language to localStorage when it changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem('language', lang)
    } catch (e) {
      console.error('[v0] localStorage error:', e)
    }
  }

  // Translation function
  const t = (key: keyof typeof translations.fr, variables?: Record<string, string>): string => {
    let text = (translations[language][key as keyof typeof translations.fr] || 
               translations.fr[key as keyof typeof translations.fr] || 
               key) as string
    
    if (variables) {
      Object.entries(variables).forEach(([varName, value]) => {
        text = (text as string).replace(`{${varName}}`, value)
      })
    }
    
    return text as string
  }

  // Always provide context, even before mount to prevent hydration errors
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
