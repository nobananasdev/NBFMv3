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
    <div className="card p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your password"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md border border-green-200">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full btn bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            onClick={onToggleForm}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}