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

    // Create a temporary user record first
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

    // Create the wedding record and link it to the temporary user
    const { data: wedding, error: weddingError } = await supabaseAdmin
      .from('weddings')
      .insert({
        name: weddingData.name,
        date: weddingData.date,
        location: weddingData.location,
        description: weddingData.description || '',
        created_by: tempUser.id,
        is_active: true
      })
      .select()
      .single()

    if (weddingError) {
      console.error('❌ Error creating wedding:', weddingError)
      // Clean up the temporary user
      await supabaseAdmin.from('users').delete().eq('id', tempUser.id)
      return NextResponse.json(
        { success: false, message: 'Failed to create wedding' },
        { status: 500 }
      )
    }

    // Send confirmation email
    try {
      const confirmationToken = tempUser.id
      const confirmUrl = getConfirmationUrl(confirmationToken, email)
      
      console.log('🔗 Generated confirmation URL:', confirmUrl)
      console.log('🔑 Token:', confirmationToken)
      console.log('📧 Email:', email)
      console.log('💒 Wedding ID:', wedding.id)
      
      await sendConfirmationEmail(email, 'Wedding Admin', confirmUrl)
      console.log('✅ Confirmation email sent to:', email)
    } catch (emailError) {
      console.error('❌ Error sending confirmation email:', emailError)
      // Clean up the temporary user and wedding if email fails
      await supabaseAdmin.from('users').delete().eq('id', tempUser.id)
      await supabaseAdmin.from('weddings').delete().eq('id', wedding.id)
      return NextResponse.json(
        { success: false, message: 'Failed to send confirmation email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Please check your email to complete your account setup',
      tempUserId: tempUser.id,
      weddingId: wedding.id
    })
  } catch (error) {
    console.error('Error in wedding signup:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
