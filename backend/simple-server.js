const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Basic routes
app.get('/', (req, res) => {
    res.json({ 
        message: 'Simplified Emotion Detection Backend API',
        services: ['Audio Processing'],
        version: '2.0.0'
    });
});

// Simple audio test route
app.post('/api/test-audio', async (req, res) => {
    try {
        const { audioData } = req.body;
        
        if (!audioData) {
            return res.status(400).json({ error: 'Audio data is required' });
        }
        
        // Simple response without complex processing
        res.json({
            success: true,
            message: 'Audio received successfully',
            audioLength: audioData.length,
            status: 'processed'
        });
    } catch (error) {
        console.error('Error in test-audio route:', error);
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

app.listen(PORT, () => {
    console.log(`Simplified server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});
