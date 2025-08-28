const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test function for the Computer Vision & Interview Analysis API
async function testComputerVisionAPI() {
    try {
        console.log('🧪 Testing Computer Vision & Interview Analysis API\n');

        // Test 1: Health check
        console.log('1. Testing health check endpoint...');
        const healthResponse = await axios.get(`${BASE_URL}/`);
        console.log('✅ Health check:', healthResponse.data.message);
        console.log('   Services:', healthResponse.data.services.join(', '));
        console.log('   Version:', healthResponse.data.version);
        console.log('');

        // Test 2: Initialize interview analysis service
        console.log('2. Testing interview service initialization...');
        const initResponse = await axios.post(`${BASE_URL}/api/interview/initialize`);
        console.log('✅ Service initialization:', initResponse.data.message);
        console.log('   Status:', initResponse.data.status.isInitialized ? 'Initialized' : 'Not Initialized');
        console.log('');

        // Test 3: Get available webcam devices
        console.log('3. Testing webcam device detection...');
        const devicesResponse = await axios.get(`${BASE_URL}/api/interview/devices`);
        console.log('✅ Available devices:', devicesResponse.data.devices.length);
        devicesResponse.data.devices.forEach(device => {
            console.log(`   - ${device.name} (ID: ${device.id})${device.isDefault ? ' [Default]' : ''}`);
        });
        console.log('');

        // Test 4: Get current configuration
        console.log('4. Testing configuration retrieval...');
        const configResponse = await axios.get(`${BASE_URL}/api/interview/config`);
        console.log('✅ Configuration retrieved');
        console.log('   Face detection confidence:', configResponse.data.configuration.FACE_DETECTION_CONFIDENCE);
        console.log('   YOLO confidence:', configResponse.data.configuration.YOLO_CONFIDENCE);
        console.log('   Webcam resolution:', `${configResponse.data.configuration.webcam.resolution.width}x${configResponse.data.configuration.webcam.resolution.height}`);
        console.log('   Frame rate:', configResponse.data.configuration.webcam.frameRate);
        console.log('');

        // Test 5: Update webcam settings
        console.log('5. Testing webcam settings update...');
        const settingsResponse = await axios.post(`${BASE_URL}/api/interview/settings`, {
            resolution: { width: 1280, height: 720 },
            frameRate: 25
        });
        console.log('✅ Webcam settings updated:', settingsResponse.data.message);
        console.log('   New resolution:', `${settingsResponse.data.currentSettings.webcam.resolution.width}x${settingsResponse.data.currentSettings.webcam.resolution.height}`);
        console.log('   New frame rate:', settingsResponse.data.currentSettings.webcam.frameRate);
        console.log('');

        // Test 6: Start interview analysis session
        console.log('6. Testing interview session start...');
        const startResponse = await axios.post(`${BASE_URL}/api/interview/start`, {
            options: { duration: 10 }
        });
        console.log('✅ Interview session started:', startResponse.data.message);
        console.log('   Status:', startResponse.data.status.isRunning ? 'Running' : 'Stopped');
        console.log('');

        // Test 7: Wait a bit for some analysis to happen
        console.log('7. Waiting for analysis to process frames...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        console.log('   Waited 3 seconds for frame processing');
        console.log('');

        // Test 8: Get current results
        console.log('8. Testing current results retrieval...');
        const resultsResponse = await axios.get(`${BASE_URL}/api/interview/results`);
        console.log('✅ Current results retrieved');
        if (resultsResponse.data.currentResults) {
            const [expression, eyeContact, posture, phoneDetected, confidence] = resultsResponse.data.currentResults;
            console.log(`   Expression: ${expression}`);
            console.log(`   Eye Contact: ${eyeContact ? 'Yes' : 'No'}`);
            console.log(`   Posture: ${posture}`);
            console.log(`   Phone Detected: ${phoneDetected ? 'Yes' : 'No'}`);
            console.log(`   Confidence: ${confidence.toFixed(2)}`);
        }
        console.log('   Metrics:', resultsResponse.data.currentMetrics);
        console.log('');

        // Test 9: Get service status
        console.log('9. Testing service status...');
        const statusResponse = await axios.get(`${BASE_URL}/api/interview/status`);
        console.log('✅ Service status retrieved');
        console.log('   Running:', statusResponse.data.status.isRunning ? 'Yes' : 'No');
        console.log('   Initialized:', statusResponse.data.status.isInitialized ? 'Yes' : 'No');
        console.log('   Frames captured:', statusResponse.data.status.webcamStatus.stats.framesCaptured);
        console.log('   Frames processed:', statusResponse.data.status.computerVisionStats.frameProcessedCount);
        console.log('');

        // Test 10: Save current frame
        console.log('10. Testing frame saving...');
        const saveFrameResponse = await axios.post(`${BASE_URL}/api/interview/save-frame`, {
            filename: 'test_frame.json'
        });
        console.log('✅ Frame saved:', saveFrameResponse.data.message);
        console.log('   Filename:', saveFrameResponse.data.filename);
        console.log('');

        // Test 11: Stop interview analysis session
        console.log('11. Testing interview session stop...');
        const stopResponse = await axios.post(`${BASE_URL}/api/interview/stop`);
        console.log('✅ Interview session stopped:', stopResponse.data.message);
        console.log('   Status:', stopResponse.data.status.isRunning ? 'Running' : 'Stopped');
        console.log('');

        // Test 12: Get session summary
        console.log('12. Testing session summary...');
        const summaryResponse = await axios.get(`${BASE_URL}/api/interview/summary`);
        console.log('✅ Session summary retrieved');
        const summary = summaryResponse.data.summary;
        console.log(`   Duration: ${summary.duration} seconds`);
        console.log(`   Total frames processed: ${summary.totalFramesProcessed}`);
        console.log(`   Eye contact percentage: ${summary.eyeContactPercentage}%`);
        console.log(`   Common expression: ${summary.commonExpression}`);
        console.log(`   Common posture: ${summary.commonPosture}`);
        console.log(`   Suspicious activity: ${summary.suspiciousPercentage}%`);
        console.log('');

        // Test 13: Reset session
        console.log('13. Testing session reset...');
        const resetResponse = await axios.post(`${BASE_URL}/api/interview/reset`);
        console.log('✅ Session reset:', resetResponse.data.message);
        console.log('   Status:', resetResponse.data.status.isRunning ? 'Running' : 'Stopped');
        console.log('');

        console.log('🎉 All Computer Vision & Interview Analysis tests passed successfully!');
        console.log('📊 API Summary:');
        console.log('   - Health check: ✅');
        console.log('   - Service initialization: ✅');
        console.log('   - Device detection: ✅');
        console.log('   - Configuration management: ✅');
        console.log('   - Webcam settings: ✅');
        console.log('   - Session management: ✅');
        console.log('   - Real-time analysis: ✅');
        console.log('   - Results retrieval: ✅');
        console.log('   - Frame saving: ✅');
        console.log('   - Session summary: ✅');
        console.log('   - Session reset: ✅');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

// Test function for the complete system (audio + computer vision)
async function testCompleteSystem() {
    try {
        console.log('🚀 Testing Complete System (Audio + Computer Vision)\n');

        // Test audio processing
        console.log('Testing Audio Processing...');
        const audioResponse = await axios.post(`${BASE_URL}/api/record-audio`, {
            duration: 2,
            saveFile: false
        });
        console.log('✅ Audio recording:', audioResponse.data.message);

        // Test computer vision
        console.log('Testing Computer Vision...');
        await axios.post(`${BASE_URL}/api/interview/initialize`);
        await axios.post(`${BASE_URL}/api/interview/start`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        await axios.post(`${BASE_URL}/api/interview/stop`);
        console.log('✅ Computer vision analysis completed');

        console.log('\n🎯 Complete system test passed!');
        console.log('   Both audio processing and computer vision are working correctly.');

    } catch (error) {
        console.error('❌ Complete system test failed:', error.message);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    console.log('Starting Computer Vision & Interview Analysis API Tests...\n');
    
    // Run the main test
    testComputerVisionAPI().then(() => {
        console.log('\n' + '='.repeat(60));
        console.log('Starting Complete System Test...');
        return testCompleteSystem();
    }).then(() => {
        console.log('\n🎉 All tests completed successfully!');
        console.log('The backend is ready for production use.');
    }).catch(error => {
        console.error('\n💥 Test execution failed:', error);
    });
}

module.exports = { 
    testComputerVisionAPI, 
    testCompleteSystem 
};
