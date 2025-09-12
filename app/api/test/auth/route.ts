import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Auth Test API Debug:')
    
         // Debug cookies
     const cookies = request.cookies
     console.log('- All cookies:', Object.fromEntries(cookies.getAll().map(c => [c.name, c.value])))
    
    const sessionToken = request.cookies.get('session-token')?.value
    console.log('- Session token exists:', !!sessionToken)
    if (sessionToken) {
      console.log('- Session token length:', sessionToken.length)
    }

    if (!sessionToken) {
      return NextResponse.json({
        success: false,
        message: 'No session token found',
        authenticated: false
      })
    }

    // Try to parse as JSON first (for development mode)
    try {
      const userData = JSON.parse(sessionToken)
      console.log('✅ Parsed session token as JSON:', userData)
      
      return NextResponse.json({
        success: true,
        authenticated: true,
        user: userData
      })
    } catch (jsonError) {
      console.log('⚠️ Session token is not JSON, trying as Supabase token')
    }

    // If not JSON, try as Supabase session token
    const { data: { user }, error } = await supabase.auth.getUser(sessionToken)
    
    if (error || !user) {
      console.log('❌ Supabase auth error:', error)
      return NextResponse.json({
        success: false,
        message: 'Invalid session token',
        authenticated: false,
        error: error?.message
      })
    }

    // Get user role from our users table
    const { data: userData } = await supabase
      .from('users')
      .select('role, name')
      .eq('id', user.id)
      .single()

    console.log('✅ User authenticated:', {
      id: user.id,
      email: user.email,
      role: userData?.role || 'guest',
      name: userData?.name
    })

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: userData?.role || 'guest',
        name: userData?.name
      }
    })

  } catch (error) {
    console.error('❌ Auth test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Authentication test failed',
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
