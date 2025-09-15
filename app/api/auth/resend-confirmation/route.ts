import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Resending confirmation email for:', email)

    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role')
      .eq('email', email)
      .single()

    if (userError || !user) {
      console.log('❌ User not found:', userError)
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Since email_confirmed column doesn't exist, we'll just send the confirmation email
    // The user can click the link to confirm their email
    console.log('📧 Sending confirmation email for:', email)

    // Send confirmation email
    try {
      const { sendConfirmationEmail } = await import('@/app/lib/email-service')
      const confirmationToken = user.id // Use user ID as token
      const { getConfirmationUrl } = await import('@/app/lib/url-utils')
      const confirmUrl = getConfirmationUrl(confirmationToken, email)
      
      await sendConfirmationEmail(email, user.name, confirmUrl)
      console.log('✅ Confirmation email resent to:', email)
      
      return NextResponse.json({
        success: true,
        message: 'Confirmation email sent successfully'
      })
    } catch (emailError) {
      console.error('❌ Error sending confirmation email:', emailError)
      return NextResponse.json(
        { success: false, message: 'Failed to send confirmation email' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Resend confirmation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
