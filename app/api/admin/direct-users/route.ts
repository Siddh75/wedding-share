import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'
import { cookies } from 'next/headers'

async function getUserFromSession() {
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get('session-token')?.value

    if (!sessionToken) {
      return null
    }

    let user = null

    try {
      // Try to parse as JSON first (for development mode)
      try {
        const userData = JSON.parse(sessionToken)
        console.log('✅ Parsed session token as JSON:', userData)
        user = userData
      } catch (jsonError) {
        console.log('⚠️ Session token is not JSON, trying as Supabase token')
        
        // If not JSON, try as Supabase session token
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.getUser(sessionToken)
        
        if (sessionError || !sessionData.user) {
          console.error('❌ Invalid Supabase session:', sessionError)
          return null
        }

        // Get user details from our users table
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('id, email, name, role')
          .eq('id', sessionData.user.id)
          .single()

        if (userError || !userData) {
          console.error('❌ User not found in database:', userError)
          return null
        }

        user = userData
      }
    } catch (error) {
      console.error('❌ Error in getUserFromSession:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('❌ Error in getUserFromSession:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is application admin
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (user.role !== 'application_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Application admin required.' },
        { status: 403 }
      )
    }

    console.log('🔍 Fetching direct signup users for application admin:', user.email)

    // Get all users who signed up directly (not through invitations)
    // We can identify this by checking if they have any wedding_invitations records
    const { data: allUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        name,
        role,
        email_confirmed,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Get all invitation records to identify invited users
    const { data: invitations, error: invitationsError } = await supabaseAdmin
      .from('wedding_invitations')
      .select('email')

    if (invitationsError) {
      console.error('❌ Error fetching invitations:', invitationsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch invitations' },
        { status: 500 }
      )
    }

    // Create a set of invited emails
    const invitedEmails = new Set(invitations?.map(inv => inv.email) || [])

    // Filter to get only admin role users who signed up directly and are not associated with super admin
    const directAdminUsers = allUsers?.filter(user => {
      // Must be admin role
      if (user.role !== 'admin') {
        return false
      }
      
      // Must not be invited (direct signup)
      if (invitedEmails.has(user.email)) {
        return false
      }
      
      return true
    }) || []

    console.log(`🔍 Filtered users: ${directAdminUsers.length} admin users who signed up directly`)

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      directAdminUsers.map(async (user) => {
        console.log(`🔍 Getting stats for user: ${user.email} (${user.id})`)

        // Count weddings created by this user - try both possible field names
        let weddingCount = 0
        
        // Try super_admin_id first (most likely)
        const { count: superAdminWeddingCount } = await supabaseAdmin
          .from('weddings')
          .select('*', { count: 'exact', head: true })
          .eq('super_admin_id', user.id)

        // Try created_by as fallback
        const { count: createdByWeddingCount } = await supabaseAdmin
          .from('weddings')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id)

        // Also check if user is in wedding_admin_ids array
        const { data: adminWeddings } = await supabaseAdmin
          .from('weddings')
          .select('id')
          .contains('wedding_admin_ids', [user.id])

        weddingCount = (superAdminWeddingCount || 0) + (createdByWeddingCount || 0) + (adminWeddings?.length || 0)

        console.log(`📊 Wedding counts for ${user.email}:`, {
          superAdmin: superAdminWeddingCount || 0,
          createdBy: createdByWeddingCount || 0,
          adminArray: adminWeddings?.length || 0,
          total: weddingCount
        })

        // Count media uploaded by this user
        const { count: mediaCount } = await supabaseAdmin
          .from('media')
          .select('*', { count: 'exact', head: true })
          .eq('uploaded_by', user.id)

        // Calculate storage used (approximate)
        const { data: mediaFiles } = await supabaseAdmin
          .from('media')
          .select('file_size')
          .eq('uploaded_by', user.id)

        const storageUsed = mediaFiles?.reduce((total, file) => total + (file.file_size || 0), 0) || 0

        return {
          ...user,
          wedding_count: weddingCount,
          media_count: mediaCount || 0,
          storage_used: storageUsed,
          storage_used_mb: Math.round((storageUsed / (1024 * 1024)) * 100) / 100
        }
      })
    )

    // Calculate summary statistics
    const summary = {
      total_direct_users: directAdminUsers.length,
      total_weddings: usersWithStats.reduce((sum, user) => sum + user.wedding_count, 0),
      total_media: usersWithStats.reduce((sum, user) => sum + user.media_count, 0),
      total_storage_mb: Math.round((usersWithStats.reduce((sum, user) => sum + user.storage_used, 0) / (1024 * 1024)) * 100) / 100,
      confirmed_users: usersWithStats.filter(user => user.email_confirmed).length,
      unconfirmed_users: usersWithStats.filter(user => !user.email_confirmed).length
    }

    console.log('✅ Fetched direct admin users:', {
      total: directAdminUsers.length,
      summary
    })

    return NextResponse.json({
      success: true,
      users: usersWithStats,
      summary
    })

  } catch (error) {
    console.error('❌ Error in direct users API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
