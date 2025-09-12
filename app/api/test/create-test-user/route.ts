import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, name, role } = await request.json()
    
    if (!email || !name || !role) {
      return NextResponse.json(
        { success: false, message: 'Email, name, and role are required' },
        { status: 400 }
      )
    }

    console.log('🔧 Testing user creation with:', { email, name, role })
    
    // Try to create user in our database
    const { data: user, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        name,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Database insert error:', createError)
      return NextResponse.json({
        success: false,
        message: 'Failed to create user',
        error: createError
      }, { status: 500 })
    }

    console.log('✅ User created successfully:', user)
    
    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      user
    })
    
  } catch (error) {
    console.error('❌ Exception:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: (error as Error).message },
      { status: 500 }
    )
  }
}

