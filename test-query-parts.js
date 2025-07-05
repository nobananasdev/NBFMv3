const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function loadEnvVars() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
  return envVars;
}

async function testQueryParts() {
  console.log('🔬 Testing each query part separately...');
  
  const envVars = loadEnvVars();
  const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const tests = [
    {
      name: 'Test 1: Basic SELECT with LIMIT',
      query: () => supabase.from('shows').select('id, title').limit(5)
    },
    {
      name: 'Test 2: Add WHERE filters',
      query: () => supabase
        .from('shows')
        .select('id, title')
        .eq('is_hidden', false)
        .eq('is_trash', false)
        .limit(5)
    },
    {
      name: 'Test 3: Add show_in_discovery filter',
      query: () => supabase
        .from('shows')
        .select('id, title')
        .eq('is_hidden', false)
        .eq('is_trash', false)
        .eq('show_in_discovery', true)
        .limit(5)
    },
    {
      name: 'Test 4: Add ORDER BY first_air_date',
      query: () => supabase
        .from('shows')
        .select('id, title, first_air_date')
        .eq('is_hidden', false)
        .eq('is_trash', false)
        .eq('show_in_discovery', true)
        .order('first_air_date', { ascending: false })
        .limit(5)
    },
    {
      name: 'Test 5: Full SELECT *',
      query: () => supabase
        .from('shows')
        .select('*')
        .eq('is_hidden', false)
        .eq('is_trash', false)
        .eq('show_in_discovery', true)
        .order('first_air_date', { ascending: false })
        .limit(5)
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n${test.name}`);
      const start = Date.now();
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout after 5s')), 5000)
      );
      
      const result = await Promise.race([test.query(), timeoutPromise]);
      const duration = Date.now() - start;
      
      if (result.error) {
        console.log(`❌ Error (${duration}ms):`, result.error.message);
      } else {
        console.log(`✅ Success (${duration}ms): ${result.data?.length || 0} rows`);
      }
    } catch (error) {
      console.log(`⏰ ${error.message}`);
    }
  }
}

testQueryParts();