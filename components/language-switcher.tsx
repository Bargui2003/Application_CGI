'use client'

import { useLanguage } from '@/context/language-context'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <button
        onClick={() => setLanguage('fr')}
        className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
          language === 'fr'
            ? 'bg-blue-500 text-white shadow-md'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
        title="Français"
      >
        🇫🇷
      </button>
      <button
        onClick={() => setLanguage('zh')}
        className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
          language === 'zh'
            ? 'bg-red-500 text-white shadow-md'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
        title="中文"
      >
        🇨🇳
      </button>
    </div>
  )
}
