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

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase Connection...');
  
  const envVars = loadEnvVars();
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🌐 URL:', supabaseUrl);
  console.log('🔑 API Key exists:', !!supabaseKey);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables!');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('📡 Testing basic connection...');
    const start = Date.now();
    
    // Test 1: Basic health check
    const { data, error } = await supabase.from('shows').select('count').limit(1);
    const duration = Date.now() - start;
    
    console.log(`⏱️ Query took: ${duration}ms`);
    
    if (error) {
      console.error('❌ Query failed:', error);
      console.log('📊 Error details:');
      console.log('  Code:', error.code);
      console.log('  Message:', error.message);
      console.log('  Details:', error.details);
    } else {
      console.log('✅ Connection successful!');
      console.log('📊 Result:', data);
    }

    // Test 2: Check if shows table exists and has data
    console.log('\n🗄️ Testing shows table...');
    const { data: showsData, error: showsError, count } = await supabase
      .from('shows')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (showsError) {
      console.error('❌ Shows table query failed:', showsError);
    } else {
      console.log(`✅ Shows table accessible! Total count: ${count || 'unknown'}`);
      console.log(`📊 Sample records: ${showsData?.length || 0}`);
      if (showsData && showsData.length > 0) {
        console.log('📄 First record preview:', {
          title: showsData[0].title,
          imdb_id: showsData[0].imdb_id,
          show_in_discovery: showsData[0].show_in_discovery
        });
      }
    }

  } catch (error) {
    console.error('💥 Connection test threw error:', error);
    console.log('🔍 Error type:', error.constructor.name);
    console.log('🔍 Error message:', error.message);
  }
}

testSupabaseConnection();