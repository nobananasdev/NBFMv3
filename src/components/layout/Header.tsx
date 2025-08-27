'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { Auth } from '../auth/Auth'

export function Header() {
  const { user, getUserDisplayName, signOut, resetUserData, isResetting } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

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
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="flex items-center justify-between h-20 lg:h-24">
            {/* Logo Section */}
            <div className="flex items-center flex-shrink-0">
              <div className="relative">
                <Image
                  src="/Nobananasformelogo.svg"
                  alt="No Bananas For Me"
                  width={400}
                  height={200}
                  className="h-12 sm:h-14 lg:h-16 w-auto logo-image animate-float"
                  priority
                  quality={100}
                  unoptimized
                />
                {/* Glow effect behind logo */}
                <div className="absolute inset-0 -z-10 blur-xl opacity-30 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
              </div>
            </div>
            
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
                  className="btn-secondary text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
                >
                  <div className="flex items-center gap-2">
                    <svg 
                      className="w-4 h-4 transition-transform group-hover:rotate-180" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="hidden sm:inline">
                      {isResetting ? 'Resetting...' : 'Reset Data'}
                    </span>
                  </div>
                </button>
                
                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="btn-modern text-sm font-semibold group"
                >
                  <div className="flex items-center gap-2">
                    <svg 
                      className="w-4 h-4 transition-transform group-hover:translate-x-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="hidden sm:inline">Sign Out</span>
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Sign In Button */}
                <button
                  onClick={openSignIn}
                  className="btn-secondary text-sm font-semibold group"
                >
                  <div className="flex items-center gap-2">
                    <svg 
                      className="w-4 h-4 transition-transform group-hover:-translate-x-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign In</span>
                  </div>
                </button>
                
                {/* Sign Up Button */}
                <button
                  onClick={openSignUp}
                  className="btn-modern text-sm font-semibold group relative overflow-hidden"
                >
                  <div className="flex items-center gap-2 relative z-10">
                    <svg 
                      className="w-4 h-4 transition-transform group-hover:scale-110" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>Sign Up</span>
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