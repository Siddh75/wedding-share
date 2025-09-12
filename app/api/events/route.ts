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
    const hasAccess = user.role === 'super_admin' && wedding.super_admin_id === user.id ||
                     user.role === 'admin' && wedding.wedding_admin_ids?.includes(user.id) ||
                     user.role === 'guest'

    if (!hasAccess) {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    // Get events for this wedding
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        created_by_user:users!events_created_by_fkey(name, email)
      `)
      .eq('wedding_id', weddingId)
      .order('start_time', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      events: events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        end_time: event.end_time,
        location: event.location,
        event_type: event.event_type,
        is_public: event.is_public,
        created_by: event.created_by_user?.name || 'Unknown',
        created_at: event.created_at,
        updated_at: event.updated_at
      }))
    })

  } catch (error) {
    console.error('Events fetch error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch events' 
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
    const { 
      weddingId, 
      title, 
      description, 
      startTime, 
      endTime, 
      location, 
      eventType, 
      isPublic = false 
    } = body

    if (!weddingId || !title || !startTime) {
      return NextResponse.json({ 
        success: false, 
        message: 'Wedding ID, title, and start time are required' 
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

    // Check access permissions - only super admins and admins can create events
    const hasAccess = user.role === 'super_admin' && wedding.super_admin_id === user.id ||
                     user.role === 'admin' && wedding.wedding_admin_ids?.includes(user.id)

    if (!hasAccess) {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    // Create event
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        wedding_id: weddingId,
        title,
        description: description || '',
        start_time: startTime,
        end_time: endTime || null,
        location: location || '',
        event_type: eventType || 'other',
        is_public: isPublic,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        end_time: event.end_time,
        location: event.location,
        event_type: event.event_type,
        is_public: event.is_public,
        created_at: event.created_at
      }
    })

  } catch (error) {
    console.error('Event creation error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create event' 
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
    const { 
      eventId, 
      title, 
      description, 
      startTime, 
      endTime, 
      location, 
      eventType, 
      isPublic 
    } = body

    if (!eventId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Event ID is required' 
      }, { status: 400 })
    }

    // Get event with wedding info
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select(`
        *,
        wedding:weddings!events_wedding_id_fkey(id, super_admin_id, wedding_admin_ids)
      `)
      .eq('id', eventId)
      .single()

    if (fetchError || !event) {
      return NextResponse.json({ 
        success: false, 
        message: 'Event not found' 
      }, { status: 404 })
    }

    // Check if user can modify this event
    const canModify = user.role === 'super_admin' && event.wedding.super_admin_id === user.id ||
                     user.role === 'admin' && event.wedding.wedding_admin_ids?.includes(user.id) ||
                     event.created_by === user.id

    if (!canModify) {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    // Update event
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (startTime !== undefined) updateData.start_time = startTime
    if (endTime !== undefined) updateData.end_time = endTime
    if (location !== undefined) updateData.location = location
    if (eventType !== undefined) updateData.event_type = eventType
    if (isPublic !== undefined) updateData.is_public = isPublic

    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      event: {
        id: updatedEvent.id,
        title: updatedEvent.title,
        description: updatedEvent.description,
        start_time: updatedEvent.start_time,
        end_time: updatedEvent.end_time,
        location: updatedEvent.location,
        event_type: updatedEvent.event_type,
        is_public: updatedEvent.is_public,
        updated_at: updatedEvent.updated_at
      }
    })

  } catch (error) {
    console.error('Event update error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update event' 
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
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Event ID is required' 
      }, { status: 400 })
    }

    // Get event with wedding info
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select(`
        *,
        wedding:weddings!events_wedding_id_fkey(id, super_admin_id, wedding_admin_ids)
      `)
      .eq('id', eventId)
      .single()

    if (fetchError || !event) {
      return NextResponse.json({ 
        success: false, 
        message: 'Event not found' 
      }, { status: 404 })
    }

    // Check if user can delete this event
    const canDelete = user.role === 'super_admin' && event.wedding.super_admin_id === user.id ||
                     user.role === 'admin' && event.wedding.wedding_admin_ids?.includes(user.id) ||
                     event.created_by === user.id

    if (!canDelete) {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    // Delete event
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    if (deleteError) throw deleteError

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    })

  } catch (error) {
    console.error('Event delete error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to delete event' 
    }, { status: 500 })
  }
}




