import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { supabase } from '@/app/lib/supabase'
import { generateWeddingCode } from '@/app/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const weddingId = params.id
    const body = await request.json()
    const { emails, role = 'guest', message, maxUses, expiresAt } = body

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'Emails are required' }, { status: 400 })
    }

    // Get user ID from email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify user is an admin of the wedding
    const { data: member, error: memberError } = await supabase
      .from('wedding_members')
      .select('id, role')
      .eq('wedding_id', weddingId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (memberError || !member || !['admin', 'super_admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const results = []
    const errors = []

    for (const email of emails) {
      try {
        // Check if user already exists
        let { data: user, error: userError } = await supabase
          .from('users')
          .select('id, name')
          .eq('email', email)
          .single()

        if (userError && userError.code !== 'PGRST116') {
          // PGRST116 is "not found" error
          errors.push({ email, error: 'Failed to check user' })
          continue
        }

        if (!user) {
          // Create new user
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              email,
              name: email.split('@')[0], // Use email prefix as name
              role: 'guest'
            })
            .select('id, name')
            .single()

          if (createError) {
            errors.push({ email, error: 'Failed to create user' })
            continue
          }
          user = newUser
        }

        // Check if user is already a member
        const { data: existingMember } = await supabase
          .from('wedding_members')
          .select('id')
          .eq('wedding_id', weddingId)
          .eq('user_id', user.id)
          .single()

        if (existingMember) {
          results.push({ email, status: 'already_member', userId: user.id })
          continue
        }

        // Add user as wedding member
        const { error: memberError } = await supabase
          .from('wedding_members')
          .insert({
            wedding_id: weddingId,
            user_id: user.id,
            role,
            invited_at: new Date().toISOString()
          })

        if (memberError) {
          errors.push({ email, error: 'Failed to add member' })
          continue
        }

        // Generate invite link
        const inviteCode = generateWeddingCode()
        const { error: inviteError } = await supabase
          .from('invite_links')
          .insert({
            wedding_id: weddingId,
            code: inviteCode,
            max_uses: maxUses || null,
            expires_at: expiresAt || null
          })

        if (inviteError) {
          errors.push({ email, error: 'Failed to create invite link' })
          continue
        }

        // Create notification for the invited user
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            wedding_id: weddingId,
            title: 'Wedding Invitation',
            message: `You've been invited to join a wedding celebration!`,
            type: 'info'
          })

        if (notificationError) {
          console.error('Failed to create notification:', notificationError)
        }

        results.push({ 
          email, 
          status: 'invited', 
          userId: user.id, 
          inviteCode,
          inviteLink: `${process.env.NEXTAUTH_URL}/join/${inviteCode}`
        })

      } catch (error) {
        console.error(`Error processing invitation for ${email}:`, error)
        errors.push({ email, error: 'Invitation failed' })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        errors
      },
      message: `Successfully processed ${results.length} invitations`
    })

  } catch (error) {
    console.error('Error in POST /api/weddings/[id]/invite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const weddingId = params.id

    // Verify user is a member of the wedding
    const { data: member, error: memberError } = await supabase
      .from('wedding_members')
      .select('id, role')
      .eq('wedding_id', weddingId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get wedding members
    const { data: members, error: membersError } = await supabase
      .from('wedding_members')
      .select(`
        *,
        user:users(id, name, email, image)
      `)
      .eq('wedding_id', weddingId)
      .eq('is_active', true)
      .order('invited_at', { ascending: false })

    if (membersError) {
      console.error('Error fetching members:', membersError)
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
    }

    // Get invite links
    const { data: inviteLinks, error: linksError } = await supabase
      .from('invite_links')
      .select('*')
      .eq('wedding_id', weddingId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (linksError) {
      console.error('Error fetching invite links:', linksError)
      return NextResponse.json({ error: 'Failed to fetch invite links' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        members,
        inviteLinks
      }
    })

  } catch (error) {
    console.error('Error in GET /api/weddings/[id]/invite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

