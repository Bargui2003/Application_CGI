'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { useLanguage } from '@/context/language-context'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { LogOut, User, Settings, Shield, Camera, Save, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

interface ProfileData {
  username: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
}

function ProfileDialog() {
  const { user, refreshSession } = useAuth()
  const { t } = useLanguage()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    username: user?.username || '',
    email: user?.email || '',
    firstName: '',
    lastName: '',
    phone: '',
    avatar: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  // Charger les données du profil quand le dialog s'ouvre
  useEffect(() => {
    if (isOpen && user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      })
      setSelectedFile(null)
      setPreviewUrl('')
    }
  }, [
    isOpen,
    user?.username,
    user?.email,
    user?.firstName,
    user?.lastName,
    user?.phone,
    user?.avatar,
  ])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    console.log('💾 Sauvegarde du profil - user.id:', user.id)
    setIsLoading(true)
    try {
      let avatarUrl = profileData.avatar

      // Upload de l'avatar si un fichier est sélectionné
      if (selectedFile) {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          throw new Error('Token d\'authentification manquant')
        }

        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('userId', user.id)

        const uploadResponse = await fetch('/api/upload-avatar', {
          method: 'POST',
          body: formData,
        })

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json()
          avatarUrl = url
        } else {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || 'Erreur lors du téléchargement de l\'avatar')
        }
      }

      // Mise à jour du profil
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Token d\'authentification manquant')
      }

      const profilePayload = {
        userId: user.id,
        ...profileData,
        avatar: avatarUrl,
      }

      console.log('📤 Envoi du profil:', profilePayload)

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
        title: 'Profil mis à jour',
        description: 'Vos informations ont été sauvegardées avec succès.',
      })

      // Rafraîchir la session pour mettre à jour les données utilisateur
      refreshSession()
      setIsOpen(false)
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la mise à jour.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getAvatarUrl = () => {
    if (previewUrl) return previewUrl
    if (profileData.avatar) return profileData.avatar
    return null
  }

  return (
    <>
      <DropdownMenuItem
        className="flex items-center gap-2 cursor-pointer"
        onClick={(e) => {
          e.preventDefault()
          setIsOpen(true)
        }}
      >
        <User className="w-4 h-4" />
        <span>Mon Profil</span>
      </DropdownMenuItem>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier mon profil</DialogTitle>
            <DialogDescription>
              Mettez à jour vos informations personnelles et votre photo de profil.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24 bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                  {getAvatarUrl() ? (
                    <img
                      src={getAvatarUrl()!}
                      alt="Avatar"
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    profileData.username.charAt(0).toUpperCase()
                  )}
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Cliquez sur l'icône caméra pour changer votre photo de profil
              </p>
            </div>

            {/* Informations générales */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Votre prénom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  value={profileData.username}
                  onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Votre nom d'utilisateur"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="votre.email@exemple.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+216 XX XXX XXX"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleSaveProfile} disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function UserProfile() {
  const { user, isAuthenticated, logout, role } = useAuth()
  const router = useRouter()

  if (!isAuthenticated || !user) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'conducteur':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = () => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'conducteur':
        return 'Conducteur'
      default:
        return 'Utilisateur'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {user.username.charAt(0).toUpperCase()}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col space-y-2 py-2">
          <div className="flex items-center space-x-2">
            <div>
              <p className="text-sm font-semibold">{user.username}</p>
              <p className="text-xs text-gray-600">{user.email}</p>
            </div>
          </div>
          <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-semibold w-fit ${getRoleBadgeColor()}`}>
            <Shield className="w-3 h-3" />
            {getRoleLabel()}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ProfileDialog />
        <DropdownMenuItem disabled className="flex items-center gap-2 text-gray-600">
          <Settings className="w-4 h-4" />
          <span className="text-xs">Paramètres (prochainement)</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-600 hover:bg-red-50 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Se déconnecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
