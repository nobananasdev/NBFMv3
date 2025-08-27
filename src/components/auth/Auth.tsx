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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 z-50">
        <div className="glass-card p-6 w-full max-w-md relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            aria-label="Close"
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
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(99,102,241,0.25),transparent),radial-gradient(1000px_500px_at_80%_10%,rgba(139,92,246,0.18),transparent)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_30%),linear-gradient(0deg,rgba(255,255,255,0.03),transparent_30%)]"></div>
      </div>
      <div className="w-full max-w-md">
        {isSignUp ? (
          <SignUpForm onToggleForm={toggleForm} />
        ) : (
          <SignInForm onToggleForm={toggleForm} />
        )}
      </div>
    </div>
  )
}