import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session-token')
    
    if (!sessionToken) {
      return NextResponse.json({ authenticated: false })
    }

    try {
      const user = JSON.parse(sessionToken.value)
      
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
      console.error('Session token parse error:', parseError)
      return NextResponse.json({ authenticated: false })
    }
  } catch (error) {
    console.error('❌ Session check error:', error)
    return NextResponse.json({ authenticated: false })
  }
}
