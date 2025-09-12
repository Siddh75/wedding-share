/**
 * Get the base URL for the application
 * Priority: NEXT_PUBLIC_APP_URL > NEXTAUTH_URL > VERCEL_URL > localhost
 */
export function getBaseUrl(): string {
  // Check for explicit app URL first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Check for NextAuth URL
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }
  
  // Check for Vercel URL (automatically set by Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // Fallback to localhost for development
  return 'http://localhost:3000'
}

/**
 * Generate a confirmation URL for email verification
 */
export function getConfirmationUrl(token: string, email: string): string {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/auth/confirm?token=${token}&email=${encodeURIComponent(email)}`
}

/**
 * Generate a join URL for wedding invitations
 */
export function getJoinUrl(weddingId: string, guestId?: string): string {
  const baseUrl = getBaseUrl()
  if (guestId) {
    return `${baseUrl}/join?wedding=${weddingId}&guest=${guestId}`
  }
  return `${baseUrl}/join?wedding=${weddingId}`
}

/**
 * Generate a signin URL
 */
export function getSigninUrl(): string {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/auth/signin`
}

/**
 * Generate a signup URL with wedding parameters
 */
export function getSignupUrl(weddingId: string, name: string, date: string, location: string, email: string): string {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/auth/signup?wedding=${weddingId}&name=${encodeURIComponent(name)}&date=${encodeURIComponent(date)}&location=${encodeURIComponent(location)}&email=${encodeURIComponent(email)}`
}
