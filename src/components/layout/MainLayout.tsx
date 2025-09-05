'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useNavigation } from '@/contexts/NavigationContext'
import { FilterProvider } from '@/contexts/FilterContext'
import { Header } from './Header'
import MobileNavigation from './MobileNavigation'
import { Auth } from '../auth/Auth'
import { DiscoverSection } from '../sections/DiscoverSection'
import { WatchlistSection } from '../sections/WatchlistSection'
import { NewSeasonsSection } from '../sections/NewSeasonsSection'
import { RatedSection } from '../sections/RatedSection'
import ScrollToTopButton from '../ui/ScrollToTopButton'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { activeSection } = useNavigation()

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(99,102,241,0.25),transparent),radial-gradient(1000px_500px_at_80%_10%,rgba(139,92,246,0.18),transparent)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_30%),linear-gradient(0deg,rgba(255,255,255,0.03),transparent_30%)]"></div>
        </div>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
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
    <FilterProvider>
      <div className="relative min-h-screen">
        {/* Background gradients */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(99,102,241,0.25),transparent),radial-gradient(1000px_500px_at_80%_10%,rgba(139,92,246,0.18),transparent)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_30%),linear-gradient(0deg,rgba(255,255,255,0.03),transparent_30%)]"></div>
        </div>

        <Header />
        {/* Mobile-only nav */}
        <MobileNavigation />
        {/* Desktop/Tablet nav moved into Header */}

        <main id="main-content" className="container mx-auto px-4 md:px-6 py-6 md:py-8 container-content animate-fade-in">
          {renderSection()}
        </main>
        {/* Global scroll-to-top button */}
        <ScrollToTopButton />
      </div>
    </FilterProvider>
  )
}
