import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test Upload API: Starting...')
    
    // Test 1: Basic request handling
    console.log('🧪 Test 1: Basic request handling')
    console.log('- Method:', request.method)
    console.log('- URL:', request.url)
    console.log('- Headers:', Object.fromEntries(request.headers.entries()))
    
    // Test 2: Cookie reading
    console.log('🧪 Test 2: Cookie reading')
    const cookieHeader = request.headers.get('cookie')
    console.log('- Cookie header:', cookieHeader)
    
    let user = null
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim())
      const sessionCookie = cookies.find(c => c.startsWith('session-token='))
      if (sessionCookie) {
        const sessionValue = sessionCookie.split('=')[1]
        try {
          const decodedValue = decodeURIComponent(sessionValue)
          user = JSON.parse(decodedValue)
          console.log('- User parsed:', user)
        } catch (parseError) {
          console.error('- Parse error:', parseError)
        }
      }
    }
    
    // Test 3: Form data parsing
    console.log('🧪 Test 3: Form data parsing')
    const formData = await request.formData()
    const file = formData.get('file') as File
    const weddingId = formData.get('weddingId') as string
    const description = formData.get('description') as string
    
    console.log('- File:', file?.name, file?.size, file?.type)
    console.log('- Wedding ID:', weddingId)
    console.log('- Description:', description)
    
    // Test 4: Basic validation
    console.log('🧪 Test 4: Basic validation')
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        message: 'No file provided',
        test: 'file_validation'
      }, { status: 400 })
    }
    
    if (!weddingId) {
      return NextResponse.json({ 
        success: false, 
        message: 'No wedding ID provided',
        test: 'wedding_id_validation'
      }, { status: 400 })
    }
    
    // Test 5: Success response
    console.log('🧪 Test 5: Success response')
    return NextResponse.json({
      success: true,
      message: 'Test upload successful',
      test: 'all_tests_passed',
      data: {
        user: user,
        file: {
          name: file.name,
          size: file.size,
          type: file.type
        },
        weddingId: weddingId,
        description: description
      }
    })
    
  } catch (error) {
    console.error('❌ Test Upload API Error:', error)
    console.error('❌ Error type:', typeof error)
    console.error('❌ Error instanceof Error:', error instanceof Error)
    console.error('❌ Error message:', error instanceof Error ? error.message : 'No message')
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json({
      success: false,
      message: 'Test upload failed',
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
