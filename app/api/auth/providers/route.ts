import { NextResponse } from 'next/server'

export async function GET() {
  const providers: Record<string, boolean> = {
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    credentials: true, // Always available
  }

  return NextResponse.json(providers)
}







