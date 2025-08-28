const { createCanvas, loadImage } = require('canvas');
const jimp = require('jimp');
const { FaceLandmarker, PoseLandmarker, FilesetResolver } = require('@mediapipe/tasks-vision');
const faceapi = require('face-api.js');
const ONNX = require('onnxruntime-node');
const path = require('path'); // Added missing import

// Configuration
const CONFIG = {
  FACE_DETECTION_CONFIDENCE: 0.3,
  POSE_DETECTION_CONFIDENCE: 0.3,
  YOLO_CONFIDENCE: 0.3,
  EXPRESSION_CONFIDENCE_THRESHOLD: 0.7,
  EXPRESSION_SMOOTHING_WINDOW: 3,
  PHONE_DETECTION_SMOOTHING: 3,
  PROCESS_EVERY_NTH_FRAME: 5,
  INPUT_SIZE: 416,
  LOG_INTERVAL_SECONDS: 1
};

// Emotion labels
const EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral'];

// COCO class for phone
const COCO_CLASSES = {
  67: 'cell phone'
};

class ComputerVisionProcessor {
  constructor() {
    this.frameCount = 0;
    this.frameProcessedCount = 0;
    this.eyeContactCount = 0;
    this.expressions = {};
    this.postures = {};
    this.suspiciousDetections = 0;

    this.expressionChanges = [];
    this.postureChanges = [];
    this.prevExpression = "neutral";
    this.prevPosture = "unknown";

    this.expressionConfHistory = [];
    this.phoneDetectionHistory = [];

    this.latestResults = ['neutral', false, 'unknown', false, 0.0];
    this.processingLock = false;
    this.frameToProcess = null;
    this.processingDone = false;

    this.lastLogTime = 0;
    this.startTime = Date.now();

    this.processEveryNth = CONFIG.PROCESS_EVERY_NTH_FRAME;

    this.logFile = 'visual_log.txt';
    this.log = (level, message) => {
      const timestamp = new Date().toISOString();
      const logEntry = `${timestamp} - ${level}: ${message}\n`;
      fs.appendFileSync(this.logFile, logEntry);
    };

    this.initModels();
  }

  async initModels() {
    const vision = await FilesetResolver.forVisionTasks(__dirname);
    this.faceMesh = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: path.join(__dirname, 'face_landmarker.task') },
      numFaces: 1,
      minDetectionConfidence: 0.3,
      minTrackingConfidence: 0.3
    });

    this.pose = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: path.join(__dirname, 'pose_landmarker.task') },
      numPoses: 1,
      minDetectionConfidence: 0.3,
      minTrackingConfidence: 0.3
    });

    await faceapi.nets.faceLandmark68Net.loadFromDisk(path.join(__dirname, 'models'));
    await faceapi.nets.faceExpressionNet.loadFromDisk(path.join(__dirname, 'models'));

    this.yoloModel = await ONNX.InferenceSession.create(path.join(__dirname, 'yolo11m.onnx'));
  }

  async analyzeEmotion(imageBuffer) {
    try {
      const image = await jimp.read(imageBuffer);
      const canvas = createCanvas(image.bitmap.width, image.bitmap.height);
      const ctx = canvas.getContext('2d');
      const loadedImage = await loadImage(image.bitmap.data);
      ctx.drawImage(loadedImage, 0, 0);

      const analysis = await faceapi.detectSingleFace(canvas).withFaceExpressions();
      if (!analysis) {
        return { expression: this.prevExpression, confidence: 0.0 };
      }

      const emotionScores = analysis.expressions;
      const expression = Object.keys(emotionScores).reduce((a, b) => emotionScores[a] > emotionScores[b] ? a : b);
      const confidence = emotionScores[expression];

      this.log('DEBUG', `Expression: ${expression} (Confidence: ${confidence.toFixed(2)})`);
      return { expression, confidence };
    } catch (error) {
      this.log('WARNING', `Face detection failed: ${error.message}`);
      return { expression: this.prevExpression, confidence: 0.0 };
    }
  }

  async detectEyeContact(imageBuffer) {
    try {
      const image = await jimp.read(imageBuffer);
      const canvas = createCanvas(image.bitmap.width, image.bitmap.height);
      const ctx = canvas.getContext('2d');
      const loadedImage = await loadImage(image.bitmap.data);
      ctx.drawImage(loadedImage, 0, 0);

      const faceResults = await this.faceMesh.detectForVideo(canvas, Date.now());
      if (faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
        const landmarks = faceResults.faceLandmarks[0];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const gazeX = (leftEye.x + rightEye.x) / 2;
        return Math.abs(gazeX - 0.5) < 0.1;
      }
      return false;
    } catch (error) {
      this.log('WARNING', `Eye contact detection failed: ${error.message}`);
      return false;
    }
  }

  async detectPosture(imageBuffer) {
    try {
      const image = await jimp.read(imageBuffer);
      const canvas = createCanvas(image.bitmap.width, image.bitmap.height);
      const ctx = canvas.getContext('2d');
      const loadedImage = await loadImage(image.bitmap.data);
      ctx.drawImage(loadedImage, 0, 0);

      const poseResults = await this.pose.detectForVideo(canvas, Date.now());
      if (poseResults.landmarks && poseResults.landmarks.length > 0) {
        const landmarks = poseResults.landmarks[0];
        const leftShoulderY = landmarks[11].y;
        const rightShoulderY = landmarks[12].y;
        return Math.abs(leftShoulderY - rightShoulderY) < 0.05 ? 'upright' : 'slouched';
      }
      return 'unknown';
    } catch (error) {
      this.log('WARNING', `Posture detection failed: ${error.message}`);
      return 'unknown';
    }
  }

  async detectObjects(imageBuffer) {
    try {
      const image = await jimp.read(imageBuffer);
      const resized = image.resize(CONFIG.INPUT_SIZE, CONFIG.INPUT_SIZE);
      const inputData = new Float32Array(resized.bitmap.data.length / 4);
      for (let i = 0; i < resized.bitmap.data.length; i += 4) {
        inputData[i / 4] = (resized.bitmap.data[i] + resized.bitmap.data[i + 1] + resized.bitmap.data[i + 2]) / (3 * 255.0);
      }
      const inputTensor = new ONNX.Tensor(inputData, 'float32', [1, 1, CONFIG.INPUT_SIZE, CONFIG.INPUT_SIZE]);

      const results = await this.yoloModel.run({ input: inputTensor });
      const boxes = results.boxes.data;
      let phoneDetected = false;
      let phoneConfidence = 0.0;

      for (let i = 0; i < boxes.length; i += 6) {
        const cls = boxes[i + 5];
        if (cls === 67 && boxes[i + 4] > CONFIG.YOLO_CONFIDENCE) {
          phoneDetected = true;
          phoneConfidence = boxes[i + 4];
          break;
        }
      }

      return { phoneDetected, phoneConfidence, boxes: [] };
    } catch (error) {
      this.log('WARNING', `Object detection failed: ${error.message}`);
      return { phoneDetected: false, phoneConfidence: 0.0, boxes: [] };
    }
  }

  smoothExpression(expression, confidence) {
    this.expressionConfHistory.push({ expression, confidence });
    if (this.expressionConfHistory.length > CONFIG.EXPRESSION_SMOOTHING_WINDOW) {
      this.expressionConfHistory.shift();
    }

    if (this.expressionConfHistory.length >= 2) {
      const exprConfSum = {};
      this.expressionConfHistory.forEach(({ expression, confidence }, index) => {
        const weight = index + 1;
        exprConfSum[expression] = (exprConfSum[expression] || 0) + (confidence * weight);
      });
      const smoothedExpression = Object.keys(exprConfSum).reduce((a, b) => exprConfSum[a] > exprConfSum[b] ? a : b);
      if (exprConfSum[smoothedExpression] > exprConfSum[this.prevExpression] * 1.2) {
        return smoothedExpression;
      }
    }
    return this.prevExpression || expression;
  }

  smoothPhoneDetection(phoneDetected, phoneConfidence) {
    this.phoneDetectionHistory.push({ phoneDetected, phoneConfidence });
    if (this.phoneDetectionHistory.length > CONFIG.PHONE_DETECTION_SMOOTHING) {
      this.phoneDetectionHistory.shift();
    }

    const phoneConfSum = this.phoneDetectionHistory.filter(item => item.phoneDetected).reduce((sum, item) => sum + item.phoneConfidence, 0);
    return phoneConfSum > 1.0;
  }

  async analyzeFrame(frameBuffer) {
    const startFrameTime = Date.now();

    const emotionResult = await this.analyzeEmotion(frameBuffer);
    let { expression, confidence } = emotionResult;
    const smoothedExpression = this.smoothExpression(expression, confidence);

    const eyeContact = await this.detectEyeContact(frameBuffer);

    const posture = await this.detectPosture(frameBuffer);

    const objectResults = await this.detectObjects(frameBuffer);
    const { phoneDetected, phoneConfidence } = objectResults;
    const smoothedPhoneDetected = this.smoothPhoneDetection(phoneDetected, phoneConfidence);

    const currentTime = (Date.now() - this.startTime) / 1000;
    if (smoothedExpression !== this.prevExpression) {
      this.expressionChanges.push({
        timestamp: currentTime,
        frame: this.frameProcessedCount,
        from: this.prevExpression,
        to: smoothedExpression
      });
      this.prevExpression = smoothedExpression;
    }

    if (posture !== this.prevPosture) {
      this.postureChanges.push({
        timestamp: currentTime,
        frame: this.frameProcessedCount,
        from: this.prevPosture,
        to: posture
      });
      this.prevPosture = posture;
    }

    this.latestResults = [smoothedExpression, eyeContact, posture, smoothedPhoneDetected, confidence];
    this.processingDone = true;
    this.frameProcessedCount++;

    if (eyeContact) this.eyeContactCount++;
    this.expressions[smoothedExpression] = (this.expressions[smoothedExpression] || 0) + 1;
    this.postures[posture] = (this.postures[posture] || 0) + 1;
    if (smoothedPhoneDetected) this.suspiciousDetections++;

    const frameDuration = Date.now() - startFrameTime;
    if (frameDuration > 50) {
      this.processEveryNth = Math.min(this.processEveryNth + 1, 10);
    } else if (frameDuration < 30 && this.processEveryNth > 1) {
      this.processEveryNth -= 1;
    }

    return this.latestResults;
  }

  generateSessionSummary() {
    const duration = (Date.now() - this.startTime) / 1000;
    const eyeContactPercentage = this.frameProcessedCount > 0 ? (this.eyeContactCount / this.frameProcessedCount) * 100 : 0;
    const commonExpression = Object.keys(this.expressions).length > 0 ? Object.keys(this.expressions).reduce((a, b) => this.expressions[a] > this.expressions[b] ? a : b) : 'none';
    const commonPosture = Object.keys(this.postures).length > 0 ? Object.keys(this.postures).reduce((a, b) => this.postures[a] > this.postures[b] ? a : b) : 'none';
    const suspiciousPercentage = this.frameProcessedCount > 0 ? (this.suspiciousDetections / this.frameProcessedCount) * 100 : 0;
    const avgTimePerFrame = this.frameProcessedCount > 0 ? (duration / this.frameProcessedCount) * 1000 : 0;

    const expressionDistribution = this.frameProcessedCount > 0 ? Object.fromEntries(Object.entries(this.expressions).map(([k, v]) => [k, (v / this.frameProcessedCount) * 100])) : {};
    const postureDistribution = this.frameProcessedCount > 0 ? Object.fromEntries(Object.entries(this.postures).map(([k, v]) => [k, (v / this.frameProcessedCount) * 100])) : {};

    return {
      duration: duration.toFixed(2),
      totalFramesProcessed: this.frameProcessedCount,
      averageProcessingTimePerFrame: avgTimePerFrame.toFixed(2),
      eyeContactPercentage: eyeContactPercentage.toFixed(2),
      commonExpression,
      expressionDistribution,
      expressionChanges: this.expressionChanges,
      commonPosture,
      postureDistribution,
      postureChanges: this.postureChanges,
      suspiciousPercentage: suspiciousPercentage.toFixed(2),
      suspiciousEventCount: this.suspiciousDetections,
      insights: [
        "High eye contact shows strong engagement—aim for 80%+ to build rapport.",
        "Positive expressions like 'happy' make you seem enthusiastic; mix in 'neutral' for balance.",
        "Consistent upright posture signals professionalism; reduce slouching to appear more alert.",
        "Low suspicious activity means fewer distractions—keep phones out of sight for best results.",
        "If phone detection fails, ensure good lighting and minimize background clutter."
      ]
    };
  }
}

module.exports = {
  ComputerVisionProcessor,
  CONFIG,
  EMOTIONS,
  COCO_CLASSES
};