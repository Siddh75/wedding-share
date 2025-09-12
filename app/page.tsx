'use client'

import Hero from './components/Hero'
import { Heart, Camera, Users, Shield, Zap, Globe } from 'lucide-react'
import { useAuth } from './components/AuthProvider'

export default function Home() {
  const { user } = useAuth()
  
  const features = [
    {
      icon: Heart,
      title: 'Private & Secure',
      description: 'Your wedding memories are kept private and secure with advanced encryption and access controls.'
    },
    {
      icon: Camera,
      title: 'High-Quality Uploads',
      description: 'Support for high-resolution photos and videos with automatic optimization and compression.'
    },
    {
      icon: Users,
      title: 'Guest Collaboration',
      description: 'Let your guests contribute their own photos and memories to create a complete wedding story.'
    },
    {
      icon: Shield,
      title: 'Moderation Tools',
      description: 'Approve photos before they go live with built-in moderation and approval workflows.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built on modern cloud infrastructure for fast loading and smooth user experience.'
    },
    {
      icon: Globe,
      title: 'Access Anywhere',
      description: 'Access your wedding gallery from any device, anywhere in the world.'
    }
  ]

  const stats = [
    { number: '10K+', label: 'Weddings Created' },
    { number: '1M+', label: 'Photos Shared' },
    { number: '50K+', label: 'Happy Couples' },
    { number: '99.9%', label: 'Uptime' }
  ]

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {user?.role === 'admin' ? 'Everything You Need to Manage Your Wedding' : 'Everything You Need for Your Wedding Gallery'}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {user?.role === 'admin'
                ? 'WeddingShare provides all the tools you need to manage your wedding gallery, organize photos, and coordinate with guests in one beautiful platform.'
                : 'WeddingShare provides all the tools you need to create, organize, and share your wedding memories with friends and family in a beautiful, secure platform.'
              }
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
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-pink-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {user?.role === 'admin' ? 'Trusted by Wedding Professionals' : 'Trusted by Thousands of Couples'}
            </h2>
            <p className="text-xl text-gray-600">
              {user?.role === 'admin'
                ? 'Join the growing community of wedding professionals who trust WeddingShare to manage their events.'
                : 'Join the growing community of couples who trust WeddingShare with their precious memories.'
              }
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-pink-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            {user?.role === 'admin' ? 'Ready to Manage Your Wedding?' : 'Ready to Start Your Wedding Gallery?'}
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            {user?.role === 'admin' 
              ? 'Access your wedding gallery and manage guests in one place.'
              : 'Create your first wedding gallery in minutes and start sharing memories with your loved ones.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center bg-white text-pink-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                {user.role === 'admin' ? 'Go to My Wedding' : 'Go to Dashboard'}
              </a>
            ) : (
              <a
                href="/auth/signup"
                className="inline-flex items-center justify-center bg-white text-pink-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Get Started Free
              </a>
            )}
            <a
              href="/demo"
              className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-pink-600 transition-all duration-200"
            >
              View Demo
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
