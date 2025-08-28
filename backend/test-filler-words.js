const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testFillerWords() {
  try {
    console.log('🧪 Testing Filler Words Functionality...\n');
    
    // Step 1: Initialize
    console.log('1️⃣ Initializing service...');
    const initResponse = await axios.post(`${API_BASE}/interview/initialize`);
    console.log('✅ Initialized:', initResponse.data);
    
    // Step 2: Start models
    console.log('\n2️⃣ Starting models...');
    const startModelsResponse = await axios.post(`${API_BASE}/interview/start-models`);
    console.log('✅ Models started:', startModelsResponse.data);
    
    // Step 3: Start data collection
    console.log('\n3️⃣ Starting data collection...');
    const startCollectionResponse = await axios.post(`${API_BASE}/interview/start-collection`);
    console.log('✅ Collection started:', startCollectionResponse.data);
    
    // Step 4: Wait for a cycle to complete (10 seconds)
    console.log('\n4️⃣ Waiting for cycle to complete (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 11000));
    
    // Step 5: Stop collection
    console.log('\n5️⃣ Stopping collection...');
    const stopCollectionResponse = await axios.post(`${API_BASE}/interview/stop-collection`);
    console.log('✅ Collection stopped:', stopCollectionResponse.data);
    
    // Step 6: Get cycle results
    console.log('\n6️⃣ Getting cycle results...');
    const resultsResponse = await axios.get(`${API_BASE}/interview/cycle-results`);
    console.log('✅ Results retrieved:', resultsResponse.data);
    
    // Step 7: Display filler words summary
    if (resultsResponse.data.success && resultsResponse.data.results.length > 0) {
      console.log('\n🗣️ FILLER WORDS ANALYSIS:');
      resultsResponse.data.results.forEach((cycle, index) => {
        console.log(`\n📊 Cycle ${cycle.cycleNumber}:`);
        if (cycle.summary.fillerWords) {
          console.log(`   Total Filler Words: ${cycle.summary.fillerWords.total}`);
          console.log(`   - Um: ${cycle.summary.fillerWords.breakdown.um}`);
          console.log(`   - Uh: ${cycle.summary.fillerWords.breakdown.uh}`);
          console.log(`   - Like: ${cycle.summary.fillerWords.breakdown.like}`);
          console.log(`   - You Know: ${cycle.summary.fillerWords.breakdown.youKnow}`);
        } else {
          console.log('   ❌ No filler words data found!');
        }
      });
    }
    
    // Step 8: End interview
    console.log('\n8️⃣ Ending interview...');
    const endResponse = await axios.post(`${API_BASE}/interview/end`);
    console.log('✅ Interview ended:', endResponse.data);
    
  } catch (error) {
    console.error('❌ Error during test:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    console.error('Full error:', error);
  }
}

// Run the test
testFillerWords();
