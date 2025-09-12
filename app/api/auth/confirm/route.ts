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
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, email_confirmed')
      .eq('id', token)
      .single()

    console.log('🔍 User lookup result:', { user, userError })

    if (userError || !user) {
      console.error('❌ User not found:', userError)
      return NextResponse.json(
        { success: false, message: 'Invalid confirmation link' },
        { status: 400 }
      )
    }

    // Verify that the email matches (for security)
    if (user.email !== email) {
      console.error('❌ Email mismatch:', { userEmail: user.email, providedEmail: email })
      return NextResponse.json(
        { success: false, message: 'Email mismatch in confirmation link' },
        { status: 400 }
      )
    }

    if (user.email_confirmed) {
      console.log('✅ Email already confirmed for:', email)
      return NextResponse.json({
        success: true,
        message: 'Email already confirmed'
      })
    }

    // Update user to mark email as confirmed
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        email_confirmed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Error updating user:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to confirm email' },
        { status: 500 }
      )
    }

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
