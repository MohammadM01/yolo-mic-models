const InterviewAnalysisService = require('./src/interviewAnalysisService');

async function testModelsDebug() {
    console.log('🧪 Testing Models Debug\n');
    
    try {
        // Create service instance
        const service = new InterviewAnalysisService();
        console.log('✅ Service created');
        
        // Test initialization
        console.log('\n1. Testing initialization...');
        const initialized = await service.initialize();
        console.log('Initialization result:', initialized);
        
        if (initialized) {
            // Test starting session
            console.log('\n2. Testing session start...');
            const started = await service.startSession({ duration: 10 });
            console.log('Session start result:', started);
            
            if (started) {
                // Wait for some processing
                console.log('\n3. Waiting for processing...');
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Get current results
                console.log('\n4. Getting current results...');
                const results = service.getCurrentResults();
                console.log('Current results:', results);
                
                // Get metrics
                console.log('\n5. Getting metrics...');
                const metrics = service.getCurrentMetrics();
                console.log('Current metrics:', metrics);
                
                // Get status
                console.log('\n6. Getting status...');
                const status = service.getServiceStatus();
                console.log('Service status:', status);
                
                // Stop session
                console.log('\n7. Stopping session...');
                const summary = await service.stopSession();
                console.log('Session summary:', summary);
                
                // Cleanup
                service.cleanup();
                console.log('\n✅ Test completed successfully');
            } else {
                console.log('❌ Failed to start session');
            }
        } else {
            console.log('❌ Failed to initialize service');
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testModelsDebug();
