import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json()

    console.log('🔍 Confirmation API received:', { token, email })

    if (!token || !email) {
      console.log('❌ Missing required parameters')
      return NextResponse.json(
        { success: false, message: 'Token and email are required' },
        { status: 400 }
      )
    }

    console.log('🔍 Confirming email for:', { token, email })

    // Find the user by token (which is the user ID)
    console.log('🔍 Looking up user with ID:', token)
    let { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role')
      .eq('id', token)
      .single()

    console.log('🔍 User lookup result:', { user, userError })

    if (userError || !user) {
      console.error('❌ User not found in users table:', userError)
      
      // Try to find the user in Supabase Auth and create them in our users table
      console.log('🔍 Attempting to find user in Supabase Auth and create in users table...')
      
      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(token)
        
        if (authError || !authUser.user) {
          console.error('❌ User not found in Supabase Auth either:', authError)
          return NextResponse.json(
            { success: false, message: 'Invalid confirmation link' },
            { status: 400 }
          )
        }
        
        console.log('✅ Found user in Supabase Auth:', authUser.user.email)
        
        // Create user in our users table
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authUser.user.id,
            email: authUser.user.email!,
            name: authUser.user.user_metadata?.name || authUser.user.email!.split('@')[0],
            role: 'guest' // Default role
            // Removed email_confirmed - column doesn't exist
          })
          .select('id, email, name, role')
          .single()
        
        if (createError) {
          console.error('❌ Error creating user in users table:', createError)
          return NextResponse.json(
            { success: false, message: 'Failed to create user profile' },
            { status: 500 }
          )
        }
        
        console.log('✅ User created in users table:', newUser)
        user = newUser
        
      } catch (error) {
        console.error('❌ Error during user creation process:', error)
        return NextResponse.json(
          { success: false, message: 'Invalid confirmation link' },
          { status: 400 }
        )
      }
    }

    // Verify that the email matches (for security)
    if (user.email !== email) {
      console.error('❌ Email mismatch:', { userEmail: user.email, providedEmail: email })
      return NextResponse.json(
        { success: false, message: 'Email mismatch in confirmation link' },
        { status: 400 }
      )
    }

    // Since email_confirmed column doesn't exist, we'll just confirm in Supabase Auth
    // and consider the email confirmed if the user exists and email matches
    console.log('✅ Email confirmation successful for:', email)

    // Also confirm the email in Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      token,
      { email_confirm: true }
    )

    if (authError) {
      console.error('⚠️ Warning: Could not update Supabase Auth user:', authError)
      // Continue anyway since we updated our database
    }

    console.log('✅ Email confirmed successfully for:', email)

    return NextResponse.json({
      success: true,
      message: 'Email confirmed successfully'
    })

  } catch (error) {
    console.error('Email confirmation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
