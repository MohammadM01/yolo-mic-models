# Emotion Detection Backend

A Node.js backend service for audio emotion detection using machine learning and signal processing.

## Features

- **Audio Recording**: Simulated audio recording functionality (can be extended with real microphone input)
- **MFCC Feature Extraction**: Mel-frequency cepstral coefficients extraction for audio analysis
- **Pitch Detection**: Basic pitch extraction using autocorrelation
- **CNN Model**: Convolutional Neural Network for emotion classification
- **REST API**: Express.js endpoints for audio processing and emotion detection
- **File Upload**: Support for audio file uploads

## Supported Emotions

- neutral
- happy
- sad
- angry
- fearful
- disgust
- surprise

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will run on port 3001 by default.

## API Endpoints

### 1. GET `/`
- **Description**: Health check endpoint
- **Response**: API status message

### 2. POST `/api/record-audio`
- **Description**: Simulate audio recording
- **Body**:
  ```json
  {
    "duration": 5,
    "saveFile": false
  }
  ```
- **Response**: Recording status and audio information

### 3. POST `/api/detect-emotion`
- **Description**: Process audio data and detect emotion
- **Body**:
  ```json
  {
    "audioData": [0.1, -0.05, 0.08, ...],
    "duration": 5
  }
  ```
- **Response**: Predicted emotion and confidence score

### 4. POST `/api/upload-audio`
- **Description**: Upload audio file for processing
- **Body**: Form data with audio file
- **Response**: Processing results and MFCC features

## Technical Details

### Audio Processing
- **Sample Rate**: 22,050 Hz
- **MFCC Features**: 13 coefficients
- **Frame Size**: 512 samples
- **Hop Size**: 256 samples

### Machine Learning Model
- **Architecture**: CNN with 2 convolutional layers
- **Input Shape**: (batch, time_steps, n_mfcc, 1)
- **Output**: 7 emotion classes with softmax activation

### Dependencies
- **Express.js**: Web framework
- **TensorFlow.js**: Machine learning library
- **FFT.js**: Fast Fourier Transform
- **ML-Matrix**: Matrix operations
- **Multer**: File upload handling

## Usage Examples

### Record and Process Audio
```javascript
// Record audio
const recordResponse = await fetch('/api/record-audio', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ duration: 5, saveFile: false })
});

// Detect emotion
const emotionResponse = await fetch('/api/detect-emotion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ audioData: [/* audio samples */], duration: 5 })
});
```

### Upload Audio File
```javascript
const formData = new FormData();
formData.append('audio', audioFile);

const uploadResponse = await fetch('/api/upload-audio', {
  method: 'POST',
  body: formData
});
```

## Development Notes

- The current implementation simulates audio recording for demonstration
- Real microphone input requires additional setup with Web Audio API or native audio libraries
- The CNN model needs training data (RAVDESS, TESS datasets) for accurate predictions
- MFCC extraction includes windowing, FFT, Mel filterbank, and DCT processing

## Future Enhancements

- Real-time microphone input
- Pre-trained emotion detection models
- Audio streaming support
- Model training endpoints
- Audio visualization
- Real-time emotion feedback

## License

ISC
