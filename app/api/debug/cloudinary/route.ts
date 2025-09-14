import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Cloudinary configuration...')
    
    // Test Cloudinary API access
    const testResult = await cloudinary.api.ping()
    console.log('✅ Cloudinary ping successful:', testResult)
    
    // Test a simple upload to verify credentials
    const testUpload = await cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', {
      resource_type: 'image',
      public_id: 'test-connection',
      overwrite: true
    })
    console.log('✅ Cloudinary test upload successful:', testUpload.public_id)
    
    // Clean up test upload
    await cloudinary.uploader.destroy('test-connection')
    console.log('✅ Test upload cleaned up')
    
    return NextResponse.json({
      success: true,
      cloudinary: {
        ping: testResult,
        testUpload: {
          public_id: testUpload.public_id,
          secure_url: testUpload.secure_url
        },
        config: {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
          api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
          api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing',
          upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'Not set'
        }
      }
    })
  } catch (error) {
    console.error('❌ Cloudinary test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
