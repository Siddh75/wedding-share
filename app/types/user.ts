export interface User {
  id: string
  name: string
  email: string
  role: 'guest' | 'admin' | 'super_admin' | 'application_admin'
  createdAt: string
  updatedAt: string
  isActive: boolean
  subscription?: {
    planId: string
    planName: string
    status: 'active' | 'trial' | 'expired' | 'cancelled'
    startDate: string
    endDate: string
    trialEndDate?: string
  }
}

export interface SuperAdminApplication {
  id: string
  businessName: string
  businessType: 'venue' | 'photography_studio' | 'event_planner' | 'other'
  contactPerson: string
  email: string
  phone: string
  website?: string
  description: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  paymentVerified: boolean
  trialEndDate?: string
}

export interface SubscriptionPlan {
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
    trialDays?: number
  }
  isActive: boolean
  isPopular: boolean
  createdAt: string
  updatedAt: string
}

export interface Wedding {
  id: string
  name: string
  date: string
  location: string
  description: string
  code: string
  superAdminId: string
  weddingAdminIds: string[]
  status: 'draft' | 'active' | 'completed' | 'archived'
  createdAt: string
  updatedAt: string
  subscriptionPlanId?: string
  features: {
    maxPhotos: number
    maxGuests: number
    customBranding: boolean
    analytics: boolean
  }
}

export interface WeddingInvitation {
  id: string
  weddingId: string
  email: string
  name?: string
  role: 'bride' | 'groom' | 'wedding_admin'
  status: 'pending' | 'accepted' | 'expired'
  signupLink: string
  expiresAt: string
  createdAt: string
}
