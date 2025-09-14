import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Session Version API: Testing session API version...')
    
    // Get cookie header
    const cookieHeader = request.headers.get('cookie')
    console.log('🔍 Session Version API: Cookie header:', cookieHeader)
    
    // Parse session token
    let sessionToken = null
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim())
      const sessionCookie = cookies.find(c => c.startsWith('session-token='))
      if (sessionCookie) {
        const sessionValue = sessionCookie.split('=')[1]
        sessionToken = { value: sessionValue }
      }
    }
    
    return NextResponse.json({
      success: true,
      version: 'v2.0',
      timestamp: new Date().toISOString(),
      debug: {
        cookieHeader: cookieHeader,
        sessionTokenFound: !!sessionToken,
        sessionTokenValue: sessionToken?.value,
        requestUrl: request.url,
        userAgent: request.headers.get('user-agent'),
        host: request.headers.get('host')
      }
    })
  } catch (error) {
    console.error('❌ Session Version API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
