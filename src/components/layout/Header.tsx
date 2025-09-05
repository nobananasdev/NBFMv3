'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { Auth } from '../auth/Auth'
import { useNavigation, NavigationSection } from '@/contexts/NavigationContext'

export function Header() {
  const { user, getUserDisplayName, signOut, resetUserData, isResetting } = useAuth()
  const { activeSection, setActiveSection, watchlistCount, ratedCount, discoverCount, newSeasonsCount } = useNavigation()
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [hovered, setHovered] = useState<NavigationSection | null>(null)

  const gradients: Record<NavigationSection, string> = {
    'discover': 'linear-gradient(135deg, rgba(99,102,241,0.35) 0%, rgba(139,92,246,0.35) 100%)', // indigo → purple
    'new-seasons': 'linear-gradient(135deg, rgba(16,185,129,0.35) 0%, rgba(5,150,105,0.35) 100%)', // emerald → teal
    'watchlist': 'linear-gradient(135deg, rgba(245,158,11,0.35) 0%, rgba(249,115,22,0.35) 100%)', // amber → orange
    'rated': 'linear-gradient(135deg, rgba(236,72,153,0.35) 0%, rgba(244,63,94,0.35) 100%)', // pink → rose
  }

  const glows: Record<NavigationSection, string> = {
    'discover': '0 0 18px rgba(99,102,241,0.35)',
    'new-seasons': '0 0 18px rgba(16,185,129,0.35)',
    'watchlist': '0 0 20px rgba(245,158,11,0.35)',
    'rated': '0 0 18px rgba(236,72,153,0.35)'
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all your data? This will delete all watchlist and rated shows and cannot be undone.')) {
      console.log('🔄 [UI] Starting reset process...')
      const result = await resetUserData()
      if (result.error) {
        console.error('❌ [UI] Reset failed:', result.error)
        alert('Reset failed. Please check the console for details.')
      } else {
        console.log('✅ [UI] Reset completed successfully')
        alert('Your data has been reset successfully!')
        // Force page reload to ensure all components refresh
        window.location.reload()
      }
    }
  }

  const openSignIn = () => {
    setAuthMode('signin')
    setShowAuth(true)
  }

  const openSignUp = () => {
    setAuthMode('signup')
    setShowAuth(true)
  }

  return (
    <>
      <header className="relative z-50 header-glass animate-fade-in">
        <div className="container mx-auto px-4 sm:px-6 container-content">
          <div className="flex items-center justify-between h-20 lg:h-24 gap-4">
            {/* Logo Section */}
            <div className="flex items-center flex-shrink-0">
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="No Bananas For Me"
                  width={400}
                  height={200}
                  className="h-12 sm:h-14 lg:h-16 w-auto logo-image"
                  priority
                  quality={100}
                  unoptimized
                />
                {/* Glow effect behind logo */}
                <div className="absolute inset-0 -z-10 blur-xl opacity-30 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
              </div>
            </div>

            {/* Simple Nav (desktop/tablet) */}
            <nav className="hidden md:flex items-center gap-2 lg:gap-3 flex-1 justify-center">
              {[
                { id: 'discover', label: 'Discovery', count: discoverCount },
                { id: 'new-seasons', label: 'New Seasons', count: newSeasonsCount },
                { id: 'watchlist', label: 'Watchlist', count: watchlistCount },
                { id: 'rated', label: 'Rated', count: ratedCount },
              ].map((item) => {
                const isActive = activeSection === (item.id as NavigationSection)
                const isHover = hovered === (item.id as NavigationSection)
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as NavigationSection)}
                    onMouseEnter={() => setHovered(item.id as NavigationSection)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(item.id as NavigationSection)}
                    onBlur={() => setHovered(null)}
                    className={`relative overflow-hidden px-3 lg:px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-all duration-300 ease-out hover:-translate-y-0.5 ${
                      isActive || isHover
                        ? 'text-white border-transparent'
                        : 'text-white/75 hover:text-white border-transparent'
                    }`}
                    style={(isActive || isHover) ? { boxShadow: `var(--shadow-lg), ${glows[item.id as NavigationSection]}` } : undefined}
                  >
                    {/* Smooth gradient overlay for active/hover */}
                    <span
                      aria-hidden
                      className={`absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300 ease-out ${
                        isActive || isHover ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{ background: gradients[item.id as NavigationSection] }}
                    />

                    {/* Content */}
                    <span className="relative z-10 flex items-center">
                      <span>{item.label}</span>
                      <span
                        className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-colors ${
                          isActive || isHover ? 'bg-white/20 text-white' : 'bg-white/10 text-white/80'
                        }`}
                        aria-live="polite"
                      >
                        {typeof item.count === 'number' && item.count >= 0 ? new Intl.NumberFormat('en-US').format(item.count) : '0'}
                      </span>
                    </span>
                  </button>
                )
              })}
            </nav>
            
            {/* User Actions */}
            {user ? (
              <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                {/* Welcome Message */}
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium text-white/90">
                    Welcome back
                  </span>
                  <span className="text-xs text-white/60">
                    {getUserDisplayName()}
                  </span>
                </div>
                
                {/* Reset Data Button */}
                <button
                  onClick={handleReset}
                  disabled={isResetting}
                  aria-label={isResetting ? 'Resetting data' : 'Reset data'}
                  title={isResetting ? 'Resetting data' : 'Reset data'}
                  className="btn-secondary text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group px-3 py-2"
                >
                  <div className="flex items-center">
                    <svg 
                      className="w-4 h-4 transition-transform group-hover:rotate-180" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span
                      className="whitespace-nowrap overflow-hidden max-w-0 opacity-0 transition-all duration-300 ml-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-2 group-focus-within:max-w-[140px] group-focus-within:opacity-100 group-focus-within:ml-2"
                    >
                      {isResetting ? 'Resetting...' : 'Reset Data'}
                    </span>
                  </div>
                </button>
                
                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  title="Sign out"
                  className="btn-modern text-sm font-semibold group px-3 py-2"
                >
                  <div className="flex items-center">
                    <svg 
                      className="w-4 h-4 transition-transform group-hover:translate-x-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span
                      className="whitespace-nowrap overflow-hidden max-w-0 opacity-0 transition-all duration-300 ml-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-2 group-focus-within:max-w-[120px] group-focus-within:opacity-100 group-focus-within:ml-2"
                    >
                      Sign Out
                    </span>
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Sign In Button */}
                <button
                  onClick={openSignIn}
                  aria-label="Sign in"
                  title="Sign in"
                  className="btn-secondary text-sm font-semibold group px-3 py-2"
                >
                  <div className="flex items-center">
                    <svg 
                      className="w-4 h-4 transition-transform group-hover:-translate-x-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span
                      className="whitespace-nowrap overflow-hidden max-w-0 opacity-0 transition-all duration-300 ml-0 group-hover:max-w-[110px] group-hover:opacity-100 group-hover:ml-2 group-focus-within:max-w-[110px] group-focus-within:opacity-100 group-focus-within:ml-2"
                    >
                      Sign In
                    </span>
                  </div>
                </button>
                
                {/* Sign Up Button */}
                <button
                  onClick={openSignUp}
                  aria-label="Sign up"
                  title="Sign up"
                  className="btn-modern text-sm font-semibold group relative overflow-hidden px-3 py-2"
                >
                  <div className="flex items-center relative z-10">
                    <svg 
                      className="w-4 h-4 transition-transform group-hover:scale-110" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span
                      className="whitespace-nowrap overflow-hidden max-w-0 opacity-0 transition-all duration-300 ml-0 group-hover:max-w-[110px] group-hover:opacity-100 group-hover:ml-2 group-focus-within:max-w-[110px] group-focus-within:opacity-100 group-focus-within:ml-2"
                    >
                      Sign Up
                    </span>
                  </div>
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Subtle bottom border with gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </header>
      
      {/* Auth Modal */}
      {showAuth && <Auth onClose={() => setShowAuth(false)} initialMode={authMode} />}
    </>
  )
}
