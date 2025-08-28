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
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={startStreams}
              disabled={webcamStream}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              📹 Start Camera & Mic
            </button>
            
            <button
              onClick={startModels}
              disabled={!webcamStream || isModelsRunning}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              🚀 Start Models
            </button>
            
            <button
              onClick={startDataCollection}
              disabled={!isModelsRunning || isCollecting}
              className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              🔄 Start Collection
            </button>
            
            <button
              onClick={stopDataCollection}
              disabled={!isCollecting}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              ⏹️ Stop Collection
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
                      <span className="font-medium">Speaking Score:</span>
                      <div className="text-purple-600">
                        {(cycle.summary.speakingScore * 100).toFixed(1)}%
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
