import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'
import { validateSubdomain } from '@/app/lib/subdomain-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get('subdomain')
    const exclude = searchParams.get('exclude') // Wedding ID to exclude from uniqueness check

    if (!subdomain) {
      return NextResponse.json(
        { success: false, message: 'Subdomain is required' },
        { status: 400 }
      )
    }

    // Client-side validation
    const validation = validateSubdomain(subdomain)
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      )
    }

    // Check for uniqueness
    let query = supabaseAdmin
      .from('weddings')
      .select('id')
      .eq('subdomain', subdomain)

    // Exclude current wedding if updating
    if (exclude) {
      query = query.neq('id', exclude)
    }

    const { data: existingWedding, error } = await query.single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking subdomain uniqueness:', error)
      return NextResponse.json(
        { success: false, message: 'Error validating subdomain' },
        { status: 500 }
      )
    }

    if (existingWedding) {
      return NextResponse.json(
        { success: false, message: 'This subdomain is already taken' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Subdomain is available'
    })

  } catch (error) {
    console.error('Error validating subdomain:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
