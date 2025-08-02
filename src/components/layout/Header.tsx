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
      <header className="mt-3 sm:mt-5">
        <div className="container mx-auto px-3 sm:px-4 max-w-5xl">
          <div className="h-14 sm:h-16 lg:h-20 rounded-[15px] sm:rounded-[20px]">
            <div className="flex items-center justify-between h-full px-3 sm:px-4">
              <div className="flex items-center flex-shrink-0">
                <Image
                  src="/Nobananasformelogo.svg"
                  alt="No Bananas For Me"
                  width={400}
                  height={200}
                  className="h-[60px] sm:h-12 lg:h-16 w-auto"
                  priority
                  quality={100}
                  unoptimized
                />
              </div>
              
              {user ? (
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                  <span className="text-xs sm:text-sm text-gray-700 hidden md:block">
                    Welcome, {getUserDisplayName()}
                  </span>
                  <button
                    onClick={handleReset}
                    disabled={isResetting}
                    className="px-2 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl active:translate-y-0 bg-[#FFFCF5] hover:bg-gray-50 border border-[#696969] shadow-sm hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <span className="font-semibold text-[10px] sm:text-sm text-black">
                      {isResetting ? 'Resetting...' : 'Reset Data'}
                    </span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="px-2 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl active:translate-y-0 bg-[#FFFCF5] hover:bg-gray-50 border border-[#696969] shadow-sm hover:shadow-lg"
                  >
                    <span className="font-semibold text-[10px] sm:text-sm text-black">
                      Sign Out
                    </span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={openSignIn}
                    className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] sm:text-xs px-3 py-2 sm:px-4 sm:py-2 rounded"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={openSignUp}
                    className="btn bg-blue-600 hover:bg-blue-700 text-white text-[10px] sm:text-xs px-3 py-2 sm:px-4 sm:py-2 rounded"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {showAuth && <Auth onClose={() => setShowAuth(false)} initialMode={authMode} />}
    </>
  )
}