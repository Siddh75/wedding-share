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

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const weddingId = searchParams.get('weddingId')
    const includeAnswers = searchParams.get('includeAnswers') === 'true'

    if (!weddingId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Wedding ID is required' 
      }, { status: 400 })
    }

    // Check if user has access to this wedding
    const { data: wedding } = await supabase
      .from('weddings')
      .select('id, super_admin_id, wedding_admin_ids')
      .eq('id', weddingId)
      .single()

    if (!wedding) {
      return NextResponse.json({ 
        success: false, 
        message: 'Wedding not found' 
      }, { status: 404 })
    }

    // Check access permissions
    const hasAccess = user.role === 'super_admin' && wedding.super_admin_id === user.id ||
                     user.role === 'admin' && wedding.wedding_admin_ids?.includes(user.id) ||
                     user.role === 'guest'

    if (!hasAccess) {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    // Get questions for this wedding
    let query = supabase
      .from('questions')
      .select(`
        *,
        created_by_user:users!questions_created_by_fkey(name, email)
        ${includeAnswers ? ', answers:answers(*, answered_by_user:users!answers_answered_by_fkey(name, email))' : ''}
      `)
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false })

    const { data: questions, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      questions: questions.map(question => ({
        id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        is_required: question.is_required,
        options: question.options,
        is_public: question.is_public,
        created_by: question.created_by_user?.name || 'Unknown',
        created_at: question.created_at,
        updated_at: question.updated_at,
        ...(includeAnswers && {
          answers: question.answers?.map(answer => ({
            id: answer.id,
            answer_text: answer.answer_text,
            answered_by: answer.answered_by_user?.name || 'Unknown',
            answered_at: answer.created_at
          })) || []
        })
      }))
    })

  } catch (error) {
    console.error('Questions fetch error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch questions' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      weddingId, 
      questionText, 
      questionType, 
      isRequired = false, 
      options = [], 
      isPublic = false 
    } = body

    if (!weddingId || !questionText || !questionType) {
      return NextResponse.json({ 
        success: false, 
        message: 'Wedding ID, question text, and question type are required' 
      }, { status: 400 })
    }

    // Check if user has access to this wedding
    const { data: wedding } = await supabase
      .from('weddings')
      .select('id, super_admin_id, wedding_admin_ids')
      .eq('id', weddingId)
      .single()

    if (!wedding) {
      return NextResponse.json({ 
        success: false, 
        message: 'Wedding not found' 
      }, { status: 404 })
    }

    // Check access permissions - only super admins and admins can create questions
    const hasAccess = user.role === 'super_admin' && wedding.super_admin_id === user.id ||
                     user.role === 'admin' && wedding.wedding_admin_ids?.includes(user.id)

    if (!hasAccess) {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    // Create question
    const { data: question, error } = await supabase
      .from('questions')
      .insert({
        wedding_id: weddingId,
        question_text: questionText,
        question_type: questionType,
        is_required: isRequired,
        options: questionType === 'multiple_choice' ? options : null,
        is_public: isPublic,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      question: {
        id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        is_required: question.is_required,
        options: question.options,
        is_public: question.is_public,
        created_at: question.created_at
      }
    })

  } catch (error) {
    console.error('Question creation error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create question' 
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
    const { 
      questionId, 
      questionText, 
      questionType, 
      isRequired, 
      options, 
      isPublic 
    } = body

    if (!questionId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Question ID is required' 
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

    // Check if user can modify this question
    const canModify = user.role === 'super_admin' && question.wedding.super_admin_id === user.id ||
                     user.role === 'admin' && question.wedding.wedding_admin_ids?.includes(user.id) ||
                     question.created_by === user.id

    if (!canModify) {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    // Update question
    const updateData: any = {}
    if (questionText !== undefined) updateData.question_text = questionText
    if (questionType !== undefined) updateData.question_type = questionType
    if (isRequired !== undefined) updateData.is_required = isRequired
    if (options !== undefined) updateData.options = questionType === 'multiple_choice' ? options : null
    if (isPublic !== undefined) updateData.is_public = isPublic

    const { data: updatedQuestion, error: updateError } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', questionId)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      question: {
        id: updatedQuestion.id,
        question_text: updatedQuestion.question_text,
        question_type: updatedQuestion.question_type,
        is_required: updatedQuestion.is_required,
        options: updatedQuestion.options,
        is_public: updatedQuestion.is_public,
        updated_at: updatedQuestion.updated_at
      }
    })

  } catch (error) {
    console.error('Question update error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update question' 
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
    const questionId = searchParams.get('questionId')

    if (!questionId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Question ID is required' 
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

    // Check if user can delete this question
    const canDelete = user.role === 'super_admin' && question.wedding.super_admin_id === user.id ||
                     user.role === 'admin' && question.wedding.wedding_admin_ids?.includes(user.id) ||
                     question.created_by === user.id

    if (!canDelete) {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied' 
      }, { status: 403 })
    }

    // Delete question (this will cascade delete answers)
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)

    if (deleteError) throw deleteError

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully'
    })

  } catch (error) {
    console.error('Question delete error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to delete question' 
    }, { status: 500 })
  }
}




