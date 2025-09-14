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
    
    // Get account info
    const accountInfo = await cloudinary.api.account()
    console.log('✅ Cloudinary account info:', {
      cloud_name: accountInfo.cloud_name,
      plan: accountInfo.plan,
      credits: accountInfo.credits
    })
    
    return NextResponse.json({
      success: true,
      cloudinary: {
        ping: testResult,
        account: {
          cloud_name: accountInfo.cloud_name,
          plan: accountInfo.plan,
          credits: accountInfo.credits
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
