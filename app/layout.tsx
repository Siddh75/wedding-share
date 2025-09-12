import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './components/AuthProvider'
import Header from './components/Header'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WeddingShare - Your Digital Wedding Album',
  description: 'Create beautiful, private photo galleries for your wedding. Invite guests to share memories and relive your special day together.',
  keywords: 'wedding, photo sharing, wedding gallery, wedding photos, wedding memories, photo album',
  authors: [{ name: 'WeddingShare Team' }],
  openGraph: {
    title: 'WeddingShare - Your Digital Wedding Album',
    description: 'Create beautiful, private photo galleries for your wedding. Invite guests to share memories and relive your special day together.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WeddingShare - Your Digital Wedding Album',
    description: 'Create beautiful, private photo galleries for your wedding. Invite guests to share memories and relive your special day together.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
