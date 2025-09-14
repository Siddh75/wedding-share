import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Basic Media Test API: Testing minimal column combinations...')
    
    const testWeddingId = '0841b34a-d327-4f87-8a42-b07050468ded'
    const testUserId = 'test-user-123'
    
    // Test 1: Try with just the most basic columns
    console.log('🧪 Test 1: Insert with only id, wedding_id, uploaded_by, type, url...')
    let test1Result = 'Not attempted'
    try {
      const { data: test1, error: error1 } = await supabaseAdmin
        .from('media')
        .insert({
          wedding_id: testWeddingId,
          uploaded_by: testUserId,
          type: 'image',
          url: 'https://test.com/image.jpg'
        })
        .select()
        .single()
      
      if (error1) {
        test1Result = `Failed: ${error1.message}`
        console.log('❌ Test 1 failed:', error1.message)
      } else {
        test1Result = `Success: ${test1.id}`
        console.log('✅ Test 1 succeeded:', test1.id)
        // Clean up
        await supabaseAdmin.from('media').delete().eq('id', test1.id)
      }
    } catch (e) {
      test1Result = `Exception: ${e}`
      console.log('❌ Test 1 exception:', e)
    }
    
    // Test 2: Try to select from media table to see what columns exist
    console.log('🧪 Test 2: Select from media table to see existing columns...')
    let test2Result = 'Not attempted'
    try {
      const { data: test2, error: error2 } = await supabaseAdmin
        .from('media')
        .select('*')
        .limit(1)
      
      if (error2) {
        test2Result = `Failed: ${error2.message}`
        console.log('❌ Test 2 failed:', error2.message)
      } else {
        test2Result = `Success: Found ${test2?.length || 0} records`
        console.log('✅ Test 2 succeeded, sample record:', test2)
        if (test2 && test2.length > 0) {
          console.log('📋 Available columns:', Object.keys(test2[0]))
        }
      }
    } catch (e) {
      test2Result = `Exception: ${e}`
      console.log('❌ Test 2 exception:', e)
    }
    
    // Test 3: Try to get table schema information
    console.log('🧪 Test 3: Try to get table schema...')
    let test3Result = 'Not attempted'
    try {
      // Try to query information_schema to get column information
      const { data: test3, error: error3 } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'media')
        .eq('table_schema', 'public')
      
      if (error3) {
        test3Result = `Failed: ${error3.message}`
        console.log('❌ Test 3 failed:', error3.message)
      } else {
        test3Result = `Success: Found ${test3?.length || 0} columns`
        console.log('✅ Test 3 succeeded, columns:', test3)
      }
    } catch (e) {
      test3Result = `Exception: ${e}`
      console.log('❌ Test 3 exception:', e)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Basic media table tests completed',
      testResults: {
        test1: test1Result,
        test2: test2Result,
        test3: test3Result
      },
      tests: {
        test1: 'Insert with only basic columns (id, wedding_id, uploaded_by, type, url)',
        test2: 'Select from media table to see existing columns',
        test3: 'Query information_schema to get column information'
      }
    })
    
  } catch (error) {
    console.error('❌ Basic Media Test API Error:', error)
    return NextResponse.json({
      success: false,
      message: 'Basic media table test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
