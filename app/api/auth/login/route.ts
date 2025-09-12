import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin, createOrUpdateUser } from '@/app/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('🔐 Login attempt:', { email, hasPassword: !!password })
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Allow test accounts for demo purposes
    // Check if we're in a test environment or if test users are enabled
    const isTestEnvironment = process.env.NODE_ENV === 'development' || process.env.ENABLE_TEST_USERS === 'true'
    
    // For demo purposes, always check test users first
    if (true) { // Always check test users for demo
      const testUsers = [
        { email: 'admin@weddingshare.com', password: 'admin123', role: 'application_admin', name: 'Application Admin' },
        { email: 'super@venue.com', password: 'super123', role: 'super_admin', name: 'Super Admin' },
        { email: 'couple@wedding.com', password: 'couple123', role: 'admin', name: 'Wedding Admin' },
      ]

      const testUser = testUsers.find(u => u.email === email && u.password === password)
      
      if (testUser) {
        console.log('✅ Development login successful for:', email)
        
        try {
          // Create or update user in database
          const userData = await createOrUpdateUser({
            email: testUser.email,
            name: testUser.name,
            role: testUser.role
          })

          const user = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
          }

          // Set session cookie
          const response = NextResponse.json({
            success: true,
            message: 'Login successful',
            user
          })

          // Set a session cookie for development
          response.cookies.set('session-token', JSON.stringify(user), {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
          })

          return response
        } catch (dbError) {
          console.error('Database error:', dbError)
          // For development, still allow login even if database fails
          const user = {
            id: 'dev-' + Date.now(),
            email: testUser.email,
            name: testUser.name,
            role: testUser.role,
          }

          const response = NextResponse.json({
            success: true,
            message: 'Login successful (development mode)',
            user
          })

          // Set a session cookie for development
          response.cookies.set('session-token', JSON.stringify(user), {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
          })

          return response
        }
      }

      // No test user found, proceed to Supabase Auth
      console.log('🔍 No test user found, proceeding to Supabase Auth...')
    }

    // For production or non-test users, use proper Supabase auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('❌ Login error:', error)
        return NextResponse.json(
          { success: false, message: error instanceof Error ? error.message : 'Login failed' },
          { status: 401 }
        )
      }

      if (data.user) {
        console.log('✅ Supabase Auth login successful for:', email)
        console.log('🔍 Supabase Auth user data:', {
          id: data.user.id,
          email: data.user.email,
          email_confirmed_at: data.user.email_confirmed_at
        })
        
        // Get user details from our users table using admin client to bypass RLS
        let { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', data.user.email)
          .single()

        console.log('🔍 Users table query result:', { userData, userError })
        console.log('🔍 Query details:', {
          searchedEmail: data.user.email,
          originalEmail: email,
          areEmailsEqual: data.user.email === email
        })

        // If first query fails, try with original email
        if (userError && userError.code === 'PGRST116') {
          console.log('🔄 First query failed, trying with original email:', email)
          
          const { data: userData2, error: userError2 } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single()
            
          console.log('🔍 Second query result:', { userData2, userError2 })
          
          if (userData2 && !userError2) {
            userData = userData2
            userError = null
            console.log('✅ Found user with original email!')
          }
        }

        if (userError || !userData) {
          console.error('❌ User not found in users table:', userError)
          return NextResponse.json(
            { success: false, message: 'User not found in system' },
            { status: 401 }
          )
        }

        console.log('✅ User found in users table:', userData)

        // Check if email is confirmed
        if (userData.email_confirmed === false) {
          console.log('❌ Email not confirmed for user:', userData.email)
          return NextResponse.json(
            { 
              success: false, 
              message: 'Email not confirmed',
              requiresConfirmation: true,
              email: userData.email
            },
            { status: 403 }
          )
        }

        const user = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
        }

        const response = NextResponse.json({
          success: true,
          message: 'Login successful',
          user
        })

        // Set session cookie
        response.cookies.set('session-token', JSON.stringify(user), {
          httpOnly: true,
          secure: process.env.NODE_ENV !== 'development',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        })

        return response
      }

      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    } catch (supabaseError) {
      console.error('❌ Supabase connection error:', supabaseError)
      return NextResponse.json(
        { success: false, message: 'Authentication service unavailable' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
