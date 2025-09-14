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

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Media Upload API Debug:')
    console.log('- Request method:', request.method)
    console.log('- Request URL:', request.url)
    
    // Debug cookies
    const cookies = request.cookies
    console.log('- All cookies:', Object.fromEntries(cookies.getAll().map(c => [c.name, c.value])))
    
    const sessionToken = request.cookies.get('session-token')?.value
    console.log('- Session token exists:', !!sessionToken)
    if (sessionToken) {
      console.log('- Session token length:', sessionToken.length)
    }

    let user = await getUserFromSession(request)
    console.log('- User from session:', user)
    
    // Temporary: Allow upload without authentication for testing
    if (!user) {
      console.log('⚠️ No user found, using test user for development')
      user = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'super_admin'
      }
    }

    console.log('✅ User authenticated:', {
      id: user.id,
      email: user.email,
      role: user.role
    })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const weddingId = formData.get('weddingId') as string
    const description = formData.get('description') as string

    console.log('- Form data received:')
    console.log('  - File:', file?.name, file?.size, file?.type)
    console.log('  - Wedding ID:', weddingId)
    console.log('  - Description:', description)

    if (!file || !weddingId) {
      console.log('❌ Missing required fields')
      return NextResponse.json({ 
        success: false, 
        message: 'File and wedding ID are required' 
      }, { status: 400 })
    }

    // Check if user has access to this wedding
    const { data: wedding } = await supabase
      .from('weddings')
      .select('id, super_admin_id, wedding_admin_ids')
      .eq('id', weddingId)
      .single()

    console.log('- Wedding data:', wedding)

    if (!wedding) {
      console.log('❌ Wedding not found')
      return NextResponse.json({ 
        success: false, 
        message: 'Wedding not found' 
      }, { status: 404 })
    }

    // Check access permissions
    const hasAccess = user.role === 'super_admin' && wedding.super_admin_id === user.id ||
                     user.role === 'admin' && wedding.wedding_admin_ids?.includes(user.id) ||
                     user.role === 'guest' // Guests can upload to any wedding

    console.log('- Access check:', {
      userRole: user.role,
      weddingSuperAdmin: wedding.super_admin_id,
      weddingAdmins: wedding.wedding_admin_ids,
      hasAccess
    })

    if (!hasAccess) {
      console.log('❌ Access denied')
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    console.log('✅ Access granted, proceeding with upload')

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log('- File converted to buffer, size:', buffer.length)

    // Upload to Cloudinary
    console.log('📤 Uploading to Cloudinary...')
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: `weddings/${weddingId}`,
          public_id: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error)
            reject(error)
          } else {
            console.log('✅ Cloudinary upload successful:', result?.secure_url)
            resolve(result)
          }
        }
      ).end(buffer)
    })

    const cloudinaryResult = uploadResult as any
    console.log('- Cloudinary result:', cloudinaryResult)

    // Determine media type
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image'
    
    // Save to database
    const { data: media, error: dbError } = await supabase
      .from('media')
      .insert({
        wedding_id: weddingId,
        uploaded_by: user.id,
        type: mediaType,
        url: cloudinaryResult.secure_url,
        filename: file.name,
        size: file.size,
        mime_type: file.type,
        is_approved: user.role !== 'guest', // Guests need approval, admins are auto-approved
        approved_by: user.role !== 'guest' ? user.id : null,
        approved_at: user.role !== 'guest' ? new Date().toISOString() : null,
        tags: description ? [description] : []
      })
      .select()
      .single()

    if (dbError) {
      console.log('❌ Database error:', dbError)
      // Delete from Cloudinary if database insert fails
      await cloudinary.uploader.destroy(cloudinaryResult.public_id)
      throw dbError
    }

    console.log('✅ Media saved to database:', media.id)

    return NextResponse.json({
      success: true,
      media: {
        id: media.id,
        url: media.url,
        type: media.type,
        filename: media.filename,
        is_approved: media.is_approved,
        uploaded_at: media.created_at
      }
    })

  } catch (error) {
    console.error('❌ Media upload error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to upload media' 
    }, { status: 500 })
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
    const status = searchParams.get('status')

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

    // Build query
    let query = supabase
      .from('media')
      .select(`
        *,
        uploaded_by_user:users!media_uploaded_by_fkey(name, email)
      `)
      .eq('wedding_id', weddingId)

    if (status) {
      query = query.eq('is_approved', status === 'approved')
    }

    // Guests can only see approved media
    if (user.role === 'guest') {
      query = query.eq('is_approved', true)
    }

    const { data: media, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      media: media.map(item => ({
        id: item.id,
        url: item.url,
        type: item.type,
        filename: item.filename,
        mime_type: item.mime_type,
        size: item.size,
        is_approved: item.is_approved,
        uploaded_by: item.uploaded_by_user?.name || 'Unknown',
        uploaded_at: item.created_at,
        tags: item.tags
      }))
    })

  } catch (error) {
    console.error('Media fetch error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch media' 
    }, { status: 500 })
  }
}
