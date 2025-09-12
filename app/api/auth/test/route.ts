import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET() {
  try {
    const session = await getServerSession()
    
    return NextResponse.json({
      message: 'NextAuth test endpoint',
      session: session ? {
        user: session.user?.email,
        authenticated: true
      } : {
        authenticated: false
      },
      timestamp: new Date().toISOString(),
      env: {
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not Set',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'Set' : 'Not Set',
        NODE_ENV: process.env.NODE_ENV
      }
    })
  } catch (error) {
    return NextResponse.json({
      message: 'NextAuth error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}






