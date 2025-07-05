'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Auth } from '../auth/Auth'

export function Header() {
  const { user, getUserDisplayName, signOut } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  const handleSignOut = async () => {
    await signOut()
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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              No Bananas For Me
            </h1>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {getUserDisplayName()}
                </span>
                <button
                  onClick={handleSignOut}
                  className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-1 border border-gray-300"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={openSignIn}
                  className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded border border-gray-300"
                >
                  Sign In
                </button>
                <button
                  onClick={openSignUp}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded"
                >
                  Sign Up
                </button>
              </div>
            )}
        </div>
      </div>
    </header>
    
    {showAuth && <Auth onClose={() => setShowAuth(false)} initialMode={authMode} />}
    </>
  )
}