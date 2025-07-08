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
      <header className="mt-5">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="h-16 sm:h-20 lg:h-[91px] rounded-[20px]">
          <div className="flex items-center justify-between h-full px-[10px]">
            <div className="flex items-center">
              <Image
                src="/nobananasformelogo.png"
                alt="No Bananas For Me"
                width={400}
                height={200}
                className="h-16 sm:h-20 lg:h-24 w-auto"
                priority
                quality={100}
                unoptimized
              />
            </div>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-xs sm:text-sm text-gray-700 hidden sm:block">
                  Welcome, {getUserDisplayName()}
                </span>
                <button
                  onClick={handleReset}
                  disabled={isResetting}
                  className="inline-flex px-[20px] py-[5px] justify-center items-center gap-[10px] rounded-[10px] border border-black transition-all duration-300 ease-out transform hover:scale-105 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{
                    backgroundColor: '#FFF'
                  }}
                  onMouseEnter={(e) => {
                    if (!isResetting) {
                      e.currentTarget.style.backgroundColor = '#F8F8F8'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isResetting) {
                      e.currentTarget.style.backgroundColor = '#FFF'
                    }
                  }}
                >
                  <span className="font-bold text-xs leading-[30px] tracking-[0.36px] text-black">
                    {isResetting ? 'Resetting...' : 'Reset Data'}
                  </span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="inline-flex px-[20px] py-[5px] justify-center items-center gap-[10px] rounded-[10px] border border-black transition-all duration-300 ease-out transform hover:scale-105 hover:-translate-y-1 active:scale-95"
                  style={{
                    backgroundColor: '#FFF'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F8F8F8'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFF'
                  }}
                >
                  <span className="font-bold text-xs leading-[30px] tracking-[0.36px] text-black">
                    Sign Out
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={openSignIn}
                  className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 rounded"
                >
                  Sign In
                </button>
                <button
                  onClick={openSignUp}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 rounded"
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