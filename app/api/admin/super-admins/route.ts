import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get('session-token')?.value

    if (!sessionToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'No session found' 
      }, { status: 401 })
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
          return NextResponse.json({ 
            success: false, 
            message: 'Invalid session' 
          }, { status: 401 })
        }

        // Get user details from our users table
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', sessionData.user.id)
          .single()

        if (userError || !userData) {
          return NextResponse.json({ 
            success: false, 
            message: 'User not found' 
          }, { status: 404 })
        }

        user = userData
      }
    } catch (error) {
      console.error('Error getting user from session:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid session' 
      }, { status: 401 })
    }

    // Check if user is application admin
    if (user.role !== 'application_admin') {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied. Only application admins can view this data.' 
      }, { status: 403 })
    }

    // Get all super admins first
    const { data: superAdmins, error: superAdminsError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, created_at')
      .eq('role', 'super_admin')
      .order('created_at', { ascending: false })

    if (superAdminsError) {
      console.error('Error fetching super admins:', superAdminsError)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch super admin data' 
      }, { status: 500 })
    }

    // Process each super admin to get their statistics
    const processedData = await Promise.all(superAdmins.map(async (admin) => {
      console.log(`🔍 Processing super admin: ${admin.name} (${admin.id})`)
      
      // Get weddings created by this super admin - try both created_by and super_admin_id
      let weddings: any[] = []
      let weddingsError: any = null
      
      // First try with created_by
      const { data: weddingsByCreatedBy, error: createdByError } = await supabaseAdmin
        .from('weddings')
        .select('id, created_at')
        .eq('created_by', admin.id)

      if (createdByError) {
        console.log(`⚠️ created_by query failed for ${admin.id}:`, createdByError)
        
        // Try with super_admin_id
        const { data: weddingsBySuperAdmin, error: superAdminError } = await supabaseAdmin
          .from('weddings')
          .select('id, created_at')
          .eq('super_admin_id', admin.id)
          
        if (superAdminError) {
          console.error(`❌ Both wedding queries failed for admin ${admin.id}:`, superAdminError)
          weddingsError = superAdminError
        } else {
          weddings = weddingsBySuperAdmin || []
          console.log(`✅ Found ${weddings.length} weddings using super_admin_id`)
        }
      } else {
        weddings = weddingsByCreatedBy || []
        console.log(`✅ Found ${weddings.length} weddings using created_by`)
      }

      if (weddingsError) {
        console.error(`Error fetching weddings for admin ${admin.id}:`, weddingsError)
        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          created_at: admin.created_at,
          wedding_count: 0,
          total_storage_mb: 0,
          total_media_count: 0,
          last_activity: admin.created_at
        }
      }

      // Get all media for these weddings
      const weddingIds = weddings.map(w => w.id)
      let allMedia = []
      
      console.log(`📸 Getting media for ${weddingIds.length} weddings:`, weddingIds)
      
      if (weddingIds.length > 0) {
        const { data: media, error: mediaError } = await supabaseAdmin
          .from('media')
          .select('id, file_size, created_at')
          .in('wedding_id', weddingIds)

        if (mediaError) {
          console.error(`❌ Error fetching media for admin ${admin.id}:`, mediaError)
        } else {
          allMedia = media || []
          console.log(`✅ Found ${allMedia.length} media files`)
        }
      }
      
      const totalStorageBytes = allMedia.reduce((sum: number, media: any) => 
        sum + (media.file_size || 0), 0
      )
      
      const totalStorageMB = Math.round(totalStorageBytes / (1024 * 1024) * 100) / 100
      
      const lastActivity = allMedia.length > 0 
        ? new Date(Math.max(...allMedia.map((m: any) => new Date(m.created_at).getTime())))
        : new Date(admin.created_at)

      const result = {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        created_at: admin.created_at,
        wedding_count: weddings.length,
        total_storage_mb: totalStorageMB,
        total_media_count: allMedia.length,
        last_activity: lastActivity.toISOString()
      }
      
      console.log(`📊 Final stats for ${admin.name}:`, {
        weddings: result.wedding_count,
        storage: result.total_storage_mb,
        media: result.total_media_count
      })
      
      return result
    }))

    // Calculate summary statistics
    const summary = {
      total_super_admins: processedData.length,
      total_weddings: processedData.reduce((sum, admin) => sum + admin.wedding_count, 0),
      total_storage_mb: processedData.reduce((sum, admin) => sum + admin.total_storage_mb, 0),
      total_media_files: processedData.reduce((sum, admin) => sum + admin.total_media_count, 0)
    }

    console.log('📈 Summary statistics:', summary)
    console.log('👥 Super admins data:', processedData)

    return NextResponse.json({
      success: true,
      data: {
        super_admins: processedData,
        summary
      }
    })

  } catch (error) {
    console.error('Super admin stats API error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}
