'use client'

import { useEffect, useState, useCallback } from 'react'

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      // Show after scrolling down some distance
      setVisible(window.scrollY > 400)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollUp = useCallback(() => {
    // Prefer scrolling to main content top if present
    const target = document.getElementById('main-content')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      aria-label="Tagasi üles"
      onClick={scrollUp}
      className="fixed z-40 bottom-4 right-4 sm:bottom-6 sm:right-6 rounded-full p-3 sm:p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30 border border-white/10 transition-transform duration-200 active:scale-95"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5 sm:h-6 sm:w-6"
        aria-hidden
      >
        {/* Upward pointing arrow */}
        <path d="M12 4l-5 5h3v7h4V9h3l-5-5z" />
      </svg>
    </button>
  )
}
