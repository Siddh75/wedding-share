'use client'

import { Heart, Check, Star, Zap, Shield, Users, Camera, Globe } from 'lucide-react'
import Link from 'next/link'

export default function PricingPage() {
  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'Perfect for small weddings and getting started',
      features: [
        'Up to 100 photos',
        'Basic gallery features',
        'Guest uploads',
        'Email support',
        'Basic templates'
      ],
      cta: 'Get Started Free',
      href: '/auth/signup',
      popular: false
    },
    {
      name: 'Premium',
      price: '$29',
      period: '/month',
      description: 'Ideal for most weddings with advanced features',
      features: [
        'Unlimited photos & videos',
        'Advanced gallery customization',
        'Guest management tools',
        'Priority support',
        'Premium templates',
        'Analytics dashboard',
        'Custom branding'
      ],
      cta: 'Start Premium Trial',
      href: '/auth/signup',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For wedding planners and large-scale events',
      features: [
        'Everything in Premium',
        'Multiple wedding management',
        'Advanced analytics',
        'API access',
        'Dedicated support',
        'Custom integrations',
        'White-label options'
      ],
      cta: 'Contact Sales',
      href: '/contact',
      popular: false
    }
  ]

  const features = [
    {
      icon: Camera,
      title: 'High-Quality Uploads',
      description: 'Support for high-resolution photos and videos with automatic optimization.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Advanced encryption and access controls to keep your memories safe.'
    },
    {
      icon: Users,
      title: 'Guest Collaboration',
      description: 'Let your guests contribute their own photos and memories.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built on modern cloud infrastructure for fast loading and smooth experience.'
    },
    {
      icon: Globe,
      title: 'Access Anywhere',
      description: 'Access your wedding gallery from any device, anywhere in the world.'
    },
    {
      icon: Heart,
      title: 'Beautiful Design',
      description: 'Stunning templates and layouts that showcase your memories beautifully.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose the perfect plan for your wedding. Start free and upgrade anytime.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <Check className="w-5 h-5 text-green-500" />
            <span>No hidden fees</span>
            <Check className="w-5 h-5 text-green-500" />
            <span>Cancel anytime</span>
            <Check className="w-5 h-5 text-green-500" />
            <span>14-day free trial</span>
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl shadow-xl border-2 p-8 ${
                  plan.popular 
                    ? 'border-pink-500 ring-4 ring-pink-500/20' 
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period && (
                      <span className="text-gray-600">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block w-full text-center py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 transform hover:scale-105'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Your Wedding
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              WeddingShare provides all the tools you need to create, organize, and share your wedding memories 
              with friends and family in a beautiful, secure platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-6 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-gray-200"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pink-100 to-purple-100 text-pink-600 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-200">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-pink-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Start Your Wedding Gallery?
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            Join thousands of couples who trust WeddingShare with their precious memories.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center bg-white text-pink-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Get Started Free
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-pink-600 transition-all duration-200"
            >
              View Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
