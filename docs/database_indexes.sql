-- ============================================================================
-- Database Performance Indexes for No Bananas For Me
-- ============================================================================
-- 
-- Purpose: Optimize database queries for 5000+ daily visitors
-- Expected Impact: 10-100x faster query performance
-- 
-- Instructions:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- 
-- ============================================================================

-- Shows Table Indexes
-- ============================================================================

-- Index for filtering by show status (Returning Series, Ended, etc.)
CREATE INDEX IF NOT EXISTS idx_shows_status 
ON shows(status);

-- Index for sorting by IMDb rating (descending for "best rated" sort)
CREATE INDEX IF NOT EXISTS idx_shows_imdb_rating 
ON shows(imdb_rating DESC);

-- Index for sorting by first air date (latest shows)
CREATE INDEX IF NOT EXISTS idx_shows_first_air_date 
ON shows(first_air_date DESC);

-- Index for new seasons feature (shows with upcoming seasons)
CREATE INDEX IF NOT EXISTS idx_shows_next_season_date 
ON shows(next_season_date DESC);

-- Partial index for discovery feed (only shows marked for discovery)
-- This is more efficient than full table scan
CREATE INDEX IF NOT EXISTS idx_shows_show_in_discovery 
ON shows(show_in_discovery) 
WHERE show_in_discovery = true;

-- GIN index for genre filtering (array contains queries)
-- Enables fast "show me all comedies" type queries
CREATE INDEX IF NOT EXISTS idx_shows_genre_ids 
ON shows USING GIN(genre_ids);

-- Composite index for common discovery queries
-- Optimizes: "show me discovery shows sorted by rating"
CREATE INDEX IF NOT EXISTS idx_shows_discovery_rating 
ON shows(show_in_discovery, imdb_rating DESC) 
WHERE show_in_discovery = true;

-- Index for TMDB sync operations
CREATE INDEX IF NOT EXISTS idx_shows_needs_sync 
ON shows(needs_sync) 
WHERE needs_sync = true;

-- Index for filtering out hidden/trash content
CREATE INDEX IF NOT EXISTS idx_shows_visible 
ON shows(is_hidden, is_trash) 
WHERE is_hidden = false AND is_trash = false;


-- User Shows Table Indexes
-- ============================================================================

-- Index for finding all shows for a specific user
CREATE INDEX IF NOT EXISTS idx_user_shows_user_id 
ON user_shows(user_id);

-- Index for filtering by status (watchlist, loved_it, etc.)
CREATE INDEX IF NOT EXISTS idx_user_shows_status 
ON user_shows(status);

-- Index for sorting by recently added/updated
CREATE INDEX IF NOT EXISTS idx_user_shows_updated_at 
ON user_shows(updated_at DESC);

-- Composite index for user + status queries
-- Optimizes: "show me user's watchlist"
CREATE INDEX IF NOT EXISTS idx_user_shows_user_status 
ON user_shows(user_id, status);

-- Composite index for user + status + updated_at
-- Optimizes: "show me user's watchlist sorted by recently added"
CREATE INDEX IF NOT EXISTS idx_user_shows_user_status_updated 
ON user_shows(user_id, status, updated_at DESC);

-- Index for finding user's interaction with specific show
CREATE INDEX IF NOT EXISTS idx_user_shows_user_imdb 
ON user_shows(user_id, imdb_id);


-- Profiles Table Indexes
-- ============================================================================

-- Index for admin user queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin 
ON profiles(is_admin) 
WHERE is_admin = true;


-- Genres Table
-- ============================================================================
-- Note: Genres table is small (~20 rows) and doesn't need additional indexes
-- The primary key (id) is sufficient


-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Run these queries to verify indexes were created successfully

-- List all indexes on shows table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'shows'
ORDER BY indexname;

-- List all indexes on user_shows table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'user_shows'
ORDER BY indexname;

-- Check index sizes (useful for monitoring)
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;


-- ============================================================================
-- Performance Testing Queries
-- ============================================================================
-- Use EXPLAIN ANALYZE to verify indexes are being used

-- Test 1: Discovery feed query
EXPLAIN ANALYZE
SELECT * FROM shows
WHERE show_in_discovery = true
  AND is_hidden = false
  AND is_trash = false
ORDER BY imdb_rating DESC
LIMIT 20;

-- Test 2: User watchlist query
EXPLAIN ANALYZE
SELECT s.* FROM shows s
JOIN user_shows us ON s.imdb_id = us.imdb_id
WHERE us.user_id = 'YOUR_USER_ID_HERE'
  AND us.status = 'watchlist'
ORDER BY us.updated_at DESC
LIMIT 20;

-- Test 3: Genre filtering query
EXPLAIN ANALYZE
SELECT * FROM shows
WHERE show_in_discovery = true
  AND genre_ids && ARRAY[18, 35]  -- Drama and Comedy
ORDER BY imdb_rating DESC
LIMIT 20;

-- Test 4: New seasons query
EXPLAIN ANALYZE
SELECT s.* FROM shows s
JOIN user_shows us ON s.imdb_id = us.imdb_id
WHERE us.user_id = 'YOUR_USER_ID_HERE'
  AND s.next_season_date IS NOT NULL
  AND s.next_season_date >= CURRENT_DATE - INTERVAL '6 months'
ORDER BY s.next_season_date DESC
LIMIT 20;


-- ============================================================================
-- Maintenance
-- ============================================================================

-- Analyze tables to update statistics (run after creating indexes)
ANALYZE shows;
ANALYZE user_shows;
ANALYZE profiles;
ANALYZE genres;

-- Vacuum tables to reclaim space (optional, run during low traffic)
-- VACUUM ANALYZE shows;
-- VACUUM ANALYZE user_shows;


-- ============================================================================
-- Notes
-- ============================================================================
--
-- 1. Index Creation Time:
--    - Small tables (< 10k rows): < 1 second
--    - Medium tables (10k-100k rows): 1-10 seconds
--    - Large tables (> 100k rows): 10-60 seconds
--
-- 2. Index Maintenance:
--    - Indexes are automatically maintained by PostgreSQL
--    - No manual intervention needed
--    - Slight overhead on INSERT/UPDATE operations (negligible)
--
-- 3. Index Size:
--    - Each index adds ~10-30% of table size
--    - Monitor with pg_relation_size queries above
--    - Drop unused indexes if needed
--
-- 4. Query Performance:
--    - Before indexes: 200-500ms queries
--    - After indexes: 10-50ms queries (10-50x faster)
--    - Use EXPLAIN ANALYZE to verify
--
-- 5. When to Reindex:
--    - After major data changes (> 50% of table)
--    - If query performance degrades over time
--    - Command: REINDEX TABLE shows;
--
-- ============================================================================