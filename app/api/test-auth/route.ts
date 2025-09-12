import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET() {
  try {
    const session = await getServerSession()
    
    return NextResponse.json({
      message: 'NextAuth test',
      session: session ? {
        user: session.user?.email,
        authenticated: true
      } : {
        authenticated: false
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      message: 'NextAuth error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}






