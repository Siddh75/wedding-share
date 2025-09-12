import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to get user from session
async function getUserFromSession(request: NextRequest) {
  try {
    const cookieStore = await import('next/headers').then(m => m.cookies())
    const sessionToken = cookieStore.get('session-token')
    
    if (!sessionToken) {
      return null
    }
    
    const user = JSON.parse(sessionToken.value)
    return user
  } catch (error) {
    console.error('Error parsing session:', error)
    return null
  }
}

// GET /api/applications - Get all super admin applications
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    if (user.role !== 'application_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('super_admin_applications')
      .select(`
        *,
        reviewed_by_user:users!super_admin_applications_reviewed_by_fkey(name, email)
      `)
      .order('submitted_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: applications, error } = await query

    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      applications: applications || []
    })
  } catch (error) {
    console.error('Error in GET /api/applications:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/applications - Submit a new super admin application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { business_name, business_type, contact_person, email, phone, website, description } = body

    // Validate required fields
    if (!business_name || !business_type || !contact_person || !email) {
      return NextResponse.json(
        { success: false, message: 'Business name, type, contact person, and email are required' },
        { status: 400 }
      )
    }

    // Check if application already exists for this email
    const { data: existingApplication } = await supabase
      .from('super_admin_applications')
      .select('id')
      .eq('email', email)
      .single()

    if (existingApplication) {
      return NextResponse.json(
        { success: false, message: 'An application already exists for this email' },
        { status: 409 }
      )
    }

    const { data: application, error } = await supabase
      .from('super_admin_applications')
      .insert({
        business_name,
        business_type,
        contact_person,
        email,
        phone,
        website,
        description,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating application:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to submit application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      application
    })
  } catch (error) {
    console.error('Error in POST /api/applications:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
