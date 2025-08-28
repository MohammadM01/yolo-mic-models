const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test function for the API endpoints
async function testAPI() {
    try {
        console.log('🧪 Testing Emotion Detection Backend API\n');

        // Test 1: Health check
        console.log('1. Testing health check endpoint...');
        const healthResponse = await axios.get(`${BASE_URL}/`);
        console.log('✅ Health check:', healthResponse.data.message);
        console.log('');

        // Test 2: Record audio (simulated)
        console.log('2. Testing audio recording endpoint...');
        const recordResponse = await axios.post(`${BASE_URL}/api/record-audio`, {
            duration: 3,
            saveFile: false
        });
        console.log('✅ Audio recording:', recordResponse.data.message);
        console.log('   Audio length:', recordResponse.data.audioLength);
        console.log('   Sample rate:', recordResponse.data.sampleRate);
        console.log('');

        // Test 3: Detect emotion (using smaller audio data)
        console.log('3. Testing emotion detection endpoint...');
        // Use smaller audio data (1 second at 22050 Hz = 22050 samples)
        const audioData = new Array(22050).fill(0).map(() => (Math.random() - 0.5) * 0.1);
        const emotionResponse = await axios.post(`${BASE_URL}/api/detect-emotion`, {
            audioData: audioData,
            duration: 1
        });
        console.log('✅ Emotion detection:', emotionResponse.data.message);
        console.log('   Predicted emotion:', emotionResponse.data.predictedEmotion);
        console.log('   Confidence:', emotionResponse.data.confidence);
        console.log('   Model type:', emotionResponse.data.modelSummary.type);
        console.log('');

        // Test 4: Upload audio file (simulated)
        console.log('4. Testing audio upload endpoint...');
        const FormData = require('form-data');
        const form = new FormData();
        
        // Create a simple audio buffer (simulated) - convert Float32Array to Buffer properly
        const audioBuffer = Buffer.from(new Float32Array(audioData).buffer);
        form.append('audio', audioBuffer, {
            filename: 'test_audio.wav',
            contentType: 'audio/wav'
        });

        const uploadResponse = await axios.post(`${BASE_URL}/api/upload-audio`, form, {
            headers: {
                ...form.getHeaders()
            }
        });
        console.log('✅ Audio upload:', uploadResponse.data.message);
        console.log('   Audio length:', uploadResponse.data.audioLength);
        console.log('   MFCC features:', uploadResponse.data.features);
        console.log('   Time steps:', uploadResponse.data.timeSteps);
        console.log('');

        console.log('🎉 All tests passed successfully!');
        console.log('📊 API Summary:');
        console.log('   - Health check: ✅');
        console.log('   - Audio recording: ✅');
        console.log('   - Emotion detection: ✅');
        console.log('   - Audio upload: ✅');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testAPI();
}

module.exports = { testAPI };
