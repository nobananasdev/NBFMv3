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
}): Promise<{ shows: ShowWithGenres[], error: any }> {
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
        }
      } catch (userShowsError) {
        console.error('⚠️ [fetchShows] Failed to fetch user shows, continuing without exclusion:', userShowsError)
      }
    }
    
    // Step 2: Fetch all shows
    console.log('🔍 [fetchShows] Fetching all shows...')
    const url = `${supabaseUrl}/rest/v1/shows?select=imdb_id,title,show_in_discovery,tmdb_id,original_title,first_air_date,last_air_date,status,imdb_rating,imdb_vote_count,tmdb_rating,tmdb_vote_count,our_score,overview,our_description,poster_path,poster_url,poster_thumb_url,genre_ids,trailer_key,season_count,episode_count,show_type,streaming_info,next_season_date,created_at,updated_at,tmdb_synced_at,needs_sync,is_hidden,is_trash,main_cast,creators,origin_country,original_language&limit=${(options.limit || 20) + userShowIds.length}`
    
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
    
    // Step 3: Filter out user shows if needed
    let filteredShows = shows || []
    if (options.excludeUserShows && userShowIds.length > 0) {
      const beforeCount = filteredShows.length
      filteredShows = filteredShows.filter((show: any) => !userShowIds.includes(show.imdb_id))
      console.log(`🔍 [fetchShows] Filtered out user shows: ${beforeCount} -> ${filteredShows.length}`)
    }
    
    // Step 4: Apply discovery filtering
    if (options.showInDiscovery) {
      filteredShows = filteredShows.filter((show: any) => show.show_in_discovery === true)
      console.log(`🔍 [fetchShows] After discovery filter: ${filteredShows.length} shows`)
    }
    
    // Step 5: Apply sorting
    if (options.sortBy && filteredShows.length > 0) {
      filteredShows = applySortingToShows(filteredShows, options.sortBy)
    }
    
    // Step 6: Apply limit after filtering and sorting
    if (options.limit) {
      filteredShows = filteredShows.slice(options.offset || 0, (options.offset || 0) + options.limit)
    }
    
    console.log(`🔍 [fetchShows] Final result: ${filteredShows.length} shows`)
    
    // Clean up the shows data with proper fallbacks
    const cleanedShows = filteredShows.map((show: any) => ({
      ...show,
      // Add required fields as fallbacks
      tmdb_id: show.tmdb_id || 0,
      original_title: show.original_title || show.title,
      first_air_date: show.first_air_date || '2024-01-01',
      last_air_date: show.last_air_date || null,
      status: show.status || 'Unknown',
      imdb_rating: show.imdb_rating || 0,
      imdb_vote_count: show.imdb_vote_count || 0,
      tmdb_rating: show.tmdb_rating || 0,
      tmdb_vote_count: show.tmdb_vote_count || 0,
      our_score: show.our_score || 0,
      overview: show.overview || 'No overview',
      our_description: show.our_description || null,
      poster_path: show.poster_path || null,
      poster_url: show.poster_url || null,
      poster_thumb_url: show.poster_thumb_url || null,
      genre_ids: show.genre_ids || [],
      trailer_key: show.trailer_key || null,
      season_count: show.season_count || 1,
      episode_count: show.episode_count || 1,
      show_type: show.show_type || 'Series',
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

    return { shows: showsWithGenres, error: null }
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
      query = query.in('status', ['liked_it', 'loved_it'])
    } else {
      query = query.eq('status', status)
    }

    // 🐛 DEBUG: Enhanced sorting with proper support for all options
    console.log(`🔍 [fetchUserShows] Applying sorting: ${options?.sortBy}`)
    switch (options?.sortBy) {
      case 'recently_added':
        query = query.order('created_at', { ascending: false })
        break
      case 'best_rated':
        // 🐛 FIX: This should not sort by updated_at, we'll handle rating sorting in memory
        query = query.order('created_at', { ascending: false })
        break
      case 'by_rating':
        // For grouped by rating, we'll sort by status first, then by created_at
        query = query.order('status', { ascending: false }).order('created_at', { ascending: false })
        break
      case 'latest':
        // Sort by when the show was added to user's list
        query = query.order('created_at', { ascending: false })
        break
      case 'rating':
        // We'll handle rating sorting in memory since it's based on show data
        query = query.order('created_at', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
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

    let shows = userShows?.map(us => ({
      ...us.shows,
      user_status: us.status
    })).filter(Boolean) || []
    
    console.log(`🔍 [fetchUserShows] Retrieved ${shows.length} shows before in-memory sorting`)
    
    // 🐛 FIX: Apply in-memory sorting for rating-based sorts
    if (options?.sortBy === 'best_rated' || options?.sortBy === 'rating') {
      console.log(`🔍 [fetchUserShows] Applying in-memory rating sort: ${options.sortBy}`)
      shows = shows.sort((a, b) => {
        const ratingA = a.imdb_rating || a.tmdb_rating || a.our_score || 0
        const ratingB = b.imdb_rating || b.tmdb_rating || b.our_score || 0
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
        const ratingA = a.imdb_rating || a.tmdb_rating || a.our_score || 0
        const ratingB = b.imdb_rating || b.tmdb_rating || b.our_score || 0
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
        const ratingA = a.imdb_rating || a.tmdb_rating || a.our_score || 0
        const ratingB = b.imdb_rating || b.tmdb_rating || b.our_score || 0
        return ratingB - ratingA
      })
    
    case 'by_rating':
      return shows.sort((a, b) => {
        const ratingA = a.imdb_rating || a.tmdb_rating || a.our_score || 0
        const ratingB = b.imdb_rating || b.tmdb_rating || b.our_score || 0
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
  const { show_type, season_count, status } = show

  if (show_type === 'Miniseries') {
    return 'Mini Series'
  }

  if (!season_count || season_count === 0) {
    return 'Series'
  }

  if (season_count === 1) {
    return `1 season${status ? `, ${status}` : ''}`
  }

  return `${season_count} seasons${status ? `, ${status}` : ''}`
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
      .map(us => us.shows as unknown as Show)
      .filter(Boolean)
      .filter((show: Show) => {
        if (!show.next_season_date) return false
        
        const nextSeasonDate = new Date(show.next_season_date)
        
        // Show if upcoming (future) or recent (within 6 months)
        return nextSeasonDate > sixMonthsAgo
      })
      .sort((a: Show, b: Show) => {
        // Sort by next_season_date, closest first
        const dateA = new Date(a.next_season_date!)
        const dateB = new Date(b.next_season_date!)
        return dateA.getTime() - dateB.getTime()
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
  const seasonCount = show.season_count || 0
  
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