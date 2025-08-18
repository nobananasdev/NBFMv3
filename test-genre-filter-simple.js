const supabaseUrl = 'https://tluyjrjdwtskuconslaj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdXlqcmpkd3Rza3Vjb25zbGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MzY1MTUsImV4cCI6MjA2NjQxMjUxNX0.1qKdvtzlS_9HL0_3444RDjt7JcPANBlzavNbCqfrVDg';

async function testGenreFilter() {
  console.log('Testing genre filtering...\n');
  
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };

  // First, let's get the genre IDs for Documentary
  const genresUrl = `${supabaseUrl}/rest/v1/genres?select=id,name&name=eq.Documentary`;
  const genresResponse = await fetch(genresUrl, { method: 'GET', headers });
  const genres = await genresResponse.json();
  
  console.log('Documentary genre:', genres);
  
  if (!genres || genres.length === 0) {
    console.log('Documentary genre not found! Trying to get all genres...');
    const allGenresUrl = `${supabaseUrl}/rest/v1/genres?select=id,name&order=name.asc`;
    const allGenresResponse = await fetch(allGenresUrl, { method: 'GET', headers });
    const allGenres = await allGenresResponse.json();
    console.log('All available genres:', allGenres);
    
    // Find Documentary or similar
    const docGenre = allGenres.find(g => g.name.toLowerCase().includes('document'));
    if (docGenre) {
      genres.push(docGenre);
      console.log('Found genre:', docGenre);
    } else {
      console.log('No documentary-like genre found. Using first genre for testing:', allGenres[0]);
      genres.push(allGenres[0]);
    }
  }
  
  const testGenreId = genres[0].id;
  const testGenreName = genres[0].name;
  console.log(`\nTesting with genre: ${testGenreName} (ID: ${testGenreId})\n`);
  
  // Test 1: Using cs (contains) operator - OLD WAY
  console.log('Test 1: Using cs operator (OLD - requires ALL genres)');
  const csUrl = `${supabaseUrl}/rest/v1/shows?select=name,genre_ids&show_in_discovery=eq.true&genre_ids.cs.{${testGenreId}}&limit=5`;
  console.log('Query URL (cs):', csUrl.replace(supabaseKey, '[KEY]'));
  const csResponse = await fetch(csUrl, { method: 'GET', headers });
  const csShows = await csResponse.json();
  console.log(`Found ${csShows.length} shows with cs operator`);
  if (csShows.length > 0) {
    console.log('Sample:', csShows[0]);
  }
  
  // Test 2: Using ov (overlaps) operator - NEW WAY  
  console.log('\nTest 2: Using ov operator (NEW - requires ANY genres)');
  const ovUrl = `${supabaseUrl}/rest/v1/shows?select=name,genre_ids&show_in_discovery=eq.true&genre_ids.ov.{${testGenreId}}&limit=5`;
  console.log('Query URL (ov):', ovUrl.replace(supabaseKey, '[KEY]'));
  const ovResponse = await fetch(ovUrl, { method: 'GET', headers });
  const ovShows = await ovResponse.json();
  console.log(`Found ${ovShows.length} shows with ov operator`);
  if (ovShows.length > 0) {
    console.log('Sample:', ovShows[0]);
  }
  
  // Test 3: Check if there are any shows with genre_ids containing the test genre
  console.log(`\nTest 3: Checking raw data for shows with ${testGenreName} genre...`);
  const allUrl = `${supabaseUrl}/rest/v1/shows?select=name,genre_ids&show_in_discovery=eq.true&limit=500`;
  const allResponse = await fetch(allUrl, { method: 'GET', headers });
  const allShows = await allResponse.json();
  
  const genreCount = allShows.filter(show => 
    show.genre_ids && show.genre_ids.includes(testGenreId)
  ).length;
  
  console.log(`Out of ${allShows.length} discovery shows checked, ${genreCount} have ${testGenreName} genre`);
  
  // Show some examples
  const genreShows = allShows.filter(show => 
    show.genre_ids && show.genre_ids.includes(testGenreId)
  ).slice(0, 3);
  
  if (genreShows.length > 0) {
    console.log(`\nExample ${testGenreName} shows:`);
    genreShows.forEach(show => {
      console.log(`- ${show.name}: genres [${show.genre_ids.join(', ')}]`);
    });
  }
  
  // Test 4: Test the exact query from the app
  console.log('\nTest 4: Testing exact app query with genre filter...');
  const appUrl = `${supabaseUrl}/rest/v1/shows?select=imdb_id,id,name,original_name,first_air_date,imdb_rating,imdb_vote_count,vote_average,vote_count,our_score,overview,poster_url,poster_thumb_url,genre_ids,number_of_seasons,number_of_episodes,type,streaming_info,main_cast,creators&limit=20&offset=0&show_in_discovery=eq.true&genre_ids.ov.{${testGenreId}}&order=first_air_date.desc.nullslast`;
  console.log('App query URL:', appUrl.replace(supabaseKey, '[KEY]'));
  const appResponse = await fetch(appUrl, { method: 'GET', headers });
  const appShows = await appResponse.json();
  console.log(`App query returned ${appShows.length} shows`);
  if (appShows.length > 0) {
    console.log('First show:', { name: appShows[0].name, genre_ids: appShows[0].genre_ids });
  }
}

testGenreFilter().catch(console.error);