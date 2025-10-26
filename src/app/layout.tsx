import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { NavigationProvider } from '@/contexts/NavigationContext'
import { MainLayout } from '@/components/layout/MainLayout'
import ErrorBoundary from '@/components/ErrorBoundary'
// import { QueryProvider } from '@/components/providers/QueryProvider' // Not used - disabled for performance

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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-2NN8T08NC3"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-2NN8T08NC3');
            `
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress MetaMask and Web3 wallet errors
              (function() {
                try {
                  // Override console.error to filter out wallet-related errors
                  const originalError = console.error;
                  console.error = function(...args) {
                    const msg = String(args[0] || '');
                    // Suppress MetaMask and wallet connection errors
                    if (msg.includes('MetaMask') ||
                        msg.includes('Failed to connect') ||
                        msg.includes('ethereum') ||
                        msg.includes('web3')) {
                      return; // Silently ignore these errors
                    }
                    originalError.apply(console, args);
                  };
                } catch(e) {
                  // If error suppression fails, continue normally
                }
              })();
            `
          }}
        />
        <link rel="preconnect" href="https://tluyjrjdwtskuconslaj.supabase.co" />
        <link rel="dns-prefetch" href="//tluyjrjdwtskuconslaj.supabase.co" />
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="dns-prefetch" href="//image.tmdb.org" />
      </head>
      <body suppressHydrationWarning>
        <ErrorBoundary>
          <AuthProvider>
            <NavigationProvider>
              <MainLayout>
                {children}
              </MainLayout>
            </NavigationProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
