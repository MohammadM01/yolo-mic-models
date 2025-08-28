const tf = require('@tensorflow/tfjs');
const Meyda = require('meyda');
const record = require('node-record-lpcm16');
const fs = require('fs');

// Audio configuration
const SAMPLE_RATE = 22050;
const DURATION = 5; // seconds
const N_MFCC = 13;

// Emotion labels
const EMOTIONS = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgust', 'surprise'];

// Function to record audio in real-time
function recordAudio(duration = 5, sampleRate = 22050, saveFile = false, filename = "recorded_audio.wav") {
  try {
    console.log("Recording audio... Speak now!");
    const recorder = record.rec({
      sampleRate: sampleRate,
      channels: 1,
      audioType: 'raw'
    });
    const buffers = [];

    recorder.start();

    recorder.stream().on('data', (buf) => {
      buffers.push(buf);
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        recorder.stop();
        console.log("Recording complete.");
        const audioBuffer = Buffer.concat(buffers);
        const audioData = new Float32Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / 4);

        if (saveFile) {
          fs.writeFileSync(filename, audioBuffer);
          console.log(`Audio saved as ${filename}`);
        }

        resolve(audioData);
      }, duration * 1000);
    });
  } catch (error) {
    console.error(`Error recording audio: ${error}`);
    return null;
  }
}

// Function to load and preprocess audio
function loadAndPreprocessAudio(audioData, sr = 22050, nMfcc = 13) {
  try {
    let y = audioData;

    // Extract MFCC features using Meyda (process in chunks)
    Meyda.bufferSize = 512;
    const mfccs = [];
    for (let i = 0; i < y.length; i += 512) {
      const chunk = y.slice(i, i + 512);
      const features = Meyda.extract('mfcc', chunk);
      mfccs.push(features);
    }

    // Extract pitch (simple autocorrelation, similar to Librosa piptrack)
    const pitch = extractPitch(y, sr); // Use custom function from original

    // Reshape MFCCs for CNN input
    const reshapedMfccs = tf.tensor(mfccs).reshape([1, mfccs.length, nMfcc, 1]);

    return { mfccs: reshapedMfccs, pitch };
  } catch (error) {
    console.error(`Error processing audio: ${error}`);
    return { mfccs: null, pitch: null };
  }
}

// Custom pitch extraction (from original JS code)
function extractPitch(audioData, sampleRate) {
  const correlation = [];
  const maxLag = Math.floor(sampleRate / 50);
  for (let lag = 0; lag < maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < audioData.length - lag; i++) {
      sum += audioData[i] * audioData[i + lag];
    }
    correlation.push(sum);
  }

  let peakIndex = 0;
  let maxCorr = 0;
  for (let i = 1; i < correlation.length; i++) {
    if (correlation[i] > maxCorr) {
      maxCorr = correlation[i];
      peakIndex = i;
    }
  }

  return sampleRate / peakIndex;
}

// Define CNN model
function createEmotionModel(inputShape, numClasses = 7) {
  const model = tf.sequential();
  model.add(tf.layers.conv2d({ filters: 32, kernelSize: [3, 3], activation: 'relu', padding: 'same', inputShape }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
  model.add(tf.layers.conv2d({ filters: 64, kernelSize: [3, 3], activation: 'relu', padding: 'same' }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.5 }));
  model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));

  model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
  return model;
}

module.exports = {
  recordAudio,
  loadAndPreprocessAudio,
  createEmotionModel,
  SAMPLE_RATE,
  N_MFCC,
  EMOTIONS
};