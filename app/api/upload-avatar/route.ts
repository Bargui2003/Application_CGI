import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Variables d\'environnement Supabase manquantes')
      return NextResponse.json(
        { error: 'Erreur de configuration serveur' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      return NextResponse.json({ error: 'Fichier ou userId manquant' }, { status: 400 })
    }

    // Vérifier que l'utilisateur existe dans la base de données
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 401 })
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Le fichier doit être une image' }, { status: 400 })
    }

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Le fichier ne doit pas dépasser 5MB' }, { status: 400 })
    }

    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Convertir le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error) {
      console.error('Erreur upload Supabase:', error)
      return NextResponse.json({ error: 'Erreur lors du téléchargement' }, { status: 500 })
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(filePath)

    return NextResponse.json({ url: publicUrl })

  } catch (error) {
    console.error('Erreur API upload avatar:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}