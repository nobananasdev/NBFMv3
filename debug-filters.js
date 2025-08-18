const { fetchStreamingProviders } = require('./src/lib/shows.ts');

async function testStreamingProviders() {
  console.log('🔍 Testing streaming providers...');
  
  try {
    const result = await fetchStreamingProviders();
    
    if (result.error) {
      console.error('❌ Error:', result.error);
    } else {
      console.log('✅ Success! Found', result.streamers.length, 'streaming providers:');
      result.streamers.forEach((streamer, index) => {
        console.log(`${index + 1}. ${streamer.name} (ID: ${streamer.id})`);
      });
    }
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

testStreamingProviders();