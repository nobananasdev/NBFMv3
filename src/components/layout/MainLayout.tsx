'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useNavigation } from '@/contexts/NavigationContext'
import { Header } from './Header'
import Navigation from './Navigation'
import { Auth } from '../auth/Auth'
import { DiscoverSection } from '../sections/DiscoverSection'
import { WatchlistSection } from '../sections/WatchlistSection'
import { NewSeasonsSection } from '../sections/NewSeasonsSection'
import { RatedSection } from '../sections/RatedSection'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { activeSection } = useNavigation()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show auth modal state can be controlled by the Auth component itself
  // Allow both authenticated and unauthenticated users to see the app

  const renderSection = () => {
    switch (activeSection) {
      case 'discover':
        return <DiscoverSection />
      case 'watchlist':
        return <WatchlistSection />
      case 'new-seasons':
        return <NewSeasonsSection />
      case 'rated':
        return <RatedSection />
      default:
        return <DiscoverSection />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl">
        {renderSection()}
      </main>
    </div>
  )
}