import React from 'react'

/**
 * Highlights search terms in text with a yellow background
 * @param text - The text to highlight
 * @param searchTerm - The search term to highlight
 * @param className - Optional CSS class for the highlight
 * @returns JSX element with highlighted text
 */
export function highlightText(
  text: string, 
  searchTerm: string, 
  className: string = 'bg-yellow-200 px-1 py-0.5 rounded'
): React.ReactNode {
  if (!searchTerm || !text) {
    return text
  }

  // Escape special regex characters in search term
  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  
  // Create regex with case-insensitive flag
  const regex = new RegExp(`(${escapedSearchTerm})`, 'gi')
  
  // Split text by the search term
  const parts = text.split(regex)
  
  return parts.map((part, index) => {
    // Check if this part matches the search term (case-insensitive)
    if (part.toLowerCase() === searchTerm.toLowerCase()) {
      return (
        <span key={index} className={className}>
          {part}
        </span>
      )
    }
    return part
  })
}

/**
 * Highlights search terms in an array of strings (like cast or creators)
 * @param items - Array of strings to highlight
 * @param searchTerm - The search term to highlight
 * @param separator - Separator between items (default: ', ')
 * @param className - Optional CSS class for the highlight
 * @returns JSX element with highlighted text
 */
export function highlightTextArray(
  items: string[], 
  searchTerm: string, 
  separator: string = ', ',
  className: string = 'bg-yellow-200 px-1 py-0.5 rounded'
): React.ReactNode {
  if (!items || items.length === 0) {
    return ''
  }

  return items.map((item, index) => (
    <React.Fragment key={index}>
      {index > 0 && separator}
      {highlightText(item, searchTerm, className)}
    </React.Fragment>
  ))
}