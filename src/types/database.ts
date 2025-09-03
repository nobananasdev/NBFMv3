export interface Database {
  public: {
    Tables: {
      shows: {
        Row: Show
        Insert: Omit<Show, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Show, 'imdb_id' | 'created_at' | 'updated_at'>>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      user_shows: {
        Row: UserShow
        Insert: Omit<UserShow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserShow, 'id' | 'user_id' | 'imdb_id' | 'created_at' | 'updated_at'>>
      }
      genres: {
        Row: Genre
        Insert: Genre
        Update: Partial<Genre>
      }
    }
    Enums: {
      show_status: ShowStatus
    }
  }
}

export interface Show {
  // Core identifiers
  imdb_id: string // PRIMARY KEY
  id: number | null
  name: string
  original_name: string | null
  
  // Dates and status
  first_air_date: string | null // DATE
  last_air_date: string | null // DATE
  status: string | null
  
  // Ratings and descriptions
  imdb_rating: number | null // DECIMAL(4,2)
  imdb_vote_count: number | null
  vote_average: number | null // DECIMAL(4,2)
  vote_count: number | null
  our_score: number | null // DECIMAL(4,2)
  overview: string | null
  our_description: string | null
  
  // Visuals and media
  poster_path: string | null
  poster_url: string | null
  poster_thumb_url: string | null
  genre_ids: number[] | null
  trailer_key: string | null
  
  // Series format and streaming
  number_of_seasons: number | null
  number_of_episodes: number | null
  type: string | null
  streaming_info: StreamingInfo | null
  // Optional simplified list of streaming providers from DB (names or IDs)
  streamers?: string[] | number[] | null
  next_season_date: string | null // DATE
  
  // Metadata and operations
  created_at: string // TIMESTAMPTZ
  updated_at: string // TIMESTAMPTZ
  tmdb_synced_at: string | null // TIMESTAMPTZ
  needs_sync: boolean
  is_hidden: boolean
  is_trash: boolean
  show_in_discovery: boolean
  
  // Cast & Crew
  main_cast: string[] | null
  creators: string[] | null
  
  // Production & Language
  origin_country: string[] | null
  original_language: string | null
}

export interface StreamingInfo {
  US?: StreamingProvider[]
  last_updated?: string
  data_source?: string
}

export interface StreamingProvider {
  provider_name: string
  provider_id: number
  type: string
}

export interface Profile {
  id: string // UUID, references auth.users
  display_name: string | null
  created_at: string // TIMESTAMPTZ
  preferences: Record<string, any> // JSONB
  is_admin: boolean
  interaction_count: number
}

export interface UserShow {
  id: number // BIGSERIAL
  user_id: string // UUID, references auth.users
  imdb_id: string // references shows(imdb_id)
  status: ShowStatus
  created_at: string // TIMESTAMPTZ
  updated_at: string // TIMESTAMPTZ
}

export interface Genre {
  id: number // INTEGER, TMDB genre ID
  name: string
}

export type ShowStatus = 'watchlist' | 'loved_it' | 'liked_it' | 'not_for_me'

// Hardcoded streaming provider IDs as specified in the project spec
export const STREAMING_PROVIDER_IDS = [8, 9, 337, 1899, 350, 15, 531, 386, 37, 43, 34, 526, 151, 294, 283, 99, 87]
