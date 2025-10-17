'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { Auth } from '../auth/Auth'
import { useNavigation, NavigationSection } from '@/contexts/NavigationContext'

export function Header() {
  const { user, getUserDisplayName, signOut, resetUserData, isResetting } = useAuth()
  const { activeSection, setActiveSection } = useNavigation()
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [hovered, setHovered] = useState<NavigationSection | null>(null)
  const [showSignOut, setShowSignOut] = useState(false)

  const navItems: Array<{ id: NavigationSection; label: string }> = [
    { id: 'discover', label: 'Discover' },
    { id: 'new-seasons', label: 'New Seasons' },
    { id: 'watchlist', label: 'Watchlist' },
    { id: 'rated', label: 'Rated' },
  ]

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
          <div className="flex items-center justify-between h-20 lg:h-24 gap-6">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="relative">
                <Image
                  src="/logo.svg"
                  alt="No Bananas For Me logo"
                  width={150}
                  height={84}
                  className="h-12 sm:h-[3.75rem] lg:h-[4.25rem] w-auto"
                  priority
                />
                <span className="pointer-events-none absolute inset-0 -z-10 translate-y-2 scale-110 rounded-full bg-[radial-gradient(circle,rgba(245,180,0,0.55)_0%,rgba(245,180,0,0)_70%)] blur-lg opacity-80" />
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6 lg:gap-10">
              {navItems.map((item) => {
                const isActive = activeSection === item.id
                const isHover = hovered === item.id
                                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    onMouseEnter={() => setHovered(item.id)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(item.id)}
                    onBlur={() => setHovered(null)}
                    className={`relative px-2 lg:px-3 py-2 text-[0.68rem] tracking-[0.35em] uppercase font-semibold transition-colors duration-200 ${
                      isActive || isHover ? 'text-[var(--accent-primary)]' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{item.label}</span>
                      
                    </span>
                    {(isActive || isHover) && (
                      <span className="absolute -bottom-3 left-1/2 h-1 w-9 -translate-x-1/2 rounded-full bg-[var(--accent-primary)] shadow-[0_0_18px_rgba(245,180,0,0.6)]"></span>
                    )}
                  </button>
                )
              })}
            </nav>
            
            {/* User Actions */}
            {user ? (
              <div className="flex items-center gap-4 flex-shrink-0">
                <button
                  type="button"
                  onMouseEnter={() => setShowSignOut(true)}
                  onMouseLeave={() => setShowSignOut(false)}
                  onFocus={() => setShowSignOut(true)}
                  onBlur={() => setShowSignOut(false)}
                  onClick={() => {
                    if (showSignOut) {
                      void handleSignOut()
                    }
                  }}
                  className={`hidden md:flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors duration-200 ${
                    showSignOut
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-black shadow-[0_0_10px_rgba(245,180,0,0.45)]'
                      : 'border-white/10 bg-white/5 text-white'
                  }`}
                >
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.35em]">
                    {showSignOut ? 'Sign Out' : getUserDisplayName()}
                  </span>
                  
                </button>

                <button
                  onClick={handleReset}
                  disabled={isResetting}
                  aria-label={isResetting ? 'Resetting data' : 'Reset data'}
                  title={isResetting ? 'Resetting data' : 'Reset data'}
                  className="hidden lg:inline-flex items-center text-[0.62rem] tracking-[0.32em] uppercase font-semibold text-white/50 hover:text-white transition-colors disabled:opacity-50 disabled:hover:text-white/50"
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="md:hidden text-[0.56rem] tracking-[0.32em] uppercase font-semibold text-white/70 hover:text-[var(--accent-primary)] transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 flex-shrink-0">
                <button
                  onClick={openSignIn}
                  className="text-[0.7rem] tracking-[0.34em] uppercase font-semibold text-white/70 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <span className="hidden sm:block text-white/30">/</span>
                <button
                  onClick={openSignUp}
                  className="text-[0.7rem] tracking-[0.34em] uppercase font-semibold text-[var(--accent-primary)] hover:text-white transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Auth Modal */}
      {showAuth && <Auth onClose={() => setShowAuth(false)} initialMode={authMode} />}
    </>
  )
}
