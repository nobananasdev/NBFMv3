const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables manually from .env.local
function loadEnvVars() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    return envVars;
  } catch (error) {
    console.error('❌ Failed to read .env.local:', error.message);
    return {};
  }
}

async function testExactBrowserQuery() {
  console.log('🔍 Testing EXACT browser query...');
  
  const envVars = loadEnvVars();
  const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // Exact same options as browser
  const options = {
    limit: 20,
    offset: 0,
    showInDiscovery: true,
    excludeUserShows: false,
    userId: undefined,
    sortBy: 'latest'
  };

  console.log('📋 Options:', options);

  try {
    console.log('🏗️ Building query...');
    let query = supabase
      .from('shows')
      .select('*')
      .eq('is_hidden', false)
      .eq('is_trash', false);

    if (options.showInDiscovery) {
      console.log('🎯 Adding show_in_discovery filter...');
      query = query.eq('show_in_discovery', true);
    }

    // Apply sorting like in browser
    switch (options.sortBy) {
      case 'latest':
        console.log('📅 Sorting by first_air_date...');
        query = query.order('first_air_date', { ascending: false });
        break;
      case 'best_rated':
        query = query.order('our_score', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    if (options.limit) {
      console.log('📏 Adding limit:', options.limit);
      query = query.limit(options.limit);
    }

    if (options.offset) {
      console.log('📍 Adding range...');
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    console.log('⏱️ Executing query with 10s timeout...');
    const start = Date.now();
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
    );
    
    const queryResult = await Promise.race([query, timeoutPromise]);
    const duration = Date.now() - start;
    
    console.log(`✅ Query completed in ${duration}ms`);
    
    const { data: shows, error } = queryResult;

    if (error) {
      console.error('❌ Query error:', error);
    } else {
      console.log(`🎬 Found ${shows?.length || 0} shows`);
      if (shows && shows.length > 0) {
        console.log('📄 First show:', {
          title: shows[0].title,
          first_air_date: shows[0].first_air_date,
          show_in_discovery: shows[0].show_in_discovery
        });
      }
    }

  } catch (error) {
    console.error('💥 Query failed:', error);
  }
}

testExactBrowserQuery();