import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || 'test@example.com'
    const token = searchParams.get('token') || 'test-token-123'
    
    const { getConfirmationUrl, getBaseUrl } = await import('@/app/lib/url-utils')
    const confirmUrl = getConfirmationUrl(token, email)
    const baseUrl = getBaseUrl()
    
    return NextResponse.json({
      success: true,
      email,
      token,
      confirmUrl,
      decodedEmail: decodeURIComponent(encodeURIComponent(email)),
      testPage: `${baseUrl}/test-confirmation?token=${token}&email=${encodeURIComponent(email)}`
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
