import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get('session-token')?.value

    if (!sessionToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'No session found' 
      }, { status: 401 })
    }

    let user = null

    try {
      // Try to parse as JSON first (for development mode)
      try {
        const userData = JSON.parse(sessionToken)
        user = userData
      } catch (jsonError) {
        // If not JSON, try as Supabase session token
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.getUser(sessionToken)
        
        if (sessionError || !sessionData.user) {
          return NextResponse.json({ 
            success: false, 
            message: 'Invalid session' 
          }, { status: 401 })
        }

        // Get user details from our users table
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', sessionData.user.id)
          .single()

        if (userError || !userData) {
          return NextResponse.json({ 
            success: false, 
            message: 'User not found' 
          }, { status: 404 })
        }

        user = userData
      }
    } catch (error) {
      console.error('Error getting user from session:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid session' 
      }, { status: 401 })
    }

    // Check if user is application admin
    if (user.role !== 'application_admin') {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied. Only application admins can create super admin accounts.' 
      }, { status: 403 })
    }

    // Parse request body
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        message: 'User with this email already exists' 
      }, { status: 400 })
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        name: name
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to create user account' 
      }, { status: 500 })
    }

    // Create user in our users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: email,
        name: name,
        role: 'super_admin'
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user in database:', userError)
      // Try to clean up the auth user if database insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to create user profile' 
      }, { status: 500 })
    }

    // Send welcome email
    try {
      const { sendWelcomeEmail } = await import('@/app/lib/email-service')
      await sendWelcomeEmail(email, name)
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the account creation if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Super admin account created successfully',
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        created_at: userData.created_at
      }
    })

  } catch (error) {
    console.error('Create super admin error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}
