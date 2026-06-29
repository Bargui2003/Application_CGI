'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { AlertCircle, Lock, User, Mail } from 'lucide-react'
import { registerUser } from '@/lib/auth'
import { useAuth } from '@/context/auth-context'
import { useLanguage } from '@/context/language-context'
import { LanguageSwitcher } from '@/components/language-switcher'

export default function RegisterPage() {
  const router = useRouter()
  const { refreshSession } = useAuth()
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.username || !formData.email || !formData.password) {
      setError('Tous les champs sont requis')
      return
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setLoading(true)

    try {
      const user = await registerUser(
        formData.username,
        formData.email,
        formData.password
      )
      if (user) {
        // Rafraîchir la session dans le contexte
        refreshSession()
        
        // Attendre un peu pour que le contexte se mette à jour
        setTimeout(() => {
          router.push('/') // Redirection vers dashboard
        }, 100)
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-600 via-blue-500 to-purple-600 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration - animated */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-blue-400/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Language Switcher - Top right on register */}
        <div className="absolute -top-16 right-0">
          <LanguageSwitcher />
        </div>
        {/* Logo section */}
        <div className="text-center mb-8 transform transition duration-500 hover:scale-105">
          <div className="flex justify-center mb-6">
            <div className="bg-white/98 p-4 rounded-2xl shadow-2xl backdrop-blur-sm border border-white/20 transition-all duration-300 hover:shadow-3xl hover:bg-white">
              <Image
                src="/logo-cgi.png"
                alt="Comptoir Guetat Industrie"
                width={280}
                height={220}
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Register card */}
        <Card className="backdrop-blur-xl bg-white/98 shadow-2xl rounded-2xl p-8 border border-white/20 transition-all duration-300 hover:shadow-3xl">
          <div className="mb-8">
            <div className="inline-block bg-linear-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold mb-3 tracking-wider">
              CRÉER UN COMPTE
            </div>
            <h2 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">{t('register.pageTitle')}</h2>
            <p className="text-gray-500 text-sm font-medium">{t('register.pageSubtitle')}</p>
          </div>

          {error && (
            <Alert className="mb-6 bg-red-50/80 border-red-300/50 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm transition-all duration-300">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span className="text-red-700 text-sm font-medium">{error}</span>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username field */}
            <div className="group">
              <Label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-3 transition-colors duration-300">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-linear-to-br from-blue-600 to-purple-600 rounded-lg">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  Nom d'utilisateur
                </div>
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Choisissez un identifiant"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-xl font-medium transition-all duration-300 focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:ring-4 focus:ring-blue-200/50 disabled:opacity-60 disabled:cursor-not-allowed hover:border-gray-300"
              />
              <p className="text-xs text-gray-500 mt-2 font-medium">3-20 caractères, lettres et chiffres</p>
            </div>

            {/* Email field */}
            <div className="group">
              <Label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3 transition-colors duration-300">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-linear-to-br from-blue-600 to-purple-600 rounded-lg">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  Adresse email
                </div>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nom@entreprise.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-xl font-medium transition-all duration-300 focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:ring-4 focus:ring-blue-200/50 disabled:opacity-60 disabled:cursor-not-allowed hover:border-gray-300"
              />
            </div>

            {/* Password field */}
            <div className="group">
              <Label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3 transition-colors duration-300">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-linear-to-br from-blue-600 to-purple-600 rounded-lg">
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                  Mot de passe
                </div>
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Minimum 6 caractères"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-xl font-medium transition-all duration-300 focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:ring-4 focus:ring-blue-200/50 disabled:opacity-60 disabled:cursor-not-allowed hover:border-gray-300"
              />
            </div>

            {/* Password confirmation field */}
            <div className="group">
              <Label htmlFor="passwordConfirm" className="block text-sm font-semibold text-gray-700 mb-3 transition-colors duration-300">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-linear-to-br from-blue-600 to-purple-600 rounded-lg">
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                  Confirmer le mot de passe
                </div>
              </Label>
              <Input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                placeholder="Confirmez votre mot de passe"
                value={formData.passwordConfirm}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-xl font-medium transition-all duration-300 focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:ring-4 focus:ring-blue-200/50 disabled:opacity-60 disabled:cursor-not-allowed hover:border-gray-300"
              />
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={loading || !formData.username || !formData.email || !formData.password}
              className="w-full bg-linear-to-r from-blue-600 via-blue-600 to-purple-600 hover:from-blue-700 hover:via-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 hover:shadow-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform disabled:hover:scale-100 text-base tracking-wide mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Inscription en cours...
                </span>
              ) : (
                'S\'inscrire'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-7 flex items-center gap-3">
            <div className="flex-1 h-px bg-linear-to-r from-gray-200 to-transparent"></div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest">ou</span>
            <div className="flex-1 h-px bg-linear-to-l from-gray-200 to-transparent"></div>
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-gray-600 font-medium">
            Vous avez déjà un compte?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-bold transition-colors duration-300 hover:underline">
              Se connecter
            </Link>
          </p>
        </Card>

        {/* Footer */}
        <p className="text-center text-white/70 text-xs mt-8 font-medium">
          © 2026 Comptoir Guetat Industrie. Tous droits réservés.
        </p>
      </div>
    </div>
  )
}
