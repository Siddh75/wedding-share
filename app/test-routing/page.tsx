export default function TestRouting() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Routing Test</h1>
        <p className="text-gray-600 mb-4">This page is accessible at /test-routing</p>
        <div className="space-y-2">
          <p><a href="/dashboard" className="text-blue-600 hover:underline">Test Dashboard</a></p>
          <p><a href="/weddings/manage" className="text-blue-600 hover:underline">Test Manage Weddings</a></p>
          <p><a href="/" className="text-blue-600 hover:underline">Test Home</a></p>
        </div>
      </div>
    </div>
  )
}
