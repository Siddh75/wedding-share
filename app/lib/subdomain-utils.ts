/**
 * Utility functions for subdomain management
 */

export function generateSubdomain(weddingName: string): string {
  // Clean the name: remove special characters, convert to lowercase, replace spaces with hyphens
  const cleanName = weddingName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  
  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `${cleanName}-${randomSuffix}`
}

export function validateSubdomain(subdomain: string): { isValid: boolean; error?: string } {
  // Check length
  if (subdomain.length < 3) {
    return { isValid: false, error: 'Subdomain must be at least 3 characters long' }
  }
  
  if (subdomain.length > 50) {
    return { isValid: false, error: 'Subdomain must be no more than 50 characters long' }
  }
  
  // Check format (only lowercase letters, numbers, and hyphens)
  const subdomainRegex = /^[a-z0-9-]+$/
  if (!subdomainRegex.test(subdomain)) {
    return { isValid: false, error: 'Subdomain can only contain lowercase letters, numbers, and hyphens' }
  }
  
  // Check it doesn't start or end with hyphen
  if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
    return { isValid: false, error: 'Subdomain cannot start or end with a hyphen' }
  }
  
  // Check for reserved subdomains
  const reservedSubdomains = [
    'www', 'app', 'api', 'admin', 'mail', 'ftp', 'blog', 'shop', 'store',
    'support', 'help', 'docs', 'status', 'dev', 'test', 'staging', 'prod',
    'cdn', 'static', 'assets', 'images', 'files', 'download', 'upload'
  ]
  
  if (reservedSubdomains.includes(subdomain)) {
    return { isValid: false, error: 'This subdomain is reserved and cannot be used' }
  }
  
  return { isValid: true }
}

export function getSubdomainFromHostname(hostname: string): string | null {
  // Handle localhost development
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const parts = hostname.split('.')
    if (parts.length > 1 && parts[0] !== 'www') {
      return parts[0]
    }
    return null
  }

  // Handle production domains
  const parts = hostname.split('.')
  if (parts.length >= 3) {
    return parts[0]
  }
  
  return null
}

export function getWeddingUrl(subdomain: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://weddingshare.com'
  return `https://${subdomain}.${base.replace(/^https?:\/\//, '')}`
}
