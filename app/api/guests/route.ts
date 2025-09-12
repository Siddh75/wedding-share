import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to get user from session
async function getUserFromSession(request: NextRequest) {
  const sessionToken = request.cookies.get('session-token')?.value
  if (!sessionToken) return null

  try {
    // Try to parse as JSON first (for development mode)
    try {
      const userData = JSON.parse(sessionToken)
      console.log('✅ Parsed session token as JSON:', userData)
      return userData
    } catch (jsonError) {
      console.log('⚠️ Session token is not JSON, trying as Supabase token')
    }

    // If not JSON, try as Supabase session token
    const { data: { user }, error } = await supabase.auth.getUser(sessionToken)
    if (error || !user) return null

    // Get user role from our users table
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    return {
      id: user.id,
      email: user.email,
      role: userData?.role || 'guest'
    }
  } catch (error) {
    console.error('Error getting user from session:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')

    if (!weddingId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Wedding ID is required' 
      }, { status: 400 })
    }

    // Check if user has access to this wedding
    const { data: wedding } = await supabase
      .from('weddings')
      .select('id, super_admin_id, wedding_admin_ids')
      .eq('id', weddingId)
      .single()

    if (!wedding) {
      return NextResponse.json({ 
        success: false, 
        message: 'Wedding not found' 
      }, { status: 404 })
    }

    // Check access permissions
    const hasAccess = (user.role === 'super_admin' && wedding.super_admin_id === user.id) ||
                     (user.role === 'admin' && wedding.wedding_admin_ids?.includes(user.id))

    if (!hasAccess) {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    // Get guests for this wedding
    const { data: guests, error } = await supabase
      .from('wedding_guests')
      .select(`
        *,
        guest:users!wedding_guests_guest_id_fkey(id, name, email, role)
      `)
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      guests: guests.map(guest => ({
        id: guest.id,
        guest_id: guest.guest_id,
        guest_name: guest.guest_name,
        guest_email: guest.guest_email,
        status: 'invited',
        invited_at: guest.invited_at,
        responded_at: guest.responded_at,
        rsvp_status: guest.rsvp_status,
        dietary_restrictions: guest.dietary_restrictions,
        plus_one: guest.plus_one,
        plus_one_name: guest.plus_one_name
      }))
    })

  } catch (error) {
    console.error('Guests fetch error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch guests' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { weddingId, guestEmail, guestName, plusOne = false, plusOneName = null } = body

    if (!weddingId || !guestEmail) {
      return NextResponse.json({ 
        success: false, 
        message: 'Wedding ID and guest email are required' 
      }, { status: 400 })
    }

    // Check if user has access to this wedding
    const { data: wedding } = await supabase
      .from('weddings')
      .select('id, super_admin_id, wedding_admin_ids')
      .eq('id', weddingId)
      .single()

    if (!wedding) {
      return NextResponse.json({ 
        success: false, 
        message: 'Wedding not found' 
      }, { status: 404 })
    }

    // Check access permissions
    const hasAccess = (user.role === 'super_admin' && wedding.super_admin_id === user.id) ||
                     (user.role === 'admin' && wedding.wedding_admin_ids?.includes(user.id))

    if (!hasAccess) {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    // Check if guest already exists
    const { data: existingGuest } = await supabase
      .from('users')
      .select('id')
      .eq('email', guestEmail)
      .single()

    let guestId: string | null = null

    if (existingGuest) {
      guestId = existingGuest.id
    }

    // Check if guest already invited to this wedding
    const { data: existingInvitation } = await supabase
      .from('wedding_guests')
      .select('id')
      .eq('wedding_id', weddingId)
      .eq('guest_email', guestEmail)
      .single()

    if (existingInvitation) {
      return NextResponse.json({ 
        success: false, 
        message: 'Guest already invited to this wedding' 
      }, { status: 400 })
    }

    // Create guest invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('wedding_guests')
      .insert({
        wedding_id: weddingId,
        guest_id: guestId,
        guest_name: guestName,
        guest_email: guestEmail,
        invited_by: user.id,
        plus_one: plusOne,
        plus_one_name: plusOneName,
        rsvp_status: 'pending'
      })
      .select()
      .single()

    if (inviteError) throw inviteError

    // Send invitation email
    try {
      const { sendGuestInvitation } = await import('@/app/lib/email-service')
      const weddingResponse = await supabase
        .from('weddings')
        .select('name, date, location')
        .eq('id', weddingId)
        .single()

      if (weddingResponse.data) {
        const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/join?wedding=${weddingId}&guest=${invitation.id}`
        
        await sendGuestInvitation({
          guestEmail,
          guestName,
          weddingName: weddingResponse.data.name,
          weddingDate: weddingResponse.data.date,
          weddingLocation: weddingResponse.data.location,
          joinUrl
        })
      }
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      // Don't fail the invitation if email fails
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        guest_email: guestEmail,
        guest_name: guestName,
        status: 'invited',
        plus_one: invitation.plus_one,
        plus_one_name: invitation.plus_one_name,
        invited_at: invitation.invited_at
      }
    })

  } catch (error) {
    console.error('Guest invitation error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to invite guest' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { invitationId, rsvpStatus, dietaryRestrictions, plusOneName } = body

    if (!invitationId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invitation ID is required' 
      }, { status: 400 })
    }

    // Get invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('wedding_guests')
      .select(`
        *,
        wedding:weddings!wedding_guests_wedding_id_fkey(id, super_admin_id, wedding_admin_ids)
      `)
      .eq('id', invitationId)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invitation not found' 
      }, { status: 404 })
    }

    // Check if user can modify this invitation
    const canModify = (user.role === 'super_admin' && invitation.wedding.super_admin_id === user.id) ||
                     (user.role === 'admin' && invitation.wedding.wedding_admin_ids?.includes(user.id)) ||
                     (invitation.guest_id === user.id) ||
                     (invitation.guest_email === user.email)

    if (!canModify) {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    // Update invitation
    const updateData: any = {}
    if (rsvpStatus !== undefined) updateData.rsvp_status = rsvpStatus
    if (dietaryRestrictions !== undefined) updateData.dietary_restrictions = dietaryRestrictions
    if (plusOneName !== undefined) updateData.plus_one_name = plusOneName
    if (rsvpStatus !== undefined) updateData.responded_at = new Date().toISOString()

    const { data: updatedInvitation, error: updateError } = await supabase
      .from('wedding_guests')
      .update(updateData)
      .eq('id', invitationId)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      invitation: {
        id: updatedInvitation.id,
        rsvp_status: updatedInvitation.rsvp_status,
        dietary_restrictions: updatedInvitation.dietary_restrictions,
        plus_one_name: updatedInvitation.plus_one_name,
        responded_at: updatedInvitation.responded_at
      }
    })

  } catch (error) {
    console.error('Guest update error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update guest' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get('invitationId')

    if (!invitationId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invitation ID is required' 
      }, { status: 400 })
    }

    // Get invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('wedding_guests')
      .select(`
        *,
        wedding:weddings!wedding_guests_wedding_id_fkey(id, super_admin_id, wedding_admin_ids)
      `)
      .eq('id', invitationId)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invitation not found' 
      }, { status: 404 })
    }

    // Check if user can delete this invitation
    const canDelete = (user.role === 'super_admin' && invitation.wedding.super_admin_id === user.id) ||
                     (user.role === 'admin' && invitation.wedding.wedding_admin_ids?.includes(user.id))

    if (!canDelete) {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    // Delete invitation
    const { error: deleteError } = await supabase
      .from('wedding_guests')
      .delete()
      .eq('id', invitationId)

    if (deleteError) throw deleteError

    return NextResponse.json({
      success: true,
      message: 'Guest invitation deleted successfully'
    })

  } catch (error) {
    console.error('Guest delete error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to delete guest invitation' 
    }, { status: 500 })
  }
}




