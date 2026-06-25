import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PUT(request: NextRequest) {
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
    const body = await request.json()
    const { userId, username, email, firstName, lastName, phone, avatar } = body

    console.log('📝 Profile Update Request:', { userId, username, email })

    if (!userId) {
      return NextResponse.json({ error: 'userId manquant' }, { status: 400 })
    }

    // Vérifier que l'utilisateur existe
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('id', userId)

    console.log('🔍 User lookup:', { userData, userError: userError?.message, userId })

    if (userError) {
      console.error('❌ Supabase Query Error:', userError)
      return NextResponse.json({ 
        error: `Erreur base de données: ${userError.message}`,
        details: userError
      }, { status: 500 })
    }

    if (!userData || userData.length === 0) {
      console.error('❌ User not found in database:', userId)
      return NextResponse.json({ error: 'Utilisateur non trouvé dans la base de données' }, { status: 404 })
    }
    
    const user = userData[0]

    // Mettre à jour le profil utilisateur avec tous les champs
    const updateData: any = {
      username: username || user.username,
      email: email || user.email,
      updated_at: new Date().toISOString(),
    }

    // Ajouter les champs de profil s'ils sont fournis
    if (firstName !== undefined && firstName !== null) updateData.first_name = firstName
    if (lastName !== undefined && lastName !== null) updateData.last_name = lastName
    if (phone !== undefined && phone !== null) updateData.phone = phone
    if (avatar !== undefined && avatar !== null) updateData.avatar = avatar

    console.log('📝 Données à mettre à jour:', updateData)

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, username, email, role, first_name, last_name, phone, avatar, created_at')
      .single()

    if (error) {
      console.error('❌ Erreur Supabase update:', error)
      return NextResponse.json({
        error: `Erreur lors de la mise à jour: ${error.message}`,
        code: error.code
      }, { status: 500 })
    }

    console.log('✅ Utilisateur mis à jour:', updatedUser.id)

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        created_at: updatedUser.created_at,
      },
      message: 'Profil mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur API profil:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
