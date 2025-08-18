const supabaseUrl = 'https://tluyjrjdwtskuconslaj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdXlqcmpkd3Rza3Vjb25zbGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MzY1MTUsImV4cCI6MjA2NjQxMjUxNX0.1qKdvtzlS_9HL0_3444RDjt7JcPANBlzavNbCqfrVDg';

async function testGenreFilter() {
  console.log('Finding a genre that actually exists in shows...\n');
  
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };

  // First, get some shows to see what genres they have
  console.log('Step 1: Getting sample shows to see their genres...');
  const sampleUrl = `${supabaseUrl}/rest/v1/shows?select=name,genre_ids&show_in_discovery=eq.true&limit=10`;
  const sampleResponse = await fetch(sampleUrl, { method: 'GET', headers });
  const sampleShows = await sampleResponse.json();
  
  console.log('Sample shows and their genres:');
  sampleShows.forEach(show => {
    console.log(`- ${show.name}: [${show.genre_ids.join(', ')}]`);
  });
  
  // Find the most common genre ID
  const genreCounts = {};
  sampleShows.forEach(show => {
    if (show.genre_ids) {
      show.genre_ids.forEach(id => {
        genreCounts[id] = (genreCounts[id] || 0) + 1;
      });
    }
  });
  
  const mostCommonGenreId = Object.keys(genreCounts).reduce((a, b) => 
    genreCounts[a] > genreCounts[b] ? a : b
  );
  
  console.log(`\nMost common genre ID in sample: ${mostCommonGenreId} (appears ${genreCounts[mostCommonGenreId]} times)`);
  
  // Get the name of this genre
  const genreNameUrl = `${supabaseUrl}/rest/v1/genres?select=id,name&id=eq.${mostCommonGenreId}`;
  const genreNameResponse = await fetch(genreNameUrl, { method: 'GET', headers });
  const genreInfo = await genreNameResponse.json();
  const genreName = genreInfo[0]?.name || 'Unknown';
  
  console.log(`Genre ${mostCommonGenreId} is: ${genreName}\n`);
  
  // Now test filtering with this genre that we KNOW exists
  console.log(`Testing filters with ${genreName} (ID: ${mostCommonGenreId})...\n`);
  
  // Test without any filter
  console.log('Test 1: No filter (baseline)');
  const noFilterUrl = `${supabaseUrl}/rest/v1/shows?select=name,genre_ids&show_in_discovery=eq.true&limit=5`;
  const noFilterResponse = await fetch(noFilterUrl, { method: 'GET', headers });
  const noFilterShows = await noFilterResponse.json();
  console.log(`No filter: ${noFilterShows.length} shows`);
  
  // Test with cs operator
  console.log('\nTest 2: Using cs operator');
  const csUrl = `${supabaseUrl}/rest/v1/shows?select=name,genre_ids&show_in_discovery=eq.true&genre_ids.cs.{${mostCommonGenreId}}&limit=5`;
  const csResponse = await fetch(csUrl, { method: 'GET', headers });
  const csShows = await csResponse.json();
  console.log(`cs operator: ${csShows.length} shows`);
  const csMatches = csShows.filter(s => s.genre_ids && s.genre_ids.includes(parseInt(mostCommonGenreId)));
  console.log(`Actually contain genre ${mostCommonGenreId}: ${csMatches.length} shows`);
  
  // Test with ov operator
  console.log('\nTest 3: Using ov operator');
  const ovUrl = `${supabaseUrl}/rest/v1/shows?select=name,genre_ids&show_in_discovery=eq.true&genre_ids.ov.{${mostCommonGenreId}}&limit=5`;
  const ovResponse = await fetch(ovUrl, { method: 'GET', headers });
  const ovShows = await ovResponse.json();
  console.log(`ov operator: ${ovShows.length} shows`);
  const ovMatches = ovShows.filter(s => s.genre_ids && s.genre_ids.includes(parseInt(mostCommonGenreId)));
  console.log(`Actually contain genre ${mostCommonGenreId}: ${ovMatches.length} shows`);
  
  // Test with @> operator (contains - alternative syntax)
  console.log('\nTest 4: Using @> operator (alternative contains)');
  const containsUrl = `${supabaseUrl}/rest/v1/shows?select=name,genre_ids&show_in_discovery=eq.true&genre_ids=@>.{${mostCommonGenreId}}&limit=5`;
  const containsResponse = await fetch(containsUrl, { method: 'GET', headers });
  if (containsResponse.ok) {
    const containsShows = await containsResponse.json();
    console.log(`@> operator: ${containsShows.length} shows`);
    const containsMatches = containsShows.filter(s => s.genre_ids && s.genre_ids.includes(parseInt(mostCommonGenreId)));
    console.log(`Actually contain genre ${mostCommonGenreId}: ${containsMatches.length} shows`);
  } else {
    console.log('@> operator: Failed with status', containsResponse.status);
  }
  
  // Test with && operator (overlap - alternative syntax)  
  console.log('\nTest 5: Using && operator (alternative overlap)');
  const overlapUrl = `${supabaseUrl}/rest/v1/shows?select=name,genre_ids&show_in_discovery=eq.true&genre_ids=&&.{${mostCommonGenreId}}&limit=5`;
  const overlapResponse = await fetch(overlapUrl, { method: 'GET', headers });
  if (overlapResponse.ok) {
    const overlapShows = await overlapResponse.json();
    console.log(`&& operator: ${overlapShows.length} shows`);
    const overlapMatches = overlapShows.filter(s => s.genre_ids && s.genre_ids.includes(parseInt(mostCommonGenreId)));
    console.log(`Actually contain genre ${mostCommonGenreId}: ${overlapMatches.length} shows`);
  } else {
    console.log('&& operator: Failed with status', overlapResponse.status);
  }
}

testGenreFilter().catch(console.error);