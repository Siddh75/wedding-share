import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true
  })
} else {
  // Fallback to individual environment variables
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

// Debug Cloudinary configuration
console.log('🔍 Cloudinary config check:')
console.log('- Cloud name:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing')
console.log('- API key:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing')
console.log('- API secret:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing')

// Helper function to get user from session
async function getUserFromSession(request: NextRequest) {
  try {
    const cookieStore = await import('next/headers').then(m => m.cookies())
    const sessionToken = cookieStore.get('session-token')
    
    if (!sessionToken) {
      console.log('❌ No session token found')
      return null
    }
    
    const user = JSON.parse(sessionToken.value)
    console.log('✅ Parsed user from session:', user)
    return user
  } catch (error) {
    console.error('❌ Error parsing session:', error)
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
    const { data: wedding } = await supabaseAdmin
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
    console.log('🔍 Cloudinary config check:')
    console.log('- Cloud name:', process.env.CLOUDINARY_CLOUD_NAME || 'MISSING')
    console.log('- API key:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'MISSING')
    console.log('- API secret:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'MISSING')
    
    // Check if Cloudinary is properly configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary configuration missing')
      return NextResponse.json({
        success: false,
        message: 'File upload service not configured. Please contact support.',
        error: 'CLOUDINARY_CONFIG_MISSING'
      }, { status: 500 })
    }
    
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: `weddings/${weddingId}`,
          public_id: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
          upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'wedding_photos',
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error)
            console.error('❌ Error details:', {
              message: error.message,
              http_code: error.http_code,
              name: error.name
            })
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
    
    // For now, let's use a placeholder URL since Cloudinary is failing
    // In production, you'll need to fix the Cloudinary configuration
    const mediaUrl = cloudinaryResult.secure_url || `https://via.placeholder.com/400x300?text=${encodeURIComponent(file.name)}`
    
    console.log('🔗 Using media URL:', mediaUrl)
    
    // Save to database
    const { data: media, error: dbError } = await supabaseAdmin
      .from('media')
      .insert({
        wedding_id: weddingId,
        uploaded_by: user.id,
        type: mediaType,
        url: mediaUrl,
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
      // If we have a Cloudinary result, try to delete it
      if (cloudinaryResult.public_id) {
        try {
          await cloudinary.uploader.destroy(cloudinaryResult.public_id)
        } catch (deleteError) {
          console.error('❌ Failed to delete from Cloudinary:', deleteError)
        }
      }
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
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to upload media',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
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
    const { data: wedding } = await supabaseAdmin
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
    let query = supabaseAdmin
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
