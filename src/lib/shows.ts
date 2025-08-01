import { supabase } from '@/lib/supabase'
import { Show, ShowStatus, Profile, STREAMING_PROVIDER_IDS } from '@/types/database'

export interface ShowWithGenres extends Show {
  genre_names?: string[]
  user_status?: ShowStatus
}

export type SortOption = 'latest' | 'rating' | 'recently_added' | 'best_rated' | 'by_rating'

/**
 * Fetch shows from Supabase with optional filtering
 */
export async function fetchShows(options: {
  limit?: number
  offset?: number
  showInDiscovery?: boolean
  excludeUserShows?: boolean
  userId?: string
  sortBy?: SortOption
  genreIds?: number[]
  yearRange?: [number, number]
  streamerIds?: number[]
}): Promise<{ shows: ShowWithGenres[], error: any, totalFiltered?: number, hasMore?: boolean }> {
  try {
    console.log('🔍 [fetchShows] Fetching shows with options:', options)
    
    // Direct REST API call to bypass problematic Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }

    // Step 1: Get user's show IDs if we need to exclude them
    let userShowIds: string[] = []
    if (options.excludeUserShows && options.userId) {
      console.log('🔍 [fetchShows] Fetching user shows to exclude...')
      const userShowsUrl = `${supabaseUrl}/rest/v1/user_shows?select=imdb_id&user_id=eq.${options.userId}`
      
      try {
        const userShowsResponse = await fetch(userShowsUrl, { method: 'GET', headers })
        if (userShowsResponse.ok) {
          const userShows = await userShowsResponse.json()
          userShowIds = userShows.map((us: any) => us.imdb_id)
          console.log('🔍 [fetchShows] Found user shows to exclude:', userShowIds.length)
        } else {
          console.log('⚠️ [fetchShows] User shows query failed with status:', userShowsResponse.status, 'continuing without exclusion')
        }
      } catch (userShowsError) {
        console.error('⚠️ [fetchShows] Failed to fetch user shows, continuing without exclusion:', userShowsError)
      }
    }
    
    // Step 2: Build query with filters applied at database level
    console.log('🔍 [fetchShows] Building filtered query...')
    
    // Build the base query with filters
    let queryParams = []
    
    // Discovery filter
    if (options.showInDiscovery) {
      queryParams.push('show_in_discovery=eq.true')
    }
    
    // Year range filter - only apply if it's not the default wide range
    if (options.yearRange && !(options.yearRange[0] === 1950 && options.yearRange[1] === 2025)) {
      const [minYear, maxYear] = options.yearRange
      queryParams.push(`first_air_date=gte.${minYear}-01-01`)
      queryParams.push(`first_air_date=lte.${maxYear}-12-31`)
    }
    
    // Exclude user shows filter
    if (options.excludeUserShows && userShowIds.length > 0) {
      // For large lists, we'll filter in memory instead of URL params
      console.log('🔍 [fetchShows] Will filter user shows in memory due to large list')
    }
    
    // Build sorting
    let orderParam = ''
    switch (options.sortBy) {
      case 'latest':
        orderParam = '&order=first_air_date.desc.nullslast'
        break
      case 'rating':
      case 'by_rating':
        // Use our_score first, then imdb_rating as fallback, then vote_average (tmdb rating)
        orderParam = '&order=our_score.desc.nullslast,imdb_rating.desc.nullslast,vote_average.desc.nullslast'
        break
      case 'recently_added':
        orderParam = '&order=created_at.desc'
        break
      case 'best_rated':
        // Only use our_score for best_rated
        orderParam = '&order=our_score.desc.nullslast'
        break
      default:
        orderParam = '&order=first_air_date.desc.nullslast'
        break
    }
    
    // Calculate fetch limit - balance between having enough content and fast loading
    // We need to fetch more than requested to account for filtering
    const baseLimit = options.limit || 20
    let fetchLimit = Math.max(baseLimit * 15, 500) // Fetch 15x more to account for filtering
    
    // If we're excluding user shows and there are many, increase the limit further
    if (options.excludeUserShows && userShowIds.length > 50) {
      fetchLimit = Math.max(baseLimit * 25, 800)
    }
    
    // For discovery view with offset (infinite scroll), fetch more to ensure we have content
    if (options.showInDiscovery && (options.offset || 0) > 0) {
      fetchLimit = Math.max(baseLimit * 30, 1000)
    }
    
    const queryString = queryParams.length > 0 ? '&' + queryParams.join('&') : ''
    const url = `${supabaseUrl}/rest/v1/shows?select=imdb_id,id,name,original_name,first_air_date,imdb_rating,imdb_vote_count,vote_average,vote_count,our_score,overview,poster_url,genre_ids,number_of_seasons,number_of_episodes,type,streaming_info,main_cast,creators&limit=${fetchLimit}${queryString}${orderParam}`
    
    console.log('🔍 [fetchShows] Query URL:', url.replace(supabaseKey, '[REDACTED]'))
    
    let shows, error
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        error = new Error(`API Error: ${response.status} - ${errorText}`)
        shows = null
      } else {
        const data = await response.json()
        shows = data
        error = null
      }
    } catch (catchError: any) {
      error = catchError
      shows = null
    }

    if (error) {
      console.error('Error fetching shows:', error)
      return { shows: [], error }
    }
    
    // Step 3: Apply remaining filters in memory
    let filteredShows = shows || []
    console.log(`🔍 [fetchShows] Initial shows fetched: ${filteredShows.length}`)
    
    // Filter out user shows if needed
    if (options.excludeUserShows && userShowIds.length > 0) {
      const beforeCount = filteredShows.length
      filteredShows = filteredShows.filter((show: any) => !userShowIds.includes(show.imdb_id))
      console.log(`🔍 [fetchShows] After user shows filter: ${beforeCount} -> ${filteredShows.length}`)
    }
    
    // Apply genre filtering
    if (options.genreIds && options.genreIds.length > 0) {
      const beforeCount = filteredShows.length
      filteredShows = filteredShows.filter((show: any) => {
        const showGenres = show.genre_ids || []
        return options.genreIds!.some(genreId => showGenres.includes(genreId))
      })
      console.log(`🔍 [fetchShows] After genre filter: ${beforeCount} -> ${filteredShows.length}`)
    }
    
    // Apply streaming provider filtering
    if (options.streamerIds && options.streamerIds.length > 0) {
      const beforeCount = filteredShows.length
      filteredShows = filteredShows.filter((show: any) => {
        if (!show.streaming_info?.US) return false
        const showProviders = show.streaming_info.US.map((p: any) => p.provider_id)
        return options.streamerIds!.some(streamerId => showProviders.includes(streamerId))
      })
      console.log(`🔍 [fetchShows] After streaming filter: ${beforeCount} -> ${filteredShows.length}`)
    }
    
    // Step 4: Apply pagination
    const totalFiltered = filteredShows.length
    const startIndex = options.offset || 0
    const endIndex = startIndex + (options.limit || 20)
    
    filteredShows = filteredShows.slice(startIndex, endIndex)
    
    console.log(`🔍 [fetchShows] Pagination: ${startIndex}-${endIndex} of ${totalFiltered} total, returning ${filteredShows.length} shows`)
    
    // Clean up the shows data with proper fallbacks
    const cleanedShows = filteredShows.map((show: any) => ({
      ...show,
      // Add required fields as fallbacks
      id: show.id || 0,
      first_air_date: show.first_air_date || '2024-01-01',
      last_air_date: show.last_air_date || null,
      status: show.status || 'Unknown',
      imdb_rating: show.imdb_rating || 0,
      imdb_vote_count: show.imdb_vote_count || 0,
      vote_average: show.vote_average || 0,
      vote_count: show.vote_count || 0,
      our_score: show.our_score || 0,
      overview: show.overview || 'No overview',
      our_description: show.our_description || null,
      poster_path: show.poster_path || null,
      poster_url: show.poster_url || null,
      poster_thumb_url: show.poster_thumb_url || null,
      genre_ids: show.genre_ids || [],
      trailer_key: show.trailer_key || null,
      streaming_info: show.streaming_info || null,
      next_season_date: show.next_season_date || null,
      created_at: show.created_at || '2024-01-01T00:00:00Z',
      updated_at: show.updated_at || '2024-01-01T00:00:00Z',
      tmdb_synced_at: show.tmdb_synced_at || null,
      needs_sync: show.needs_sync || false,
      is_hidden: show.is_hidden || false,
      is_trash: show.is_trash || false,
      main_cast: show.main_cast || [],
      creators: show.creators || [],
      origin_country: show.origin_country || [],
      original_language: show.original_language || 'en'
    }))

    // Add genre names using direct API calls
    const showsWithGenres = await addGenreNames(cleanedShows)

    // Return shows with metadata for pagination
    // For hasMore logic: if we got fewer shows than requested after filtering, there's no more
    // But if we got exactly what we requested, there might be more
    const requestedAmount = options.limit || 20
    const actuallyReturned = showsWithGenres.length
    const hasMoreData = actuallyReturned === requestedAmount && endIndex < totalFiltered
    
    return { 
      shows: showsWithGenres, 
      error: null,
      // Add metadata to help with hasMore logic
      totalFiltered,
      hasMore: hasMoreData
    }
  } catch (error) {
    console.error('Error in fetchShows:', error)
    return { shows: [], error }
  }
}

/**
 * Fetch user's shows by status
 */
export async function fetchUserShows(
  userId: string,
  status: ShowStatus | 'all_rated',
  options?: {
    sortBy?: SortOption
    limit?: number
    offset?: number
  }
): Promise<{ shows: ShowWithGenres[], error: any }> {
  try {
    console.log(`🔍 [fetchUserShows] Fetching user shows for ${userId}, status: ${status}, sortBy: ${options?.sortBy}`)
    
    let query = supabase
      .from('user_shows')
      .select(`
        *,
        shows:imdb_id (*)
      `)
      .eq('user_id', userId)

    // Handle status filtering
    if (status === 'all_rated') {
      // Include all rating statuses: liked_it, loved_it, and not_for_me
      query = query.in('status', ['liked_it', 'loved_it', 'not_for_me'])
    } else {
      query = query.eq('status', status)
    }

    console.log(`🔍 [fetchUserShows] Applying sorting: ${options?.sortBy}`)
    switch (options?.sortBy) {
      case 'recently_added':
        // Sort by when the status was last updated, not when first created
        query = query.order('updated_at', { ascending: false })
        break
      case 'best_rated':
        // 🐛 FIX: This should not sort by updated_at, we'll handle rating sorting in memory
        query = query.order('updated_at', { ascending: false })
        break
      case 'by_rating':
        // For grouped by rating, we'll sort by status first, then by updated_at
        // Also fetch more data since grouping needs all shows
        query = query.order('status', { ascending: false }).order('updated_at', { ascending: false })
        console.log('🔍 [fetchUserShows] by_rating sorting applied, will fetch more data')
        break
      case 'latest':
        // Sort by when the show was added to user's list
        query = query.order('created_at', { ascending: false })
        break
      case 'rating':
        // We'll handle rating sorting in memory since it's based on show data
        query = query.order('updated_at', { ascending: false })
        break
      default:
        query = query.order('updated_at', { ascending: false })
        break
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data: userShows, error: userShowsError } = await query

    if (userShowsError) {
      console.error('Error fetching user shows:', userShowsError)
      return { shows: [], error: userShowsError }
    }

    let shows = userShows?.map(us => {
      const show = us.shows as any
      return {
        ...show,
        // Add required fields as fallbacks
        id: show.id || 0,
        first_air_date: show.first_air_date || '2024-01-01',
        last_air_date: show.last_air_date || null,
        status: show.status || 'Unknown',
        imdb_rating: show.imdb_rating || 0,
        imdb_vote_count: show.imdb_vote_count || 0,
        vote_average: show.vote_average || 0,
        vote_count: show.vote_count || 0,
        our_score: show.our_score || 0,
        overview: show.overview || 'No overview',
        our_description: show.our_description || null,
        poster_path: show.poster_path || null,
        poster_url: show.poster_url || null,
        poster_thumb_url: show.poster_thumb_url || null,
        genre_ids: show.genre_ids || [],
        trailer_key: show.trailer_key || null,
        streaming_info: show.streaming_info || null,
        next_season_date: show.next_season_date || null,
        created_at: show.created_at || '2024-01-01T00:00:00Z',
        updated_at: show.updated_at || '2024-01-01T00:00:00Z',
        tmdb_synced_at: show.tmdb_synced_at || null,
        needs_sync: show.needs_sync || false,
        is_hidden: show.is_hidden || false,
        is_trash: show.is_trash || false,
        main_cast: show.main_cast || [],
        creators: show.creators || [],
        origin_country: show.origin_country || [],
        original_language: show.original_language || 'en',
        user_status: us.status
      }
    }).filter(Boolean) || []
    
    console.log(`🔍 [fetchUserShows] Retrieved ${shows.length} shows before in-memory sorting`)
    
    // 🐛 FIX: Apply in-memory sorting for rating-based sorts
    if (options?.sortBy === 'best_rated' || options?.sortBy === 'rating' || options?.sortBy === 'by_rating') {
      shows = shows.sort((a, b) => {
        // For "best_rated", use ONLY our_score to match what's displayed
        const ratingA = options?.sortBy === 'best_rated'
          ? (a.our_score || 0)
          : options?.sortBy === 'by_rating'
          ? (a.our_score || a.imdb_rating || a.vote_average || 0)
          : (a.imdb_rating || a.vote_average || a.our_score || 0)
        const ratingB = options?.sortBy === 'best_rated'
          ? (b.our_score || 0)
          : options?.sortBy === 'by_rating'
          ? (b.our_score || b.imdb_rating || b.vote_average || 0)
          : (b.imdb_rating || b.vote_average || b.our_score || 0)
        
        return ratingB - ratingA
      })
    }
    
    const showsWithGenres = await addGenreNames(shows)
    console.log(`🔍 [fetchUserShows] Final result: ${showsWithGenres.length} shows`)

    return { shows: showsWithGenres, error: null }
  } catch (error) {
    console.error('Error in fetchUserShows:', error)
    return { shows: [], error }
  }
}

/**
 * Add genre names to shows using direct API calls
 */
async function addGenreNames(shows: Show[]): Promise<ShowWithGenres[]> {
  try {
    // Get all unique genre IDs
    const allGenreIds = Array.from(
      new Set(
        shows
          .flatMap(show => show.genre_ids || [])
          .filter(Boolean)
      )
    )

    if (allGenreIds.length === 0) {
      return shows.map(show => ({ ...show, genre_names: [] }))
    }

    // Direct API call for genres
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const genreFilter = allGenreIds.map(id => `id.eq.${id}`).join(',')
    const url = `${supabaseUrl}/rest/v1/genres?select=id,name&or=(${genreFilter})`
    
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }

    const response = await fetch(url, { method: 'GET', headers })
    
    if (!response.ok) {
      console.error('Error fetching genres:', response.status)
      return shows.map(show => ({ ...show, genre_names: [] }))
    }

    const genres = await response.json()

    // Create a map of genre ID to name
    const genreMap = new Map(genres?.map((g: any) => [g.id, g.name]) || [])

    // Add genre names to shows
    return shows.map(show => ({
      ...show,
      genre_names: (show.genre_ids || [])
        .map(id => genreMap.get(id))
        .filter(Boolean) as string[]
    }))
  } catch (error) {
    console.error('Error adding genre names:', error)
    return shows.map(show => ({ ...show, genre_names: [] }))
  }
}

/**
 * Apply sorting to shows array
 */
function applySortingToShows(shows: any[], sortBy: SortOption): any[] {
  switch (sortBy) {
    case 'latest':
      return shows.sort((a, b) => {
        const dateA = new Date(a.first_air_date || a.created_at || '1900-01-01')
        const dateB = new Date(b.first_air_date || b.created_at || '1900-01-01')
        return dateB.getTime() - dateA.getTime()
      })
    
    case 'rating':
      return shows.sort((a, b) => {
        const ratingA = a.our_score || a.imdb_rating || a.vote_average || 0
        const ratingB = b.our_score || b.imdb_rating || b.vote_average || 0
        return ratingB - ratingA
      })
    
    case 'recently_added':
      return shows.sort((a, b) => {
        const dateA = new Date(a.created_at || '1900-01-01')
        const dateB = new Date(b.created_at || '1900-01-01')
        return dateB.getTime() - dateA.getTime()
      })
    
    case 'best_rated':
      return shows.sort((a, b) => {
        // For "best_rated", use ONLY our_score to match what's displayed
        const ratingA = a.our_score || 0
        const ratingB = b.our_score || 0
        return ratingB - ratingA
      })
    
    case 'by_rating':
      return shows.sort((a, b) => {
        const ratingA = a.imdb_rating || a.vote_average || a.our_score || 0
        const ratingB = b.imdb_rating || b.vote_average || b.our_score || 0
        return ratingB - ratingA
      })
    
    default:
      console.log(`🔍 [applySortingToShows] Unknown sort option: ${sortBy}`)
      return shows
  }
}

/**
 * Update user show status
 */
export async function updateUserShowStatus(
  userId: string,
  imdbId: string,
  status: ShowStatus
): Promise<{ error: any }> {
  try {
    console.log('🔄 [updateUserShowStatus] Starting status update...', { userId, imdbId, status })
    
    // Use direct REST API instead of Supabase client to avoid hanging
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }

    // First, check if record exists with timeout
    console.log('🔍 [updateUserShowStatus] Checking existing record...')
    const checkUrl = `${supabaseUrl}/rest/v1/user_shows?select=id&user_id=eq.${userId}&imdb_id=eq.${imdbId}`
    
    const checkPromise = fetch(checkUrl, { method: 'GET', headers })
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Check timeout')), 10000)
    )
    
    const checkResponse = await Promise.race([checkPromise, timeoutPromise])
    
    if (!checkResponse.ok) {
      const errorText = await checkResponse.text()
      console.error('❌ [updateUserShowStatus] Check failed:', errorText)
      return { error: new Error(`Check failed: ${checkResponse.status}`) }
    }
    
    const existingRecords = await checkResponse.json()
    console.log('📋 [updateUserShowStatus] Existing records:', existingRecords)
    
    if (existingRecords && existingRecords.length > 0) {
      // Update existing record
      console.log('🔄 [updateUserShowStatus] Updating existing record...')
      const updateUrl = `${supabaseUrl}/rest/v1/user_shows?id=eq.${existingRecords[0].id}`
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      }
      
      const updatePromise = fetch(updateUrl, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updateData)
      })
      
      const updateTimeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Update timeout')), 10000)
      )
      
      const updateResponse = await Promise.race([updatePromise, updateTimeoutPromise])
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        console.error('❌ [updateUserShowStatus] Update failed:', errorText)
        return { error: new Error(`Update failed: ${updateResponse.status}`) }
      }
      
      console.log('✅ [updateUserShowStatus] Record updated successfully')
    } else {
      // Create new record
      console.log('➕ [updateUserShowStatus] Creating new record...')
      const insertUrl = `${supabaseUrl}/rest/v1/user_shows`
      const insertData = {
        user_id: userId,
        imdb_id: imdbId,
        status
      }
      
      const insertPromise = fetch(insertUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(insertData)
      })
      
      const insertTimeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Insert timeout')), 10000)
      )
      
      const insertResponse = await Promise.race([insertPromise, insertTimeoutPromise])
      
      if (!insertResponse.ok) {
        const errorText = await insertResponse.text()
        console.error('❌ [updateUserShowStatus] Insert failed:', errorText)
        return { error: new Error(`Insert failed: ${insertResponse.status}`) }
      }
      
      console.log('✅ [updateUserShowStatus] New record created successfully')
    }

    // Update user's interaction count
    console.log('📊 [updateUserShowStatus] Updating interaction count...')
    await updateUserInteractionCount(userId)

    console.log('🎉 [updateUserShowStatus] All operations completed successfully')
    return { error: null }
  } catch (error) {
    console.error('❌ [updateUserShowStatus] Error:', error)
    return { error }
  }
}

/**
 * Update user's interaction count
 */
async function updateUserInteractionCount(userId: string): Promise<void> {
  try {
    console.log('📊 [updateUserInteractionCount] Starting interaction count update...')
    
    // Use direct REST API to avoid hanging
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }

    // Get current count with timeout
    const fetchUrl = `${supabaseUrl}/rest/v1/profiles?select=interaction_count&id=eq.${userId}`
    
    const fetchPromise = fetch(fetchUrl, { method: 'GET', headers })
    const fetchTimeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Fetch profile timeout')), 5000)
    )
    
    const fetchResponse = await Promise.race([fetchPromise, fetchTimeoutPromise])
    
    if (!fetchResponse.ok) {
      console.error('❌ [updateUserInteractionCount] Fetch failed:', fetchResponse.status)
      return
    }
    
    const profiles = await fetchResponse.json()
    const currentCount = profiles?.[0]?.interaction_count || 0
    const newCount = currentCount + 1
    
    console.log('📊 [updateUserInteractionCount] Updating count from', currentCount, 'to', newCount)

    // Update count with timeout
    const updateUrl = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`
    const updateData = { interaction_count: newCount }
    
    const updatePromise = fetch(updateUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updateData)
    })
    
    const updateTimeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Update profile timeout')), 5000)
    )
    
    const updateResponse = await Promise.race([updatePromise, updateTimeoutPromise])
    
    if (!updateResponse.ok) {
      console.error('❌ [updateUserInteractionCount] Update failed:', updateResponse.status)
      return
    }
    
    console.log('✅ [updateUserInteractionCount] Interaction count updated successfully')
  } catch (error) {
    console.error('❌ [updateUserInteractionCount] Error:', error)
  }
}

/**
 * Filter streaming providers to only include US providers with specified IDs
 */
export function filterStreamingProviders(show: Show): Array<{ provider_name: string; provider_id: number; type: string }> {
  if (!show.streaming_info?.US) {
    return []
  }

  return show.streaming_info.US.filter(provider => 
    STREAMING_PROVIDER_IDS.includes(provider.provider_id)
  )
}

/**
 * Format show air date
 */
export function formatAirDate(dateString: string | null): string {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    return date.getFullYear().toString()
  } catch (error) {
    return ''
  }
}

/**
 * Format series information based on show type and season count
 */
export function formatSeriesInfo(show: Show): string {
  const { type, number_of_seasons, status } = show

  if (type === 'Miniseries') {
    return 'Mini Series'
  }

  if (!number_of_seasons || number_of_seasons === 0) {
    return 'Series'
  }

  if (number_of_seasons === 1) {
    return `1 season${status ? `, ${status}` : ''}`
  }

  return `${number_of_seasons} seasons${status ? `, ${status}` : ''}`
}

/**
 * Get show description (prefer our_description over overview)
 */
export function getShowDescription(show: Show): string {
  return show.our_description || show.overview || ''
}

/**
 * Get poster URL with fallback
 */
export function getPosterUrl(show: Show): string | null {
  return show.poster_url || show.poster_path
}

/**
 * Fetch new seasons shows for user (shows they rated as loved_it or liked_it with season updates)
 */
export async function fetchNewSeasonsShows(
  userId: string,
  options?: {
    limit?: number
    offset?: number
  }
): Promise<{ shows: ShowWithGenres[], error: any }> {
  try {
    // Get shows user rated as loved_it or liked_it
    const { data: userShows, error: userShowsError } = await supabase
      .from('user_shows')
      .select(`
        imdb_id,
        shows:imdb_id (*)
      `)
      .eq('user_id', userId)
      .in('status', ['liked_it', 'loved_it'])

    if (userShowsError) {
      console.error('Error fetching user shows for new seasons:', userShowsError)
      return { shows: [], error: userShowsError }
    }

    if (!userShows || userShows.length === 0) {
      return { shows: [], error: null }
    }

    // Filter shows that have next_season_date and are either upcoming or recent
    const currentDate = new Date()
    const sixMonthsAgo = new Date(currentDate.getTime() - (6 * 30 * 24 * 60 * 60 * 1000))

    const shows = userShows
      .map(us => {
        const show = us.shows as any
        return {
          ...show,
          // Add required fields as fallbacks
          id: show.id || 0,
          first_air_date: show.first_air_date || '2024-01-01',
          last_air_date: show.last_air_date || null,
          status: show.status || 'Unknown',
          imdb_rating: show.imdb_rating || 0,
          imdb_vote_count: show.imdb_vote_count || 0,
          vote_average: show.vote_average || 0,
          vote_count: show.vote_count || 0,
          our_score: show.our_score || 0,
          overview: show.overview || 'No overview',
          our_description: show.our_description || null,
          poster_path: show.poster_path || null,
          poster_url: show.poster_url || null,
          poster_thumb_url: show.poster_thumb_url || null,
          genre_ids: show.genre_ids || [],
          trailer_key: show.trailer_key || null,
          streaming_info: show.streaming_info || null,
          next_season_date: show.next_season_date || null,
          created_at: show.created_at || '2024-01-01T00:00:00Z',
          updated_at: show.updated_at || '2024-01-01T00:00:00Z',
          tmdb_synced_at: show.tmdb_synced_at || null,
          needs_sync: show.needs_sync || false,
          is_hidden: show.is_hidden || false,
          is_trash: show.is_trash || false,
          main_cast: show.main_cast || [],
          creators: show.creators || [],
          origin_country: show.origin_country || [],
          original_language: show.original_language || 'en'
        }
      })
      .filter(Boolean)
      .filter((show: Show) => {
        if (!show.next_season_date) return false
        
        const nextSeasonDate = new Date(show.next_season_date)
        
        // Show if upcoming (future) or recent (within 6 months)
        return nextSeasonDate > sixMonthsAgo
      })
      .sort((a: Show, b: Show) => {
        // Custom sorting for New Seasons: Future (furthest first) → Today → Past (recent first)
        const dateA = new Date(a.next_season_date!)
        const dateB = new Date(b.next_season_date!)
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Reset to start of day for comparison
        
        const todayTime = today.getTime()
        const timeA = dateA.getTime()
        const timeB = dateB.getTime()
        
        // Categorize dates
        const isFutureA = timeA > todayTime
        const isFutureB = timeB > todayTime
        const isTodayA = timeA === todayTime
        const isTodayB = timeB === todayTime
        
        // Both future: furthest first (descending)
        if (isFutureA && isFutureB) {
          return timeB - timeA
        }
        
        // Both past: most recent first (descending)
        if (!isFutureA && !isTodayA && !isFutureB && !isTodayB) {
          return timeB - timeA
        }
        
        // Mixed categories: Future > Today > Past
        if (isFutureA && !isFutureB) return -1  // A (future) before B
        if (!isFutureA && isFutureB) return 1   // B (future) before A
        if (isTodayA && !isTodayB && !isFutureB) return -1  // A (today) before B (past)
        if (!isTodayA && !isFutureA && isTodayB) return 1   // B (today) before A (past)
        
        return 0 // Same category, maintain order
      })

    // Apply pagination
    const startIndex = options?.offset || 0
    const endIndex = startIndex + (options?.limit || 10)
    const paginatedShows = shows.slice(startIndex, endIndex)

    const showsWithGenres = await addGenreNames(paginatedShows)

    return { shows: showsWithGenres, error: null }
  } catch (error) {
    console.error('Error in fetchNewSeasonsShows:', error)
    return { shows: [], error }
  }
}

/**
 * Format season information for New Seasons view
 */
export function formatSeasonInfo(show: Show): { seasonText: string, airDate: string, isUpcoming: boolean } {
  const currentDate = new Date()
  const nextSeasonDate = show.next_season_date ? new Date(show.next_season_date) : null
  
  if (!nextSeasonDate) {
    return { seasonText: 'Season info unavailable', airDate: '', isUpcoming: false }
  }
  
  const isUpcoming = nextSeasonDate > currentDate
  const seasonCount = show.number_of_seasons || 0
  
  let seasonText: string
  if (isUpcoming) {
    seasonText = `Season ${seasonCount + 1}`
  } else {
    seasonText = `Season ${seasonCount}`
  }
  
  const airDate = nextSeasonDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
  
  return { seasonText, airDate, isUpcoming }
}

/**
 * Fetch all available genres for filtering
 */
export async function fetchGenres(): Promise<{ genres: Array<{ id: number; name: string }>, error: any }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }

    const url = `${supabaseUrl}/rest/v1/genres?select=id,name&order=name.asc`
    const response = await fetch(url, { method: 'GET', headers })
    
    if (!response.ok) {
      console.error('Error fetching genres:', response.status)
      return { genres: [], error: new Error(`Failed to fetch genres: ${response.status}`) }
    }

    const genres = await response.json()
    return { genres: genres || [], error: null }
  } catch (error) {
    console.error('Error in fetchGenres:', error)
    return { genres: [], error }
  }
}

/**
 * Fetch year range from shows data
 */
export async function fetchYearRange(): Promise<{ yearRange: [number, number], error: any }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }

    // Get min and max years from first_air_date
    const url = `${supabaseUrl}/rest/v1/shows?select=first_air_date&show_in_discovery=eq.true&first_air_date=not.is.null&order=first_air_date.asc&limit=1`
    const minResponse = await fetch(url, { method: 'GET', headers })
    
    const maxUrl = `${supabaseUrl}/rest/v1/shows?select=first_air_date&show_in_discovery=eq.true&first_air_date=not.is.null&order=first_air_date.desc&limit=1`
    const maxResponse = await fetch(maxUrl, { method: 'GET', headers })
    
    if (!minResponse.ok || !maxResponse.ok) {
      console.error('Error fetching year range')
      return { yearRange: [2000, 2024], error: new Error('Failed to fetch year range') }
    }

    const minData = await minResponse.json()
    const maxData = await maxResponse.json()
    
    const minYear = minData?.[0]?.first_air_date ? new Date(minData[0].first_air_date).getFullYear() : 2000
    const maxYear = maxData?.[0]?.first_air_date ? new Date(maxData[0].first_air_date).getFullYear() : 2024
    
    return { yearRange: [minYear, maxYear], error: null }
  } catch (error) {
    console.error('Error in fetchYearRange:', error)
    return { yearRange: [2000, 2024], error }
  }
}

/**
 * Fetch all available streaming providers from shows data
 */
export async function fetchStreamingProviders(): Promise<{ streamers: Array<{ id: number; name: string }>, error: any }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }

    // Get all shows with streaming info
    const url = `${supabaseUrl}/rest/v1/shows?select=streaming_info&show_in_discovery=eq.true&streaming_info=not.is.null`
    const response = await fetch(url, { method: 'GET', headers })
    
    if (!response.ok) {
      console.error('Error fetching streaming providers:', response.status)
      return { streamers: [], error: new Error(`Failed to fetch streaming providers: ${response.status}`) }
    }

    const shows = await response.json()
    
    // Extract unique streaming providers
    const providerMap = new Map<number, string>()
    
    shows?.forEach((show: any) => {
      if (show.streaming_info?.US) {
        show.streaming_info.US.forEach((provider: any) => {
          if (provider.provider_id && provider.provider_name) {
            providerMap.set(provider.provider_id, provider.provider_name)
          }
        })
      }
    })
    
    // Convert to array and sort by name
    const streamers = Array.from(providerMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
    
    return { streamers, error: null }
  } catch (error) {
    console.error('Error in fetchStreamingProviders:', error)
    return { streamers: [], error }
  }
}

/**
 * Fetch filter options (genres, year range, streaming providers)
 */
export async function fetchFilterOptions(): Promise<{
  options: {
    genres: Array<{ id: number; name: string }>
    yearRange: [number, number]
    streamers: Array<{ id: number; name: string }>
  }
  error: any
}> {
  try {
    const [genresResult, yearRangeResult, streamersResult] = await Promise.all([
      fetchGenres(),
      fetchYearRange(),
      fetchStreamingProviders()
    ])

    if (genresResult.error || yearRangeResult.error || streamersResult.error) {
      const error = genresResult.error || yearRangeResult.error || streamersResult.error
      console.error('Error fetching filter options:', error)
      return {
        options: {
          genres: genresResult.genres,
          yearRange: yearRangeResult.yearRange,
          streamers: streamersResult.streamers
        },
        error
      }
    }

    return {
      options: {
        genres: genresResult.genres,
        yearRange: yearRangeResult.yearRange,
        streamers: streamersResult.streamers
      },
      error: null
    }
  } catch (error) {
    console.error('Error in fetchFilterOptions:', error)
    return {
      options: {
        genres: [],
        yearRange: [2000, 2024],
        streamers: []
      },
      error
    }
  }
}
