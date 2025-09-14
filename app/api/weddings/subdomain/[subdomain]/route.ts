import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    const { subdomain } = params

    if (!subdomain) {
      return NextResponse.json(
        { success: false, message: 'Subdomain is required' },
        { status: 400 }
      )
    }

    // Fetch wedding by subdomain
    const { data: wedding, error } = await supabaseAdmin
      .from('weddings')
      .select(`
        id,
        name,
        date,
        location,
        description,
        subdomain,
        is_active,
        created_at
      `)
      .eq('subdomain', subdomain)
      .eq('is_active', true)
      .single()

    if (error || !wedding) {
      return NextResponse.json(
        { success: false, message: 'Wedding not found' },
        { status: 404 }
      )
    }

    // Get wedding stats
    const { data: guestCount } = await supabaseAdmin
      .from('wedding_members')
      .select('id', { count: 'exact' })
      .eq('wedding_id', wedding.id)
      .eq('is_active', true)

    const { data: photoCount } = await supabaseAdmin
      .from('media')
      .select('id', { count: 'exact' })
      .eq('wedding_id', wedding.id)
      .eq('is_approved', true)

    return NextResponse.json({
      success: true,
      wedding: {
        ...wedding,
        guestCount: guestCount?.length || 0,
        photoCount: photoCount?.length || 0
      }
    })

  } catch (error) {
    console.error('Error fetching wedding by subdomain:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
