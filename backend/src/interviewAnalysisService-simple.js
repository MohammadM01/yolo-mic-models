const ComputerVisionProcessor = require('./computerVisionProcessor-simple');

class InterviewAnalysisService {
  constructor() {
    this.computerVision = new ComputerVisionProcessor();
    this.analysisResults = [];
    this.startTime = Date.now();
    
    console.log('InterviewAnalysisService initialized (simplified mode)');
  }

  async analyzeFrame(imageBuffer) {
    try {
      const results = await this.computerVision.processFrame(imageBuffer);
      
      const analysis = {
        timestamp: Date.now(),
        emotion: results[0],
        hasPhone: results[1],
        posture: results[2],
        eyeContact: results[3],
        confidence: results[4]
      };
      
      this.analysisResults.push(analysis);
      
      // Keep only last 100 results to prevent memory issues
      if (this.analysisResults.length > 100) {
        this.analysisResults = this.analysisResults.slice(-100);
      }
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing frame:', error);
      return {
        timestamp: Date.now(),
        emotion: 'neutral',
        hasPhone: false,
        posture: 'unknown',
        eyeContact: false,
        confidence: 0.0,
        error: error.message
      };
    }
  }

  getAnalysisSummary() {
    if (this.analysisResults.length === 0) {
      return {
        totalFrames: 0,
        averageConfidence: 0,
        dominantEmotion: 'neutral',
        phoneUsagePercentage: 0,
        postureDistribution: {},
        startTime: this.startTime,
        duration: Date.now() - this.startTime
      };
    }

    const emotions = this.analysisResults.map(r => r.emotion);
    const confidences = this.analysisResults.map(r => r.confidence);
    const phones = this.analysisResults.map(r => r.hasPhone);
    const postures = this.analysisResults.map(r => r.posture);

    // Calculate dominant emotion
    const emotionCounts = {};
    emotions.forEach(emotion => {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });
    const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => 
      emotionCounts[a] > emotionCounts[b] ? a : b
    );

    // Calculate phone usage percentage
    const phoneUsagePercentage = (phones.filter(p => p).length / phones.length) * 100;

    // Calculate posture distribution
    const postureDistribution = {};
    postures.forEach(posture => {
      postureDistribution[posture] = (postureDistribution[posture] || 0) + 1;
    });

    return {
      totalFrames: this.analysisResults.length,
      averageConfidence: confidences.reduce((a, b) => a + b, 0) / confidences.length,
      dominantEmotion: dominantEmotion,
      phoneUsagePercentage: phoneUsagePercentage,
      postureDistribution: postureDistribution,
      startTime: this.startTime,
      duration: Date.now() - this.startTime,
      lastUpdate: this.analysisResults[this.analysisResults.length - 1]?.timestamp
    };
  }

  getRecentResults(limit = 10) {
    return this.analysisResults.slice(-limit);
  }

  reset() {
    this.analysisResults = [];
    this.startTime = Date.now();
    console.log('InterviewAnalysisService reset');
  }

  close() {
    this.computerVision.close();
    console.log('InterviewAnalysisService closed');
  }
}

module.exports = InterviewAnalysisService;
