import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const InterviewAnalysis = () => {
  const [isModelsRunning, setIsModelsRunning] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [cycleResults, setCycleResults] = useState([]);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [webcamStream, setWebcamStream] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const statusIntervalRef = useRef(null);

  const API_BASE_URL = 'http://localhost:3001/api';

  useEffect(() => {
    // Start status monitoring when component mounts
    startStatusMonitoring();
    
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, []);

  const startStatusMonitoring = () => {
    statusIntervalRef.current = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/interview/status`);
        if (response.data.success) {
          setCurrentStatus(response.data.status);
          setIsModelsRunning(response.data.status.isRunning);
          setIsCollecting(response.data.status.isCollecting);
        }
      } catch (error) {
        console.error('Status monitoring error:', error);
        setError('Failed to get status from server');
      }
    }, 2000); // Update every 2 seconds
  };

  const startStreams = async () => {
    try {
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      
      setWebcamStream(stream);
      setAudioStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to access camera or microphone: ' + err.message);
    }
  };

  const stopStreams = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
  };

  const startModels = async () => {
    try {
      setError(null);
      
      // Initialize the service first
      await axios.post(`${API_BASE_URL}/interview/initialize`);
      
      // Start the models
      const response = await axios.post(`${API_BASE_URL}/interview/start-models`);
      
      if (response.data.success) {
        setIsModelsRunning(true);
        setError(null);
      } else {
        setError('Failed to start models: ' + response.data.message);
      }
    } catch (err) {
      setError('Error starting models: ' + err.message);
    }
  };

  const startStreamsAndModels = async () => {
    try {
      setError(null);
      
      // First start the camera and microphone streams
      await startStreams();
      
      // Wait a moment for streams to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Then start the models
      await startModels();
      
    } catch (err) {
      setError('Error starting streams and models: ' + err.message);
    }
  };

  const startDataCollection = async () => {
    try {
      setError(null);
      
      const response = await axios.post(`${API_BASE_URL}/interview/start-collection`);
      
      if (response.data.success) {
        setIsCollecting(true);
        setError(null);
      } else {
        setError('Failed to start data collection: ' + response.data.message);
      }
    } catch (err) {
      setError('Error starting data collection: ' + err.message);
    }
  };

  const stopDataCollection = async () => {
    try {
      setError(null);
      
      const response = await axios.post(`${API_BASE_URL}/interview/stop-collection`);
      
      if (response.data.success) {
        setIsCollecting(false);
        
        // Get the cycle results
        const resultsResponse = await axios.get(`${API_BASE_URL}/interview/cycle-results`);
        if (resultsResponse.data.success) {
          setCycleResults(resultsResponse.data.results);
        }
        
        setError(null);
      } else {
        setError('Failed to stop data collection: ' + response.data.message);
      }
    } catch (err) {
      setError('Error stopping data collection: ' + err.message);
    }
  };

  const endInterview = async () => {
    try {
      setError(null);
      
      const response = await axios.post(`${API_BASE_URL}/interview/end`);
      
      if (response.data.success) {
        setIsModelsRunning(false);
        setIsCollecting(false);
        stopStreams();
        setError(null);
      } else {
        setError('Failed to end interview: ' + response.data.message);
      }
    } catch (err) {
      setError('Error ending interview: ' + err.message);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = 640;
      canvas.height = 480;
      context.drawImage(videoRef.current, 0, 0, 640, 480);
      
      // Convert to blob and send to server
      canvas.toBlob(async (blob) => {
        try {
          const formData = new FormData();
          formData.append('frame', blob, 'frame.jpg');
          
          await axios.post(`${API_BASE_URL}/analyze-frame`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (err) {
          console.error('Error sending frame:', err);
        }
      }, 'image/jpeg');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          🎥 Interview Analysis System
        </h1>
        
        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Control Panel</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={startStreamsAndModels}
              disabled={webcamStream || isModelsRunning}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              🚀 Start Camera & Mic & Models
            </button>
            
            <button
              onClick={isCollecting ? stopDataCollection : startDataCollection}
              disabled={!isModelsRunning}
              className={`font-bold py-3 px-4 rounded transition-colors ${
                isCollecting 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                  : 'bg-yellow-500 hover:bg-yellow-600 text-white'
              } disabled:bg-gray-400 disabled:text-white`}
            >
              {isCollecting ? '⏹️ Stop Collection' : '🔄 Start Collection'}
            </button>
          </div>
          
          <div className="mt-4">
            <button
              onClick={endInterview}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded transition-colors"
            >
              🏁 End Interview
            </button>
          </div>
        </div>

        {/* Video Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Live Video Feed</h2>
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 bg-gray-200 rounded"
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              {webcamStream && (
                <button
                  onClick={captureFrame}
                  className="absolute bottom-2 right-2 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
                >
                  📸 Capture
                </button>
              )}
            </div>
          </div>

          {/* Status Panel */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">System Status</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Camera & Microphone:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  webcamStream ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {webcamStream ? '🟢 Active' : '🔴 Inactive'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Models:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  isModelsRunning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isModelsRunning ? '🟢 Running' : '🔴 Stopped'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Data Collection:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  isCollecting ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {isCollecting ? '🟡 Collecting' : '⚪ Idle'}
                </span>
              </div>
              
              {currentStatus && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Current Cycle:</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {currentStatus.currentCycle || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Cycles:</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {currentStatus.totalCycles || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Session Duration:</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {Math.round((currentStatus.sessionDuration || 0) / 1000)}s
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Cycle Results */}
        {cycleResults.length > 0 && (
          <div className="bg-purple-100 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-purple-800">
              📊 Cycle Results ({cycleResults.length} cycles)
            </h2>
            
            <div className="space-y-4">
              {cycleResults.map((cycle, index) => (
                <div key={index} className="bg-white rounded-lg p-4 shadow">
                  <h3 className="text-lg font-semibold text-purple-700 mb-2">
                    Cycle {cycle.cycleNumber} - {new Date(cycle.startTime).toLocaleTimeString()}
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Duration:</span>
                      <div className="text-purple-600">{Math.round(cycle.duration / 1000)}s</div>
                    </div>
                    
                    <div>
                      <span className="font-medium">Expression:</span>
                      <div className="text-purple-600">
                        {cycle.summary.dominantExpression} ({(cycle.summary.expressionConfidence * 100).toFixed(1)}%)
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium">Posture:</span>
                      <div className="text-purple-600">
                        {cycle.summary.dominantPosture} ({(cycle.summary.postureConfidence * 100).toFixed(1)}%)
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium">Eye Contact:</span>
                      <div className="text-purple-600">
                        {(cycle.summary.eyeContactRate * 100).toFixed(1)}%
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium">Overall Confidence:</span>
                      <div className="text-purple-600">
                        {(cycle.summary.overallConfidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Speaking Analysis Section */}
                  {cycle.summary.speakingMetrics && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-3">🎤 Speaking Analysis</h4>
                      
                      {/* Overall Speaking Score */}
                      <div className="mb-3 p-3 bg-white rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-blue-700">Overall Speaking Score:</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {(cycle.summary.speakingScore * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Detailed Speaking Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {/* Tone Analysis */}
                        <div className="bg-white p-3 rounded border">
                          <h5 className="font-medium text-blue-700 mb-2">🎵 Tone Quality</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Pitch:</span>
                              <span className="text-blue-600 font-medium">
                                {cycle.summary.speakingMetrics.tone?.pitch ? 
                                  (cycle.summary.speakingMetrics.tone.pitch * 100).toFixed(1) + '%' : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Volume:</span>
                              <span className="text-blue-600 font-medium">
                                {cycle.summary.speakingMetrics.tone?.volume ? 
                                  (cycle.summary.speakingMetrics.tone.volume * 100).toFixed(1) + '%' : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Clarity:</span>
                              <span className="text-blue-600 font-medium">
                                {cycle.summary.speakingMetrics.tone?.clarity ? 
                                  (cycle.summary.speakingMetrics.tone.clarity * 100).toFixed(1) + '%' : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Stability:</span>
                              <span className="text-blue-600 font-medium">
                                {cycle.summary.speakingMetrics.tone?.stability ? 
                                  (cycle.summary.speakingMetrics.tone.stability * 100).toFixed(1) + '%' : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Vocal Strength */}
                        <div className="bg-white p-3 rounded border">
                          <h5 className="font-medium text-blue-700 mb-2">💪 Vocal Strength</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Power:</span>
                              <span className="text-blue-600 font-medium">
                                {cycle.summary.speakingMetrics.strength?.vocalPower ? 
                                  (cycle.summary.speakingMetrics.strength.vocalPower * 100).toFixed(1) + '%' : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Projection:</span>
                              <span className="text-blue-600 font-medium">
                                {cycle.summary.speakingMetrics.strength?.projection ? 
                                  (cycle.summary.speakingMetrics.strength.projection * 100).toFixed(1) + '%' : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Resonance:</span>
                              <span className="text-blue-600 font-medium">
                                {cycle.summary.speakingMetrics.strength?.resonance ? 
                                  (cycle.summary.speakingMetrics.strength.resonance * 100).toFixed(1) + '%' : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Breath Control:</span>
                              <span className="text-blue-600 font-medium">
                                {cycle.summary.speakingMetrics.strength?.breathControl ? 
                                  (cycle.summary.speakingMetrics.strength.breathControl * 100).toFixed(1) + '%' : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Fluency & Articulation */}
                        <div className="bg-white p-3 rounded border">
                          <h5 className="font-medium text-blue-700 mb-2">🗣️ Fluency & Clarity</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Pace:</span>
                              <span className="text-blue-600 font-medium">
                                {cycle.summary.speakingMetrics.fluency?.pace ? 
                                  (cycle.summary.speakingMetrics.fluency.pace * 100).toFixed(1) + '%' : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Rhythm:</span>
                              <span className="text-blue-600 font-medium">
                                {cycle.summary.speakingMetrics.fluency?.rhythm ? 
                                  (cycle.summary.speakingMetrics.fluency.rhythm * 100).toFixed(1) + '%' : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Pronunciation:</span>
                              <span className="text-blue-600 font-medium">
                                {cycle.summary.speakingMetrics.articulation?.pronunciation ? 
                                  (cycle.summary.speakingMetrics.articulation.pronunciation * 100).toFixed(1) + '%' : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Enunciation:</span>
                              <span className="text-blue-600 font-medium">
                                {cycle.summary.speakingMetrics.articulation?.enunciation ? 
                                  (cycle.summary.speakingMetrics.articulation.enunciation * 100).toFixed(1) + '%' : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Advanced Tone Analysis */}
                      {cycle.summary.speakingMetrics.tone && (
                        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded border">
                          <h5 className="font-medium text-indigo-700 mb-2">🌟 Advanced Tone Analysis</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span>Warmth:</span>
                              <span className="text-indigo-600 font-medium">
                                {(cycle.summary.speakingMetrics.tone.warmth * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Authority:</span>
                              <span className="text-indigo-600 font-medium">
                                {(cycle.summary.speakingMetrics.tone.authority * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Enthusiasm:</span>
                              <span className="text-indigo-600 font-medium">
                                {(cycle.summary.speakingMetrics.tone.enthusiasm * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Confidence:</span>
                              <span className="text-indigo-600 font-medium">
                                {(cycle.summary.speakingMetrics.tone.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Filler Words Section */}
                  {cycle.summary.fillerWords && cycle.summary.fillerWords.total > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2">🗣️ Filler Words Detected</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-yellow-700">Total:</span>
                          <div className="text-yellow-600 font-bold">{cycle.summary.fillerWords.total}</div>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-700">Um:</span>
                          <div className="text-yellow-600">{cycle.summary.fillerWords.breakdown.um}</div>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-700">Uh:</span>
                          <div className="text-yellow-600">{cycle.summary.fillerWords.breakdown.uh}</div>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-700">Like:</span>
                          <div className="text-yellow-600">{cycle.summary.fillerWords.breakdown.like}</div>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-700">You Know:</span>
                          <div className="text-yellow-600">{cycle.summary.fillerWords.breakdown.youKnow}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filler Words Summary */}
        {cycleResults.length > 0 && (
          <div className="bg-yellow-100 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-yellow-800">
              🗣️ Filler Words Summary
            </h2>
            
            {(() => {
              const totalFillerWords = cycleResults.reduce((total, cycle) => 
                total + (cycle.summary.fillerWords?.total || 0), 0);
              
              const fillerBreakdown = cycleResults.reduce((acc, cycle) => {
                if (cycle.summary.fillerWords?.breakdown) {
                  acc.um += cycle.summary.fillerWords.breakdown.um || 0;
                  acc.uh += cycle.summary.fillerWords.breakdown.uh || 0;
                  acc.like += cycle.summary.fillerWords.breakdown.like || 0;
                  acc.youKnow += cycle.summary.fillerWords.breakdown.youKnow || 0;
                }
                return acc;
              }, { um: 0, uh: 0, like: 0, youKnow: 0 });
              
              return (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">{totalFillerWords}</div>
                    <div className="text-sm text-yellow-700">Total Filler Words</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{fillerBreakdown.um}</div>
                    <div className="text-sm text-yellow-700">Um</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{fillerBreakdown.uh}</div>
                    <div className="text-sm text-yellow-700">Uh</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{fillerBreakdown.like}</div>
                    <div className="text-sm text-yellow-700">Like</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{fillerBreakdown.youKnow}</div>
                    <div className="text-sm text-yellow-700">You Know</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Comprehensive Speaking Analysis Summary */}
        {cycleResults.length > 0 && (
          <div className="bg-blue-100 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-blue-800">
              🎤 Speaking Analysis Summary
            </h2>
            
            {(() => {
              // Calculate averages across all cycles
              const cyclesWithSpeakingData = cycleResults.filter(cycle => cycle.summary.speakingMetrics);
              
              if (cyclesWithSpeakingData.length === 0) {
                return (
                  <div className="text-center text-blue-600 py-4">
                    No speaking analysis data available for this session
                  </div>
                );
              }
              
              // Aggregate tone metrics
              const avgTone = cyclesWithSpeakingData.reduce((acc, cycle) => {
                const tone = cycle.summary.speakingMetrics.tone;
                if (tone) {
                  acc.pitch += tone.pitch || 0;
                  acc.volume += tone.volume || 0;
                  acc.clarity += tone.clarity || 0;
                  acc.stability += tone.stability || 0;
                  acc.warmth += tone.warmth || 0;
                  acc.authority += tone.authority || 0;
                  acc.enthusiasm += tone.enthusiasm || 0;
                  acc.confidence += tone.confidence || 0;
                }
                return acc;
              }, { pitch: 0, volume: 0, clarity: 0, stability: 0, warmth: 0, authority: 0, enthusiasm: 0, confidence: 0 });
              
              // Aggregate strength metrics
              const avgStrength = cyclesWithSpeakingData.reduce((acc, cycle) => {
                const strength = cycle.summary.speakingMetrics.strength;
                if (strength) {
                  acc.vocalPower += strength.vocalPower || 0;
                  acc.projection += strength.projection || 0;
                  acc.resonance += strength.resonance || 0;
                  acc.breathControl += strength.breathControl || 0;
                  acc.stamina += strength.stamina || 0;
                }
                return acc;
              }, { vocalPower: 0, projection: 0, resonance: 0, breathControl: 0, stamina: 0 });
              
              // Aggregate fluency metrics
              const avgFluency = cyclesWithSpeakingData.reduce((acc, cycle) => {
                const fluency = cycle.summary.speakingMetrics.fluency;
                if (fluency) {
                  acc.pace += fluency.pace || 0;
                  acc.rhythm += fluency.rhythm || 0;
                  acc.pauses += fluency.pauses || 0;
                  acc.flow += fluency.flow || 0;
                }
                return acc;
              }, { pace: 0, rhythm: 0, pauses: 0, flow: 0 });
              
              // Aggregate articulation metrics
              const avgArticulation = cyclesWithSpeakingData.reduce((acc, cycle) => {
                const articulation = cycle.summary.speakingMetrics.articulation;
                if (articulation) {
                  acc.pronunciation += articulation.pronunciation || 0;
                  acc.enunciation += articulation.enunciation || 0;
                  acc.speed += articulation.speed || 0;
                }
                return acc;
              }, { pronunciation: 0, enunciation: 0, speed: 0 });
              
              // Calculate averages
              const count = cyclesWithSpeakingData.length;
              Object.keys(avgTone).forEach(key => avgTone[key] /= count);
              Object.keys(avgStrength).forEach(key => avgStrength[key] /= count);
              Object.keys(avgFluency).forEach(key => avgFluency[key] /= count);
              Object.keys(avgArticulation).forEach(key => avgArticulation[key] /= count);
              
              // Calculate overall speaking score average
              const avgSpeakingScore = cyclesWithSpeakingData.reduce((sum, cycle) => 
                sum + cycle.summary.speakingScore, 0) / count;
              
              return (
                <div className="space-y-6">
                  {/* Overall Speaking Score */}
                  <div className="text-center p-4 bg-white rounded-lg border-2 border-blue-300">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {(avgSpeakingScore * 100).toFixed(1)}%
                    </div>
                    <div className="text-lg text-blue-700">Average Speaking Score</div>
                    <div className="text-sm text-blue-600">Across {count} cycles</div>
                  </div>
                  
                  {/* Detailed Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Tone Analysis */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold text-blue-700 mb-3 text-center">🎵 Tone Quality</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Pitch:</span>
                          <span className="font-medium text-blue-600">
                            {(avgTone.pitch * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Clarity:</span>
                          <span className="font-medium text-blue-600">
                            {(avgTone.clarity * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Stability:</span>
                          <span className="font-medium text-blue-600">
                            {(avgTone.stability * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Warmth:</span>
                          <span className="font-medium text-blue-600">
                            {(avgTone.warmth * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Vocal Strength */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold text-blue-700 mb-3 text-center">💪 Vocal Strength</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Power:</span>
                          <span className="font-medium text-blue-600">
                            {(avgStrength.vocalPower * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Projection:</span>
                          <span className="font-medium text-blue-600">
                            {(avgStrength.projection * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Resonance:</span>
                          <span className="font-medium text-blue-600">
                            {(avgStrength.resonance * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Breath Control:</span>
                          <span className="font-medium text-blue-600">
                            {(avgStrength.breathControl * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Fluency */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold text-blue-700 mb-3 text-center">🗣️ Fluency</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Pace:</span>
                          <span className="font-medium text-blue-600">
                            {(avgFluency.pace * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rhythm:</span>
                          <span className="font-medium text-blue-600">
                            {(avgFluency.rhythm * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Flow:</span>
                          <span className="font-medium text-blue-600">
                            {(avgFluency.flow * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pauses:</span>
                          <span className="font-medium text-blue-600">
                            {(avgFluency.pauses * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Articulation */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold text-blue-700 mb-3 text-center">✨ Articulation</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Pronunciation:</span>
                          <span className="font-medium text-blue-600">
                            {(avgArticulation.pronunciation * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Enunciation:</span>
                          <span className="font-medium text-blue-600">
                            {(avgArticulation.enunciation * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Speed:</span>
                          <span className="font-medium text-blue-600">
                            {(avgArticulation.speed * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Volume:</span>
                          <span className="font-medium text-blue-600">
                            {(avgTone.volume * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Performance Insights */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
                    <h3 className="font-semibold text-indigo-700 mb-3">💡 Performance Insights</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">
                          {avgTone.clarity > 0.7 ? '🟢' : avgTone.clarity > 0.5 ? '🟡' : '🔴'}
                        </div>
                        <div className="text-indigo-700 font-medium">Speaking Clarity</div>
                        <div className="text-indigo-600">
                          {avgTone.clarity > 0.7 ? 'Excellent' : avgTone.clarity > 0.5 ? 'Good' : 'Needs Improvement'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">
                          {avgTone.pitch > 0.7 ? '🟢' : avgTone.pitch > 0.5 ? '🟡' : '🔴'}
                        </div>
                        <div className="text-indigo-700 font-medium">Pitch Control</div>
                        <div className="text-indigo-600">
                          {avgTone.pitch > 0.7 ? 'Excellent' : avgTone.pitch > 0.5 ? 'Good' : 'Needs Improvement'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">
                          {avgStrength.vocalPower > 0.7 ? '🟢' : avgStrength.vocalPower > 0.5 ? '🟡' : '🔴'}
                        </div>
                        <div className="text-indigo-700 font-medium">Vocal Power</div>
                        <div className="text-indigo-600">
                          {avgStrength.vocalPower > 0.7 ? 'Excellent' : avgStrength.vocalPower > 0.5 ? 'Good' : 'Needs Improvement'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Real-time Status Updates */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Real-time Status</h2>
          <div className="text-gray-600">
            <p>Status updates every 2 seconds</p>
            <p>Last update: {currentStatus ? new Date().toLocaleTimeString() : 'Never'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewAnalysis;
