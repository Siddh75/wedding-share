import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, emailConfirmed } = await request.json()

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, message: 'userId or email parameter is required' },
        { status: 400 }
      )
    }

    if (emailConfirmed === undefined) {
      return NextResponse.json(
        { success: false, message: 'emailConfirmed parameter is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('users')
      .update({ email_confirmed: emailConfirmed })

    if (userId) {
      query = query.eq('id', userId)
    } else if (email) {
      query = query.eq('email', email)
    }

    const { data, error } = await query.select('id, email, name, role, email_confirmed')

    if (error) {
      console.error('❌ Error updating user:', error)
      return NextResponse.json(
        { success: false, message: 'Error updating user', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User email_confirmed updated successfully',
      user: data?.[0] || data
    })

  } catch (error) {
    console.error('❌ Update email confirmed API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
