import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/app/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, email, name, password, weddingData } = body

    // Validate required fields
    if (!token || !email || !name || !password) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Decode wedding data if provided
    let decodedWeddingData = null
    if (weddingData) {
      try {
        decodedWeddingData = JSON.parse(Buffer.from(weddingData, 'base64').toString())
        console.log('💒 Decoded wedding data:', decodedWeddingData)
      } catch (decodeError) {
        console.error('❌ Error decoding wedding data:', decodeError)
        return NextResponse.json(
          { success: false, message: 'Invalid wedding data' },
          { status: 400 }
        )
      }
    }

    // Find the temporary user record
    const { data: tempUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', token)
      .eq('email', email)
      .single()

    if (userError || !tempUser) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired confirmation link' },
        { status: 400 }
      )
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Mark as confirmed
      user_metadata: {
        name,
        role: 'admin'
      }
    })

    if (authError) {
      console.error('❌ Supabase Auth error:', authError)
      return NextResponse.json(
        { success: false, message: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Update the user record with the Supabase Auth user ID
    const { data: user, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        id: authData.user.id, // Use the Supabase Auth user ID
        name
        // Removed email_confirmed, updated_at - columns don't exist
      })
      .eq('id', token)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating user:', updateError)
      // Clean up the auth user if database update fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { success: false, message: 'Failed to update user account' },
        { status: 500 }
      )
    }

    // Create the wedding only if wedding data is provided
    let wedding = null
    if (decodedWeddingData) {
      console.log('💒 Creating wedding with data:', decodedWeddingData)
      const code = `${decodedWeddingData.name.replace(/\s+/g, '').toUpperCase()}${Date.now().toString().slice(-4)}`
      
      const { data: weddingResult, error: weddingError } = await supabaseAdmin
        .from('weddings')
        .insert({
          name: decodedWeddingData.name,
          description: decodedWeddingData.description || '',
          date: decodedWeddingData.date,
          location: decodedWeddingData.location,
          code,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single()

      if (weddingError) {
        console.error('❌ Error creating wedding:', weddingError)
        // Clean up the auth user if wedding creation fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json(
          { success: false, message: 'Failed to create wedding' },
          { status: 500 }
        )
      }

      wedding = weddingResult
      console.log('✅ Wedding created successfully:', wedding.id)
    }

    // Update user role to super_admin since they created the wedding
    const { error: roleUpdateError } = await supabaseAdmin
      .from('users')
      .update({ role: 'super_admin' })
      .eq('id', user.id)

    if (roleUpdateError) {
      console.error('❌ Error updating user role:', roleUpdateError)
      // Continue even if role update fails
    }

    console.log('✅ Wedding signup completed successfully:', { user: user.id, wedding: wedding?.id || 'none' })

    return NextResponse.json({
      success: true,
      message: wedding ? 'Account and wedding created successfully' : 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: wedding ? 'super_admin' : 'admin'
      },
      wedding: wedding ? {
        id: wedding.id,
        name: wedding.name,
        code: wedding.code
      } : null
    })
  } catch (error) {
    console.error('Error in confirm wedding signup:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
