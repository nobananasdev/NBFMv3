import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { NavigationProvider } from '@/contexts/NavigationContext'
import { MainLayout } from '@/components/layout/MainLayout'
import ErrorBoundary from '@/components/ErrorBoundary'
import { QueryProvider } from '@/components/providers/QueryProvider'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'No Bananas For Me',
  description: 'Track your TV shows and movies without the bananas',
  icons: {
    icon: '/Favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://tluyjrjdwtskuconslaj.supabase.co" />
        <link rel="dns-prefetch" href="//tluyjrjdwtskuconslaj.supabase.co" />
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="dns-prefetch" href="//image.tmdb.org" />
      </head>
      <body>
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <NavigationProvider>
                <MainLayout>
                  {children}
                </MainLayout>
              </NavigationProvider>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
