/**
 * Advanced Image Loading Optimization Service
 * Provides format optimization, connection management, and progressive loading
 */

import { ShowWithGenres, getPosterUrl } from './shows'

// Connection management
let activeConnections = 0
const MAX_CONNECTIONS = 12 // Increased from 6 to allow more concurrent image loads
const connectionQueue: Array<() => void> = []

// Format optimization
interface ImageFormats {
  webp: string
  avif: string
  original: string
}

// Network detection
interface NetworkInfo {
  effectiveType: string
  downlink: number
  saveData: boolean
}

// Cache for optimized URLs and preloaded images
const formatCache = new Map<string, ImageFormats>()
const preloadCache = new Map<string, Promise<string>>()
const loadedImages = new Set<string>()

/**
 * Get network information for adaptive loading
 */
function getNetworkInfo(): NetworkInfo {
  // Type assertion to access experimental API
  const navigator = (window as any).navigator
  
  if (navigator.connection) {
    return {
      effectiveType: navigator.connection.effectiveType || '4g',
      downlink: navigator.connection.downlink || 10,
      saveData: navigator.connection.saveData || false
    }
  }
  
  // Default to good connection if not available
  return {
    effectiveType: '4g',
    downlink: 10,
    saveData: false
  }
}

/**
 * Generate optimized image URLs for different formats
 */
function generateOptimizedUrls(originalUrl: string): ImageFormats {
  if (formatCache.has(originalUrl)) {
    return formatCache.get(originalUrl)!
  }

  // For TMDB images, we can add format and size parameters
  const formats: ImageFormats = {
    webp: originalUrl,
    avif: originalUrl,
    original: originalUrl
  }

  // If it's a TMDB URL, we can optimize it
  if (originalUrl.includes('image.tmdb.org')) {
    const baseUrl = originalUrl.replace(/\/w\d+\//, '/w300/')
    formats.webp = `${baseUrl}?format=webp&quality=80`
    formats.avif = `${baseUrl}?format=avif&quality=75`
    formats.original = baseUrl
  }

  formatCache.set(originalUrl, formats)
  return formats
}

/**
 * Get the best image format based on browser support and network
 */
function getBestImageUrl(formats: ImageFormats, networkInfo: NetworkInfo): string {
  // If user has save-data enabled or slow connection, use original
  if (networkInfo.saveData || networkInfo.effectiveType === 'slow-2g') {
    return formats.original
  }

  // Check browser support for modern formats
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d')

  // Test AVIF support (best compression)
  if (ctx && canvas.toDataURL('image/avif').startsWith('data:image/avif')) {
    return formats.avif
  }

  // Test WebP support (good compression)
  if (ctx && canvas.toDataURL('image/webp').startsWith('data:image/webp')) {
    return formats.webp
  }

  // Fallback to original
  return formats.original
}

/**
 * Manage connection queue to prevent browser connection limit issues
 */
function executeWithConnectionLimit<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const execute = () => {
      activeConnections++
      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          activeConnections--
          // Process next item in queue
          if (connectionQueue.length > 0) {
            const next = connectionQueue.shift()
            if (next) next()
          }
        })
    }

    if (activeConnections < MAX_CONNECTIONS) {
      execute()
    } else {
      connectionQueue.push(execute)
    }
  })
}

/**
 * Preload a single image with format optimization and connection management
 */
function preloadOptimizedImage(url: string, priority: 'high' | 'low' = 'low'): Promise<string> {
  // Return cached promise if already preloading/preloaded
  if (preloadCache.has(url)) {
    return preloadCache.get(url)!
  }

  const promise = executeWithConnectionLimit(async () => {
    const networkInfo = getNetworkInfo()
    const formats = generateOptimizedUrls(url)
    const optimizedUrl = getBestImageUrl(formats, networkInfo)

    return new Promise<string>((resolve, reject) => {
      const img = new Image()
      
      // Set fetch priority based on importance
      if ('fetchPriority' in img) {
        (img as any).fetchPriority = priority
      }

      // Enable crossorigin for better caching
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        loadedImages.add(url)
        loadedImages.add(optimizedUrl)
        console.log(`📸 [ImageOptimizer] Successfully preloaded (${formats.webp !== formats.original ? 'optimized' : 'original'}):`, url)
        resolve(optimizedUrl)
      }
      
      img.onerror = (error) => {
        console.warn('📸 [ImageOptimizer] Failed to preload:', url, error)
        // Try fallback to original format
        if (optimizedUrl !== formats.original) {
          const fallbackImg = new Image()
          fallbackImg.crossOrigin = 'anonymous'
          fallbackImg.onload = () => {
            loadedImages.add(url)
            loadedImages.add(formats.original)
            resolve(formats.original)
          }
          fallbackImg.onerror = () => resolve(url) // Last resort
          fallbackImg.src = formats.original
        } else {
          resolve(url) // Don't reject, let component handle error
        }
      }
      
      // Start loading the optimized image
      img.src = optimizedUrl
    })
  })

  preloadCache.set(url, promise)
  return promise
}

/**
 * Preload poster images for shows with prioritization
 */
export async function preloadShowImagesOptimized(
  shows: ShowWithGenres[], 
  priority: 'high' | 'low' = 'low'
): Promise<void> {
  if (!shows.length) return

  console.log(`📸 [ImageOptimizer] Starting optimized preload for ${shows.length} show images (priority: ${priority})`)

  const networkInfo = getNetworkInfo()
  
  // Increased concurrent limits for faster loading
  let concurrentLimit = 8
  if (networkInfo.effectiveType === 'slow-2g' || networkInfo.saveData) {
    concurrentLimit = 4
  } else if (networkInfo.effectiveType === '2g') {
    concurrentLimit = 6
  } else if (networkInfo.downlink > 10) {
    concurrentLimit = 12
  }

  const imageUrls = shows
    .map(show => getPosterUrl(show))
    .filter((url): url is string => !!url)

  if (!imageUrls.length) {
    console.log('📸 [ImageOptimizer] No valid poster URLs to preload')
    return
  }

  // Process images in batches to respect connection limits
  const batches: string[][] = []
  for (let i = 0; i < imageUrls.length; i += concurrentLimit) {
    batches.push(imageUrls.slice(i, i + concurrentLimit))
  }

  try {
    for (const batch of batches) {
      const batchPromises = batch.map(url => preloadOptimizedImage(url, priority))
      await Promise.allSettled(batchPromises)
      
      // Reduced delays for faster loading
      if (networkInfo.effectiveType === 'slow-2g' || networkInfo.saveData) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    
    console.log(`📸 [ImageOptimizer] Completed optimized preloading ${imageUrls.length} images`)
  } catch (error) {
    console.error('📸 [ImageOptimizer] Error during batch preload:', error)
  }
}

/**
 * Get the optimized URL for an image
 */
export function getOptimizedImageUrl(originalUrl: string): string {
  if (!originalUrl) return originalUrl

  const networkInfo = getNetworkInfo()
  const formats = generateOptimizedUrls(originalUrl)
  return getBestImageUrl(formats, networkInfo)
}

/**
 * Check if an image has been preloaded and is ready to display
 */
export function isImagePreloaded(url: string): boolean {
  return loadedImages.has(url) || loadedImages.has(getOptimizedImageUrl(url))
}

/**
 * Preload images for the next batch with delay
 */
export function preloadNextBatchImagesOptimized(
  shows: ShowWithGenres[], 
  delay: number = 1000
): void {
  setTimeout(() => {
    preloadShowImagesOptimized(shows, 'low').catch(error => {
      console.error('📸 [ImageOptimizer] Error in delayed preload:', error)
    })
  }, delay)
}

/**
 * Clear all caches for memory management
 */
export function clearImageCaches(): void {
  formatCache.clear()
  preloadCache.clear()
  loadedImages.clear()
  console.log('📸 [ImageOptimizer] All caches cleared')
}

/**
 * Get cache statistics for debugging
 */
export function getOptimizationStats(): {
  formatsCached: number
  preloadCache: number
  loadedImages: number
  activeConnections: number
  queuedConnections: number
} {
  return {
    formatsCached: formatCache.size,
    preloadCache: preloadCache.size,
    loadedImages: loadedImages.size,
    activeConnections,
    queuedConnections: connectionQueue.length
  }
}

/**
 * Generate a blur placeholder data URL for immediate display
 */
export function generateBlurPlaceholder(width: number = 240, height: number = 320): string {
  // Create a tiny canvas for the blur placeholder
  const canvas = document.createElement('canvas')
  canvas.width = 8
  canvas.height = 12
  const ctx = canvas.getContext('2d')
  
  if (ctx) {
    // Create a simple gradient that resembles a poster
    const gradient = ctx.createLinearGradient(0, 0, 0, 12)
    gradient.addColorStop(0, '#f0f0f0')
    gradient.addColorStop(0.5, '#e0e0e0')
    gradient.addColorStop(1, '#d0d0d0')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 8, 12)
    
    // Add some texture
    ctx.fillStyle = '#c0c0c0'
    ctx.fillRect(2, 2, 4, 2)
    ctx.fillRect(1, 6, 6, 1)
    ctx.fillRect(2, 9, 4, 1)
  }
  
  return canvas.toDataURL('image/png')
}