'use client'

import { useState } from 'react'
import { SignInForm } from './SignInForm'
import { SignUpForm } from './SignUpForm'

interface AuthProps {
  onClose?: () => void
  initialMode?: 'signin' | 'signup'
}

export function Auth({ onClose, initialMode = 'signin' }: AuthProps = {}) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup')

  const toggleForm = () => {
    setIsSignUp(!isSignUp)
  }

  const handleClose = () => {
    if (onClose) {
      onClose()
    }
  }

  // If onClose is provided, render as modal
  if (onClose) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {isSignUp ? (
            <SignUpForm onToggleForm={toggleForm} />
          ) : (
            <SignInForm onToggleForm={toggleForm} />
          )}
        </div>
      </div>
    )
  }

  // Default full-screen layout
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {isSignUp ? (
        <SignUpForm onToggleForm={toggleForm} />
      ) : (
        <SignInForm onToggleForm={toggleForm} />
      )}
    </div>
  )
}