import React, { useState, useEffect, useRef } from "react";

function ModelsTesting() {
  const [isRecording, setIsRecording] = useState(false);
  const [isFirstClick, setIsFirstClick] = useState(true);
  const [interviewData, setInterviewData] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [isModelActive, setIsModelActive] = useState(false);
  const [currentResults, setCurrentResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [realTimeData, setRealTimeData] = useState([]);
  const [cycleNumber, setCycleNumber] = useState(0);
  const [allCyclesData, setAllCyclesData] = useState([]);

  // Audio state
  const [audioData, setAudioData] = useState([]);
  const [currentAudioEmotion, setCurrentAudioEmotion] = useState("neutral");
  const [audioConfidence, setAudioConfidence] = useState(0);
  const [isAudioRecording, setIsAudioRecording] = useState(false);

  const resultsIntervalRef = useRef(null);
  const sessionTimerRef = useRef(null);
  const videoRef = useRef(null);
  const localStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioProcessorRef = useRef(null);

  const API_BASE = "http://localhost:3001";

  const initializeService = async () => {
    // ... same as original
  };

  useEffect(() => {
    const initCamera = async () => {
      // ... same as original
    };
    const timer = setTimeout(initCamera, 1000);
    return () => clearTimeout(timer);
  }, []);

  const startInterview = async () => {
    try {
      setIsLoading(true);
      console.log("Starting interview analysis...");

      if (!isModelActive) {
        const initialized = await initializeService();
        if (!initialized) {
          alert("Failed to initialize interview service");
          setIsLoading(false);
          return;
        }
        setIsModelActive(true);
      }

      const cameraInitialized = await initializeCamera();
      if (!cameraInitialized) {
        console.warn(
          "Camera initialization failed, continuing with audio only"
        );
      }

      const audioInitialized = await initializeAudio();
      if (!audioInitialized) {
        console.warn("Audio initialization failed, continuing with video only");
      }

      setIsAudioRecording(true);

      const response = await fetch(`${API_BASE}/api/interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options: { duration: 10 } }),
      });

      const data = await response.json();
      if (data.success) {
        setIsRecording(true);
        setIsFirstClick(false);
        setSessionDuration(0);
        setRealTimeData([]);
        setAudioData([]);
        setCycleNumber(1);
        setAllCyclesData([]);
        setShowResults(false);
        console.log(
          "=== FIRST CLICK: Interview started successfully - Cycle 1 (Video + Audio) ==="
        );
        console.log(
          "Data collection will run continuously in 10-second cycles"
        );
        console.log("Summaries logged to console every 10 seconds");
        console.log(
          "Click the button again to stop processing and view all results"
        );

        startSessionTimer();
        startResultsPolling();
      } else {
        console.error("Failed to start interview:", data);
        alert("Failed to start interview");
      }
    } catch (error) {
      console.error("Error starting interview:", error);
      alert("Error starting interview");
    } finally {
      setIsLoading(false);
    }
  };

  const startSessionTimer = () => {
    setSessionDuration(0);
    sessionTimerRef.current = setInterval(() => {
      setSessionDuration((prev) => {
        if (prev >= 9) {
          // 0-9 = 10s
          completeCycle();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const completeCycle = async () => {
    try {
      console.log(
        `Completing Cycle ${cycleNumber} - 10 seconds of data collected`
      );

      const cycleData = {
        cycleNumber: cycleNumber,
        duration: 10,
        realTimeData: [...realTimeData],
        summary: {
          duration: 10,
          totalFramesProcessed: realTimeData.length,
          eyeContactPercentage: (
            (realTimeData.filter((d) => d.results[1]).length /
              realTimeData.length) *
            100
          ).toFixed(2),
          commonExpression: getMostCommonExpression(realTimeData),
          commonPosture: getMostCommonPosture(realTimeData),
          suspiciousPercentage: (
            (realTimeData.filter((d) => d.results[3]).length /
              realTimeData.length) *
            100
          ).toFixed(2),
        },
        timestamp: Date.now(),
      };

      setAllCyclesData((prev) => [...prev, cycleData]);
      console.log(`Summary for Cycle ${cycleNumber}:`, cycleData.summary);

      setRealTimeData([]);
      setCycleNumber((prev) => prev + 1);
    } catch (error) {
      console.error("Error completing cycle:", error);
    }
  };

  const getMostCommonExpression = (data) => {
    // ... same as original
  };

  const getMostCommonPosture = (data) => {
    // ... same as original
  };

  const stopInterview = async () => {
    try {
      setIsLoading(true);
      console.log("Stopping data processing...");

      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }

      setIsAudioRecording(false);

      const response = await fetch(`${API_BASE}/api/interview/stop`, {
        method: "POST",
      });

      const data = await response.json();
      if (data.success) {
        setIsRecording(false);
        console.log(
          "=== SECOND CLICK: Data processing stopped successfully ==="
        );
        console.log("All cycle summaries are available in console");
        console.log("Results now displayed on the right side");

        if (sessionDuration > 0) {
          await completeCycle();
        }

        const summaryResponse = await fetch(
          `${API_BASE}/api/interview/summary`
        );
        const summaryData = await summaryResponse.json();

        if (summaryData.success) {
          setInterviewData(summaryData.summary);
          console.log("Overall interview summary:", summaryData.summary);
        }

        stopResultsPolling();
        setShowResults(true);
      } else {
        console.error("Failed to stop interview:", data);
        alert("Failed to stop interview");
      }
    } catch (error) {
      console.error("Error stopping interview:", error);
      alert("Error stopping interview");
    } finally {
      setIsLoading(false);
    }
  };

  const endInterview = async () => {
    // ... same as original, plus
    setShowResults(false);
  };

  const startResultsPolling = () => {
    // ... same as original
  };

  const stopResultsPolling = () => {
    // ... same as original
  };

  const handleStartPress = () => {
    if (isFirstClick) {
      startInterview();
    } else {
      stopInterview();
    }
  };

  const handleEndInterview = () => {
    endInterview();
  };

  const testCamera = async () => {
    // ... same as original
  };

  const initializeCamera = async () => {
    // ... same as original
  };

  const initializeAudio = async () => {
    // ... same as original
  };

  const processAudioData = async (audioData) => {
    // ... same as original
  };

  const detectAudioEmotion = async (audioData) => {
    // ... same as original
  };

  useEffect(() => {
    return () => {
      // ... same as original
    };
  }, []);

  const renderInterviewData = () => {
    if (!interviewData || !showResults) return null;

    return (
      <div className="text-white p-4 space-y-4">
        <h2 className="text-2xl font-bold text-center mb-4">
          Interview Analysis Results
        </h2>

        <div className="bg-white/10 rounded-lg p-3">
          <h3 className="text-lg font-semibold mb-2">Overall Summary</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Duration: {interviewData.duration}s</div>
            <div>Frames Processed: {interviewData.totalFramesProcessed}</div>
            <div>Eye Contact: {interviewData.eyeContactPercentage}%</div>
            <div>Common Expression: {interviewData.commonExpression}</div>
            <div>Common Posture: {interviewData.commonPosture}</div>
            <div>
              Suspicious Activity: {interviewData.suspiciousPercentage}%
            </div>
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-3">
          <h3 className="text-lg font-semibold mb-2">
            Per Cycle Summaries ({allCyclesData.length})
          </h3>
          <div className="max-h-96 overflow-y-auto space-y-4">
            {allCyclesData.map((cycle, index) => (
              <div key={index} className="p-3 bg-white/5 rounded">
                <h4 className="font-semibold mb-2">
                  Cycle {cycle.cycleNumber} (10s)
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Frames: {cycle.summary.totalFramesProcessed}</div>
                  <div>Eye Contact: {cycle.summary.eyeContactPercentage}%</div>
                  <div>Expression: {cycle.summary.commonExpression}</div>
                  <div>Posture: {cycle.summary.commonPosture}</div>
                  <div>Suspicious: {cycle.summary.suspiciousPercentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {interviewData.insights && (
          <div className="bg-white/10 rounded-lg p-3">
            <h3 className="text-lg font-semibold mb-2">Performance Insights</h3>
            <ul className="text-sm space-y-1">
              {interviewData.insights.map((insight, index) => (
                <li key={index} className="text-xs">
                  • {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderCamera = () => {
    // ... same as original
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="bg-[#1A233B] flex-1 justify-center relative p-5">
        <div className="bg-[#87CEEB] w-[48%] h-[50vh] max-h-[100vh] rounded-lg absolute top-5 left-5">
          {renderCamera()}
        </div>

        <div className="bg-[#9370DB] w-[47%] h-[95%] max-h-[100%] rounded-lg absolute top-5 right-5 overflow-y-auto">
          {isRecording ? (
            <div className="text-white p-4 text-center">
              <h2 className="text-2xl font-bold mb-4">
                Data Collection in Progress
              </h2>
              <p className="text-lg mb-4">
                Collecting data in 10-second cycles...
              </p>
              <div className="space-y-2 text-sm">
                <p>Cycles Completed: {allCyclesData.length}</p>
                <p>Current Cycle: {cycleNumber}</p>
                <p>Progress: {sessionDuration}/10 seconds</p>
                <p className="text-yellow-300">
                  Check console for cycle summaries
                </p>
              </div>
            </div>
          ) : (
            renderInterviewData()
          )}
        </div>

        <div className="absolute bottom-5 left-5 flex gap-4">
          <button
            onClick={handleStartPress}
            disabled={isLoading}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              isFirstClick
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-yellow-600 hover:bg-yellow-700 text-white"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isLoading
              ? "Loading..."
              : isFirstClick
              ? "Press to Start"
              : "Press to Stop & View Data"}
          </button>

          <button
            onClick={handleEndInterview}
            disabled={isLoading || isFirstClick}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              isFirstClick
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            End Interview
          </button>

          {/* ... other buttons like Enable Camera, Test Camera */}
        </div>

        {/* ... loading overlay, camera status */}
      </main>
    </div>
  );
}

export default ModelsTesting;
