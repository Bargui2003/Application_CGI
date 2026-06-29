'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/context/language-context'

export default function UnauthorizedPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-linear-to-br from-red-500 to-orange-500 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="relative z-10 text-center max-w-md">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="bg-white/20 p-6 rounded-full backdrop-blur-xl">
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Error message */}
        <h1 className="text-4xl font-bold text-white mb-2">{t('unauth.title')}</h1>
        <p className="text-white/90 mb-8 text-lg">
          {t('unauth.message')}
        </p>

        {/* Info box */}
        <div className="bg-white/10 backdrop-blur-xl rounded-lg p-6 mb-8 border border-white/20">
          <p className="text-white/80 text-sm">
            Votre rôle actuel ne vous permet pas d'accéder à cette ressource. 
            Contactez un administateur si vous pensez qu'il y a une erreur.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-lg flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t('unauth.goHome')}
            </Button>
          </Link>
          <Link href="/login">
            <Button className="w-full bg-white text-red-600 hover:bg-white/90 rounded-lg">
              {t('login.signin')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
