const fs = require('fs');
const path = require('path');

class MicrophoneProcessor {
  constructor() {
    this.isRecording = false;
    this.audioStream = null;
    this.audioChunks = [];
    this.sampleRate = 22050;
    this.analysisResults = [];
    
    console.log('Microphone Processor initialized');
  }

  async startRecording() {
    try {
      this.isRecording = true;
      this.audioChunks = [];
      
      console.log('🎤 Microphone recording started');
      return true;
    } catch (error) {
      console.error('Error starting microphone recording:', error);
      return false;
    }
  }

  async stopRecording() {
    try {
      this.isRecording = false;
      console.log('🎤 Microphone recording stopped');
      return true;
    } catch (error) {
      console.error('Error stopping microphone recording:', error);
      return false;
    }
  }

  // Simulate real-time audio analysis
  async analyzeSpeakingSkills(audioData = null) {
    try {
      // In a real implementation, this would process actual audio data
      // For now, we'll simulate realistic speaking analysis
      
      const metrics = {
        tone: {
          pitch: this.generateRealisticPitch(),
          volume: this.generateRealisticVolume(),
          clarity: this.generateRealisticClarity(),
          stability: this.generateRealisticStability(),
          // Enhanced tone analysis
          warmth: this.generateRealisticToneWarmth(),
          authority: this.generateRealisticToneAuthority(),
          enthusiasm: this.generateRealisticToneEnthusiasm(),
          confidence: this.generateRealisticToneConfidence()
        },
        strength: {
          vocalPower: this.generateRealisticVocalPower(),
          projection: this.generateRealisticProjection(),
          resonance: this.generateRealisticResonance(),
          breathControl: this.generateRealisticBreathControl(),
          stamina: this.generateRealisticVocalStamina()
        },
        hesitationPatterns: {
          frequency: this.generateRealisticHesitationFrequency(),
          duration: this.generateRealisticHesitationDuration(),
          recovery: this.generateRealisticHesitationRecovery(),
          types: this.generateRealisticHesitationTypes(),
          context: this.generateRealisticHesitationContext()
        },
        fluency: {
          pace: this.generateRealisticPace(),
          rhythm: this.generateRealisticRhythm(),
          pauses: this.generateRealisticPauses(),
          flow: this.generateRealisticFlow()
        },
        fillerWords: {
          umCount: this.generateRealisticFillerCount('um'),
          uhCount: this.generateRealisticFillerCount('uh'),
          likeCount: this.generateRealisticFillerCount('like'),
          youKnowCount: this.generateRealisticFillerCount('you know')
        },
        articulation: {
          pronunciation: this.generateRealisticPronunciation(),
          enunciation: this.generateRealisticEnunciation(),
          speed: this.generateRealisticSpeed()
        },
        score: 0.0,
        timestamp: Date.now()
      };

      // Calculate overall speaking score with enhanced metrics
      const toneScore = (metrics.tone.pitch + metrics.tone.volume + metrics.tone.clarity + metrics.tone.stability + 
                        metrics.tone.warmth + metrics.tone.authority + metrics.tone.enthusiasm + metrics.tone.confidence) / 8;
      
      const strengthScore = (metrics.strength.vocalPower + metrics.strength.projection + metrics.strength.resonance + 
                           metrics.strength.breathControl + metrics.strength.stamina) / 5;
      
      const hesitationScore = Math.max(0, 1 - (metrics.hesitationPatterns.frequency * 0.3 + metrics.hesitationPatterns.duration * 0.2));
      
      const fluencyScore = (metrics.fluency.pace + metrics.fluency.rhythm + metrics.fluency.flow) / 3;
      const articulationScore = (metrics.articulation.pronunciation + metrics.articulation.enunciation + metrics.articulation.speed) / 3;
      
      // Penalize for filler words
      const fillerPenalty = Math.min(0.2, (metrics.fillerWords.umCount + metrics.fillerWords.uhCount + metrics.fillerWords.likeCount) * 0.02);
      
      // Weighted scoring: tone (25%), strength (25%), hesitation (20%), fluency (15%), articulation (15%)
      metrics.score = Math.max(0, 
        (toneScore * 0.25) + 
        (strengthScore * 0.25) + 
        (hesitationScore * 0.20) + 
        (fluencyScore * 0.15) + 
        (articulationScore * 0.15) - 
        fillerPenalty
      );
      
      // Store analysis result
      this.analysisResults.push(metrics);
      
      return metrics;
    } catch (error) {
      console.error('Error analyzing speaking skills:', error);
      return {
        tone: { pitch: 0.5, volume: 0.5, clarity: 0.5, stability: 0.5 },
        fluency: { pace: 0.5, rhythm: 0.5, pauses: 0.5, flow: 0.5 },
        fillerWords: { umCount: 0, uhCount: 0, likeCount: 0, youKnowCount: 0 },
        articulation: { pronunciation: 0.5, enunciation: 0.5, speed: 0.5 },
        score: 0.5,
        timestamp: Date.now()
      };
    }
  }

  // Generate realistic pitch variations (0.0 to 1.0)
  generateRealisticPitch() {
    const basePitch = 0.6 + Math.random() * 0.3; // Base pitch between 0.6-0.9
    const variation = (Math.random() - 0.5) * 0.2; // ±0.1 variation
    return Math.max(0, Math.min(1, basePitch + variation));
  }

  // Generate realistic volume levels
  generateRealisticVolume() {
    const baseVolume = 0.7 + Math.random() * 0.2; // Base volume between 0.7-0.9
    const variation = (Math.random() - 0.5) * 0.15; // ±0.075 variation
    return Math.max(0, Math.min(1, baseVolume + variation));
  }

  // Generate realistic clarity scores
  generateRealisticClarity() {
    const baseClarity = 0.65 + Math.random() * 0.25; // Base clarity between 0.65-0.9
    const variation = (Math.random() - 0.5) * 0.1; // ±0.05 variation
    return Math.max(0, Math.min(1, baseClarity + variation));
  }

  // Generate realistic stability scores
  generateRealisticStability() {
    const baseStability = 0.6 + Math.random() * 0.3; // Base stability between 0.6-0.9
    const variation = (Math.random() - 0.5) * 0.15; // ±0.075 variation
    return Math.max(0, Math.min(1, baseStability + variation));
  }

  // Generate realistic pace scores
  generateRealisticPace() {
    const basePace = 0.55 + Math.random() * 0.3; // Base pace between 0.55-0.85
    const variation = (Math.random() - 0.5) * 0.2; // ±0.1 variation
    return Math.max(0, Math.min(1, basePace + variation));
  }

  // Generate realistic rhythm scores
  generateRealisticRhythm() {
    const baseRhythm = 0.6 + Math.random() * 0.25; // Base rhythm between 0.6-0.85
    const variation = (Math.random() - 0.5) * 0.15; // ±0.075 variation
    return Math.max(0, Math.min(1, baseRhythm + variation));
  }

  // Generate realistic pause analysis
  generateRealisticPauses() {
    const basePauses = 0.5 + Math.random() * 0.3; // Base pauses between 0.5-0.8
    const variation = (Math.random() - 0.5) * 0.2; // ±0.1 variation
    return Math.max(0, Math.min(1, basePauses + variation));
  }

  // Generate realistic flow scores
  generateRealisticFlow() {
    const baseFlow = 0.55 + Math.random() * 0.3; // Base flow between 0.55-0.85
    const variation = (Math.random() - 0.5) * 0.2; // ±0.1 variation
    return Math.max(0, Math.min(1, baseFlow + variation));
  }

  // Generate realistic filler word counts
  generateRealisticFillerCount(type) {
    // 80% chance of having no filler words (natural speech)
    if (Math.random() < 0.8) {
      return 0;
    }
    
    // 20% chance of having some filler words
    switch (type) {
      case 'um':
        return Math.floor(Math.random() * 2) + 1; // 1-2 ums (when present)
      case 'uh':
        return Math.floor(Math.random() * 2) + 1; // 1-2 uhs (when present)
      case 'like':
        return Math.floor(Math.random() * 2) + 1; // 1-2 likes (when present)
      case 'you know':
        return Math.floor(Math.random() * 2) + 1; // 1-2 you knows (when present)
      default:
        return 0;
    }
  }

  // Generate realistic pronunciation scores
  generateRealisticPronunciation() {
    const basePronunciation = 0.7 + Math.random() * 0.2; // Base pronunciation between 0.7-0.9
    const variation = (Math.random() - 0.5) * 0.15; // ±0.075 variation
    return Math.max(0, Math.min(1, basePronunciation + variation));
  }

  // Generate realistic enunciation scores
  generateRealisticEnunciation() {
    const baseEnunciation = 0.65 + Math.random() * 0.25; // Base enunciation between 0.65-0.9
    const variation = (Math.random() - 0.5) * 0.15; // ±0.075 variation
    return Math.max(0, Math.min(1, baseEnunciation + variation));
  }

  // Generate realistic speed scores
  generateRealisticSpeed() {
    const baseSpeed = 0.6 + Math.random() * 0.25; // Base speed between 0.6-0.85
    const variation = (Math.random() - 0.5) * 0.2; // ±0.1 variation
    return Math.max(0, Math.min(1, baseSpeed + variation));
  }

  // Enhanced Tone Analysis Generators
  
  // Generate realistic tone warmth (0.0 to 1.0)
  generateRealisticToneWarmth() {
    const baseWarmth = 0.5 + Math.random() * 0.4; // Base warmth between 0.5-0.9
    const variation = (Math.random() - 0.5) * 0.2; // ±0.1 variation
    return Math.max(0, Math.min(1, baseWarmth + variation));
  }

  // Generate realistic tone authority (0.0 to 1.0)
  generateRealisticToneAuthority() {
    const baseAuthority = 0.4 + Math.random() * 0.5; // Base authority between 0.4-0.9
    const variation = (Math.random() - 0.5) * 0.25; // ±0.125 variation
    return Math.max(0, Math.min(1, baseAuthority + variation));
  }

  // Generate realistic tone enthusiasm (0.0 to 1.0)
  generateRealisticToneEnthusiasm() {
    const baseEnthusiasm = 0.3 + Math.random() * 0.6; // Base enthusiasm between 0.3-0.9
    const variation = (Math.random() - 0.5) * 0.3; // ±0.15 variation
    return Math.max(0, Math.min(1, baseEnthusiasm + variation));
  }

  // Generate realistic tone confidence (0.0 to 1.0)
  generateRealisticToneConfidence() {
    const baseConfidence = 0.5 + Math.random() * 0.4; // Base confidence between 0.5-0.9
    const variation = (Math.random() - 0.5) * 0.2; // ±0.1 variation
    return Math.max(0, Math.min(1, baseConfidence + variation));
  }

  // Vocal Strength Generators
  
  // Generate realistic vocal power (0.0 to 1.0)
  generateRealisticVocalPower() {
    const basePower = 0.6 + Math.random() * 0.3; // Base power between 0.6-0.9
    const variation = (Math.random() - 0.5) * 0.2; // ±0.1 variation
    return Math.max(0, Math.min(1, basePower + variation));
  }

  // Generate realistic vocal projection (0.0 to 1.0)
  generateRealisticProjection() {
    const baseProjection = 0.5 + Math.random() * 0.4; // Base projection between 0.5-0.9
    const variation = (Math.random() - 0.5) * 0.25; // ±0.125 variation
    return Math.max(0, Math.min(1, baseProjection + variation));
  }

  // Generate realistic vocal resonance (0.0 to 1.0)
  generateRealisticResonance() {
    const baseResonance = 0.4 + Math.random() * 0.5; // Base resonance between 0.4-0.9
    const variation = (Math.random() - 0.5) * 0.2; // ±0.1 variation
    return Math.max(0, Math.min(1, baseResonance + variation));
  }

  // Generate realistic breath control (0.0 to 1.0)
  generateRealisticBreathControl() {
    const baseBreathControl = 0.5 + Math.random() * 0.4; // Base breath control between 0.5-0.9
    const variation = (Math.random() - 0.5) * 0.2; // ±0.1 variation
    return Math.max(0, Math.min(1, baseBreathControl + variation));
  }

  // Generate realistic vocal stamina (0.0 to 1.0)
  generateRealisticVocalStamina() {
    const baseStamina = 0.6 + Math.random() * 0.3; // Base stamina between 0.6-0.9
    const variation = (Math.random() - 0.5) * 0.2; // ±0.1 variation
    return Math.max(0, Math.min(1, baseStamina + variation));
  }

  // Hesitation Pattern Generators
  
  // Generate realistic hesitation frequency (0.0 to 1.0, lower is better)
  generateRealisticHesitationFrequency() {
    // 70% chance of low hesitation (good speakers)
    if (Math.random() < 0.7) {
      return 0.1 + Math.random() * 0.2; // 0.1-0.3 (low hesitation)
    }
    // 20% chance of medium hesitation
    else if (Math.random() < 0.9) {
      return 0.3 + Math.random() * 0.3; // 0.3-0.6 (medium hesitation)
    }
    // 10% chance of high hesitation
    else {
      return 0.6 + Math.random() * 0.4; // 0.6-1.0 (high hesitation)
    }
  }

  // Generate realistic hesitation duration (0.0 to 1.0, lower is better)
  generateRealisticHesitationDuration() {
    // 80% chance of short hesitations
    if (Math.random() < 0.8) {
      return 0.1 + Math.random() * 0.3; // 0.1-0.4 (short hesitations)
    }
    // 20% chance of longer hesitations
    else {
      return 0.4 + Math.random() * 0.6; // 0.4-1.0 (longer hesitations)
    }
  }

  // Generate realistic hesitation recovery (0.0 to 1.0, higher is better)
  generateRealisticHesitationRecovery() {
    // 75% chance of good recovery
    if (Math.random() < 0.75) {
      return 0.6 + Math.random() * 0.4; // 0.6-1.0 (good recovery)
    }
    // 25% chance of poor recovery
    else {
      return 0.2 + Math.random() * 0.4; // 0.2-0.6 (poor recovery)
    }
  }

  // Generate realistic hesitation types
  generateRealisticHesitationTypes() {
    const types = ['pause', 'filler', 'repetition', 'correction', 'thinking'];
    const selectedTypes = [];
    
    // Randomly select 1-3 hesitation types
    const numTypes = Math.floor(Math.random() * 3) + 1;
    const shuffled = types.sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < numTypes; i++) {
      selectedTypes.push(shuffled[i]);
    }
    
    return selectedTypes;
  }

  // Generate realistic hesitation context
  generateRealisticHesitationContext() {
    const contexts = ['transition', 'complex-idea', 'memory-recall', 'emotion', 'technical-term'];
    const selectedContexts = [];
    
    // Randomly select 1-2 contexts
    const numContexts = Math.floor(Math.random() * 2) + 1;
    const shuffled = contexts.sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < numContexts; i++) {
      selectedContexts.push(shuffled[i]);
    }
    
    return selectedContexts;
  }

  // Get recent analysis results
  getRecentResults(limit = 10) {
    return this.analysisResults.slice(-limit);
  }

  // Get speaking skills summary
  getSpeakingSummary() {
    if (this.analysisResults.length === 0) {
      return { message: 'No speaking analysis data available' };
    }

    const recentResults = this.analysisResults.slice(-5); // Last 5 results
    const avgScore = recentResults.reduce((sum, result) => sum + result.score, 0) / recentResults.length;
    
    // Enhanced tone analysis (including new metrics)
    const avgTone = recentResults.reduce((sum, result) => 
      sum + (result.tone.pitch + result.tone.volume + result.tone.clarity + result.tone.stability + 
             result.tone.warmth + result.tone.authority + result.tone.enthusiasm + result.tone.confidence) / 8, 0) / recentResults.length;
    
    // Vocal strength analysis
    const avgStrength = recentResults.reduce((sum, result) => 
      sum + (result.strength.vocalPower + result.strength.projection + result.strength.resonance + 
             result.strength.breathControl + result.strength.stamina) / 5, 0) / recentResults.length;
    
    // Hesitation pattern analysis (lower is better, so we invert the score)
    const avgHesitation = recentResults.reduce((sum, result) => 
      sum + (1 - (result.hesitationPatterns.frequency * 0.4 + result.hesitationPatterns.duration * 0.3 + 
                  (1 - result.hesitationPatterns.recovery) * 0.3)), 0) / recentResults.length;
    
    const avgFluency = recentResults.reduce((sum, result) => 
      sum + (result.fluency.pace + result.fluency.rhythm + result.fluency.flow) / 3, 0) / recentResults.length;
    
    const avgArticulation = recentResults.reduce((sum, result) => 
      sum + (result.articulation.pronunciation + result.articulation.enunciation + result.articulation.speed) / 3, 0) / recentResults.length;

    const totalFillers = recentResults.reduce((sum, result) => 
      sum + result.fillerWords.umCount + result.fillerWords.uhCount + result.fillerWords.likeCount, 0);

    // Get most common hesitation types
    const hesitationTypes = {};
    recentResults.forEach(result => {
      result.hesitationPatterns.types.forEach(type => {
        hesitationTypes[type] = (hesitationTypes[type] || 0) + 1;
      });
    });

    // Get most common hesitation contexts
    const hesitationContexts = {};
    recentResults.forEach(result => {
      result.hesitationPatterns.context.forEach(context => {
        hesitationContexts[context] = (hesitationContexts[context] || 0) + 1;
      });
    });

    return {
      averageScore: avgScore,
      averageTone: avgTone,
      averageStrength: avgStrength,
      averageHesitation: avgHesitation,
      averageFluency: avgFluency,
      averageArticulation: avgArticulation,
      totalFillerWords: totalFillers,
      mostCommonHesitationTypes: hesitationTypes,
      mostCommonHesitationContexts: hesitationContexts,
      samplesAnalyzed: this.analysisResults.length,
      timestamp: new Date().toISOString()
    };
  }

  // Get detailed tone analysis
  getDetailedToneAnalysis() {
    if (this.analysisResults.length === 0) {
      return { message: 'No tone analysis data available' };
    }

    const recentResults = this.analysisResults.slice(-10); // Last 10 results
    
    const toneBreakdown = {
      pitch: {
        average: recentResults.reduce((sum, result) => sum + result.tone.pitch, 0) / recentResults.length,
        trend: this.calculateTrend(recentResults.map(r => r.tone.pitch))
      },
      volume: {
        average: recentResults.reduce((sum, result) => sum + result.tone.volume, 0) / recentResults.length,
        trend: this.calculateTrend(recentResults.map(r => r.tone.volume))
      },
      clarity: {
        average: recentResults.reduce((sum, result) => sum + result.tone.clarity, 0) / recentResults.length,
        trend: this.calculateTrend(recentResults.map(r => r.tone.clarity))
      },
      stability: {
        average: recentResults.reduce((sum, result) => sum + result.tone.stability, 0) / recentResults.length,
        trend: this.calculateTrend(recentResults.map(r => r.tone.stability))
      },
      warmth: {
        average: recentResults.reduce((sum, result) => sum + result.tone.warmth, 0) / recentResults.length,
        trend: this.calculateTrend(recentResults.map(r => r.tone.warmth))
      },
      authority: {
        average: recentResults.reduce((sum, result) => sum + result.tone.authority, 0) / recentResults.length,
        trend: this.calculateTrend(recentResults.map(r => r.tone.authority))
      },
      enthusiasm: {
        average: recentResults.reduce((sum, result) => sum + result.tone.enthusiasm, 0) / recentResults.length,
        trend: this.calculateTrend(recentResults.map(r => r.tone.enthusiasm))
      },
      confidence: {
        average: recentResults.reduce((sum, result) => sum + result.tone.confidence, 0) / recentResults.length,
        trend: this.calculateTrend(recentResults.map(r => r.tone.confidence))
      }
    };

    return {
      toneBreakdown,
      overallToneScore: Object.values(toneBreakdown).reduce((sum, metric) => sum + metric.average, 0) / Object.keys(toneBreakdown).length,
      samplesAnalyzed: recentResults.length,
      timestamp: new Date().toISOString()
    };
  }

  // Get detailed strength analysis
  getDetailedStrengthAnalysis() {
    if (this.analysisResults.length === 0) {
      return { message: 'No strength analysis data available' };
    }

    const recentResults = this.analysisResults.slice(-10); // Last 10 results
    
    const strengthBreakdown = {
      vocalPower: {
        average: recentResults.reduce((sum, result) => sum + result.strength.vocalPower, 0) / recentResults.length,
        trend: this.calculateTrend(recentResults.map(r => r.strength.vocalPower))
      },
      projection: {
        average: recentResults.reduce((sum, result) => sum + result.strength.projection, 0) / recentResults.length,
        trend: this.calculateTrend(recentResults.map(r => r.strength.projection))
      },
      resonance: {
        average: recentResults.reduce((sum, result) => sum + result.strength.resonance, 0) / recentResults.length,
        trend: this.calculateTrend(recentResults.map(r => r.strength.resonance))
      },
      breathControl: {
        average: recentResults.reduce((sum, result) => sum + result.strength.breathControl, 0) / recentResults.length,
        trend: this.calculateTrend(recentResults.map(r => r.strength.breathControl))
      },
      stamina: {
        average: recentResults.reduce((sum, result) => sum + result.strength.stamina, 0) / recentResults.length,
        trend: this.calculateTrend(recentResults.map(r => r.strength.stamina))
      }
    };

    return {
      strengthBreakdown,
      overallStrengthScore: Object.values(strengthBreakdown).reduce((sum, metric) => sum + metric.average, 0) / Object.keys(strengthBreakdown).length,
      samplesAnalyzed: recentResults.length,
      timestamp: new Date().toISOString()
    };
  }

  // Get detailed hesitation analysis
  getDetailedHesitationAnalysis() {
    if (this.analysisResults.length === 0) {
      return { message: 'No hesitation analysis data available' };
    }

    const recentResults = this.analysisResults.slice(-10); // Last 10 results
    
    const hesitationBreakdown = {
      frequency: {
        average: recentResults.reduce((sum, result) => sum + result.hesitationPatterns.frequency, 0) / recentResults.length,
        trend: this.calculateTrend(recentResults.map(r => r.hesitationPatterns.frequency)),
        interpretation: this.interpretHesitationFrequency(recentResults.reduce((sum, result) => sum + result.hesitationPatterns.frequency, 0) / recentResults.length)
      },
      duration: {
        average: recentResults.reduce((sum, result) => sum + result.hesitationPatterns.duration, 0) / recentResults.length,
        trend: this.calculateTrend(recentResults.map(r => r.hesitationPatterns.duration)),
        interpretation: this.interpretHesitationDuration(recentResults.reduce((sum, result) => sum + result.hesitationPatterns.duration, 0) / recentResults.length)
      },
      recovery: {
        average: recentResults.reduce((sum, result) => sum + result.hesitationPatterns.recovery, 0) / recentResults.length,
        trend: this.calculateTrend(recentResults.map(r => r.hesitationPatterns.recovery)),
        interpretation: this.interpretHesitationRecovery(recentResults.reduce((sum, result) => sum + result.hesitationPatterns.recovery, 0) / recentResults.length)
      }
    };

    // Aggregate hesitation types and contexts
    const allHesitationTypes = {};
    const allHesitationContexts = {};
    
    recentResults.forEach(result => {
      result.hesitationPatterns.types.forEach(type => {
        allHesitationTypes[type] = (allHesitationTypes[type] || 0) + 1;
      });
      result.hesitationPatterns.context.forEach(context => {
        allHesitationContexts[context] = (allHesitationContexts[context] || 0) + 1;
      });
    });

    return {
      hesitationBreakdown,
      hesitationTypes: allHesitationTypes,
      hesitationContexts: allHesitationContexts,
      overallHesitationScore: 1 - (hesitationBreakdown.frequency.average * 0.4 + hesitationBreakdown.duration.average * 0.3 + (1 - hesitationBreakdown.recovery.average) * 0.3),
      samplesAnalyzed: recentResults.length,
      timestamp: new Date().toISOString()
    };
  }

  // Helper method to calculate trend (positive, negative, or stable)
  calculateTrend(values) {
    if (values.length < 2) return 'insufficient-data';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (Math.abs(difference) < 0.05) return 'stable';
    return difference > 0 ? 'improving' : 'declining';
  }

  // Helper methods to interpret hesitation metrics
  interpretHesitationFrequency(frequency) {
    if (frequency < 0.2) return 'excellent';
    if (frequency < 0.4) return 'good';
    if (frequency < 0.6) return 'fair';
    return 'needs-improvement';
  }

  interpretHesitationDuration(duration) {
    if (duration < 0.2) return 'excellent';
    if (duration < 0.4) return 'good';
    if (duration < 0.6) return 'fair';
    return 'needs-improvement';
  }

  interpretHesitationRecovery(recovery) {
    if (recovery > 0.8) return 'excellent';
    if (recovery > 0.6) return 'good';
    if (recovery > 0.4) return 'fair';
    return 'needs-improvement';
  }

  // Cleanup resources
  cleanup() {
    this.stopRecording();
    this.analysisResults = [];
    console.log('Microphone Processor cleaned up');
  }
}

module.exports = MicrophoneProcessor;
