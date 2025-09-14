import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Media Table Test API: Testing different column combinations...')
    
    const testWeddingId = '0841b34a-d327-4f87-8a42-b07050468ded'
    const testUserId = 'test-user-123'
    
    // Test 1: Try to insert with all columns (including approved_at and approved_by)
    console.log('🧪 Test 1: Insert with all columns including approved_at and approved_by...')
    let test1Result = 'Not attempted'
    try {
      const { data: test1, error: error1 } = await supabaseAdmin
        .from('media')
        .insert({
          wedding_id: testWeddingId,
          uploaded_by: testUserId,
          type: 'image',
          url: 'https://test.com/image.jpg',
          filename: 'test-image.jpg',
          size: 1024,
          mime_type: 'image/jpeg',
          is_approved: true,
          approved_by: testUserId,
          approved_at: new Date().toISOString(),
          tags: ['test']
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
    
    // Test 2: Try to insert without approved_at and approved_by
    console.log('🧪 Test 2: Insert without approved_at and approved_by...')
    let test2Result = 'Not attempted'
    try {
      const { data: test2, error: error2 } = await supabaseAdmin
        .from('media')
        .insert({
          wedding_id: testWeddingId,
          uploaded_by: testUserId,
          type: 'image',
          url: 'https://test.com/image2.jpg',
          filename: 'test-image2.jpg',
          size: 1024,
          mime_type: 'image/jpeg',
          is_approved: true,
          tags: ['test']
        })
        .select()
        .single()
      
      if (error2) {
        test2Result = `Failed: ${error2.message}`
        console.log('❌ Test 2 failed:', error2.message)
      } else {
        test2Result = `Success: ${test2.id}`
        console.log('✅ Test 2 succeeded:', test2.id)
        // Clean up
        await supabaseAdmin.from('media').delete().eq('id', test2.id)
      }
    } catch (e) {
      test2Result = `Exception: ${e}`
      console.log('❌ Test 2 exception:', e)
    }
    
    // Test 3: Try to insert with minimal columns
    console.log('🧪 Test 3: Insert with minimal required columns...')
    let test3Result = 'Not attempted'
    try {
      const { data: test3, error: error3 } = await supabaseAdmin
        .from('media')
        .insert({
          wedding_id: testWeddingId,
          uploaded_by: testUserId,
          type: 'image',
          url: 'https://test.com/image3.jpg',
          filename: 'test-image3.jpg',
          size: 1024,
          mime_type: 'image/jpeg'
        })
        .select()
        .single()
      
      if (error3) {
        test3Result = `Failed: ${error3.message}`
        console.log('❌ Test 3 failed:', error3.message)
      } else {
        test3Result = `Success: ${test3.id}`
        console.log('✅ Test 3 succeeded:', test3.id)
        // Clean up
        await supabaseAdmin.from('media').delete().eq('id', test3.id)
      }
    } catch (e) {
      test3Result = `Exception: ${e}`
      console.log('❌ Test 3 exception:', e)
    }
    
    // Test 4: Try to select from media table to see what columns exist
    console.log('🧪 Test 4: Select from media table...')
    try {
      const { data: test4, error: error4 } = await supabaseAdmin
        .from('media')
        .select('*')
        .limit(1)
      
      if (error4) {
        console.log('❌ Test 4 failed:', error4.message)
      } else {
        console.log('✅ Test 4 succeeded, sample record:', test4)
      }
    } catch (e) {
      console.log('❌ Test 4 exception:', e)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Media table tests completed',
      testResults: {
        test1: test1Result,
        test2: test2Result,
        test3: test3Result,
        test4: 'Select from media table - see logs'
      },
      tests: {
        test1: 'Insert with all columns including approved_at and approved_by',
        test2: 'Insert without approved_at and approved_by',
        test3: 'Insert with minimal required columns',
        test4: 'Select from media table'
      }
    })
    
  } catch (error) {
    console.error('❌ Media Table Test API Error:', error)
    return NextResponse.json({
      success: false,
      message: 'Media table test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
