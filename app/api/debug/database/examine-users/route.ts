import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Examine Users API: Getting existing user record to see actual columns...')
    
    // Get an existing user record to see what columns actually exist
    const { data: userRecords, error: selectError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1)
    
    if (selectError) {
      console.error('❌ Error selecting from users table:', selectError)
      return NextResponse.json({
        success: false,
        message: 'Failed to select from users table',
        error: selectError.message
      }, { status: 500 })
    }
    
    if (!userRecords || userRecords.length === 0) {
      console.log('⚠️ No user records found')
      return NextResponse.json({
        success: true,
        message: 'No user records found to examine',
        actualColumns: [],
        recordCount: 0
      })
    }
    
    const sampleRecord = userRecords[0]
    const actualColumns = Object.keys(sampleRecord)
    
    console.log('✅ Found user record with columns:', actualColumns)
    console.log('📋 Sample record:', sampleRecord)
    
    // Now let's also check the weddings table
    console.log('🔍 Examining weddings table...')
    const { data: weddingRecords, error: weddingError } = await supabaseAdmin
      .from('weddings')
      .select('*')
      .limit(1)
    
    let weddingColumns: string[] = []
    let sampleWeddingRecord: any = null
    
    if (!weddingError && weddingRecords && weddingRecords.length > 0) {
      sampleWeddingRecord = weddingRecords[0]
      weddingColumns = Object.keys(sampleWeddingRecord)
      console.log('✅ Found wedding record with columns:', weddingColumns)
      console.log('📋 Sample wedding record:', sampleWeddingRecord)
    } else {
      console.log('⚠️ No wedding records found or error:', weddingError)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Users and weddings table examination completed',
      users: {
        actualColumns: actualColumns,
        recordCount: userRecords.length,
        sampleRecord: sampleRecord
      },
      weddings: {
        actualColumns: weddingColumns,
        recordCount: weddingRecords?.length || 0,
        sampleRecord: sampleWeddingRecord
      }
    })
    
  } catch (error) {
    console.error('❌ Examine Users API Error:', error)
    return NextResponse.json({
      success: false,
      message: 'Users table examination failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
