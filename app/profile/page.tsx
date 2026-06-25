'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { 
  Camera, 
  Save, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react'

interface ProfileFormData {
  firstName: string
  lastName: string
  username: string
  email: string
  phone: string
}

export default function ProfilePage() {
  const { user, isAuthenticated, refreshSession } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [originalData, setOriginalData] = useState<ProfileFormData | null>(null)
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
  })

  // Redirection si non authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // Charger les données du profil
  useEffect(() => {
    if (user) {
      const data: ProfileFormData = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
      }
      setFormData(data)
      setOriginalData(data)
      
      if (user.avatar) {
        setPreviewUrl(user.avatar)
      }
    }
  }, [user])

  if (!isAuthenticated || !user) {
    return null
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Erreur',
          description: 'Veuillez sélectionner une image',
          variant: 'destructive',
        })
        return
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Erreur',
          description: 'La taille de l\'image ne doit pas dépasser 5MB',
          variant: 'destructive',
        })
        return
      }

      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const hasChanges = () => {
    if (selectedFile) return true
    if (!originalData) return false
    
    return (
      formData.firstName !== originalData.firstName ||
      formData.lastName !== originalData.lastName ||
      formData.username !== originalData.username ||
      formData.email !== originalData.email ||
      formData.phone !== originalData.phone
    )
  }

  const handleSaveProfile = async () => {
    if (!hasChanges()) {
      toast({
        title: 'Aucune modification',
        description: 'Vous n\'avez rien modifié',
      })
      return
    }

    setIsSaving(true)
    try {
      let avatarUrl = user.avatar

      // Upload de l'avatar si un fichier est sélectionné
      if (selectedFile) {
        const formDataUpload = new FormData()
        formDataUpload.append('file', selectedFile)
        formDataUpload.append('userId', user.id)

        const uploadResponse = await fetch('/api/upload-avatar', {
          method: 'POST',
          body: formDataUpload,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || 'Erreur lors du téléchargement de l\'avatar')
        }

        const { url } = await uploadResponse.json()
        avatarUrl = url
      }

      // Mise à jour du profil
      const profilePayload = {
        userId: user.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        avatar: avatarUrl,
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profilePayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du profil')
      }

      toast({
        title: 'Succès',
        description: 'Votre profil a été mis à jour avec succès',
      })

      // Rafraîchir la session
      refreshSession()
      setOriginalData(formData)
      setSelectedFile(null)
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la mise à jour',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (originalData) {
      setFormData(originalData)
      setSelectedFile(null)
      setPreviewUrl(user.avatar || '')
    }
  }

  const getAvatarUrl = () => {
    if (previewUrl) return previewUrl
    if (user.avatar) return user.avatar
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
      <div className="container max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mon Profil</h1>
            <p className="text-slate-600">Gérez vos informations personnelles</p>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
            <CardTitle>Informations Personnelles</CardTitle>
            <CardDescription className="text-blue-100">
              Mettez à jour vos informations de profil et votre photo
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8 space-y-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl border-4 border-white shadow-lg">
                  {getAvatarUrl() ? (
                    <img
                      src={getAvatarUrl()!}
                      alt="Avatar"
                      className="h-full w-full object-cover rounded-full"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-3 cursor-pointer hover:bg-blue-700 transition-colors shadow-md"
                >
                  <Camera className="h-5 w-5" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-900">{user.username}</p>
                <p className="text-xs text-slate-500 mt-1">Cliquez sur l'icône caméra pour changer votre photo</p>
              </div>
            </div>

            {/* Form Section */}
            <div className="space-y-6 border-t pt-6">
              {/* Nom et Prénom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-700 font-semibold">Prénom</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Votre prénom"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-700 font-semibold">Nom de famille</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Votre nom"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
              </div>

              {/* Nom d'utilisateur */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-700 font-semibold">Nom d&apos;utilisateur</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Votre nom d'utilisateur"
                  className="bg-slate-50 border-slate-200"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-semibold">Adresse Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="votre.email@exemple.com"
                  className="bg-slate-50 border-slate-200"
                />
              </div>

              {/* Téléphone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700 font-semibold">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+216 XX XXX XXX"
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t pt-6">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving || !hasChanges()}
                className="gap-2"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving || !hasChanges()}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sauvegarde en cours...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Sauvegarder les modifications
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert className="mt-6 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            Les modifications seront sauvegardées immédiatement. Vous recevrez une confirmation après la mise à jour.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
