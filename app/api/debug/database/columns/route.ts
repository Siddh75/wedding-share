import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Database Columns API: Checking media table structure...')
    
    // Query to get column information for the media table
    const { data: columns, error } = await supabaseAdmin
      .rpc('get_table_columns', { table_name: 'media' })
    
    if (error) {
      console.error('❌ Error getting columns:', error)
      
      // Fallback: try a simple query to see what happens
      const { data: testData, error: testError } = await supabaseAdmin
        .from('media')
        .select('*')
        .limit(1)
      
      return NextResponse.json({
        success: false,
        message: 'Failed to get column information',
        error: error.message,
        fallback: {
          testQuery: testError ? testError.message : 'Test query succeeded',
          testData: testData
        }
      }, { status: 500 })
    }
    
    console.log('✅ Columns retrieved:', columns)
    
    return NextResponse.json({
      success: true,
      message: 'Media table columns retrieved',
      columns: columns,
      columnCount: columns?.length || 0
    })
    
  } catch (error) {
    console.error('❌ Database Columns API Error:', error)
    return NextResponse.json({
      success: false,
      message: 'Database columns check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
