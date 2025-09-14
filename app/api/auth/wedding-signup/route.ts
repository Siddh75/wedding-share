import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'
import { sendConfirmationEmail } from '@/app/lib/email-service'
import { getConfirmationUrl } from '@/app/lib/url-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, weddingData } = body

    // Validate required fields
    if (!email || !weddingData) {
      return NextResponse.json(
        { success: false, message: 'Email and wedding data are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Validate wedding data
    if (!weddingData.name || !weddingData.date || !weddingData.location) {
      return NextResponse.json(
        { success: false, message: 'Wedding name, date, and location are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create a temporary user record (no wedding created yet)
    const { data: tempUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        name: 'Temporary User', // Will be updated in step 2
        role: 'admin'
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating temporary user:', createError)
      return NextResponse.json(
        { success: false, message: 'Failed to create temporary account' },
        { status: 500 }
      )
    }

    // Store wedding data temporarily in a simple way
    // We'll encode it in the confirmation token or use a separate temporary storage
    const weddingDataEncoded = Buffer.from(JSON.stringify(weddingData)).toString('base64')
    console.log('💒 Wedding data encoded for temporary storage:', weddingDataEncoded)

    // Send confirmation email with wedding data encoded in the URL
    try {
      const confirmationToken = tempUser.id
      // Include wedding data in the confirmation URL as a query parameter
      const confirmUrl = `${getConfirmationUrl(confirmationToken, email)}&weddingData=${encodeURIComponent(weddingDataEncoded)}`
      
      console.log('🔗 Generated confirmation URL:', confirmUrl)
      console.log('🔑 Token:', confirmationToken)
      console.log('📧 Email:', email)
      console.log('💒 Wedding data encoded:', weddingDataEncoded.substring(0, 50) + '...')
      
      await sendConfirmationEmail(email, 'Wedding Admin', confirmUrl)
      console.log('✅ Confirmation email sent to:', email)
    } catch (emailError) {
      console.error('❌ Error sending confirmation email:', emailError)
      // Clean up the temporary user if email fails
      await supabaseAdmin.from('users').delete().eq('id', tempUser.id)
      return NextResponse.json(
        { success: false, message: 'Failed to send confirmation email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Please check your email to complete your account setup',
      tempUserId: tempUser.id
    })
  } catch (error) {
    console.error('Error in wedding signup:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
