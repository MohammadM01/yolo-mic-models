const ComputerVisionProcessor = require('./computerVisionProcessor-simple');
const MicrophoneProcessor = require('./microphoneProcessor');
const fs = require('fs');

class InterviewAnalysisService {
  constructor() {
    this.isRunning = false;
    this.isCollecting = false;
    this.cycleDuration = 10000; // 10 seconds
    this.cycleInterval = null;
    this.cycleCount = 0;
    this.cycleResults = [];
    this.currentCycleData = {
      facialExpressions: [],
      postureData: [],
      speakingMetrics: [],
      eyeContactData: [],
      startTime: null
    };
    
    // Initialize processors
    this.visionProcessor = new ComputerVisionProcessor();
    this.microphoneProcessor = new MicrophoneProcessor();
    
    // Statistics
    this.stats = {
      totalCycles: 0,
      totalFrames: 0,
      totalAudioSamples: 0,
      sessionStartTime: null
    };
    
    console.log('Interview Analysis Service initialized');
  }

  async initialize() {
    try {
      // Initialize vision models
      await this.visionProcessor.initModels();
      
      // Initialize microphone processor
      console.log('Microphone processor initialized');
      
      this.stats.sessionStartTime = Date.now();
      console.log('Interview Analysis Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Initialization error:', error);
      return false;
    }
  }

  startModels() {
    if (this.isRunning) {
      console.log('Models are already running');
      return false;
    }
    
    this.isRunning = true;
    this.isCollecting = false;
    this.cycleCount = 0;
    this.cycleResults = [];
    
    console.log('🎥 Models started - Camera and microphone active');
    console.log('📊 Click again to start data collection in 10s cycles');
    
    return true;
  }

  startDataCollection() {
    if (!this.isRunning) {
      console.log('❌ Models must be started first');
      return false;
    }
    
    if (this.isCollecting) {
      console.log('❌ Data collection already in progress');
      return false;
    }
    
    this.isCollecting = true;
    this.cycleCount = 0;
    this.cycleResults = [];
    
    // Start microphone recording
    this.microphoneProcessor.startRecording();
    
    console.log('🔄 Starting data collection in 10-second cycles...');
    this.startCycle();
    
    return true;
  }

  startCycle() {
    if (!this.isCollecting) return;
    
    this.cycleCount++;
    this.currentCycleData = {
      facialExpressions: [],
      postureData: [],
      speakingMetrics: [],
      eyeContactData: [],
      startTime: Date.now()
    };
    
    console.log(`\n🔄 Cycle ${this.cycleCount} started at ${new Date().toLocaleTimeString()}`);
    
    // Simulate data collection for this cycle
    this.collectCycleData();
    
    // Schedule next cycle
    this.cycleInterval = setTimeout(() => {
      this.completeCycle();
    }, this.cycleDuration);
  }

  async collectCycleData() {
    if (!this.isCollecting) return;
    
    // Simulate real-time data collection
    const dataCollectionInterval = setInterval(async () => {
      if (!this.isCollecting) {
        clearInterval(dataCollectionInterval);
        return;
      }
      
      // Collect facial expression data
      const expression = await this.visionProcessor.analyzeEmotion(null);
      this.currentCycleData.facialExpressions.push(expression);
      
      // Collect posture data
      const posture = await this.visionProcessor.analyzePosture(null);
      this.currentCycleData.postureData.push(posture);
      
      // Collect speaking metrics using microphone processor
      const speakingMetric = await this.microphoneProcessor.analyzeSpeakingSkills();
      console.log('🎤 Speaking metric collected:', JSON.stringify(speakingMetric, null, 2));
      this.currentCycleData.speakingMetrics.push(speakingMetric);
      
      // Collect eye contact data
      const eyeContact = await this.visionProcessor.detectEyeContact(null);
      this.currentCycleData.eyeContactData.push(eyeContact.hasEyeContact);
      
    }, 1000); // Collect data every second
  }

  completeCycle() {
    if (!this.isCollecting) return;
    
    const cycleEndTime = Date.now();
    const cycleDuration = cycleEndTime - this.currentCycleData.startTime;
    
    // Calculate cycle summary
    const cycleSummary = this.calculateCycleSummary(this.currentCycleData);
    
    // Add cycle result
    this.cycleResults.push({
      cycleNumber: this.cycleCount,
      startTime: this.currentCycleData.startTime,
      endTime: cycleEndTime,
      duration: cycleDuration,
      summary: cycleSummary,
      rawData: { ...this.currentCycleData }
    });
    
    // Log cycle summary to console
    console.log(`\n📊 Cycle ${this.cycleCount} Summary:`);
    console.log(`   Duration: ${cycleDuration}ms`);
    console.log(`   Facial Expressions: ${cycleSummary.dominantExpression} (${(cycleSummary.expressionConfidence * 100).toFixed(1)}%)`);
    console.log(`   Posture: ${cycleSummary.dominantPosture} (${(cycleSummary.postureConfidence * 100).toFixed(1)}%)`);
    console.log(`   Speaking Score: ${(cycleSummary.speakingScore * 100).toFixed(1)}%`);
    console.log(`   Eye Contact Rate: ${(cycleSummary.eyeContactRate * 100).toFixed(1)}%`);
    console.log(`   Overall Confidence: ${(cycleSummary.overallConfidence * 100).toFixed(1)}%`);
    console.log(`   🗣️ Filler Words: ${cycleSummary.fillerWords.total} total`);
    if (cycleSummary.fillerWords.total > 0) {
      console.log(`      - Um: ${cycleSummary.fillerWords.breakdown.um}`);
      console.log(`      - Uh: ${cycleSummary.fillerWords.breakdown.uh}`);
      console.log(`      - Like: ${cycleSummary.fillerWords.breakdown.like}`);
      console.log(`      - You Know: ${cycleSummary.fillerWords.breakdown.youKnow}`);
    }
    
    // Start next cycle if still collecting
    if (this.isCollecting) {
      this.startCycle();
    }
  }

  calculateCycleSummary(cycleData) {
    // Calculate dominant facial expression
    const expressionCounts = {};
    cycleData.facialExpressions.forEach(expr => {
      const emotion = expr.expression || 'neutral';
      expressionCounts[emotion] = (expressionCounts[emotion] || 0) + 1;
    });
    const dominantExpression = Object.keys(expressionCounts).reduce((a, b) => 
      expressionCounts[a] > expressionCounts[b] ? a : b, 'neutral');
    const expressionConfidence = cycleData.facialExpressions.length > 0 ? 
      cycleData.facialExpressions.reduce((sum, expr) => sum + (expr.confidence || 0), 0) / cycleData.facialExpressions.length : 0;
    
    // Calculate dominant posture
    const postureCounts = {};
    cycleData.postureData.forEach(post => {
      const posture = post.posture || 'unknown';
      postureCounts[posture] = (postureCounts[posture] || 0) + 1;
    });
    const dominantPosture = Object.keys(postureCounts).reduce((a, b) => 
      postureCounts[a] > postureCounts[b] ? a : b, 'unknown');
    const postureConfidence = cycleData.postureData.length > 0 ? 
      cycleData.postureData.reduce((sum, post) => sum + (post.confidence || 0), 0) / cycleData.postureData.length : 0;
    
    // Calculate speaking score and filler words
    let speakingScore = 0;
    let totalFillerWords = 0;
    let fillerWordBreakdown = {
      um: 0,
      uh: 0,
      like: 0,
      youKnow: 0
    };
    
    if (cycleData.speakingMetrics.length > 0) {
      speakingScore = cycleData.speakingMetrics.reduce((sum, metric) => sum + (metric.score || 0), 0) / cycleData.speakingMetrics.length;
      
      // Aggregate filler words from all speaking metrics in this cycle
      cycleData.speakingMetrics.forEach(metric => {
        console.log('🔍 Speaking metric:', JSON.stringify(metric, null, 2));
        if (metric.fillerWords) {
          console.log('🗣️ Found filler words:', metric.fillerWords);
          totalFillerWords += (metric.fillerWords.umCount || 0) + (metric.fillerWords.uhCount || 0) + 
                             (metric.fillerWords.likeCount || 0) + (metric.fillerWords.youKnowCount || 0);
          
          fillerWordBreakdown.um += (metric.fillerWords.umCount || 0);
          fillerWordBreakdown.uh += (metric.fillerWords.uhCount || 0);
          fillerWordBreakdown.like += (metric.fillerWords.likeCount || 0);
          fillerWordBreakdown.youKnow += (metric.fillerWords.youKnowCount || 0);
        } else {
          console.log('❌ No filler words found in metric');
        }
      });
    }
    
    // Calculate eye contact rate
    const eyeContactRate = cycleData.eyeContactData.length > 0 ? 
      cycleData.eyeContactData.filter(contact => contact).length / cycleData.eyeContactData.length : 0;
    
    // Calculate overall confidence
    const overallConfidence = (expressionConfidence + postureConfidence + speakingScore + eyeContactRate) / 4;
    
    return {
      dominantExpression,
      expressionConfidence,
      dominantPosture,
      postureConfidence,
      speakingScore,
      eyeContactRate,
      overallConfidence,
      fillerWords: {
        total: totalFillerWords,
        breakdown: fillerWordBreakdown
      }
    };
  }

  stopDataCollection() {
    if (!this.isCollecting) {
      console.log('❌ No data collection in progress');
      return false;
    }
    
    this.isCollecting = false;
    
    if (this.cycleInterval) {
      clearTimeout(this.cycleInterval);
      this.cycleInterval = null;
    }
    
    console.log('\n🛑 Data collection stopped');
    console.log(`📊 Total cycles completed: ${this.cycleCount}`);
    console.log(`📋 All cycle results available for display`);
    
    return true;
  }

  endInterview() {
    this.isRunning = false;
    this.isCollecting = false;
    
    if (this.cycleInterval) {
      clearTimeout(this.cycleInterval);
      this.cycleInterval = null;
    }
    
    console.log('\n🏁 Interview ended - All models stopped');
    console.log(`📊 Final Statistics:`);
    console.log(`   Total Cycles: ${this.cycleCount}`);
    console.log(`   Total Results: ${this.cycleResults.length}`);
    console.log(`   Session Duration: ${this.getSessionDuration()}ms`);
    
    return true;
  }

  getCycleResults() {
    return this.cycleResults;
  }

  getCurrentStatus() {
    return {
      isRunning: this.isRunning,
      isCollecting: this.isCollecting,
      currentCycle: this.cycleCount,
      totalCycles: this.cycleResults.length,
      sessionDuration: this.getSessionDuration()
    };
  }

  getSessionDuration() {
    if (!this.stats.sessionStartTime) return 0;
    return Date.now() - this.stats.sessionStartTime;
  }

  analyzeSpeakingSkills() {
    // Simulate speaking skills analysis
    const metrics = {
      tone: {
        pitch: 0.5 + Math.random() * 0.5,
        volume: 0.6 + Math.random() * 0.4,
        clarity: 0.7 + Math.random() * 0.3
      },
      fluency: {
        pace: 0.6 + Math.random() * 0.4,
        rhythm: 0.5 + Math.random() * 0.5,
        pauses: 0.4 + Math.random() * 0.6
      },
      fillerWords: {
        umCount: Math.floor(Math.random() * 5),
        uhCount: Math.floor(Math.random() * 3),
        likeCount: Math.floor(Math.random() * 4)
      },
      score: 0.5 + Math.random() * 0.5
    };
    
    return metrics;
  }

  getAnalysisSummary() {
    if (this.cycleResults.length === 0) {
      return { message: 'No data collected yet' };
    }
    
    const totalCycles = this.cycleResults.length;
    const avgExpressionConfidence = this.cycleResults.reduce((sum, cycle) => 
      sum + cycle.summary.expressionConfidence, 0) / totalCycles;
    const avgPostureConfidence = this.cycleResults.reduce((sum, cycle) => 
      sum + cycle.summary.postureConfidence, 0) / totalCycles;
    const avgSpeakingScore = this.cycleResults.reduce((sum, cycle) => 
      sum + cycle.summary.speakingScore, 0) / totalCycles;
    const avgEyeContactRate = this.cycleResults.reduce((sum, cycle) => 
      sum + cycle.summary.eyeContactRate, 0) / totalCycles;
    
    return {
      totalCycles,
      sessionDuration: this.getSessionDuration(),
      averages: {
        expressionConfidence: avgExpressionConfidence,
        postureConfidence: avgPostureConfidence,
        speakingScore: avgSpeakingScore,
        eyeContactRate: avgEyeContactRate
      },
      lastCycle: this.cycleResults[this.cycleResults.length - 1]
    };
  }

  getRecentResults(limit = 10) {
    return this.cycleResults.slice(-limit);
  }

  getSpeakingAnalysis() {
    return this.microphoneProcessor.getSpeakingSummary();
  }

  getDetailedSpeakingMetrics() {
    return this.microphoneProcessor.getRecentResults();
  }

  cleanup() {
    this.endInterview();
    console.log('Interview Analysis Service cleaned up');
  }
}

module.exports = InterviewAnalysisService;