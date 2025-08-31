import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { name, wedding_code } = await request.json()

    if (!name || !wedding_code) {
      return NextResponse.json(
        { error: 'Name and wedding code are required' },
        { status: 400 }
      )
    }

    // Find the wedding by code
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('*')
      .eq('wedding_code', wedding_code)
      .eq('is_active', true)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json(
        { error: 'Invalid wedding code' },
        { status: 400 }
      )
    }

    // Check if guest user already exists
    let { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', `${name.toLowerCase().replace(/\s+/g, '')}@${wedding_code}.guest`)
      .eq('wedding_id', wedding.id)
      .single()

    let userId: string

    if (!existingUser) {
      // Create new guest user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          name,
          email: `${name.toLowerCase().replace(/\s+/g, '')}@${wedding_code}.guest`,
          role: 'guest',
          wedding_id: wedding.id,
          is_guest: true,
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating user:', createError)
        return NextResponse.json(
          { error: 'Failed to create guest user' },
          { status: 500 }
        )
      }

      userId = newUser.id
    } else {
      userId = existingUser.id
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId,
        weddingId: wedding.id,
        role: 'guest',
        name,
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '24h' }
    )

    return NextResponse.json({
      token,
      user: {
        id: userId,
        name,
        role: 'guest',
        wedding_id: wedding.id,
      },
      wedding: {
        id: wedding.id,
        name: wedding.name,
        subdomain: wedding.subdomain,
      },
    })
  } catch (error) {
    console.error('Guest access error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
