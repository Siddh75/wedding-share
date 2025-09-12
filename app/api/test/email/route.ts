import { NextRequest, NextResponse } from 'next/server'
import { sendWeddingInvitation } from '@/app/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, weddingName, weddingDate, weddingLocation, adminName } = body

    if (!to || !weddingName || !weddingDate || !weddingLocation || !adminName) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
    const loginUrl = `${baseUrl}/auth/signin`
    const signupUrl = `${baseUrl}/auth/signup?wedding=test-wedding-id&name=${encodeURIComponent(weddingName)}&date=${encodeURIComponent(weddingDate)}&location=${encodeURIComponent(weddingLocation)}&email=${encodeURIComponent(to)}`
    const actualRecipient = process.env.RESEND_DEV_EMAIL || to

    await sendWeddingInvitation({
      to,
      weddingName,
      weddingDate,
      weddingLocation,
      adminName,
      loginUrl,
      signupUrl
    })

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${actualRecipient} (intended for ${to})`
    })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send test email' },
      { status: 500 }
    )
  }
}
