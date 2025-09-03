import { supabase } from '@/lib/supabase'
import { Show, ShowStatus, Profile, STREAMING_PROVIDER_IDS } from '@/types/database'

export interface ShowWithGenres extends Show {
  genre_names?: string[]
  user_status?: ShowStatus
}

export type SortOption = 'latest' | 'rating' | 'recently_added' | 'best_rated' | 'by_rating'

// Canonical streamer names and set for lookups
const CANONICAL_STREAMER_LIST = [
  'Netflix',
  'Amazon Prime',
  'HBO Max',
  'Disney+',
  'Hulu',
  'Apple TV+',
  'Paramount+',
  'Peacock',
  'AMC+',
  'BritBox',
  'Rakuten Viki'
] as const
const CANONICAL_STREAMERS = new Set<string>(CANONICAL_STREAMER_LIST as unknown as string[])

function normalizeStreamerName(name: string): string | null {
  if (!name) return null
  const n = name.trim().toLowerCase()
  const map: Record<string, string> = {
    'netflix': 'Netflix',
    'amazon prime': 'Amazon Prime',
    'prime video': 'Amazon Prime',
    'amazon prime video': 'Amazon Prime',
    'hbo max': 'HBO Max',
    'max': 'HBO Max',
    'hbo': 'HBO Max',
    'disney+': 'Disney+',
    'disney plus': 'Disney+',
    'hulu': 'Hulu',
    'apple tv+': 'Apple TV+',
    'apple tv plus': 'Apple TV+',
    'appletv+': 'Apple TV+',
    'appletv plus': 'Apple TV+',
    'paramount+': 'Paramount+',
    'paramount plus': 'Paramount+',
    'peacock': 'Peacock',
    'amc+': 'AMC+',
    'amc plus': 'AMC+',
    'britbox': 'BritBox',
    'rakuten viki': 'Rakuten Viki',
    'viki': 'Rakuten Viki'
  }
  const normalized = map[n] || null
  return normalized && CANONICAL_STREAMERS.has(normalized) ? normalized : null
}

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
  search?: string // Added for genre name search functionality
}): Promise<{ shows: ShowWithGenres[], error: any, totalFiltered?: number, hasMore?: boolean, rawFetched: number, nextOffset: number }> {
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
    
    // NOTE: Genre filtering moved to in-memory due to Supabase REST API limitations with array operators
    // The cs and ov operators don't work correctly with array fields
    
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
    
    // Calculate fetch limit - need to fetch more when filtering to ensure we get enough results
    const baseLimit = options.limit || 20
    let fetchLimit = baseLimit
    
    // Increase fetch limit when we have filters that will be applied in memory
    if (options.streamerIds && options.streamerIds.length > 0) {
      // Fetch 10x more to ensure we find enough matches in one request
      fetchLimit = Math.max(baseLimit * 10, 200)
    } else if (options.genreIds && options.genreIds.length > 0) {
      // Fetch 5x more for genre filtering (applied in memory)
      fetchLimit = Math.max(baseLimit * 5, 100)
    } else if (options.excludeUserShows && userShowIds.length > 0) {
      fetchLimit = Math.ceil(baseLimit * 1.8)
    }
    
    // Add offset to query for proper pagination
    const offsetParam = (options.offset && options.offset > 0) ? `&offset=${options.offset}` : ''
    const queryString = queryParams.length > 0 ? '&' + queryParams.join('&') : ''
    const url = `${supabaseUrl}/rest/v1/shows?select=imdb_id,id,name,original_name,first_air_date,imdb_rating,imdb_vote_count,vote_average,vote_count,our_score,overview,poster_url,poster_thumb_url,genre_ids,number_of_seasons,number_of_episodes,type,streaming_info,streamers,main_cast,creators&limit=${fetchLimit}${offsetParam}${queryString}${orderParam}`
    
    console.log('🔍 [fetchShows] Query URL:', url.replace(supabaseKey || '', '[REDACTED]'))
    
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
    const rawFetched = Array.isArray(shows) ? shows.length : 0

    if (error) {
      console.error('Error fetching shows:', error)
      return { shows: [], error, totalFiltered: 0, hasMore: false, rawFetched: 0, nextOffset: (options.offset || 0) }
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
    
    // Apply genre filtering in memory (database operators don't work correctly with arrays)
    if (options.genreIds && options.genreIds.length > 0) {
      const beforeCount = filteredShows.length
      filteredShows = filteredShows.filter((show: any) => {
        const showGenres = show.genre_ids || []
        // Check if show has ANY of the selected genres
        return options.genreIds!.some(genreId => showGenres.includes(genreId))
      })
      console.log(`🔍 [fetchShows] After genre filter: ${beforeCount} -> ${filteredShows.length} (looking for genres: ${options.genreIds.join(', ')})`)
    }
    
    
    
    // Apply streaming provider filtering (by canonical names)
    if (options.streamerIds && options.streamerIds.length > 0) {
      const beforeCount = filteredShows.length
      const selectedNames = new Set(
        options.streamerIds
          .map(id => CANONICAL_STREAMER_LIST[id - 1])
          .filter(Boolean)
      )
      filteredShows = filteredShows.filter((show: any) => {
        if (!show.streaming_info?.US) return false
        // Collect providers regardless of structure
        const providers: any[] = []
        if (Array.isArray(show.streaming_info.US)) {
          providers.push(...show.streaming_info.US)
        } else if (typeof show.streaming_info.US === 'object') {
          const usInfo = show.streaming_info.US
          if (usInfo.flatrate && Array.isArray(usInfo.flatrate)) providers.push(...usInfo.flatrate)
          if (usInfo.ads && Array.isArray(usInfo.ads)) providers.push(...usInfo.ads)
          if (usInfo.rent && Array.isArray(usInfo.rent)) providers.push(...usInfo.rent)
          if (usInfo.buy && Array.isArray(usInfo.buy)) providers.push(...usInfo.buy)
        }
        const names = new Set(
          providers
            .map((p: any) => normalizeStreamerName(p.provider_name))
            .filter((n: any): n is string => !!n)
        )
        // Match any selected name
        for (const n of selectedNames) {
          if (names.has(n)) return true
        }
        return false
      })
      console.log(`🔍 [fetchShows] After streaming filter: ${beforeCount} -> ${filteredShows.length}`)
    }
    
    // Step 4: Apply final limit (since we already used offset in query)
    const totalFiltered = filteredShows.length
    const requestedLimit = options.limit || 20
    
    // Only slice if we got more than requested (due to filtering buffer)
    if (filteredShows.length > requestedLimit) {
      filteredShows = filteredShows.slice(0, requestedLimit)
    }
    
    console.log(`🔍 [fetchShows] Final result: ${filteredShows.length} shows (requested: ${requestedLimit})`)
    
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
      streamers: show.streamers || null,
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
    // Use rawFetched and fetchLimit to determine if there might be more data on the server
    const requestedAmount = options.limit || 20
    const hasMoreData = rawFetched === fetchLimit
    const nextOffset = (options.offset || 0) + rawFetched

    return {
      shows: showsWithGenres,
      error: null,
      totalFiltered,
      hasMore: hasMoreData,
      rawFetched,
      nextOffset
    }
  } catch (error) {
    console.error('Error in fetchShows:', error)
    return { shows: [], error, totalFiltered: 0, hasMore: false, rawFetched: 0, nextOffset: (options.offset || 0) }
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
        streamers: show.streamers || null,
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
  // Prefer simplified DB field if present (string names)
  const asAny = show as any
  if (Array.isArray(asAny.streamers) && asAny.streamers.length > 0) {
    const first = asAny.streamers[0]
    if (typeof first === 'string') {
      const seen = new Set<string>()
      return (asAny.streamers as string[])
        .map(name => normalizeStreamerName(name))
        .filter((name): name is string => !!name)
        .filter(name => {
          if (seen.has(name)) return false
          seen.add(name)
          return true
        })
        .map((name: string, idx: number) => ({ provider_name: name, provider_id: idx + 1, type: 'flatrate' }))
    }
  }

  if (!show.streaming_info?.US) {
    return []
  }

  let providers: Array<{ provider_name: string; provider_id: number; type: string }> = []

  // Handle both array format and object format with ads/flatrate
  if (Array.isArray(show.streaming_info.US)) {
    // Old format: direct array
    providers = show.streaming_info.US.filter(provider =>
      STREAMING_PROVIDER_IDS.includes(provider.provider_id)
    )
  } else if (typeof show.streaming_info.US === 'object') {
    // New format: object with ads, flatrate, etc.
    const usInfo = show.streaming_info.US as any
    const allProviders: any[] = []
    
    if (usInfo.flatrate && Array.isArray(usInfo.flatrate)) {
      allProviders.push(...usInfo.flatrate)
    }
    if (usInfo.ads && Array.isArray(usInfo.ads)) {
      allProviders.push(...usInfo.ads)
    }
    if (usInfo.rent && Array.isArray(usInfo.rent)) {
      allProviders.push(...usInfo.rent)
    }
    if (usInfo.buy && Array.isArray(usInfo.buy)) {
      allProviders.push(...usInfo.buy)
    }
    
    providers = allProviders
      .filter(provider =>
        provider.provider_id &&
        provider.provider_name &&
        STREAMING_PROVIDER_IDS.includes(provider.provider_id)
      )
      .map(provider => ({
        provider_name: provider.provider_name,
        provider_id: provider.provider_id,
        type: provider.type || 'flatrate'
      }))
  }

  // Normalize names and keep only canonical ones
  const seenByName = new Set<string>()
  const normalized = providers
    .map(p => ({ ...p, provider_name: normalizeStreamerName(p.provider_name) || '' }))
    .filter(p => p.provider_name && CANONICAL_STREAMERS.has(p.provider_name))
    .filter(p => {
      if (seenByName.has(p.provider_name)) return false
      seenByName.add(p.provider_name)
      return true
    })

  return normalized
}

/**
 * Format show air date
 */
export function formatAirDate(dateString: string | null): string {
  if (!dateString) return ''

  // Expect full date and show in Estonian style: DD.MM.YYYY
  const fullDateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (fullDateMatch) {
    const [, y, m, d] = fullDateMatch
    return `${d}.${m}.${y}`
  }

  // Fallback: try to parse and format as DD.MM.YYYY using UTC to avoid TZ shifts
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    // If it's not parseable (e.g., just a year), return as-is
    // to avoid inventing a day/month
    return dateString
  }
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${d}.${m}.${y}`
}

/**
 * Determine if a show is NEW (within one month of first_air_date)
 */
export function isNewRelease(firstAirDate: string | null, now: Date = new Date()): boolean {
  if (!firstAirDate) return false

  // Prefer strict YYYY-MM-DD parsing to avoid TZ differences
  const m = firstAirDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  let start: Date | null = null
  if (m) {
    const y = Number(m[1])
    const mo = Number(m[2]) - 1
    const d = Number(m[3])
    start = new Date(Date.UTC(y, mo, d))
  } else {
    const parsed = new Date(firstAirDate)
    if (!isNaN(parsed.getTime())) {
      // Normalize to UTC midnight
      start = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()))
    }
  }
  if (!start) return false

  const expiry = new Date(start)
  // Add one calendar month (handles month length automatically)
  expiry.setUTCMonth(expiry.getUTCMonth() + 1)

  // Compare using UTC midnight
  const nowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  return nowUTC <= expiry
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
          streamers: show.streamers || null,
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
  
  const airDate = nextSeasonDate.toLocaleDateString('et-EE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
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
    // Always return the full canonical list so filters show all options
    const streamers = CANONICAL_STREAMER_LIST.map((name, idx) => ({ id: idx + 1, name }))
    return { streamers, error: null }
  } catch (error) {
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

// ====== COMPREHENSIVE DATABASE SEARCH (NO SCHEMA CHANGES) ======

/**
 * Search shows across entire database using existing fields only
 * Searches name, original_name, creators, and main_cast with 3-character minimum
 */
export async function searchShowsDatabase(params: {
  query: string
  limit?: number
  offset?: number
  genreIds?: number[]
  yearRange?: [number, number]
  streamerIds?: number[]
  userId?: string
  excludeUserShows?: boolean
  sortBy?: SortOption
}): Promise<{ shows: ShowWithGenres[]; error: any; hasMore: boolean; rawFetched: number; nextOffset: number }> {
  try {
    const q = params.query?.trim() || ''
    if (q.length < 3) {
      return { shows: [], error: null, hasMore: false, rawFetched: 0, nextOffset: params.offset || 0 }
    }

    console.log('🔍 [searchShowsDatabase] Searching entire database for:', q)
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }

    // Get user's show IDs if we need to exclude them
    let userShowIds: string[] = []
    if (params.excludeUserShows && params.userId) {
      try {
        const userShowsUrl = `${supabaseUrl}/rest/v1/user_shows?select=imdb_id&user_id=eq.${params.userId}`
        const userShowsResponse = await fetch(userShowsUrl, { method: 'GET', headers })
        if (userShowsResponse.ok) {
          const userShows = await userShowsResponse.json()
          userShowIds = userShows.map((us: any) => us.imdb_id)
        }
      } catch (error) {
        console.warn('⚠️ [searchShowsDatabase] Failed to fetch user shows:', error)
      }
    }

    // Use a more efficient approach: fetch fewer shows but prioritize high-quality content
    const searchLimit = Math.min(1000, 1000) // Reduced from 6000 to 1000 for better performance
    const searchTerm = q.toLowerCase()
    
    console.log(`🔍 [searchShowsDatabase] Fetching ${searchLimit} high-rated shows for comprehensive search`)
    
    // Build query filters
    let queryParams = []
    
    // Year range filter
    if (params.yearRange && !(params.yearRange[0] === 1950 && params.yearRange[1] === 2025)) {
      const [minYear, maxYear] = params.yearRange
      queryParams.push(`first_air_date=gte.${minYear}-01-01`)
      queryParams.push(`first_air_date=lte.${maxYear}-12-31`)
    }
    
    const queryString = queryParams.length > 0 ? '&' + queryParams.join('&') : ''
    
    // Single optimized query prioritizing high-rated content
    const url = `${supabaseUrl}/rest/v1/shows?select=imdb_id,id,name,original_name,first_air_date,imdb_rating,imdb_vote_count,vote_average,vote_count,our_score,overview,poster_url,poster_thumb_url,genre_ids,number_of_seasons,number_of_episodes,type,streaming_info,streamers,main_cast,creators&limit=${searchLimit}&offset=0${queryString}&order=our_score.desc.nullslast,imdb_rating.desc.nullslast`
    
    const response = await fetch(url, { method: 'GET', headers })
    
    if (!response.ok) {
      console.error('❌ [searchShowsDatabase] Database query failed:', response.status)
      return { shows: [], error: new Error(`Database query failed: ${response.status}`), hasMore: false, rawFetched: 0, nextOffset: params.offset || 0 }
    }

    let allShows = await response.json()
    
    console.log(`🔍 [searchShowsDatabase] Fetched ${allShows.length} shows total for search`)
    
    // Apply user exclusion filter
    if (params.excludeUserShows && userShowIds.length > 0) {
      const beforeCount = allShows.length
      allShows = allShows.filter((show: any) => !userShowIds.includes(show.imdb_id))
      console.log(`🔍 [searchShowsDatabase] After user shows filter: ${beforeCount} -> ${allShows.length}`)
    }
    
    // Apply genre filtering
    if (params.genreIds && params.genreIds.length > 0) {
      const beforeCount = allShows.length
      allShows = allShows.filter((show: any) => {
        const showGenres = show.genre_ids || []
        return params.genreIds!.some(genreId => showGenres.includes(genreId))
      })
      console.log(`🔍 [searchShowsDatabase] After genre filter: ${beforeCount} -> ${allShows.length}`)
    }
    
    // Apply streaming provider filtering (by canonical names)
    if (params.streamerIds && params.streamerIds.length > 0) {
      const beforeCount = allShows.length
      const selectedNames = new Set(
        params.streamerIds
          .map(id => CANONICAL_STREAMER_LIST[id - 1])
          .filter(Boolean)
      )
      allShows = allShows.filter((show: any) => {
        if (!show.streaming_info?.US) return false
        const providers: any[] = []
        if (Array.isArray(show.streaming_info.US)) {
          providers.push(...show.streaming_info.US)
        } else if (typeof show.streaming_info.US === 'object') {
          const usInfo = show.streaming_info.US
          if (usInfo.flatrate && Array.isArray(usInfo.flatrate)) providers.push(...usInfo.flatrate)
          if (usInfo.ads && Array.isArray(usInfo.ads)) providers.push(...usInfo.ads)
          if (usInfo.rent && Array.isArray(usInfo.rent)) providers.push(...usInfo.rent)
          if (usInfo.buy && Array.isArray(usInfo.buy)) providers.push(...usInfo.buy)
        }
        const names = new Set(
          providers
            .map((p: any) => normalizeStreamerName(p.provider_name))
            .filter((n: any): n is string => !!n)
        )
        for (const n of selectedNames) {
          if (names.has(n)) return true
        }
        return false
      })
      console.log(`🔍 [searchShowsDatabase] After streaming filter: ${beforeCount} -> ${allShows.length}`)
    }
    
    // Client-side search across name, original_name, creators, and main_cast
    const searchResults = allShows
      .map((show: any) => {
        const score = scoreShowAgainstQuery(show, q)
        return { show, score }
      })
      .filter((item: { show: any; score: number }) => item.score > 0)
      .sort((a: { show: any; score: number }, b: { show: any; score: number }) => {
        // Apply sorting based on sortBy parameter
        if (params.sortBy) {
          const sortedShows = applySortingToShows([a.show, b.show], params.sortBy)
          // If a.show comes first in sorted array, return -1 (a before b)
          return sortedShows[0].imdb_id === a.show.imdb_id ? -1 : 1
        }
        // Default: sort by relevance score
        return b.score - a.score
      })
      .map((item: { show: any; score: number }) => item.show)
    
    console.log(`🔍 [searchShowsDatabase] Found ${searchResults.length} matching shows`)
    
    // Apply pagination
    const limit = params.limit || 20
    const offset = params.offset || 0
    const paginatedResults = searchResults.slice(offset, offset + limit)
    const hasMore = offset + limit < searchResults.length
    
    // Clean up the shows data
    const cleanedShows = paginatedResults.map((show: any) => ({
      ...show,
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
      streamers: show.streamers || null,
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

    // Add genre names
    const showsWithGenres = await addGenreNames(cleanedShows)
    
    return {
      shows: showsWithGenres,
      error: null,
      hasMore,
      rawFetched: allShows.length,
      nextOffset: offset + limit
    }
  } catch (error) {
    console.error('❌ [searchShowsDatabase] Error:', error)
    return { shows: [], error, hasMore: false, rawFetched: 0, nextOffset: params.offset || 0 }
  }
}

/**
 * Quick search suggestions using optimized database query with 3-character minimum
 */
export async function quickSearchDatabase(params: {
  prefix: string
  genreIds?: number[]
  yearRange?: [number, number]
  streamerIds?: number[]
  limit?: number
  userId?: string
}): Promise<{ suggestions: Array<{ imdb_id: string; name: string; original_name: string | null; creators: string[]; main_cast: string[]; user_status?: ShowStatus }>; error: any }> {
  try {
    const q = params.prefix?.trim() || ''
    if (q.length < 3) {
      return { suggestions: [], error: null }
    }

    console.log('🔍 [quickSearchDatabase] Quick search for:', q)
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }

    // Get user's show IDs if we need to exclude them
    let userShowIds: string[] = []
    if (params.userId) {
      try {
        const userShowsUrl = `${supabaseUrl}/rest/v1/user_shows?select=imdb_id&user_id=eq.${params.userId}`
        const userShowsResponse = await fetch(userShowsUrl, { method: 'GET', headers })
        if (userShowsResponse.ok) {
          const userShows = await userShowsResponse.json()
          userShowIds = userShows.map((us: any) => us.imdb_id)
        }
      } catch (error) {
        console.warn('⚠️ [quickSearchDatabase] Failed to fetch user shows:', error)
      }
    }

    // Use a smarter search strategy: try multiple approaches to find matches
    const searchTerm = q.toLowerCase()
    
    console.log(`🔍 [quickSearchDatabase] Using smart search strategy for: "${q}"`)
    
    // Build query filters for year range
    let queryParams = []
    if (params.yearRange && !(params.yearRange[0] === 1950 && params.yearRange[1] === 2025)) {
      const [minYear, maxYear] = params.yearRange
      queryParams.push(`first_air_date=gte.${minYear}-01-01`)
      queryParams.push(`first_air_date=lte.${maxYear}-12-31`)
    }
    
    const queryString = queryParams.length > 0 ? '&' + queryParams.join('&') : ''
    
    // Strategy 1: Try direct database search using ilike for exact matches first
    console.log(`🔍 [quickSearchDatabase] Strategy 1: Direct database search for "${q}"`)
    const directSearchUrl = `${supabaseUrl}/rest/v1/shows?select=imdb_id,id,name,original_name,first_air_date,imdb_rating,imdb_vote_count,vote_average,vote_count,our_score,overview,poster_url,poster_thumb_url,genre_ids,number_of_seasons,number_of_episodes,type,streaming_info,streamers,main_cast,creators&or=(name.ilike.*${encodeURIComponent(q)}*,original_name.ilike.*${encodeURIComponent(q)}*)&limit=50${queryString}&order=our_score.desc.nullslast,imdb_rating.desc.nullslast`
    
    let directMatches = []
    try {
      const directResponse = await fetch(directSearchUrl, { method: 'GET', headers })
      if (directResponse.ok) {
        directMatches = await directResponse.json()
        console.log(`🔍 [quickSearchDatabase] Strategy 1 found ${directMatches.length} direct matches`)
      }
    } catch (error) {
      console.warn('⚠️ [quickSearchDatabase] Strategy 1 failed:', error)
    }
    
    // Strategy 2: If we have enough direct matches, use them; otherwise fetch more shows for client-side search
    let allShows = directMatches
    
    if (directMatches.length < 5) {
      console.log(`🔍 [quickSearchDatabase] Strategy 2: Fetching more shows for client-side search`)
      const fallbackLimit = 1000 // Increased from 200 to 1000 for better coverage
      const fallbackUrl = `${supabaseUrl}/rest/v1/shows?select=imdb_id,id,name,original_name,first_air_date,imdb_rating,imdb_vote_count,vote_average,vote_count,our_score,overview,poster_url,poster_thumb_url,genre_ids,number_of_seasons,number_of_episodes,type,streaming_info,streamers,main_cast,creators&limit=${fallbackLimit}&offset=0${queryString}&order=our_score.desc.nullslast,imdb_rating.desc.nullslast`
      
      const fallbackResponse = await fetch(fallbackUrl, { method: 'GET', headers })
      
      if (!fallbackResponse.ok) {
        console.error('❌ [quickSearchDatabase] Fallback database query failed:', fallbackResponse.status)
        return { suggestions: [], error: new Error(`Database query failed: ${fallbackResponse.status}`) }
      }

      const fallbackShows = await fallbackResponse.json()
      console.log(`🔍 [quickSearchDatabase] Strategy 2 fetched ${fallbackShows.length} shows for client-side search`)
      
      // Combine direct matches with fallback shows, removing duplicates
      const seenIds = new Set(directMatches.map((show: any) => show.imdb_id))
      const uniqueFallbackShows = fallbackShows.filter((show: any) => !seenIds.has(show.imdb_id))
      allShows = [...directMatches, ...uniqueFallbackShows]
    }
    
    console.log(`🔍 [quickSearchDatabase] Total shows to search: ${allShows.length}`)
    
    // Apply genre filtering if specified
    if (params.genreIds && params.genreIds.length > 0) {
      const beforeCount = allShows.length
      allShows = allShows.filter((show: any) => {
        const showGenres = show.genre_ids || []
        return params.genreIds!.some(genreId => showGenres.includes(genreId))
      })
      console.log(`🔍 [quickSearchDatabase] After genre filter: ${beforeCount} -> ${allShows.length}`)
    }
    
    // Apply streaming provider filtering if specified (by canonical names)
    if (params.streamerIds && params.streamerIds.length > 0) {
      const beforeCount = allShows.length
      const selectedNames = new Set(
        params.streamerIds
          .map(id => CANONICAL_STREAMER_LIST[id - 1])
          .filter(Boolean)
      )
      allShows = allShows.filter((show: any) => {
        if (!show.streaming_info?.US) return false
        const providers: any[] = []
        if (Array.isArray(show.streaming_info.US)) {
          providers.push(...show.streaming_info.US)
        } else if (typeof show.streaming_info.US === 'object') {
          const usInfo = show.streaming_info.US
          if (usInfo.flatrate && Array.isArray(usInfo.flatrate)) providers.push(...usInfo.flatrate)
          if (usInfo.ads && Array.isArray(usInfo.ads)) providers.push(...usInfo.ads)
          if (usInfo.rent && Array.isArray(usInfo.rent)) providers.push(...usInfo.rent)
          if (usInfo.buy && Array.isArray(usInfo.buy)) providers.push(...usInfo.buy)
        }
        const names = new Set(
          providers
            .map((p: any) => normalizeStreamerName(p.provider_name))
            .filter((n: any): n is string => !!n)
        )
        for (const n of selectedNames) {
          if (names.has(n)) return true
        }
        return false
      })
      console.log(`🔍 [quickSearchDatabase] After streaming filter: ${beforeCount} -> ${allShows.length}`)
    }
    
    // Client-side search with scoring
    const searchResults = allShows
      .map((show: any) => {
        const score = scoreShowAgainstQuery(show, q)
        return { show, score }
      })
      .filter((item: { show: any; score: number }) => item.score > 0)
      .sort((a: { show: any; score: number }, b: { show: any; score: number }) => b.score - a.score) // Sort by relevance score
      .slice(0, params.limit || 10) // Take top results
      .map((item: { show: any; score: number }) => item.show)
    
    console.log(`🔍 [quickSearchDatabase] Found ${searchResults.length} matching shows`)
    
    // Convert to suggestion format
    let suggestions = searchResults.map((show: any) => ({
      imdb_id: show.imdb_id,
      name: show.name,
      original_name: show.original_name,
      creators: show.creators || [],
      main_cast: show.main_cast || []
    }))
    
    // If user is provided, add their show statuses
    if (params.userId && suggestions.length > 0) {
      const imdbIds = suggestions.map((s: any) => s.imdb_id)
      const { statuses, error: statusError } = await getUserShowStatuses(params.userId, imdbIds)
      
      if (!statusError) {
        suggestions = suggestions.map((suggestion: any) => ({
          ...suggestion,
          user_status: statuses[suggestion.imdb_id]
        }))
      }
    }
    
    console.log(`🔍 [quickSearchDatabase] Returning ${suggestions.length} suggestions`)
    
    return { suggestions, error: null }
  } catch (error) {
    console.error('❌ [quickSearchDatabase] Error:', error)
    return { suggestions: [], error }
  }
}

/**
 * Get user's show statuses for a list of shows
 */
export async function getUserShowStatuses(
  userId: string,
  imdbIds: string[]
): Promise<{ statuses: Record<string, ShowStatus>, error: any }> {
  try {
    if (!userId || imdbIds.length === 0) {
      return { statuses: {}, error: null }
    }

    console.log('🔍 [getUserShowStatuses] Fetching statuses for', imdbIds.length, 'shows')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }

    // Build query to get user shows for the given IMDB IDs
    const imdbFilter = imdbIds.map(id => `imdb_id.eq.${id}`).join(',')
    const url = `${supabaseUrl}/rest/v1/user_shows?select=imdb_id,status&user_id=eq.${userId}&or=(${imdbFilter})`
    
    const response = await fetch(url, { method: 'GET', headers })
    
    if (!response.ok) {
      console.error('Error fetching user show statuses:', response.status)
      return { statuses: {}, error: new Error(`Failed to fetch user show statuses: ${response.status}`) }
    }

    const userShows = await response.json()
    
    // Convert to a map of imdb_id -> status
    const statuses: Record<string, ShowStatus> = {}
    userShows?.forEach((userShow: any) => {
      if (userShow.imdb_id && userShow.status) {
        statuses[userShow.imdb_id] = userShow.status
      }
    })
    
    console.log('🔍 [getUserShowStatuses] Found statuses for', Object.keys(statuses).length, 'shows')
    
    return { statuses, error: null }
  } catch (error) {
    console.error('❌ [getUserShowStatuses] Error:', error)
    return { statuses: {}, error }
  }
}


// ====== Client-side search helpers (no DB changes) ======

function normalizeText(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function tokenize(q: string): string[] {
  return normalizeText(q).split(/\s+/).filter(Boolean)
}

function scoreShowAgainstQuery(show: Show, query: string): number {
  const q = normalizeText(query)
  if (!q) return 0

  const tokens = tokenize(q)
  const name = normalizeText(show.name)
  const original = normalizeText(show.original_name)
  const creators = (show.creators || []).map(normalizeText)
  const cast = (show.main_cast || []).map(normalizeText)

  let score = 0
  let hasMatch = false

  // EXACT MATCHES (highest priority)
  if (name === q) {
    score += 100
    hasMatch = true
  } else if (original === q) {
    score += 95
    hasMatch = true
  }

  // PREFIX MATCHES (second priority) - only if query starts the title or original name
  if (!hasMatch && name.startsWith(q) && q.length >= 3) {
    score += 80
    hasMatch = true
  } else if (!hasMatch && original && original.startsWith(q) && q.length >= 3) {
    score += 75
    hasMatch = true
  }

  // WORD BOUNDARY MATCHES (third priority) - query must start a word in the title
  if (!hasMatch) {
    const nameWords = name.split(/\s+/)
    const originalWords = original ? original.split(/\s+/) : []
    
    // Check if query matches the start of any word in the title
    for (const word of nameWords) {
      if (word.startsWith(q) && q.length >= 3) {
        score += 60
        hasMatch = true
        break
      }
    }
    
    if (!hasMatch) {
      for (const word of originalWords) {
        if (word.startsWith(q) && q.length >= 3) {
          score += 55
          hasMatch = true
          break
        }
      }
    }
  }

  // SUBSTRING MATCHES (fourth priority) - only if query is contained in title
  if (!hasMatch && q.length >= 3) {
    if (name.includes(q)) {
      score += 30
      hasMatch = true
    } else if (original && original.includes(q)) {
      score += 25
      hasMatch = true
    }
  }

  // MULTI-TOKEN MATCHING (for phrases) - all tokens must match
  if (!hasMatch && tokens.length > 1) {
    let tokenScore = 0
    let matchedTokens = 0
    const nameWords = name.split(/\s+/)
    const originalWords = original ? original.split(/\s+/) : []
    
    for (const token of tokens) {
      if (token.length < 2) continue
      
      let tokenMatched = false
      
      // Check if token starts any word in title
      for (const word of nameWords) {
        if (word.startsWith(token)) {
          tokenMatched = true
          tokenScore += 15
          break
        }
      }
      
      if (!tokenMatched) {
        for (const word of originalWords) {
          if (word.startsWith(token)) {
            tokenMatched = true
            tokenScore += 12
            break
          }
        }
      }
      
      // If no word start match, check substring in title
      if (!tokenMatched && token.length >= 3) {
        if (name.includes(token)) {
          tokenMatched = true
          tokenScore += 8
        } else if (original && original.includes(token)) {
          tokenMatched = true
          tokenScore += 6
        }
      }
      
      if (tokenMatched) {
        matchedTokens++
      }
    }
    
    // Require ALL tokens to match for multi-token queries
    if (matchedTokens === tokens.length && tokenScore > 0) {
      score += tokenScore
      hasMatch = true
    }
  }

  // CREATOR/CAST MATCHES - only if query matches creator or cast member name
  if (!hasMatch && q.length >= 3) {
    for (const creator of creators) {
      if (creator.startsWith(q) || creator.includes(` ${q}`) || creator.includes(`-${q}`)) {
        score += 40
        hasMatch = true
        break
      }
    }
    
    if (!hasMatch) {
      for (const actor of cast) {
        if (actor.startsWith(q) || actor.includes(` ${q}`) || actor.includes(`-${q}`)) {
          score += 35
          hasMatch = true
          break
        }
      }
    }
  }

  // Return 0 if no match found
  if (!hasMatch) return 0

  // Light rating tie-breaker (very small impact)
  const our = show.our_score || 0
  const imdb = show.imdb_rating || 0
  const tmdb = show.vote_average || 0
  const tieBreak = Math.max(our, imdb, tmdb)
  score += tieBreak * 0.001

  return score
}

/**
 * searchShowsClient - Client-side search over a fetched page.
 * The function fetches one "page" using fetchShows with active filters, then scores and sorts locally.
 * Pagination/hasMore mirrors the underlying fetchShows call.
 */
export async function searchShowsClient(params: {
  query: string
  limit?: number
  offset?: number
  genreIds?: number[]
  yearRange?: [number, number]
  streamerIds?: number[]
  userId?: string
  excludeUserShows?: boolean
}): Promise<{ shows: ShowWithGenres[]; error: any; hasMore: boolean; rawFetched: number; nextOffset: number }> {
  try {
    // Scan multiple pages to collect enough substring matches and rank them
    const uiPageSize = params.limit ?? 20
    const targetMatches = Math.max(uiPageSize * 3, 60) // aim to collect many then slice top N
    const scanPageSize = 50

    let currentOffset = params.offset ?? 0
    let hasMoreServer = true
    let totalScanned = 0
    let lastNextOffset = currentOffset

    const seen = new Set<string>()
    const scored: Array<{ s: ShowWithGenres; score: number }> = []

    while (hasMoreServer && scored.length < targetMatches) {
      const base = await fetchShows({
        limit: scanPageSize,
        offset: currentOffset,
        showInDiscovery: false,
        excludeUserShows: !!params.excludeUserShows && !!params.userId,
        userId: params.userId,
        sortBy: 'latest',
        genreIds: params.genreIds && params.genreIds.length > 0 ? params.genreIds : undefined,
        yearRange: params.yearRange,
        streamerIds: params.streamerIds && params.streamerIds.length > 0 ? params.streamerIds : undefined
      })

      if (base.error) {
        return { shows: [], error: base.error, hasMore: false, rawFetched: 0, nextOffset: currentOffset }
      }

      totalScanned += base.rawFetched || 0

      for (const s of base.shows) {
        const score = scoreShowAgainstQuery(s as any, params.query)
        if (score > 0 && !seen.has(s.imdb_id)) {
          seen.add(s.imdb_id)
          scored.push({ s: s as ShowWithGenres, score })
        }
      }

      hasMoreServer = !!base.hasMore
      lastNextOffset = base.nextOffset ?? currentOffset

      // advance; guard against no progress
      if (!hasMoreServer || (base.rawFetched || 0) === 0 || base.nextOffset === currentOffset) {
        break
      }
      currentOffset = lastNextOffset
    }

    // Rank by relevance and take the top N to display
    const ranked = scored.sort((a, b) => b.score - a.score).map(x => x.s)
    const shows = ranked.slice(0, uiPageSize)

    return {
      shows,
      error: null,
      hasMore: hasMoreServer,
      rawFetched: totalScanned,
      nextOffset: lastNextOffset
    }
  } catch (error) {
    return { shows: [], error, hasMore: false, rawFetched: 0, nextOffset: params.offset ?? 0 }
  }
}

/**
 * quickSearchClientSuggestions - Get up to N suggestions using a single filtered fetch and local ranking.
 */
export async function quickSearchClientSuggestions(params: {
  prefix: string
  genreIds?: number[]
  yearRange?: [number, number]
  streamerIds?: number[]
  limit?: number
}): Promise<{ suggestions: Array<{ imdb_id: string; name: string; original_name: string | null; creators: string[]; main_cast: string[] }>; error: any }> {
  try {
    const q = params.prefix?.trim() || ''
    if (q.length < 3) return { suggestions: [], error: null }

    // Fetch a moderately sized sample to rank suggestions from
    const base = await fetchShows({
      limit: 80,
      offset: 0,
      showInDiscovery: false,
      excludeUserShows: false, // suggestions do not exclude user shows to keep it simple
      sortBy: 'latest',
      genreIds: params.genreIds && params.genreIds.length > 0 ? params.genreIds : undefined,
      yearRange: params.yearRange,
      streamerIds: params.streamerIds && params.streamerIds.length > 0 ? params.streamerIds : undefined
    })

    if (base.error) {
      return { suggestions: [], error: base.error }
    }

    const ranked = base.shows
      .map(s => ({ s, score: scoreShowAgainstQuery(s, q) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, params.limit ?? 8)
      .map(x => ({
        imdb_id: x.s.imdb_id,
        name: x.s.name,
        original_name: x.s.original_name,
        creators: x.s.creators || [],
        main_cast: x.s.main_cast || []
      }))

    return { suggestions: ranked, error: null }
  } catch (error) {
    return { suggestions: [], error }
  }
}

/**
 * Fetch a specific show by IMDB ID
 */
export async function fetchShowByImdbId(
  imdbId: string,
  userId?: string
): Promise<{ show: ShowWithGenres | null, error: any }> {
  try {
    console.log('🔍 [fetchShowByImdbId] Fetching show:', imdbId)
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }

    const url = `${supabaseUrl}/rest/v1/shows?select=imdb_id,id,name,original_name,first_air_date,imdb_rating,imdb_vote_count,vote_average,vote_count,our_score,overview,poster_url,poster_thumb_url,genre_ids,number_of_seasons,number_of_episodes,type,streaming_info,streamers,main_cast,creators&imdb_id=eq.${imdbId}&limit=1`
    
    const response = await fetch(url, { method: 'GET', headers })
    
    if (!response.ok) {
      console.error('Error fetching show by IMDB ID:', response.status)
      return { show: null, error: new Error(`Failed to fetch show: ${response.status}`) }
    }

    const shows = await response.json()
    
    if (!shows || shows.length === 0) {
      return { show: null, error: null }
    }

    const show = shows[0]
    
    // Clean up the show data
    const cleanedShow = {
      ...show,
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

    // Add genre names
    const showsWithGenres = await addGenreNames([cleanedShow])
    let finalShow = showsWithGenres[0]

    // Add user status if userId is provided
    if (userId) {
      const { statuses, error: statusError } = await getUserShowStatuses(userId, [imdbId])
      if (!statusError && statuses[imdbId]) {
        finalShow = { ...finalShow, user_status: statuses[imdbId] }
      }
    }
    
    console.log('🔍 [fetchShowByImdbId] Found show:', finalShow.name)
    
    return { show: finalShow, error: null }
  } catch (error) {
    console.error('❌ [fetchShowByImdbId] Error:', error)
    return { show: null, error }
  }
}
