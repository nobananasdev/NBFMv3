// Test script to debug search functionality
const { searchShowsDatabase, fetchShowByImdbId } = require('./src/lib/shows.ts')

async function testSearch() {
  console.log('Testing search functionality...')
  
  // Test 1: General search
  console.log('\n=== Test 1: General search for "breaking" ===')
  try {
    const result = await searchShowsDatabase({
      query: 'breaking',
      limit: 5,
      offset: 0
    })
    console.log('Search results:', result.shows.length)
    if (result.shows.length > 0) {
      console.log('First result:', result.shows[0].name)
    }
    if (result.error) {
      console.error('Search error:', result.error)
    }
  } catch (error) {
    console.error('Search failed:', error)
  }
  
  // Test 2: Fetch specific show by IMDB ID
  console.log('\n=== Test 2: Fetch specific show by IMDB ID ===')
  try {
    const result = await fetchShowByImdbId('tt0903747') // Breaking Bad IMDB ID
    console.log('Show found:', result.show ? result.show.name : 'No show found')
    if (result.error) {
      console.error('Fetch error:', result.error)
    }
  } catch (error) {
    console.error('Fetch failed:', error)
  }
}

testSearch()