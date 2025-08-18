async function testDocumentariesFilter() {
  const supabaseUrl = 'https://tluyjrjdwtskuconslaj.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdXlqcmpkd3Rza3Vjb25zbGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MzY1MTUsImV4cCI6MjA2NjQxMjUxNX0.1qKdvtzlS_9HL0_3444RDjt7JcPANBlzavNbCqfrVDg';
  
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };

  console.log('🔍 Testing Documentaries genre filter...\n');

  // Step 1: Get the genre ID for "Documentaries"
  console.log('1. Fetching genre ID for "Documentaries"...');
  const genresUrl = `${supabaseUrl}/rest/v1/genres?select=id,name&name=eq.Documentary`;
  const genresResponse = await fetch(genresUrl, { method: 'GET', headers });
  const genres = await genresResponse.json();
  
  if (!genres || genres.length === 0) {
    console.log('❌ Could not find "Documentary" genre');
    return;
  }
  
  const documentaryGenreId = genres[0].id;
  console.log(`✅ Found Documentary genre with ID: ${documentaryGenreId}\n`);

  // Step 2: Count all shows with Documentary genre (without any limits)
  console.log('2. Counting all shows with Documentary genre...');
  const countUrl = `${supabaseUrl}/rest/v1/shows?select=imdb_id,name,genre_ids&show_in_discovery=eq.true`;
  const countResponse = await fetch(countUrl, { method: 'GET', headers });
  const allShows = await countResponse.json();
  
  const documentaryShows = allShows.filter(show => 
    show.genre_ids && show.genre_ids.includes(documentaryGenreId)
  );
  
  console.log(`✅ Total shows with Documentary genre: ${documentaryShows.length}\n`);
  
  // Step 3: List the documentary shows
  console.log('3. Documentary shows found:');
  documentaryShows.forEach((show, index) => {
    console.log(`   ${index + 1}. ${show.name} (${show.imdb_id})`);
  });
  
  // Step 4: Test the actual fetchShows function behavior
  console.log('\n4. Testing fetchShows function with Documentary filter...');
  const fetchUrl = `${supabaseUrl}/rest/v1/shows?select=imdb_id,name,genre_ids&show_in_discovery=eq.true&limit=200`;
  const fetchResponse = await fetch(fetchUrl, { method: 'GET', headers });
  const fetchedShows = await fetchResponse.json();
  
  const filteredDocs = fetchedShows.filter(show => 
    show.genre_ids && show.genre_ids.includes(documentaryGenreId)
  );
  
  console.log(`✅ Shows matching Documentary filter: ${filteredDocs.length}`);
  
  // Step 5: Check if there are exactly 5 or more
  console.log('\n📊 Summary:');
  console.log(`- Documentary genre ID: ${documentaryGenreId}`);
  console.log(`- Total documentary shows in database: ${documentaryShows.length}`);
  console.log(`- Shows visible in discovery: ${filteredDocs.length}`);
  
  if (documentaryShows.length === 5) {
    console.log('\n✅ CONFIRMED: There are exactly 5 documentary shows in the database');
  } else if (documentaryShows.length < 5) {
    console.log(`\n⚠️ There are only ${documentaryShows.length} documentary shows (less than 5)`);
  } else {
    console.log(`\n⚠️ There are ${documentaryShows.length} documentary shows (more than 5)`);
  }
}

testDocumentariesFilter().catch(console.error);