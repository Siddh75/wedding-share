import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to get user from session
async function getUserFromSession(request: NextRequest) {
  const sessionToken = request.cookies.get('session-token')?.value
  if (!sessionToken) return null

  try {
    const { data: { user }, error } = await supabase.auth.getUser(sessionToken)
    if (error || !user) return null

    // Get user role from our users table
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    return {
      id: user.id,
      email: user.email,
      role: userData?.role || 'guest'
    }
  } catch (error) {
    console.error('Error getting user from session:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { questionId, answerText } = body

    if (!questionId || !answerText) {
      return NextResponse.json({ 
        success: false, 
        message: 'Question ID and answer text are required' 
      }, { status: 400 })
    }

    // Get question with wedding info
    const { data: question, error: fetchError } = await supabase
      .from('questions')
      .select(`
        *,
        wedding:weddings!questions_wedding_id_fkey(id, super_admin_id, wedding_admin_ids)
      `)
      .eq('id', questionId)
      .single()

    if (fetchError || !question) {
      return NextResponse.json({ 
        success: false, 
        message: 'Question not found' 
      }, { status: 404 })
    }

    // Check if user has access to this wedding
    const hasAccess = user.role === 'super_admin' && question.wedding.super_admin_id === user.id ||
                     user.role === 'admin' && question.wedding.wedding_admin_ids?.includes(user.id) ||
                     user.role === 'guest'

    if (!hasAccess) {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    // Check if user already answered this question
    const { data: existingAnswer } = await supabase
      .from('answers')
      .select('id')
      .eq('question_id', questionId)
      .eq('answered_by', user.id)
      .single()

    if (existingAnswer) {
      return NextResponse.json({ 
        success: false, 
        message: 'You have already answered this question' 
      }, { status: 400 })
    }

    // Create answer
    const { data: answer, error } = await supabase
      .from('answers')
      .insert({
        question_id: questionId,
        answer_text: answerText,
        answered_by: user.id
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      answer: {
        id: answer.id,
        answer_text: answer.answer_text,
        answered_at: answer.created_at
      }
    })

  } catch (error) {
    console.error('Answer creation error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to submit answer' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { answerId, answerText } = body

    if (!answerId || !answerText) {
      return NextResponse.json({ 
        success: false, 
        message: 'Answer ID and answer text are required' 
      }, { status: 400 })
    }

    // Get answer with question and wedding info
    const { data: answer, error: fetchError } = await supabase
      .from('answers')
      .select(`
        *,
        question:questions!answers_question_id_fkey(
          id,
          wedding:weddings!questions_wedding_id_fkey(id, super_admin_id, wedding_admin_ids)
        )
      `)
      .eq('id', answerId)
      .single()

    if (fetchError || !answer) {
      return NextResponse.json({ 
        success: false, 
        message: 'Answer not found' 
      }, { status: 404 })
    }

    // Check if user can modify this answer
    const canModify = user.role === 'super_admin' && answer.question.wedding.super_admin_id === user.id ||
                     user.role === 'admin' && answer.question.wedding.wedding_admin_ids?.includes(user.id) ||
                     answer.answered_by === user.id

    if (!canModify) {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    // Update answer
    const { data: updatedAnswer, error: updateError } = await supabase
      .from('answers')
      .update({
        answer_text: answerText,
        updated_at: new Date().toISOString()
      })
      .eq('id', answerId)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      answer: {
        id: updatedAnswer.id,
        answer_text: updatedAnswer.answer_text,
        updated_at: updatedAnswer.updated_at
      }
    })

  } catch (error) {
    console.error('Answer update error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update answer' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const answerId = searchParams.get('answerId')

    if (!answerId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Answer ID is required' 
      }, { status: 400 })
    }

    // Get answer with question and wedding info
    const { data: answer, error: fetchError } = await supabase
      .from('answers')
      .select(`
        *,
        question:questions!answers_question_id_fkey(
          id,
          wedding:weddings!questions_wedding_id_fkey(id, super_admin_id, wedding_admin_ids)
        )
      `)
      .eq('id', answerId)
      .single()

    if (fetchError || !answer) {
      return NextResponse.json({ 
        success: false, 
        message: 'Answer not found' 
      }, { status: 404 })
    }

    // Check if user can delete this answer
    const canDelete = user.role === 'super_admin' && answer.question.wedding.super_admin_id === user.id ||
                     user.role === 'admin' && answer.question.wedding.wedding_admin_ids?.includes(user.id) ||
                     answer.answered_by === user.id

    if (!canDelete) {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    // Delete answer
    const { error: deleteError } = await supabase
      .from('answers')
      .delete()
      .eq('id', answerId)

    if (deleteError) throw deleteError

    return NextResponse.json({
      success: true,
      message: 'Answer deleted successfully'
    })

  } catch (error) {
    console.error('Answer delete error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to delete answer' 
    }, { status: 500 })
  }
}




