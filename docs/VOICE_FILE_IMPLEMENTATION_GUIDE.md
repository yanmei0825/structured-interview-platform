# Voice File Feature - Implementation Guide

## What Changed

### Backend Changes

#### 1. `backend/src/index.ts`
- Added static file serving for voice files: `app.use('/voice_files', express.static('voice_files'))`
- Added raw audio parser for `/voice/send` endpoint
- Voice files are now served directly from the `voice_files/` directory

#### 2. `backend/src/routes/survey.ts`
- **New Route**: `POST /:token/voice/send`
  - Receives raw audio data
  - Saves audio to `voice_files/` directory
  - Returns voice file metadata (path, fileName, size, timestamp)
  - Adds voice message to session history
  
- **Fixed Route**: `POST /:token/voice/transcribe`
  - Cleaned up malformed route definition
  - Still available for transcription-based workflows

### Frontend Changes

#### 1. `frontend/components/VoiceButtonAdvanced.tsx`
- Updated `transcribeAudio()` function to send audio directly to `/voice/send`
- Changed from transcription workflow to file upload workflow
- Returns voice file path instead of transcribed text
- Updated `VoiceAnalysis` interface to include `isVoiceFile` and `fileName` fields

#### 2. `frontend/components/InterviewChat.tsx`
- Updated `Message` interface to support `voiceFile` metadata
- Modified message rendering to display voice files as HTML5 audio elements
- Voice files show with microphone icon and playable audio controls
- Updated `handleSend()` to detect and handle voice file messages
- Voice file paths are sent to backend as special message format

## How to Use

### For Users
1. Click the microphone button in the chat
2. Record your response (up to 60 seconds)
3. Stop recording when done
4. Voice file appears in chat with audio player
5. Click send to submit the voice file
6. Backend receives the voice file and continues the interview

### For Developers

#### Testing the Feature
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Open http://localhost:3000 in browser
# Navigate to interview chat
# Click microphone button and test recording
```

#### Checking Voice Files
```bash
# Voice files are stored in:
backend/voice_files/

# File naming pattern:
voice_{token}_{timestamp}.webm

# Example:
voice_ee1275c7-613b-4f1d-9a43-4a4821b8865f_1234567890.webm
```

#### API Testing with cURL
```bash
# Send voice file
curl -X POST http://localhost:5000/survey/YOUR_TOKEN/voice/send \
  --data-binary @audio.webm \
  -H "Content-Type: audio/webm"

# Get voice file
curl http://localhost:5000/voice_files/voice_token_timestamp.webm \
  -o downloaded_audio.webm
```

## File Structure

```
backend/
├── src/
│   ├── index.ts                    # Updated: Added static file serving
│   ├── routes/
│   │   └── survey.ts               # Updated: Added /voice/send route
│   ├── voice.ts                    # Existing: STT/TTS functions
│   └── voice-processor.ts          # Existing: Voice analysis
├── voice_files/                    # New: Voice file storage
│   └── voice_*.webm                # Voice files
└── package.json

frontend/
├── components/
│   ├── InterviewChat.tsx           # Updated: Voice file display
│   ├── VoiceButtonAdvanced.tsx     # Updated: Send voice files
│   └── VoiceButton.tsx             # Existing: Simple transcription
└── lib/
    └── api.ts                      # Existing: API calls
```

## Data Flow

### Recording and Sending Voice File
```
User Records Audio
    ↓
VoiceButtonAdvanced.tsx
    ↓
assessQuality() - Check audio quality
    ↓
fetch(/survey/:token/voice/send) - Send raw audio
    ↓
Backend: survey.ts /voice/send route
    ↓
Save to voice_files/ directory
    ↓
Return file path: /voice_files/voice_token_timestamp.webm
    ↓
Frontend: Display audio player in chat
    ↓
User clicks Send
    ↓
Send voice file path to backend as message
    ↓
Backend: Process message with voice file reference
```

### Displaying Voice File in Chat
```
Message with voiceFile metadata
    ↓
InterviewChat.tsx renders message
    ↓
Check if message.voiceFile exists
    ↓
If yes: Render HTML5 audio player
    ↓
If no: Render text message
    ↓
Audio player shows with controls (play, pause, volume)
```

## Configuration

### Environment Variables
```bash
# Frontend (.env.local or .env)
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000

# Backend (.env)
PORT=5000
```

### Express Middleware Order (Important!)
```typescript
// 1. CORS
app.use(cors());

// 2. Request logging
app.use((req, res, next) => { ... });

// 3. Static file serving for voice files
app.use('/voice_files', express.static('voice_files'));

// 4. Raw audio parser (BEFORE JSON parser)
app.use('/survey/:token/voice/send', express.raw({ type: 'audio/*' }));
app.use('/survey/:token/voice/transcribe', express.raw({ type: 'audio/*' }));

// 5. JSON parser
app.use(express.json());

// 6. Routes
app.use('/survey', surveyRouter);
```

## Troubleshooting

### Voice File Not Appearing in Chat
1. Check browser console for errors
2. Verify backend is running: `curl http://localhost:5000/`
3. Check voice file was saved: `ls backend/voice_files/`
4. Verify CORS is enabled in backend

### Audio Player Not Working
1. Check Content-Type header: Should be `audio/webm`
2. Verify file exists in `voice_files/` directory
3. Check browser supports HTML5 audio element
4. Try different browser (Chrome, Firefox, Safari)

### Voice File Not Sent to Backend
1. Check network tab in browser DevTools
2. Verify token is correct
3. Check audio quality assessment passed
4. Verify `/voice/send` route is registered

### 404 Error When Accessing Voice File
1. Verify static file serving is configured: `app.use('/voice_files', express.static('voice_files'))`
2. Check file exists in `voice_files/` directory
3. Verify file path in message is correct
4. Check file permissions

## Performance Considerations

### File Size
- Default limit: 50MB per file
- Typical voice file: 100KB - 1MB (depending on duration and quality)
- Consider implementing cleanup for files older than 24 hours

### Storage
- Voice files are stored on disk
- Consider implementing cloud storage (S3, GCS) for production
- Monitor disk space usage

### Network
- Audio files are sent as raw binary data
- Consider compression for large files
- Use appropriate Content-Type headers

## Security Considerations

### File Access
- Files are served from isolated `voice_files/` directory
- Directory traversal prevention implemented
- Session token validation required for sending files

### File Cleanup
- Implement periodic cleanup of old files
- Consider implementing file expiration (e.g., 24 hours)
- Monitor for disk space issues

### Privacy
- Voice files contain user responses
- Consider encrypting files at rest
- Implement proper access controls
- Consider GDPR compliance for data retention

## Next Steps

1. **Test the feature**: Record audio and verify it appears in chat
2. **Monitor storage**: Check `voice_files/` directory size
3. **Implement cleanup**: Add periodic cleanup of old files
4. **Add transcription**: Optionally transcribe voice files on demand
5. **Enhance UI**: Add visual feedback for file upload progress
6. **Add analytics**: Track voice file usage and storage

## Support

For issues or questions:
1. Check browser console for errors
2. Check backend logs for errors
3. Verify all files are properly saved
4. Check network requests in DevTools
5. Review this guide for troubleshooting steps
