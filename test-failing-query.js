async function testFailingQuery() {
  console.log('🔍 Testing the exact failing query...');
  
  const supabaseUrl = 'https://tluyjrjdwtskuconslaj.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdXlqcmpkd3Rza3Vjb25zbGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MzY1MTUsImV4cCI6MjA2NjQxMjUxNX0.1qKdvtzlS_9HL0_3444RDjt7JcPANBlzavNbCqfrVDg';
  
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  // Test the exact query from the browser logs
  const url = `${supabaseUrl}/rest/v1/shows?select=imdb_id,name,original_name,first_air_date,imdb_rating,our_score,overview,poster_url,genre_ids,number_of_seasons,number_of_episodes,type,streaming_info&limit=500&show_in_discovery=eq.true&order=first_air_date.desc.nullslast`;
  
  console.log('🌐 Query URL:', url);
  
  try {
    const response = await fetch(url, { method: 'GET', headers });
    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    } else {
      const data = await response.json();
      console.log('✅ Success! Got', data.length, 'shows');
      if (data.length > 0) {
        console.log('📄 First show:', JSON.stringify(data[0], null, 2));
      }
    }
  } catch (error) {
    console.error('❌ Fetch error:', error);
  }
}

testFailingQuery();