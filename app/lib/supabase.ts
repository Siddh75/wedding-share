import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper function to get user from session
export async function getUserFromSession() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session-token')
    
    if (!sessionToken) {
      return null
    }

    // In production, this would verify a JWT token
    // For now, we'll use a simple approach with Supabase auth
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Get user details from our users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single()

    if (userError || !userData) {
      return null
    }

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      isActive: userData.is_active
    }
  } catch (error) {
    console.error('Error getting user from session:', error)
    return null
  }
}

// Helper function to create or update user
export async function createOrUpdateUser(userData: {
  email: string
  name: string
  role: string
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert({
        email: userData.email,
        name: userData.name,
        role: userData.role,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating/updating user:', error)
    throw error
  }
}

// Database table names
export const TABLES = {
  USERS: 'users',
  SUPER_ADMIN_APPLICATIONS: 'super_admin_applications',
  WEDDINGS: 'weddings',
  WEDDING_MEMBERS: 'wedding_members',
  MEDIA: 'media',
  EVENTS: 'events',
  QUESTIONS: 'questions',
  ANSWERS: 'answers',
  INVITE_LINKS: 'invite_links',
  NOTIFICATIONS: 'notifications'
} as const

// RLS policies and functions
export const POLICIES = {
  // Users can only see their own profile
  USERS_SELECT: 'users_select_policy',
  USERS_UPDATE: 'users_update_policy',
  
  // Wedding members can see wedding details
  WEDDINGS_SELECT: 'weddings_select_policy',
  WEDDINGS_INSERT: 'weddings_insert_policy',
  WEDDINGS_UPDATE: 'weddings_update_policy',
  WEDDINGS_DELETE: 'weddings_delete_policy',
  
  // Media access based on wedding membership
  MEDIA_SELECT: 'media_select_policy',
  MEDIA_INSERT: 'media_insert_policy',
  MEDIA_UPDATE: 'media_update_policy',
  MEDIA_DELETE: 'media_delete_policy',
  
  // Events access based on wedding membership
  EVENTS_SELECT: 'events_select_policy',
  EVENTS_INSERT: 'events_insert_policy',
  EVENTS_UPDATE: 'events_update_policy',
  EVENTS_DELETE: 'events_delete_policy'
} as const

