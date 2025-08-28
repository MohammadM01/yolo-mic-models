const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// Import simplified services
const audioProcessor = require('./src/audioProcessor');
const InterviewAnalysisService = require('./src/interviewAnalysisService-simple');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for audio data
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize Interview Analysis Service
const interviewService = new InterviewAnalysisService();

// Audio Processing Routes
app.get('/', (req, res) => {
    res.json({ 
        message: 'Emotion Detection & Interview Analysis Backend API',
        services: ['Audio Processing', 'Computer Vision (Simplified)', 'Interview Analysis'],
        version: '2.0.0'
    });
});

// Route to record audio
app.post('/api/record-audio', async (req, res) => {
    try {
        const { duration = 5, saveFile = false } = req.body;
        
        const audioData = await audioProcessor.recordAudio(duration, audioProcessor.SAMPLE_RATE, saveFile);
        
        if (audioData === null) {
            return res.status(500).json({ error: 'Failed to record audio' });
        }
        
        res.json({ 
            success: true, 
            message: 'Audio recorded successfully',
            audioLength: audioData.length,
            sampleRate: audioProcessor.SAMPLE_RATE
        });
    } catch (error) {
        console.error('Error in record-audio route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to process audio and detect emotion
app.post('/api/detect-emotion', async (req, res) => {
    try {
        const { audioData, duration = 5 } = req.body;
        
        if (!audioData) {
            return res.status(400).json({ error: 'Audio data is required' });
        }
        
        // Check if audio data is too large
        if (audioData.length > 1000000) { // 1 million samples limit
            return res.status(413).json({ 
                error: 'Audio data too large. Please use shorter audio or upload as file.',
                maxSamples: 1000000,
                receivedSamples: audioData.length
            });
        }
        
        // Preprocess the audio
        const processed = audioProcessor.loadAndPreprocessAudio(audioData, audioProcessor.SAMPLE_RATE);
        
        if (processed.mfccs === null) {
            return res.status(500).json({ error: 'Failed to process audio' });
        }
        
        // Create and summarize model
        const inputShape = [processed.mfccs.shape[1], processed.mfccs.shape[2], 1];
        const model = audioProcessor.createEmotionModel(inputShape);
        
        // Get model summary
        const modelSummary = model.summary();
        
        // Make prediction using rule-based model
        try {
            const prediction = model.predict(processed.mfccs);
            const predictedEmotion = audioProcessor.EMOTIONS[prediction.predictedClass];
            
            res.json({
                success: true,
                predictedEmotion: predictedEmotion,
                confidence: prediction.confidence,
                scores: prediction.scores,
                modelSummary: modelSummary
            });
        } catch (predictionError) {
            console.error('Prediction error:', predictionError);
            res.status(500).json({ error: 'Failed to make prediction' });
        }
    } catch (error) {
        console.error('Error in detect-emotion route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Audio Processing API'
    });
});

// Audio upload route
app.post('/api/upload-audio', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file uploaded' });
        }
        
        const audioBuffer = req.file.buffer;
        const audioData = new Float32Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / 4);
        
        // Process the uploaded audio
        const processed = audioProcessor.loadAndPreprocessAudio(audioData, audioProcessor.SAMPLE_RATE);
        
        if (processed.mfccs === null) {
            return res.status(500).json({ error: 'Failed to process uploaded audio' });
        }
        
        res.json({
            success: true,
            message: 'Audio uploaded and processed successfully',
            audioLength: audioData.length,
            sampleRate: audioProcessor.SAMPLE_RATE
        });
    } catch (error) {
        console.error('Error in upload-audio route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Computer Vision Routes
app.post('/api/analyze-frame', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }
        
        const imageBuffer = req.file.buffer;
        const analysis = await interviewService.analyzeFrame(imageBuffer);
        
        res.json({
            success: true,
            message: 'Frame analyzed successfully',
            analysis: analysis
        });
    } catch (error) {
        console.error('Error in analyze-frame route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/analysis-summary', (req, res) => {
    try {
        const summary = interviewService.getAnalysisSummary();
        res.json({
            success: true,
            summary: summary
        });
    } catch (error) {
        console.error('Error in analysis-summary route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/recent-results', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const results = interviewService.getRecentResults(limit);
        res.json({
            success: true,
            results: results
        });
    } catch (error) {
        console.error('Error in recent-results route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Emotion Detection & Interview Analysis Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Available routes:`);
    console.log(`  - GET  /api/health`);
    console.log(`  - POST /api/record-audio`);
    console.log(`  - POST /api/detect-emotion`);
    console.log(`  - POST /api/upload-audio`);
    console.log(`  - POST /api/analyze-frame`);
    console.log(`  - GET  /api/analysis-summary`);
    console.log(`  - GET  /api/recent-results`);
});
