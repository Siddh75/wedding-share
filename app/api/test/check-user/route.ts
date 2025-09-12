import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Checking for user with email:', email)
    
    // Check in our users table
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    console.log('🔍 Database query result:', { dbUser, dbError })

    // Check in Supabase Auth (if possible)
    try {
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      const authUser = authUsers.users.find(u => u.email === email)
      
      return NextResponse.json({
        success: true,
        email,
        inDatabase: !!dbUser && !dbError,
        inSupabaseAuth: !!authUser,
        databaseUser: dbUser,
        authUser: authUser ? {
          id: authUser.id,
          email: authUser.email,
          email_confirmed_at: authUser.email_confirmed_at,
          created_at: authUser.created_at
        } : null,
        databaseError: dbError
      })
    } catch (authError) {
      return NextResponse.json({
        success: true,
        email,
        inDatabase: !!dbUser && !dbError,
        inSupabaseAuth: 'Unable to check',
        databaseUser: dbUser,
        databaseError: dbError,
        authError: authError instanceof Error ? authError.message : 'Unknown auth error'
      })
    }
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

