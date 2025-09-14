import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { data: media, error } = await supabase
      .from('media')
      .select(`
        *,
        uploaded_by_user:users!media_uploaded_by_fkey(name, email),
        wedding:weddings!media_wedding_id_fkey(id, name, super_admin_id, wedding_admin_ids)
      `)
      .eq('id', params.id)
      .single()

    if (error || !media) {
      return NextResponse.json({ 
        success: false, 
        message: 'Media not found' 
      }, { status: 404 })
    }

    // Check access permissions
    const hasAccess = user.role === 'super_admin' && media.wedding.super_admin_id === user.id ||
                     user.role === 'admin' && media.wedding.wedding_admin_ids?.includes(user.id) ||
                     user.role === 'guest' && media.status === 'approved' ||
                     media.uploaded_by === user.id

    if (!hasAccess) {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      media: {
        id: media.id,
        file_url: media.file_url,
        file_type: media.file_type,
        file_size: media.file_size,
        description: media.description,
        status: media.status,
        uploaded_by: media.uploaded_by_user?.name || 'Unknown',
        uploaded_at: media.created_at,
        metadata: media.metadata,
        wedding_name: media.wedding.name
      }
    })

  } catch (error) {
    console.error('Media fetch error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch media' 
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { is_approved, description } = body

    // Get media with wedding info
    const { data: media, error: fetchError } = await supabase
      .from('media')
      .select(`
        *,
        wedding:weddings!media_wedding_id_fkey(id, super_admin_id, wedding_admin_ids)
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !media) {
      return NextResponse.json({ 
        success: false, 
        message: 'Media not found' 
      }, { status: 404 })
    }

    // Check if user can modify this media
    const canModify = user.role === 'super_admin' && media.wedding.super_admin_id === user.id ||
                     user.role === 'admin' && media.wedding.wedding_admin_ids?.includes(user.id) ||
                     media.uploaded_by === user.id

    if (!canModify) {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    // Only super admins and admins can change approval status
    if (is_approved !== undefined && !['super_admin', 'admin'].includes(user.role)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Only admins can change media approval status' 
      }, { status: 403 })
    }

    // Update media
    const updateData: any = {}
    if (description !== undefined) updateData.description = description
    if (is_approved !== undefined) {
      updateData.is_approved = is_approved
      // updateData.approved_by = is_approved ? user.id : null // Removed - column doesn't exist
      // updateData.approved_at = is_approved ? new Date().toISOString() : null // Removed - column doesn't exist
    }

    const { data: updatedMedia, error: updateError } = await supabase
      .from('media')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      media: {
        id: updatedMedia.id,
        url: updatedMedia.url,
        is_approved: updatedMedia.is_approved,
        description: updatedMedia.description,
        updated_at: updatedMedia.updated_at
      }
    })

  } catch (error) {
    console.error('Media update error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update media' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Get media with wedding info
    const { data: media, error: fetchError } = await supabase
      .from('media')
      .select(`
        *,
        wedding:weddings!media_wedding_id_fkey(id, super_admin_id, wedding_admin_ids)
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !media) {
      return NextResponse.json({ 
        success: false, 
        message: 'Media not found' 
      }, { status: 404 })
    }

    // Check if user can delete this media
    const canDelete = user.role === 'super_admin' && media.wedding.super_admin_id === user.id ||
                     user.role === 'admin' && media.wedding.wedding_admin_ids?.includes(user.id) ||
                     media.uploaded_by === user.id

    if (!canDelete) {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    // Delete from Cloudinary if public_id exists
    if (media.cloudinary_public_id) {
      try {
        await cloudinary.uploader.destroy(media.cloudinary_public_id)
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError)
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('media')
      .delete()
      .eq('id', params.id)

    if (deleteError) throw deleteError

    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully'
    })

  } catch (error) {
    console.error('Media delete error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to delete media' 
    }, { status: 500 })
  }
}




