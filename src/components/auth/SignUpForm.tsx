'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface SignUpFormProps {
  onToggleForm: () => void
}

export function SignUpForm({ onToggleForm }: SignUpFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Use email username as display name
    const displayName = email.includes('@') ? email.split('@')[0] : undefined

    try {
      const { error } = await signUp(email, password, displayName)

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Account created successfully! Please check your email to confirm your account before signing in.')
      }
    } catch (unexpectedError) {
      setError('An unexpected error occurred. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div className="glass-card p-8 max-w-md mx-auto">
      <h2 className="text-3xl font-bold text-center mb-6 gradient-text">Sign Up</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="search-input"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="search-input"
            placeholder="Enter your password"
          />
        </div>

        {error && (
          <div className="text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-400 text-sm text-center">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-modern disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-white/60">
          Already have an account?{' '}
          <button
            onClick={onToggleForm}
            className="text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}