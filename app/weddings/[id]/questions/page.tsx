'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { useParams, useRouter } from 'next/navigation'
import { Heart, MessageSquare, Send, ArrowLeft, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface Question {
  id: string
  text: string
  type: 'text' | 'multiple_choice' | 'rating'
  options?: string[]
  required: boolean
}

interface Answer {
  id: string
  questionId: string
  answer: string
  answeredBy: string
  answeredAt: string
}

interface Wedding {
  id: string
  name: string
  date: string
  location: string
  description: string
}

export default function WeddingQuestions() {
  const { user, loading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const weddingId = params.id as string
  
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  useEffect(() => {
    if (weddingId) {
      fetchWeddingData()
    }
  }, [weddingId])

  const fetchWeddingData = async () => {
    try {
      // In a real app, this would fetch from your API
      // For now, using mock data
      const mockWedding: Wedding = {
        id: weddingId,
        name: "Sarah & Michael's Wedding",
        date: "June 15, 2024",
        location: "Central Park, New York",
        description: "A beautiful celebration of love in the heart of the city"
      }
      
      const mockQuestions: Question[] = [
        {
          id: '1',
          text: 'What was your favorite moment from our wedding day?',
          type: 'text',
          required: true
        },
        {
          id: '2',
          text: 'How would you rate the overall experience?',
          type: 'rating',
          required: true
        },
        {
          id: '3',
          text: 'Which part of the celebration did you enjoy most?',
          type: 'multiple_choice',
          options: ['Ceremony', 'Reception', 'Dancing', 'Food & Drinks', 'Photography'],
          required: false
        },
        {
          id: '4',
          text: 'Do you have any suggestions for future events?',
          type: 'text',
          required: false
        }
      ]
      
      setWedding(mockWedding)
      setQuestions(mockQuestions)
    } catch (error) {
      console.error('Failed to fetch wedding data:', error)
      toast.error('Failed to load wedding questions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if all required questions are answered
    const requiredQuestions = questions.filter(q => q.required)
    const unansweredRequired = requiredQuestions.filter(q => !answers[q.id])
    
    if (unansweredRequired.length > 0) {
      toast.error('Please answer all required questions')
      return
    }

    setIsSubmitting(true)
    try {
      // In a real app, this would submit to your API
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      toast.success('Thank you for your responses!')
      setHasSubmitted(true)
    } catch (error) {
      toast.error('Failed to submit responses. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please sign in to view this wedding questionnaire.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading questions...</p>
        </div>
      </div>
    )
  }

  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Wedding Not Found</h1>
          <p className="text-gray-600">The wedding you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  if (hasSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        {/* Success Message */}
        <div className="max-w-2xl mx-auto py-20 px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Thank You!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your responses have been submitted successfully. We appreciate you taking the time to share your thoughts about {wedding.name}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/weddings/${weddingId}`}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Wedding Gallery</span>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-2 border-2 border-pink-500 text-pink-600 px-6 py-3 rounded-xl hover:bg-pink-50 transition-all duration-200 font-medium"
            >
              <span>Go to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Wedding Info */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-10 h-10 text-pink-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Wedding Questionnaire
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Help {wedding.name} by sharing your thoughts and memories
          </p>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 inline-block">
            <div className="text-sm text-gray-500 mb-2">Wedding Details</div>
            <div className="text-lg font-semibold text-gray-900">{wedding.name}</div>
            <div className="text-gray-600">{wedding.date} • {wedding.location}</div>
          </div>
        </div>

        {/* Questions Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {questions.map((question, index) => (
              <div key={question.id} className="border-b border-gray-100 pb-8 last:border-b-0">
                <div className="mb-4">
                  <label className="block text-lg font-semibold text-gray-900 mb-2">
                    {index + 1}. {question.text}
                    {question.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  {question.type === 'text' && (
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                      rows={4}
                      placeholder="Share your thoughts..."
                      required={question.required}
                    />
                  )}
                  
                  {question.type === 'rating' && (
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => handleAnswerChange(question.id, rating.toString())}
                          className={`w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                            answers[question.id] === rating.toString()
                              ? 'border-pink-500 bg-pink-500 text-white'
                              : 'border-gray-300 text-gray-400 hover:border-pink-300 hover:text-pink-400'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {question.type === 'multiple_choice' && question.options && (
                    <div className="space-y-3">
                      {question.options.map((option) => (
                        <label key={option} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name={question.id}
                            value={option}
                            checked={answers[question.id] === option}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                          />
                          <span className="text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Submit Responses</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Your responses help the couple remember their special day and improve future celebrations.
          </p>
        </div>
      </div>
    </div>
  )
}
