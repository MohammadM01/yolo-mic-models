const fs = require('fs');
const path = require('path');
const Webcam = require('node-webcam');

// Configuration
const CONFIG = {
  width: 640,
  height: 480,
  delay: 0,
  quality: 100,
  output: 'jpeg',
  device: false,
  callbackReturn: 'base64'
};

class WebcamCapture {
  constructor() {
    this.isCapturing = false;
    this.currentFrame = null;
    this.frameBuffer = [];
    this.maxBufferSize = 10;
    this.frameRate = 30;
    this.captureInterval = null;
    this.isInitialized = false;
    this.onFrameProcessed = null;
    this.onError = null;

    this.stats = {
      framesCaptured: 0,
      framesProcessed: 0,
      startTime: null,
      averageFPS: 0
    };

    this.webcam = Webcam.create(CONFIG);
  }

  async initialize() {
    try {
      await new Promise((resolve, reject) => {
        this.webcam.capture('test', (err, data) => {
          if (err) reject(err);
          else resolve(true);
        });
      });
      this.isInitialized = true;
      this.stats.startTime = Date.now();
      console.log('Webcam initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize webcam:', error);
      if (this.onError) this.onError(error);
      return false;
    }
  }

  startCapture() {
    if (!this.isInitialized) {
      throw new Error('Webcam not initialized');
    }

    if (this.isCapturing) {
      console.log('Webcam is already capturing');
      return;
    }

    this.isCapturing = true;
    this.stats.startTime = Date.now();
    console.log('Starting webcam capture...');

    this.captureInterval = setInterval(() => {
      this.captureFrame();
    }, 1000 / this.frameRate);
  }

  stopCapture() {
    if (!this.isCapturing) {
      console.log('Webcam is not capturing');
      return;
    }

    this.isCapturing = false;

    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }

    console.log('Webcam capture stopped');
    this.calculateStats();
  }

  captureFrame() {
    try {
      this.webcam.capture('frame', (err, data) => {
        if (err) {
          console.error('Error capturing frame:', err);
          if (this.onError) this.onError(err);
          return;
        }

        const frameData = Buffer.from(data.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
        this.currentFrame = frameData;
        this.stats.framesCaptured++;

        this.frameBuffer.push({
          frame: frameData,
          timestamp: Date.now(),
          frameNumber: this.stats.framesCaptured
        });

        if (this.frameBuffer.length > this.maxBufferSize) {
          this.frameBuffer.shift();
        }

        if (this.onFrameProcessed) {
          this.onFrameProcessed(frameData, this.stats.framesCaptured);
        }
      });
    } catch (error) {
      console.error('Error in captureFrame:', error);
      if (this.onError) this.onError(error);
    }
  }

  calculateStats() {
    if (this.stats.framesCaptured > 0 && this.stats.startTime) {
      const duration = (Date.now() - this.stats.startTime) / 1000;
      this.stats.averageFPS = this.stats.framesCaptured / duration;
    }
  }

  getCurrentFrame() {
    return this.currentFrame;
  }

  getFrameFromBuffer(index) {
    return this.frameBuffer[index] || null;
  }

  setResolution(width, height) {
    CONFIG.width = width;
    CONFIG.height = height;
    this.webcam = Webcam.create(CONFIG);
  }

  setFrameRate(fps) {
    this.frameRate = fps;
    if (this.isCapturing && this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = setInterval(() => this.captureFrame(), 1000 / this.frameRate);
    }
  }

  saveFrame(filename) {
    if (this.currentFrame) {
      fs.writeFileSync(path.join(__dirname, filename), this.currentFrame);
    }
  }

  loadFrame(filename) {
    try {
      this.currentFrame = fs.readFileSync(path.join(__dirname, filename));
      return true;
    } catch (error) {
      console.error('Error loading frame:', error);
      return false;
    }
  }

  getStatus() {
    return {
      isCapturing: this.isCapturing,
      framesCaptured: this.stats.framesCaptured,
      averageFPS: this.stats.averageFPS.toFixed(2),
      isInitialized: this.isInitialized
    };
  }

  cleanup() {
    this.stopCapture();
    this.frameBuffer = [];
    this.currentFrame = null;
    this.isInitialized = false;
    console.log('Webcam resources cleaned up');
  }
}

module.exports = WebcamCapture;