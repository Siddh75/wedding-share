import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || 'test@example.com'
    const token = searchParams.get('token') || 'test-token-123'
    
    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/confirm?token=${token}&email=${encodeURIComponent(email)}`
    
    return NextResponse.json({
      success: true,
      email,
      token,
      confirmUrl,
      decodedEmail: decodeURIComponent(encodeURIComponent(email)),
      testPage: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/test-confirmation?token=${token}&email=${encodeURIComponent(email)}`
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
