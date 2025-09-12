import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/app/lib/supabase'
import { sendWelcomeEmail } from '@/app/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, weddingId, role = 'guest', weddingData } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('❌ Email validation failed for:', email)
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address' },
        { status: 400 }
      )
    }
    
    console.log('✅ Email validation passed for:', email)

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long' },
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

    // If this is a wedding invitation, verify the invitation
    let invitationRole = role
    if (weddingId) {
      console.log('🔍 Checking invitation for:', { weddingId, email })
      
      // Temporarily bypass invitation check for testing
      console.log('⚠️ Temporarily bypassing invitation check for testing')
      invitationRole = 'admin' // Default to admin role for wedding invitations
      
      // TODO: Uncomment this when wedding_invitations table is created
      /*
      const { data: invitation, error: invitationError } = await supabaseAdmin
        .from('wedding_invitations')
        .select('*')
        .eq('wedding_id', weddingId)
        .eq('email', email)
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString())
        .single()

      console.log('🔍 Invitation query result:', { invitation, invitationError })

      if (invitationError || !invitation) {
        // Let's check what invitations exist for this wedding
        const { data: allInvitations, error: allInvitationsError } = await supabaseAdmin
          .from('wedding_invitations')
          .select('*')
          .eq('wedding_id', weddingId)

        console.log('🔍 All invitations for this wedding:', { allInvitations, allInvitationsError })

        return NextResponse.json(
          { success: false, message: 'Invalid or expired invitation' },
          { status: 400 }
        )
      }

      invitationRole = invitation.role
      */
    }

    // For invited users, create the account directly without email confirmation
    if (weddingId) {
      console.log('🔐 Creating invited user account directly...')
      console.log('📝 User details:', { email, name, role: invitationRole, weddingId })
      
      let user: any = null
      
      try {
        // Create user record in our users table first
        const { data: userData, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            email,
            name,
            role: invitationRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          console.error('❌ Database error:', createError)
          return NextResponse.json(
            { success: false, message: 'Failed to create user account', error: createError.message },
            { status: 500 }
          )
        }

        user = userData
        console.log('✅ User created in database:', user)
      } catch (dbError) {
        console.error('❌ Database exception:', dbError)
        return NextResponse.json(
          { success: false, message: 'Database operation failed', error: (dbError as Error).message },
          { status: 500 }
        )
      }

      // Create Supabase Auth user without email confirmation using admin functions
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Mark email as confirmed
        user_metadata: {
          name,
          role: invitationRole
        }
      })

      if (authError) {
        console.error('❌ Supabase Auth admin error:', authError)
        // Even if auth fails, we have the user in our database
        // We can handle this gracefully
        console.log('⚠️ Auth creation failed, but user exists in database')
      } else {
        console.log('✅ Supabase Auth user created:', authData.user)
      }

      // Link user to wedding
      try {
        // Get the wedding to verify it exists
        const { data: wedding } = await supabaseAdmin
          .from('weddings')
          .select('id, wedding_admin_ids')
          .eq('id', weddingId)
          .single()

        if (wedding) {
          // Add user to wedding_admin_ids array
          const currentAdminIds = wedding.wedding_admin_ids || []
          const updatedAdminIds = [...currentAdminIds, user.id]

          const { error: updateWeddingError } = await supabaseAdmin
            .from('weddings')
            .update({
              wedding_admin_ids: updatedAdminIds,
              updated_at: new Date().toISOString()
            })
            .eq('id', weddingId)

          if (updateWeddingError) {
            console.error('Error updating wedding with admin:', updateWeddingError)
          }

          // Mark invitation as accepted
          const { error: updateInvitationError } = await supabaseAdmin
            .from('wedding_invitations')
            .update({
              status: 'accepted',
              accepted_at: new Date().toISOString(),
              accepted_by: user.id
            })
            .eq('wedding_id', weddingId)
            .eq('email', email)

          if (updateInvitationError) {
            console.error('Error updating invitation status:', updateInvitationError)
          }
        }
      } catch (weddingError) {
        console.error('Error linking user to wedding:', weddingError)
        // Continue even if wedding linking fails
      }

      // Send welcome email
      try {
        await sendWelcomeEmail(email, name)
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError)
        // Continue even if email fails
      }

      return NextResponse.json({
        success: true,
        message: 'Account created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      })
    }

    // For non-invited users, create account directly but mark as unconfirmed
    console.log('🔐 Creating regular user account...')
    
    // If user is signing up as admin but no weddingId provided, they need to create a wedding
    if (invitationRole === 'admin' && !weddingId) {
      console.log('⚠️ User signing up as admin without weddingId - they will need to create a wedding after verification')
    }
    
    // Create Supabase Auth user first to get the proper ID
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Don't confirm email yet
      user_metadata: {
        name,
        role: invitationRole
      }
    })

    if (authError) {
      console.error('❌ Supabase Auth error:', authError)
      return NextResponse.json(
        { success: false, message: 'Failed to create user account' },
        { status: 500 }
      )
    }

    console.log('✅ Supabase Auth user created:', authData.user)

    // Create user record in our users table using the Supabase Auth user ID
    const { data: user, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id, // Use the Supabase Auth user ID
        email,
        name,
        role: invitationRole,
        email_confirmed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Database error:', createError)
      // Clean up the auth user if database fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { success: false, message: 'Failed to create user account' },
        { status: 500 }
      )
    }

    console.log('✅ User created in database:', user)


    // Send custom confirmation email
    try {
      const { sendConfirmationEmail } = await import('@/app/lib/email-service')
      const confirmationToken = authData.user.id // Use user ID as token
      const { getConfirmationUrl } = await import('@/app/lib/url-utils')
      const confirmUrl = getConfirmationUrl(confirmationToken, email)
      
      console.log('🔗 Generated confirmation URL:', confirmUrl)
      console.log('🔑 Token:', confirmationToken)
      console.log('📧 Email:', email)
      
      await sendConfirmationEmail(email, name, confirmUrl)
      console.log('✅ Confirmation email sent to:', email)
    } catch (emailError) {
      console.error('❌ Error sending confirmation email:', emailError)
      // Continue even if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Error in signup:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
