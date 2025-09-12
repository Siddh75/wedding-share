import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'weddings', 'super_admin_applications'])

    // Check if users exist
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .limit(5)

    // Check if weddings exist
    const { data: weddings, error: weddingsError } = await supabase
      .from('weddings')
      .select('id, name, code')
      .limit(5)

    return NextResponse.json({
      success: true,
      database: {
        tables: tables || [],
        users: users || [],
        weddings: weddings || [],
        errors: {
          tables: tablesError?.message,
          users: usersError?.message,
          weddings: weddingsError?.message
        }
      }
    })
  } catch (error) {
    console.error('Database diagnostic error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
}




