import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'
import { validateSubdomain } from '@/app/lib/subdomain-utils'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Subdomain validation API called')
    
    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get('subdomain')
    const exclude = searchParams.get('exclude') // Wedding ID to exclude from uniqueness check

    console.log('🔍 Validation params:', { subdomain, exclude })

    if (!subdomain) {
      console.log('❌ No subdomain provided')
      return NextResponse.json(
        { success: false, message: 'Subdomain is required' },
        { status: 400 }
      )
    }

    // Client-side validation
    console.log('🔍 Validating subdomain format:', subdomain)
    const validation = validateSubdomain(subdomain)
    if (!validation.isValid) {
      console.log('❌ Subdomain validation failed:', validation.error)
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      )
    }

    // Check for uniqueness
    console.log('🔍 Checking subdomain uniqueness in database')
    let query = supabaseAdmin
      .from('weddings')
      .select('id')
      .eq('subdomain', subdomain)

    // Exclude current wedding if updating
    if (exclude) {
      query = query.neq('id', exclude)
    }

    const { data: existingWedding, error } = await query

    console.log('🔍 Database query result:', { existingWedding, error })

    if (error) {
      console.error('❌ Database error checking subdomain uniqueness:', error)
      return NextResponse.json(
        { success: false, message: 'Error validating subdomain' },
        { status: 500 }
      )
    }

    if (existingWedding && existingWedding.length > 0) {
      console.log('❌ Subdomain already taken:', existingWedding)
      return NextResponse.json(
        { success: false, message: 'This subdomain is already taken' },
        { status: 400 }
      )
    }

    console.log('✅ Subdomain is available')
    return NextResponse.json({
      success: true,
      message: 'Subdomain is available'
    })

  } catch (error) {
    console.error('❌ Error validating subdomain:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
