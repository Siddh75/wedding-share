import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('🔐 Session API: Checking session... [UPDATED VERSION - v3.0]')
    console.log('🔐 Session API: Request URL:', request.url)
    
    // Get cookie header directly (same logic as working debug endpoints)
    const cookieHeader = request.headers.get('cookie')
    console.log('🔐 Session API: Cookie header:', cookieHeader)
    
    let sessionToken = null
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim())
      console.log('🔐 Session API: Parsed cookies from header:', cookies)
      
      const sessionCookie = cookies.find(c => c.startsWith('session-token='))
      if (sessionCookie) {
        const sessionValue = sessionCookie.split('=')[1]
        console.log('🔐 Session API: Session value from header:', sessionValue)
        sessionToken = { value: sessionValue }
      }
    }
    
    console.log('🔐 Session API: Session token found:', !!sessionToken)
    console.log('🔐 Session API: Session token value:', sessionToken?.value)
    
    if (!sessionToken) {
      console.log('🔐 Session API: No session token found')
      return NextResponse.json({ 
        authenticated: false,
        version: 'v3.0',
        debug: {
          cookieHeader: cookieHeader,
          sessionTokenFound: false,
          reason: 'No session token found in cookies'
        }
      })
    }

    try {
      const user = JSON.parse(sessionToken.value)
      console.log('🔐 Session API: Parsed user:', user)
      
      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        version: 'v3.0',
        debug: {
          cookieHeader: cookieHeader,
          sessionTokenFound: !!sessionToken,
          sessionTokenValue: sessionToken?.value
        }
      })
    } catch (parseError) {
      console.error('❌ Session token parse error:', parseError)
      console.error('❌ Session token value that failed to parse:', sessionToken.value)
      return NextResponse.json({ 
        authenticated: false,
        version: 'v3.0',
        error: 'Parse error',
        debug: {
          cookieHeader: cookieHeader,
          sessionTokenFound: !!sessionToken,
          sessionTokenValue: sessionToken?.value,
          parseError: parseError instanceof Error ? parseError.message : 'Unknown error'
        }
      })
    }
  } catch (error) {
    console.error('❌ Session check error:', error)
    return NextResponse.json({ 
      authenticated: false,
      version: 'v3.0',
      error: 'Server error',
      debug: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
}
