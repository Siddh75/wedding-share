import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('🔐 Session API: Checking session...')
    console.log('🔐 Session API: Request URL:', request.url)
    console.log('🔐 Session API: Request headers:', Object.fromEntries(request.headers.entries()))
    
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session-token')
    
    console.log('🔐 Session API: Session token found:', !!sessionToken)
    console.log('🔐 Session API: Session token value:', sessionToken?.value)
    console.log('🔐 Session API: All cookies:', cookieStore.getAll().map(c => ({ 
      name: c.name, 
      hasValue: !!c.value,
      value: c.value?.substring(0, 50) + (c.value && c.value.length > 50 ? '...' : '')
    })))
    
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
