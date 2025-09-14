import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Helper function to get user from session (same as working session API)
async function getUserFromSession(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie')
    console.log('🔍 Upload Simple API: Cookie header:', cookieHeader)
    
    if (!cookieHeader) {
      console.log('❌ No cookie header found')
      return null
    }
    
    const cookies = cookieHeader.split(';').map(c => c.trim())
    const sessionCookie = cookies.find(c => c.startsWith('session-token='))
    
    if (!sessionCookie) {
      console.log('❌ No session-token cookie found')
      return null
    }
    
    const sessionValue = sessionCookie.split('=')[1]
    console.log('🔍 Upload Simple API: Session value:', sessionValue)
    
    const decodedValue = decodeURIComponent(sessionValue)
    console.log('🔍 Upload Simple API: Decoded value:', decodedValue)
    
    const user = JSON.parse(decodedValue)
    console.log('✅ Parsed user from session:', user)
    return user
  } catch (error) {
    console.error('❌ Error parsing session:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Upload Simple API: Starting...')
    
    // Step 1: Get user from session
    console.log('🔍 Step 1: Getting user from session...')
    let user = await getUserFromSession(request)
    console.log('- User from session:', user)
    
    if (!user) {
      console.log('⚠️ No user found, using test user for development')
      user = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'admin'
      }
    }
    
    // Step 2: Parse form data
    console.log('🔍 Step 2: Parsing form data...')
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
    
    // Step 3: Test database connection (without complex queries)
    console.log('🔍 Step 3: Testing database connection...')
    try {
      const { data: testData, error: testError } = await supabaseAdmin
        .from('weddings')
        .select('id')
        .eq('id', weddingId)
        .limit(1)
      
      console.log('- Database test result:', { testData, testError })
      
      if (testError) {
        console.error('❌ Database error:', testError)
        return NextResponse.json({
          success: false,
          message: 'Database connection failed',
          error: testError.message,
          test: 'database_connection_failed'
        }, { status: 500 })
      }
      
      if (!testData || testData.length === 0) {
        console.log('❌ Wedding not found')
        return NextResponse.json({
          success: false,
          message: 'Wedding not found',
          test: 'wedding_not_found'
        }, { status: 404 })
      }
      
      console.log('✅ Database connection successful')
      console.log('✅ Wedding found:', testData[0])
      
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError)
      return NextResponse.json({
        success: false,
        message: 'Database connection failed',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error',
        test: 'database_connection_exception'
      }, { status: 500 })
    }
    
    // Step 4: Create a simple media record (without Cloudinary)
    console.log('🔍 Step 4: Creating media record...')
    try {
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image'
      const placeholderUrl = `https://via.placeholder.com/400x300?text=${encodeURIComponent(file.name)}`
      
      const { data: media, error: mediaError } = await supabaseAdmin
        .from('media')
        .insert({
          wedding_id: weddingId,
          uploaded_by: user.id,
          file_url: placeholderUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          status: 'approved', // Auto-approve for testing
          description: description || file.name,
          metadata: {
            original_name: file.name,
            test_upload: true
          }
        })
        .select()
        .single()
      
      console.log('- Media insert result:', { media, mediaError })
      
      if (mediaError) {
        console.error('❌ Media insert error:', mediaError)
        return NextResponse.json({
          success: false,
          message: 'Failed to save media to database',
          error: mediaError.message,
          test: 'media_insert_failed'
        }, { status: 500 })
      }
      
      console.log('✅ Media saved successfully:', media.id)
      
      return NextResponse.json({
        success: true,
        message: 'Upload successful (simplified)',
        test: 'all_steps_completed',
        media: {
          id: media.id,
          url: media.url,
          type: media.type,
          filename: media.filename,
          is_approved: media.is_approved,
          uploaded_at: media.created_at
        }
      })
      
    } catch (mediaError) {
      console.error('❌ Media creation error:', mediaError)
      return NextResponse.json({
        success: false,
        message: 'Failed to create media record',
        error: mediaError instanceof Error ? mediaError.message : 'Unknown media error',
        test: 'media_creation_exception'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Upload Simple API Error:', error)
    console.error('❌ Error type:', typeof error)
    console.error('❌ Error instanceof Error:', error instanceof Error)
    console.error('❌ Error message:', error instanceof Error ? error.message : 'No message')
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json({
      success: false,
      message: 'Upload simple failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      test: 'error_caught',
      details: {
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}
