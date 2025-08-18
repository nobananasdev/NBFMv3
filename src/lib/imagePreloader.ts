/**
 * Image Preloading Service (Legacy Interface)
 * Provides utilities for preloading poster images in the background
 * Now powered by the advanced ImageOptimizer for better performance
 */

import { ShowWithGenres } from './shows'
import {
  preloadShowImagesOptimized,
  isImagePreloaded as isOptimizedImagePreloaded,
  preloadNextBatchImagesOptimized,
  clearImageCaches,
  getOptimizationStats
} from './imageOptimizer'

/**
 * Preload poster images for an array of shows
 * Returns a promise that resolves when all images are loaded (or failed)
 */
export async function preloadShowImages(shows: ShowWithGenres[]): Promise<void> {
  return preloadShowImagesOptimized(shows, 'high')
}

/**
 * Check if an image has been preloaded and is ready to display
 */
export function isImagePreloaded(url: string): boolean {
  return isOptimizedImagePreloaded(url)
}

/**
 * Preload images for the next batch of shows (to be used with data preloading)
 */
export function preloadNextBatchImages(shows: ShowWithGenres[], delay: number = 1000): void {
  preloadNextBatchImagesOptimized(shows, delay)
}

/**
 * Clear the preload cache (useful for memory management)
 */
export function clearPreloadCache(): void {
  clearImageCaches()
}

/**
 * Get cache statistics for debugging
 */
export function getPreloadStats(): {
  cacheSize: number
  loadedCount: number
  pendingCount: number
} {
  const stats = getOptimizationStats()
  return {
    cacheSize: stats.preloadCache,
    loadedCount: stats.loadedImages,
    pendingCount: stats.preloadCache - stats.loadedImages
  }
}

// Export additional optimized functions
export {
  preloadShowImagesOptimized,
  getOptimizedImageUrl,
  generateBlurPlaceholder,
  getOptimizationStats
} from './imageOptimizer'