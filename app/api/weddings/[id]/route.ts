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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Get Wedding API Debug:')
    
    const user = await getUserFromSession(request)
    console.log('- User from session:', user)
    
    if (!user) {
      console.log('❌ No user found - returning 401')
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const weddingId = params.id
    console.log('- Wedding ID:', weddingId)

    // Get wedding details
    const { data: wedding, error } = await supabase
      .from('weddings')
      .select('*')
      .eq('id', weddingId)
      .single()

    if (error || !wedding) {
      console.log('❌ Wedding not found')
      return NextResponse.json({ 
        success: false, 
        message: 'Wedding not found' 
      }, { status: 404 })
    }

    // Check access permissions
    const hasAccess = user.role === 'super_admin' && wedding.super_admin_id === user.id ||
                     user.role === 'admin' && wedding.wedding_admin_ids?.includes(user.id)

    if (!hasAccess) {
      console.log('❌ Access denied')
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    // Get guest count
    const { count: guestCount } = await supabase
      .from('wedding_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('wedding_id', weddingId)

    // Get photo count
    const { count: photoCount } = await supabase
      .from('media')
      .select('*', { count: 'exact', head: true })
      .eq('wedding_id', weddingId)

    console.log('✅ Wedding found:', wedding.id)

    return NextResponse.json({
      success: true,
      wedding: {
        ...wedding,
        guestCount: guestCount || 0,
        photoCount: photoCount || 0
      }
    })

  } catch (error) {
    console.error('❌ Get wedding error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch wedding' 
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Update Wedding API Debug:')
    
    const user = await getUserFromSession(request)
    console.log('- User from session:', user)
    
    if (!user) {
      console.log('❌ No user found - returning 401')
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const weddingId = params.id
    const { name, date, location, description } = await request.json()
    
    console.log('- Wedding ID:', weddingId)
    console.log('- Update data:', { name, date, location, description })

    // Get wedding to check permissions
    const { data: wedding, error: fetchError } = await supabase
      .from('weddings')
      .select('*')
      .eq('id', weddingId)
      .single()

    if (fetchError || !wedding) {
      console.log('❌ Wedding not found')
      return NextResponse.json({ 
        success: false, 
        message: 'Wedding not found' 
      }, { status: 404 })
    }

    // Check access permissions
    const hasAccess = user.role === 'super_admin' && wedding.super_admin_id === user.id ||
                     user.role === 'admin' && wedding.wedding_admin_ids?.includes(user.id)

    if (!hasAccess) {
      console.log('❌ Access denied')
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    // Update wedding
    const { data: updatedWedding, error: updateError } = await supabase
      .from('weddings')
      .update({
        name,
        date,
        location,
        description: description || ''
      })
      .eq('id', weddingId)
      .select()
      .single()

    if (updateError) {
      console.log('❌ Update error:', updateError)
      throw updateError
    }

    console.log('✅ Wedding updated:', updatedWedding.id)

    return NextResponse.json({
      success: true,
      wedding: updatedWedding
    })

  } catch (error) {
    console.error('❌ Update wedding error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update wedding' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Delete Wedding API Debug:')
    
    const user = await getUserFromSession(request)
    console.log('- User from session:', user)
    
    if (!user) {
      console.log('❌ No user found - returning 401')
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const weddingId = params.id
    console.log('- Wedding ID:', weddingId)

    // Get wedding to check permissions
    const { data: wedding, error: fetchError } = await supabase
      .from('weddings')
      .select('*')
      .eq('id', weddingId)
      .single()

    if (fetchError || !wedding) {
      console.log('❌ Wedding not found')
      return NextResponse.json({ 
        success: false, 
        message: 'Wedding not found' 
      }, { status: 404 })
    }

    // Check access permissions (only super admin can delete)
    const hasAccess = user.role === 'super_admin' && wedding.super_admin_id === user.id

    if (!hasAccess) {
      console.log('❌ Access denied - only super admin can delete')
      return NextResponse.json({ 
        success: false, 
        message: 'Only super admin can delete weddings' 
      }, { status: 403 })
    }

    // Delete wedding (cascade will handle related data)
    const { error: deleteError } = await supabase
      .from('weddings')
      .delete()
      .eq('id', weddingId)

    if (deleteError) {
      console.log('❌ Delete error:', deleteError)
      throw deleteError
    }

    console.log('✅ Wedding deleted:', weddingId)

    return NextResponse.json({
      success: true,
      message: 'Wedding deleted successfully'
    })

  } catch (error) {
    console.error('❌ Delete wedding error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to delete wedding' 
    }, { status: 500 })
  }
}
