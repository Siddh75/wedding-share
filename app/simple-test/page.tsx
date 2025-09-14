export default function SimpleTest() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">✅ Routing Test Successful!</h1>
        <p className="text-gray-600 mb-6">This page is accessible at /simple-test</p>
        <div className="space-y-3">
          <p className="text-sm text-gray-500">If you can see this page, basic routing is working.</p>
          <div className="flex flex-col space-y-2">
            <a href="/" className="text-blue-600 hover:underline">← Go to Home</a>
            <a href="/dashboard" className="text-blue-600 hover:underline">→ Test Dashboard</a>
            <a href="/weddings/manage" className="text-blue-600 hover:underline">→ Test Manage Weddings</a>
          </div>
        </div>
      </div>
    </div>
  )
}
