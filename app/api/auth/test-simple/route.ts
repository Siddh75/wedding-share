import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'NextAuth endpoint test',
    status: 'working',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    return NextResponse.json({
      message: 'POST request received',
      body,
      status: 'success',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      message: 'Error processing request',
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}






