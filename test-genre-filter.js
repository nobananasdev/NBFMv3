require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
    console.log('Documentary genre not found!');
    return;
  }
  
  const documentaryId = genres[0].id;
  console.log(`Documentary genre ID: ${documentaryId}\n`);
  
  // Test 1: Using cs (contains) operator - OLD WAY
  console.log('Test 1: Using cs operator (OLD - requires ALL genres)');
  const csUrl = `${supabaseUrl}/rest/v1/shows?select=name,genre_ids&genre_ids.cs.{${documentaryId}}&limit=5`;
  const csResponse = await fetch(csUrl, { method: 'GET', headers });
  const csShows = await csResponse.json();
  console.log(`Found ${csShows.length} shows with cs operator`);
  if (csShows.length > 0) {
    console.log('Sample:', csShows[0]);
  }
  
  // Test 2: Using ov (overlaps) operator - NEW WAY  
  console.log('\nTest 2: Using ov operator (NEW - requires ANY genres)');
  const ovUrl = `${supabaseUrl}/rest/v1/shows?select=name,genre_ids&genre_ids.ov.{${documentaryId}}&limit=5`;
  const ovResponse = await fetch(ovUrl, { method: 'GET', headers });
  const ovShows = await ovResponse.json();
  console.log(`Found ${ovShows.length} shows with ov operator`);
  if (ovShows.length > 0) {
    console.log('Sample:', ovShows[0]);
  }
  
  // Test 3: Check if there are any shows with genre_ids containing documentaryId
  console.log('\nTest 3: Checking raw data for shows with Documentary genre...');
  const allUrl = `${supabaseUrl}/rest/v1/shows?select=name,genre_ids&limit=100`;
  const allResponse = await fetch(allUrl, { method: 'GET', headers });
  const allShows = await allResponse.json();
  
  const docsCount = allShows.filter(show => 
    show.genre_ids && show.genre_ids.includes(documentaryId)
  ).length;
  
  console.log(`Out of ${allShows.length} shows checked, ${docsCount} have Documentary genre`);
  
  // Show some examples
  const docShows = allShows.filter(show => 
    show.genre_ids && show.genre_ids.includes(documentaryId)
  ).slice(0, 3);
  
  if (docShows.length > 0) {
    console.log('\nExample Documentary shows:');
    docShows.forEach(show => {
      console.log(`- ${show.name}: genres [${show.genre_ids.join(', ')}]`);
    });
  }
}

testGenreFilter().catch(console.error);