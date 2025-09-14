import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Session API: Testing cookie reading...')
    
    // Get all request headers
    const headers = Object.fromEntries(request.headers.entries())
    console.log('🔍 Debug Session API: All headers:', headers)
    
    // Get cookie header specifically
    const cookieHeader = request.headers.get('cookie')
    console.log('🔍 Debug Session API: Cookie header:', cookieHeader)
    
    // Parse cookies manually
    let sessionToken = null
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim())
      console.log('🔍 Debug Session API: Parsed cookies:', cookies)
      
      const sessionCookie = cookies.find(c => c.startsWith('session-token='))
      if (sessionCookie) {
        const sessionValue = sessionCookie.split('=')[1]
        console.log('🔍 Debug Session API: Session value:', sessionValue)
        sessionToken = { value: sessionValue }
      }
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        headers: headers,
        cookieHeader: cookieHeader,
        sessionToken: sessionToken,
        sessionTokenValue: sessionToken?.value,
        userAgent: headers['user-agent'],
        host: headers['host'],
        origin: headers['origin'],
        referer: headers['referer']
      }
    })
  } catch (error) {
    console.error('❌ Debug Session API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
