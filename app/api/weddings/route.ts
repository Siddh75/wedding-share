import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'
import { sendWeddingInvitation } from '@/app/lib/email-service'

// Helper function to get user from session
async function getUserFromSession(request: NextRequest) {
  try {
    const cookieStore = await import('next/headers').then(m => m.cookies())
    const sessionToken = cookieStore.get('session-token')
    
    if (!sessionToken) {
      return null
    }
    
    const user = JSON.parse(sessionToken.value)
    return user
  } catch (error) {
    console.error('Error parsing session:', error)
    return null
  }
}

// GET /api/weddings - Get all weddings for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    let query = supabaseAdmin
      .from('weddings')
      .select(`
        *,
        subscription_plans(name, features),
        media(count),
        wedding_invitations(count)
      `)

    // Filter based on user role
    if (user.role === 'super_admin') {
      query = query.eq('super_admin_id', user.id)
    } else if (user.role === 'admin') {
      // Wedding admins can see weddings where they are in wedding_admin_ids
      query = query.contains('wedding_admin_ids', [user.id])
    } else {
      // Guests can only see weddings they're invited to
      query = query.eq('id', 'none') // This will return empty for now
    }

    const { data: weddings, error } = await query

    if (error) {
      console.error('Error fetching weddings:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch weddings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      weddings: weddings || []
    })
  } catch (error) {
    console.error('Error in GET /api/weddings:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/weddings - Create a new wedding
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Allow both super_admin and admin users to create weddings
    // Admin users can create weddings during signup or if they have permission
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only Super Admins and Admins can create weddings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, date, location, description, subscription_plan_id, adminEmail } = body

    // Validate required fields
    if (!name || !date || !location || !adminEmail) {
      return NextResponse.json(
        { success: false, message: 'Name, date, location, and admin email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(adminEmail)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Generate unique wedding code
    const code = `${name.replace(/\s+/g, '').toUpperCase()}${Date.now().toString().slice(-4)}`

    const { data: wedding, error } = await supabaseAdmin
      .from('weddings')
      .insert({
        name,
        date,
        location,
        description,
        code,
        super_admin_id: user.id,
        subscription_plan_id,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating wedding:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to create wedding' },
        { status: 500 }
      )
    }

    // Handle wedding admin invitation
    if (adminEmail) {
      try {
        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id, name, role')
          .eq('email', adminEmail)
          .single()

        if (existingUser) {
          // User exists, add them to wedding_admin_ids
          const currentAdminIds = wedding.wedding_admin_ids || []
          const updatedAdminIds = [...currentAdminIds, existingUser.id]

          const { error: updateWeddingError } = await supabaseAdmin
            .from('weddings')
            .update({
              wedding_admin_ids: updatedAdminIds,
              updated_at: new Date().toISOString()
            })
            .eq('id', wedding.id)

          if (updateWeddingError) {
            console.error('Error updating wedding with existing admin:', updateWeddingError)
          }
        } else {
          // Store invitation data for new user signup
          console.log('📧 Creating invitation for:', { weddingId: wedding.id, email: adminEmail })
          
          // Temporarily skip invitation creation for testing
          console.log('⚠️ Temporarily skipping invitation creation for testing')
          
          // TODO: Uncomment this when wedding_invitations table is created
          /*
          const { error: invitationError } = await supabaseAdmin
            .from('wedding_invitations')
            .insert({
              wedding_id: wedding.id,
              email: adminEmail,
              role: 'admin',
              status: 'pending',
              created_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
            })

          if (invitationError) {
            console.error('Error creating invitation:', invitationError)
          } else {
            console.log('✅ Invitation created successfully')
          }
          */
        }

        // Send invitation email
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
          const loginUrl = `${baseUrl}/auth/signin`
          const signupUrl = `${baseUrl}/auth/signup?wedding=${wedding.id}&name=${encodeURIComponent(name)}&date=${encodeURIComponent(date)}&location=${encodeURIComponent(location)}&email=${encodeURIComponent(adminEmail)}`
          const adminName = existingUser ? existingUser.name : `Wedding Admin - ${name}`
          
          await sendWeddingInvitation({
            to: adminEmail,
            weddingName: name,
            weddingDate: date,
            weddingLocation: location,
            adminName: adminName,
            loginUrl: loginUrl,
            signupUrl: signupUrl
          })

          console.log('Wedding invitation email sent successfully')
        } catch (emailError) {
          console.error('Error sending wedding invitation email:', emailError)
          // Continue with wedding creation even if email fails
        }
      } catch (userError) {
        console.error('Error handling wedding admin user:', userError)
        // Continue with wedding creation even if user handling fails
      }
    }

    return NextResponse.json({
      success: true,
      wedding
    })
  } catch (error) {
    console.error('Error in POST /api/weddings:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/weddings - Update a wedding
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Wedding ID is required' },
        { status: 400 }
      )
    }

    // Check if user has permission to update this wedding
    const { data: existingWedding } = await supabaseAdmin
      .from('weddings')
      .select('super_admin_id, wedding_admin_ids')
      .eq('id', id)
      .single()

    if (!existingWedding) {
      return NextResponse.json(
        { success: false, message: 'Wedding not found' },
        { status: 404 }
      )
    }

    const canUpdate = 
      user.role === 'super_admin' && existingWedding.super_admin_id === user.id ||
      user.role === 'admin' && existingWedding.wedding_admin_ids.includes(user.id)

    if (!canUpdate) {
      return NextResponse.json(
        { success: false, message: 'Permission denied' },
        { status: 403 }
      )
    }

    const { data: wedding, error } = await supabaseAdmin
      .from('weddings')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating wedding:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to update wedding' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      wedding
    })
  } catch (error) {
    console.error('Error in PUT /api/weddings:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/weddings - Delete a wedding
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Wedding ID is required' },
        { status: 400 }
      )
    }

    // Check if user has permission to delete this wedding
    const { data: existingWedding } = await supabaseAdmin
      .from('weddings')
      .select('super_admin_id')
      .eq('id', id)
      .single()

    if (!existingWedding) {
      return NextResponse.json(
        { success: false, message: 'Wedding not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'super_admin' || existingWedding.super_admin_id !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Only the Super Admin can delete this wedding' },
        { status: 403 }
      )
    }

    const { error } = await supabaseAdmin
      .from('weddings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting wedding:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to delete wedding' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Wedding deleted successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/weddings:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

