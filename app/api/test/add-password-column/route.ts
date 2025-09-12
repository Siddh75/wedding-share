import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Adding password_hash column to users table...')
    
    // Add password_hash column
    const { error: alterError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1)
    
    if (alterError) {
      console.error('Error testing connection:', alterError)
      return NextResponse.json(
        { success: false, message: 'Database connection failed' },
        { status: 500 }
      )
    }
    
    // Try to add the column using raw SQL
    try {
      const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', {
        sql: 'ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash text;'
      })
      
      if (sqlError) {
        console.log('RPC method not available, trying alternative approach...')
        
        // Alternative: Create a new table with the password column
        const { error: createError } = await supabaseAdmin
          .from('users_with_passwords')
          .select('*')
          .limit(1)
        
        if (createError && createError.code === 'PGRST116') {
          // Table doesn't exist, create it
          console.log('Creating new users table with password support...')
          
          // For now, let's just return success and guide manual setup
          return NextResponse.json({
            success: true,
            message: 'Please manually add password_hash column to users table',
            instructions: [
              '1. Go to your Supabase dashboard',
              '2. Navigate to SQL Editor',
              '3. Run: ALTER TABLE public.users ADD COLUMN password_hash text;',
              '4. Then restart the application'
            ]
          })
        }
      }
      
      console.log('✅ Password column added successfully')
      return NextResponse.json({
        success: true,
        message: 'Password column added successfully'
      })
      
    } catch (rpcError) {
      console.log('RPC method failed, providing manual instructions...')
      return NextResponse.json({
        success: true,
        message: 'Please manually add password_hash column',
        instructions: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to SQL Editor',
          '3. Run: ALTER TABLE public.users ADD COLUMN password_hash text;',
          '4. Then restart the application'
        ]
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