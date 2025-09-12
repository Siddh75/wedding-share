'use client'

import { useState } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Camera, 
  Shield, 
  Zap,
  Calendar,
  DollarSign
} from 'lucide-react'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  duration: 'monthly' | 'yearly' | 'lifetime'
  targetUsers: string[]
  features: {
    maxWeddings: number
    maxPhotos: number
    maxGuests: number
    customBranding: boolean
    prioritySupport: boolean
    analytics: boolean
    apiAccess: boolean
  }
  isActive: boolean
  isPopular: boolean
}

export default function PlansManagement() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)

  // Mock data - in real app this would come from API
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: '1',
      name: 'Free Couple',
      description: 'Perfect for couples planning their wedding',
      price: 0,
      duration: 'lifetime',
      targetUsers: ['couple'],
      features: {
        maxWeddings: 1,
        maxPhotos: 100,
        maxGuests: 50,
        customBranding: false,
        prioritySupport: false,
        analytics: false,
        apiAccess: false
      },
      isActive: true,
      isPopular: false
    },
    {
      id: '2',
      name: 'Premium Couple',
      description: 'Advanced features for the perfect wedding',
      price: 29,
      duration: 'monthly',
      targetUsers: ['couple'],
      features: {
        maxWeddings: 1,
        maxPhotos: 1000,
        maxGuests: 200,
        customBranding: true,
        prioritySupport: true,
        analytics: true,
        apiAccess: false
      },
      isActive: true,
      isPopular: true
    },
    {
      id: '3',
      name: 'Starter Venue',
      description: 'For small venues and photography studios',
      price: 99,
      duration: 'monthly',
      targetUsers: ['venue', 'photography_studio'],
      features: {
        maxWeddings: 5,
        maxPhotos: 5000,
        maxGuests: 1000,
        customBranding: true,
        prioritySupport: true,
        analytics: true,
        apiAccess: false
      },
      isActive: true,
      isPopular: false
    }
  ])

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

  if (!user || user.role !== 'application_admin') {
    router.push('/auth/signin')
    return null
  }

  const handleCreatePlan = () => {
    setShowCreateForm(true)
    setEditingPlan(null)
  }

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan)
    setShowCreateForm(true)
  }

  const handleDeletePlan = (planId: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      setPlans(plans.filter(p => p.id !== planId))
    }
  }

  const getTargetUsersDisplay = (users: string[]) => {
    return users.map(user => {
      switch (user) {
        case 'couple': return 'Couples'
        case 'venue': return 'Venues'
        case 'photography_studio': return 'Photography Studios'
        default: return user
      }
    }).join(', ')
  }

  const getDurationDisplay = (duration: string) => {
    switch (duration) {
      case 'monthly': return '/month'
      case 'yearly': return '/year'
      case 'lifetime': return 'one-time'
      default: return duration
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
              <p className="text-gray-600 mt-2">Create and manage subscription plans for different user types</p>
            </div>
            <button
              onClick={handleCreatePlan}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200 font-medium mt-4 sm:mt-0"
            >
              <Plus className="w-5 h-5" />
              <span>Create Plan</span>
            </button>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl border-2 p-8 ${
                  plan.isPopular
                    ? 'border-pink-500 ring-4 ring-pink-500/20'
                    : 'border-gray-200'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price === 0 ? 'Free' : `$${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-600">{getDurationDisplay(plan.duration)}</span>
                    )}
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getTargetUsersDisplay(plan.targetUsers)}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Max Weddings</span>
                    <span className="font-semibold">{plan.features.maxWeddings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Max Photos</span>
                    <span className="font-semibold">{plan.features.maxPhotos.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Max Guests</span>
                    <span className="font-semibold">{plan.features.maxGuests.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Custom Branding</span>
                    <span className={plan.features.customBranding ? 'text-green-600' : 'text-red-600'}>
                      {plan.features.customBranding ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Priority Support</span>
                    <span className={plan.features.prioritySupport ? 'text-green-600' : 'text-red-600'}>
                      {plan.features.prioritySupport ? '✓' : '✗'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="flex-1 inline-flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="inline-flex items-center justify-center bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Status */}
                <div className="mt-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    plan.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create/Edit Plan Modal would go here */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingPlan ? 'Edit Plan' : 'Create New Plan'}
            </h2>
            {/* Plan creation form would go here */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700">
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
