import CreateWeddingForm from '@/app/components/CreateWeddingForm'
import { Heart, Camera, Users, Calendar } from 'lucide-react'

export default function CreateWeddingPage() {
  const benefits = [
    {
      icon: Camera,
      title: 'Easy Photo Sharing',
      description: 'Upload photos and videos with drag-and-drop simplicity'
    },
    {
      icon: Users,
      title: 'Guest Collaboration',
      description: 'Let friends and family contribute their own memories'
    },
    {
      icon: Calendar,
      title: 'Event Organization',
      description: 'Organize photos by wedding events and moments'
    },
    {
      icon: Heart,
      title: 'Private & Secure',
      description: 'Keep your memories safe with secure access controls'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Create Your Wedding Gallery
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Set up a beautiful, private space to share your wedding memories with family and friends. 
            It only takes a few minutes to get started.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <CreateWeddingForm />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Benefits */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Why Choose WeddingShare?
              </h3>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={benefit.title} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-pink-100 to-purple-100 text-pink-600 rounded-lg flex items-center justify-center">
                      <benefit.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{benefit.title}</h4>
                      <p className="text-sm text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-xl font-semibold mb-4">Platform Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-pink-100">Weddings Created</span>
                  <span className="font-semibold">10,000+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-pink-100">Photos Shared</span>
                  <span className="font-semibold">1M+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-pink-100">Happy Couples</span>
                  <span className="font-semibold">50,000+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-pink-100">Uptime</span>
                  <span className="font-semibold">99.9%</span>
                </div>
              </div>
            </div>

            {/* Help & Support */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Need Help?
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  Our team is here to help you create the perfect wedding gallery. 
                  Get in touch if you have any questions.
                </p>
                <div className="pt-3">
                  <a
                    href="/support"
                    className="inline-flex items-center text-pink-600 hover:text-pink-700 font-medium"
                  >
                    Contact Support →
                  </a>
                </div>
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🔒 Security & Privacy
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• End-to-end encryption</li>
                <li>• Private access codes</li>
                <li>• GDPR compliant</li>
                <li>• Regular security audits</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-600 mb-6">
              Create your wedding gallery in just a few minutes and start sharing memories with your loved ones.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/demo"
                className="inline-flex items-center justify-center border-2 border-pink-300 text-pink-600 px-6 py-3 rounded-xl font-medium hover:border-pink-400 hover:bg-pink-50 transition-colors"
              >
                View Demo
              </a>
              <a
                href="/pricing"
                className="inline-flex items-center justify-center bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                View Pricing
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}







