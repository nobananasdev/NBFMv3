import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { NavigationProvider } from '@/contexts/NavigationContext'
import { MainLayout } from '@/components/layout/MainLayout'

export const metadata: Metadata = {
  title: 'No Bananas For Me',
  description: 'Track your TV shows and movies without the bananas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NavigationProvider>
            <MainLayout>
              {children}
            </MainLayout>
          </NavigationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}