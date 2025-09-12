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
    console.log('🔍 Cloudinary Test:')
    console.log('- Cloud name:', process.env.CLOUDINARY_CLOUD_NAME)
    console.log('- API key exists:', !!process.env.CLOUDINARY_API_KEY)
    console.log('- API secret exists:', !!process.env.CLOUDINARY_API_SECRET)

    // Test Cloudinary connection
    const result = await cloudinary.api.ping()
    console.log('- Cloudinary ping result:', result)

    return NextResponse.json({
      success: true,
      message: 'Cloudinary is configured correctly',
      cloudinary: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key_exists: !!process.env.CLOUDINARY_API_KEY,
        api_secret_exists: !!process.env.CLOUDINARY_API_SECRET,
        ping_result: result
      }
    })

  } catch (error) {
    console.error('❌ Cloudinary test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Cloudinary configuration error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}




