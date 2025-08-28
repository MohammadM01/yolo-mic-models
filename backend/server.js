const express = require('express');
const cors = require('cors');
const InterviewAnalysisService = require('./src/interviewAnalysisService');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const interviewService = new InterviewAnalysisService();

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Interview Analysis Backend'
  });
});

app.post('/api/interview/initialize', async (req, res) => {
  try {
    const result = await interviewService.initialize();
    res.json({ 
      success: result, 
      message: result ? 'Interview analysis service initialized' : 'Failed to initialize service'
    });
  } catch (error) {
    console.error('Initialization error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/interview/start-models', (req, res) => {
  try {
    const result = interviewService.startModels();
    res.json({ 
      success: result, 
      message: result ? 'Models started successfully' : 'Failed to start models'
    });
  } catch (error) {
    console.error('Start models error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/interview/start-collection', (req, res) => {
  try {
    const result = interviewService.startDataCollection();
    res.json({ 
      success: result, 
      message: result ? 'Data collection started' : 'Failed to start data collection'
    });
  } catch (error) {
    console.error('Start collection error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/interview/stop-collection', (req, res) => {
  try {
    const result = interviewService.stopDataCollection();
    res.json({ 
      success: result, 
      message: result ? 'Data collection stopped' : 'Failed to stop data collection'
    });
  } catch (error) {
    console.error('Stop collection error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/interview/cycle-results', (req, res) => {
  try {
    const results = interviewService.getCycleResults();
    res.json({ 
      success: true, 
      results: results,
      count: results.length
    });
  } catch (error) {
    console.error('Get cycle results error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/interview/end', (req, res) => {
  try {
    const result = interviewService.endInterview();
    res.json({ 
      success: result, 
      message: result ? 'Interview ended successfully' : 'Failed to end interview'
    });
  } catch (error) {
    console.error('End interview error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/interview/status', (req, res) => {
  try {
    const status = interviewService.getCurrentStatus();
    res.json({ 
      success: true, 
      status: status
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Interview Analysis Backend Server running on port ${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🎥 Interview Analysis: http://localhost:${PORT}/api/interview/*`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  interviewService.cleanup();
  process.exit(0);
});