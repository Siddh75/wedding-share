import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('🔐 Session API: Checking session...')
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session-token')
    
    console.log('🔐 Session API: Session token found:', !!sessionToken)
    console.log('🔐 Session API: All cookies:', cookieStore.getAll().map(c => ({ name: c.name, hasValue: !!c.value })))
    
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
      return NextResponse.json({ authenticated: false })
    }
  } catch (error) {
    console.error('❌ Session check error:', error)
    return NextResponse.json({ authenticated: false })
  }
}
