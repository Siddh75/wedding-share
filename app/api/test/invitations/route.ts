import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    const email = searchParams.get('email')

    // Check if table exists
    const { data: tableExists, error: tableError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'wedding_invitations')
      .single()

    console.log('🔍 Table check:', { tableExists, tableError })

    if (!tableExists) {
      return NextResponse.json({
        success: false,
        message: 'wedding_invitations table does not exist',
        suggestion: 'Run the add_wedding_invitations_table.sql script in Supabase'
      })
    }

    // Get all invitations
    const { data: allInvitations, error: allError } = await supabaseAdmin
      .from('wedding_invitations')
      .select('*')

    console.log('🔍 All invitations:', { allInvitations, allError })

    // If specific weddingId provided, get invitations for that wedding
    let weddingInvitations = null
    if (weddingId) {
      const { data: weddingInv, error: weddingError } = await supabaseAdmin
        .from('wedding_invitations')
        .select('*')
        .eq('wedding_id', weddingId)

      weddingInvitations = { data: weddingInv, error: weddingError }
      console.log('🔍 Wedding invitations:', weddingInvitations)
    }

    // If specific email provided, get invitations for that email
    let emailInvitations = null
    if (email) {
      const { data: emailInv, error: emailError } = await supabaseAdmin
        .from('wedding_invitations')
        .select('*')
        .eq('email', email)

      emailInvitations = { data: emailInv, error: emailError }
      console.log('🔍 Email invitations:', emailInvitations)
    }

    return NextResponse.json({
      success: true,
      tableExists: true,
      allInvitations: allInvitations || [],
      weddingInvitations: weddingInvitations?.data || [],
      emailInvitations: emailInvitations?.data || [],
      errors: {
        all: allError,
        wedding: weddingInvitations?.error,
        email: emailInvitations?.error
      }
    })
  } catch (error) {
    console.error('Error in invitation diagnostics:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


