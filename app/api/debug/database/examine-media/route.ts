import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Examine Media API: Getting existing media record to see actual columns...')
    
    // Get an existing media record to see what columns actually exist
    const { data: mediaRecords, error: selectError } = await supabaseAdmin
      .from('media')
      .select('*')
      .limit(1)
    
    if (selectError) {
      console.error('❌ Error selecting from media table:', selectError)
      return NextResponse.json({
        success: false,
        message: 'Failed to select from media table',
        error: selectError.message
      }, { status: 500 })
    }
    
    if (!mediaRecords || mediaRecords.length === 0) {
      console.log('⚠️ No media records found')
      return NextResponse.json({
        success: true,
        message: 'No media records found to examine',
        actualColumns: [],
        recordCount: 0
      })
    }
    
    const sampleRecord = mediaRecords[0]
    const actualColumns = Object.keys(sampleRecord)
    
    console.log('✅ Found media record with columns:', actualColumns)
    console.log('📋 Sample record:', sampleRecord)
    
    // Now try to insert a record with only the columns that actually exist
    console.log('🧪 Testing insert with actual existing columns...')
    const testWeddingId = '0841b34a-d327-4f87-8a42-b07050468ded'
    const testUserId = 'test-user-123'
    
    // Create insert data with only the columns that exist (excluding id and timestamps)
    const insertData: any = {}
    for (const column of actualColumns) {
      if (column === 'id' || column === 'created_at' || column === 'updated_at') {
        continue // Skip auto-generated columns
      }
      
      if (column === 'wedding_id') {
        insertData[column] = testWeddingId
      } else if (column === 'uploaded_by') {
        insertData[column] = testUserId
      } else if (column === 'url') {
        insertData[column] = 'https://test.com/examine-test.jpg'
      } else if (column === 'type') {
        insertData[column] = 'image'
      } else if (column === 'filename') {
        insertData[column] = 'examine-test.jpg'
      } else if (column === 'size') {
        insertData[column] = 1024
      } else if (column === 'mime_type') {
        insertData[column] = 'image/jpeg'
      } else if (column === 'is_approved') {
        insertData[column] = true
      } else if (column === 'approved_by') {
        insertData[column] = testUserId
      } else if (column === 'approved_at') {
        insertData[column] = new Date().toISOString()
      } else if (column === 'tags') {
        insertData[column] = ['test']
      } else if (column === 'event_id') {
        insertData[column] = null
      } else if (column === 'thumbnail_url') {
        insertData[column] = null
      } else {
        // For unknown columns, try to use a reasonable default
        insertData[column] = null
      }
    }
    
    console.log('🧪 Insert data prepared:', insertData)
    
    let insertResult = 'Not attempted'
    try {
      const { data: insertedRecord, error: insertError } = await supabaseAdmin
        .from('media')
        .insert(insertData)
        .select()
        .single()
      
      if (insertError) {
        insertResult = `Failed: ${insertError.message}`
        console.log('❌ Insert failed:', insertError.message)
      } else {
        insertResult = `Success: ${insertedRecord.id}`
        console.log('✅ Insert succeeded:', insertedRecord.id)
        // Clean up
        await supabaseAdmin.from('media').delete().eq('id', insertedRecord.id)
      }
    } catch (e) {
      insertResult = `Exception: ${e}`
      console.log('❌ Insert exception:', e)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Media table examination completed',
      actualColumns: actualColumns,
      recordCount: mediaRecords.length,
      sampleRecord: sampleRecord,
      insertTest: {
        result: insertResult,
        insertData: insertData
      }
    })
    
  } catch (error) {
    console.error('❌ Examine Media API Error:', error)
    return NextResponse.json({
      success: false,
      message: 'Media table examination failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
