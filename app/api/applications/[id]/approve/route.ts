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

// POST /api/applications/[id]/approve - Approve or reject a super admin application
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const body = await request.json()
    const { status, payment_verified, trial_end_date } = body

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Status must be either "approved" or "rejected"' },
        { status: 400 }
      )
    }

    // Get the application
    const { data: application, error: fetchError } = await supabase
      .from('super_admin_applications')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !application) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      )
    }

    if (application.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Application has already been processed' },
        { status: 400 }
      )
    }

    // Update the application
    const updateData: any = {
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id
    }

    if (status === 'approved') {
      updateData.payment_verified = payment_verified || false
      if (trial_end_date) {
        updateData.trial_end_date = trial_end_date
      }
    }

    const { data: updatedApplication, error: updateError } = await supabase
      .from('super_admin_applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating application:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update application' },
        { status: 500 }
      )
    }

    // If approved, create a user account for the super admin
    if (status === 'approved') {
      try {
        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', application.email)
          .single()

        if (!existingUser) {
          // Create new user account
          const { error: userError } = await supabase
            .from('users')
            .insert({
              email: application.email,
              name: application.contact_person,
              role: 'super_admin',
              is_active: true
            })

          if (userError) {
            console.error('Error creating user:', userError)
            // Don't fail the approval, just log the error
          }
        } else {
          // Update existing user to super_admin role
          const { error: userError } = await supabase
            .from('users')
            .update({
              role: 'super_admin',
              is_active: true
            })
            .eq('id', existingUser.id)

          if (userError) {
            console.error('Error updating user:', userError)
          }
        }
      } catch (userError) {
        console.error('Error handling user creation:', userError)
        // Don't fail the approval, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      application: updatedApplication
    })
  } catch (error) {
    console.error('Error in POST /api/applications/[id]/approve:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
