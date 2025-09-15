import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, message: 'userId or email parameter is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('users')
      .select('id, email, name, role, email_confirmed, created_at, updated_at')

    if (userId) {
      query = query.eq('id', userId)
    } else if (email) {
      query = query.eq('email', email)
    }

    const { data: users, error } = await query

    if (error) {
      console.error('❌ Error fetching user:', error)
      return NextResponse.json(
        { success: false, message: 'Error fetching user', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User status retrieved',
      users: users,
      count: users?.length || 0
    })

  } catch (error) {
    console.error('❌ User status API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
