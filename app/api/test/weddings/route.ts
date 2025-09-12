import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to get user from session
async function getUserFromSession(request: NextRequest) {
  const sessionToken = request.cookies.get('session-token')?.value
  if (!sessionToken) return null

  try {
    // Try to parse as JSON first (for development mode)
    try {
      const userData = JSON.parse(sessionToken)
      console.log('✅ Parsed session token as JSON:', userData)
      return userData
    } catch (jsonError) {
      console.log('⚠️ Session token is not JSON, trying as Supabase token')
    }

    // If not JSON, try as Supabase session token
    const { data: { user }, error } = await supabase.auth.getUser(sessionToken)
    if (error || !user) return null

    // Get user role from our users table
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    return {
      id: user.id,
      email: user.email,
      role: userData?.role || 'guest'
    }
  } catch (error) {
    console.error('Error getting user from session:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Wedding List API Debug:')
    
    const user = await getUserFromSession(request)
    console.log('- User from session:', user)
    
    if (!user) {
      console.log('❌ No user found - returning 401')
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', {
      id: user.id,
      email: user.email,
      role: user.role
    })

    // Get weddings based on user role
    let query = supabase.from('weddings').select('*')

    if (user.role === 'super_admin') {
      // Super admin can see all weddings they created
      query = query.eq('super_admin_id', user.id)
    } else if (user.role === 'admin') {
      // Admin can see weddings they're assigned to
      query = query.contains('wedding_admin_ids', [user.id])
    } else {
      // Guests can't see wedding list
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const { data: weddings, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.log('❌ Database error:', error)
      throw error
    }

    console.log('✅ Found weddings:', weddings?.length || 0)

    return NextResponse.json({
      success: true,
      weddings: weddings || []
    })

  } catch (error) {
    console.error('❌ Wedding list error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch weddings' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Wedding Creation API Debug:')
    
    const user = await getUserFromSession(request)
    console.log('- User from session:', user)
    
    if (!user) {
      console.log('❌ No user found - returning 401')
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'super_admin') {
      console.log('❌ Only super admins can create weddings')
      return NextResponse.json({ success: false, message: 'Only super admins can create weddings' }, { status: 403 })
    }

    const { name, description, date, location } = await request.json()
    
    console.log('- Wedding data:', { name, description, date, location })

    if (!name || !date) {
      return NextResponse.json({ 
        success: false, 
        message: 'Name and date are required' 
      }, { status: 400 })
    }

    const { data: wedding, error } = await supabase
      .from('weddings')
      .insert({
        name,
        description: description || '',
        date,
        location: location || '',
        super_admin_id: user.id,
        wedding_admin_ids: [user.id] // Super admin is also an admin
      })
      .select()
      .single()

    if (error) {
      console.log('❌ Database error:', error)
      throw error
    }

    console.log('✅ Wedding created:', wedding.id)

    return NextResponse.json({
      success: true,
      wedding
    })

  } catch (error) {
    console.error('❌ Wedding creation error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create wedding' 
    }, { status: 500 })
  }
}
