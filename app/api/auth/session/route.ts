import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('🔐 Session API: Checking session...')
    console.log('🔐 Session API: Request URL:', request.url)
    console.log('🔐 Session API: Request headers:', Object.fromEntries(request.headers.entries()))
    
    // Try reading cookies from request headers first
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
    
    // Fallback to cookies() function
    if (!sessionToken) {
      console.log('🔐 Session API: Trying cookies() function...')
      const cookieStore = await cookies()
      sessionToken = cookieStore.get('session-token')
      console.log('🔐 Session API: Session token from cookies():', sessionToken)
    }
    
    console.log('🔐 Session API: Session token found:', !!sessionToken)
    console.log('🔐 Session API: Session token value:', sessionToken?.value)
    
    if (!sessionToken) {
      console.log('🔐 Session API: No session token found')
      return NextResponse.json({ authenticated: false })
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
        }
      })
    } catch (parseError) {
      console.error('❌ Session token parse error:', parseError)
      console.error('❌ Session token value that failed to parse:', sessionToken.value)
      return NextResponse.json({ authenticated: false })
    }
  } catch (error) {
    console.error('❌ Session check error:', error)
    return NextResponse.json({ authenticated: false })
  }
}
