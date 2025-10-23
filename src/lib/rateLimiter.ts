/**
 * Rate Limiting and Request Optimization Utilities
 * 
 * Provides:
 * - Request debouncing
 * - Request caching with TTL
 * - Request queue management
 * - Rate limiting per endpoint
 */

// ============================================================================
// TYPES
// ============================================================================

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface QueuedRequest<T> {
  key: string
  executor: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: any) => void
  timestamp: number
}

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

// ============================================================================
// REQUEST CACHE
// ============================================================================

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    const now = Date.now()
    const age = now - entry.timestamp

    if (age > entry.ttl) {
      // Cache expired, remove it
      this.cache.delete(key)
      return null
    }

    console.log(`📦 [Cache] HIT for key: ${key} (age: ${Math.round(age / 1000)}s)`)
    return entry.data as T
  }

  /**
   * Set cache entry with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    }
    
    this.cache.set(key, entry)
    console.log(`📦 [Cache] SET for key: ${key} (TTL: ${Math.round(entry.ttl / 1000)}s)`)
  }

  /**
   * Clear specific cache entry
   */
  clear(key: string): void {
    this.cache.delete(key)
    console.log(`📦 [Cache] CLEAR for key: ${key}`)
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear()
    console.log(`📦 [Cache] CLEAR ALL`)
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now()
    let cleared = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        cleared++
      }
    }

    if (cleared > 0) {
      console.log(`📦 [Cache] Cleaned up ${cleared} expired entries`)
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Math.round((Date.now() - entry.timestamp) / 1000),
        ttl: Math.round(entry.ttl / 1000)
      }))
    }
  }
}

// ============================================================================
// RATE LIMITER
// ============================================================================

class RateLimiter {
  private requests = new Map<string, number[]>()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig = { maxRequests: 10, windowMs: 1000 }) {
    this.config = config
  }

  /**
   * Check if request is allowed under rate limit
   */
  isAllowed(key: string): boolean {
    const now = Date.now()
    const windowStart = now - this.config.windowMs
    
    // Get existing requests for this key
    let timestamps = this.requests.get(key) || []
    
    // Filter out old requests outside the window
    timestamps = timestamps.filter(ts => ts > windowStart)
    
    // Check if we're under the limit
    if (timestamps.length >= this.config.maxRequests) {
      console.warn(`⚠️ [RateLimit] BLOCKED for key: ${key} (${timestamps.length}/${this.config.maxRequests} requests)`)
      return false
    }
    
    // Add current request
    timestamps.push(now)
    this.requests.set(key, timestamps)
    
    return true
  }

  /**
   * Get time until next request is allowed (in ms)
   */
  getRetryAfter(key: string): number {
    const timestamps = this.requests.get(key) || []
    if (timestamps.length === 0) return 0
    
    const oldestInWindow = timestamps[0]
    const windowStart = Date.now() - this.config.windowMs
    
    if (oldestInWindow > windowStart) {
      return oldestInWindow + this.config.windowMs - Date.now()
    }
    
    return 0
  }

  /**
   * Clear rate limit for specific key
   */
  clear(key: string): void {
    this.requests.delete(key)
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.requests.clear()
  }
}

// ============================================================================
// REQUEST QUEUE
// ============================================================================

class RequestQueue {
  private queue: QueuedRequest<any>[] = []
  private processing = false
  private concurrentLimit = 3
  private activeRequests = 0

  /**
   * Add request to queue
   */
  async enqueue<T>(key: string, executor: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        key,
        executor,
        resolve,
        reject,
        timestamp: Date.now()
      })

      console.log(`🔄 [Queue] Added request: ${key} (queue size: ${this.queue.length})`)
      
      // Start processing if not already running
      if (!this.processing) {
        this.processQueue()
      }
    })
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return
    
    this.processing = true

    while (this.queue.length > 0 && this.activeRequests < this.concurrentLimit) {
      const request = this.queue.shift()
      if (!request) break

      this.activeRequests++
      
      console.log(`🔄 [Queue] Processing: ${request.key} (active: ${this.activeRequests}, queued: ${this.queue.length})`)

      // Execute request
      request.executor()
        .then(result => {
          request.resolve(result)
          console.log(`✅ [Queue] Completed: ${request.key}`)
        })
        .catch(error => {
          request.reject(error)
          console.error(`❌ [Queue] Failed: ${request.key}`, error)
        })
        .finally(() => {
          this.activeRequests--
          // Continue processing queue
          if (this.queue.length > 0) {
            this.processQueue()
          }
        })
    }

    if (this.queue.length === 0 && this.activeRequests === 0) {
      this.processing = false
      console.log(`🔄 [Queue] All requests processed`)
    }
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      queued: this.queue.length,
      active: this.activeRequests,
      processing: this.processing
    }
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = []
    console.log(`🔄 [Queue] Cleared`)
  }
}

// ============================================================================
// DEBOUNCER
// ============================================================================

/**
 * Create a debounced function that delays execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func(...args)
      timeoutId = null
    }, waitMs)
  }
}

/**
 * Create a debounced async function that returns a promise
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | null = null
  let pendingPromise: Promise<ReturnType<T>> | null = null

  return function debounced(...args: Parameters<T>): Promise<ReturnType<T>> {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    if (!pendingPromise) {
      pendingPromise = new Promise((resolve, reject) => {
        timeoutId = setTimeout(async () => {
          try {
            const result = await func(...args)
            resolve(result)
          } catch (error) {
            reject(error)
          } finally {
            timeoutId = null
            pendingPromise = null
          }
        }, waitMs)
      })
    }

    return pendingPromise
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

export const requestCache = new RequestCache()
export const rateLimiter = new RateLimiter({
  maxRequests: 10, // 10 requests
  windowMs: 1000   // per second
})
export const requestQueue = new RequestQueue()

// Cleanup expired cache entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    requestCache.cleanup()
  }, 5 * 60 * 1000)
}

// ============================================================================
// CACHED REQUEST WRAPPER
// ============================================================================

/**
 * Wrapper for API requests with caching, rate limiting, and queuing
 */
export async function cachedRequest<T>(
  key: string,
  executor: () => Promise<T>,
  options: {
    cacheTTL?: number
    skipCache?: boolean
    skipRateLimit?: boolean
    skipQueue?: boolean
  } = {}
): Promise<T> {
  const {
    cacheTTL = 5 * 60 * 1000, // 5 minutes default
    skipCache = false,
    skipRateLimit = false,
    skipQueue = false
  } = options

  // Check cache first
  if (!skipCache) {
    const cached = requestCache.get<T>(key)
    if (cached !== null) {
      return cached
    }
  }

  // Check rate limit
  if (!skipRateLimit && !rateLimiter.isAllowed(key)) {
    const retryAfter = rateLimiter.getRetryAfter(key)
    throw new Error(`Rate limit exceeded. Retry after ${Math.ceil(retryAfter / 1000)}s`)
  }

  // Execute request (with or without queue)
  const executeRequest = async (): Promise<T> => {
    const result = await executor()
    
    // Cache the result
    if (!skipCache) {
      requestCache.set(key, result, cacheTTL)
    }
    
    return result
  }

  if (skipQueue) {
    return executeRequest()
  } else {
    return requestQueue.enqueue(key, executeRequest)
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate cache key from parameters
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join('|')
  
  return `${prefix}:${sortedParams}`
}

/**
 * Clear all caches and rate limits
 */
export function clearAllOptimizations(): void {
  requestCache.clearAll()
  rateLimiter.clearAll()
  requestQueue.clear()
  console.log('🧹 [Optimization] Cleared all caches, rate limits, and queues')
}

/**
 * Get optimization statistics
 */
export function getOptimizationStats() {
  return {
    cache: requestCache.getStats(),
    queue: requestQueue.getStats()
  }
}