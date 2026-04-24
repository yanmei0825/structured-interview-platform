# Voice File Feature - Direct Audio Sending

## Overview
Users can now record audio and send it directly to the chat as a playable voice file instead of transcribing it to text. This allows for preserving the original voice while still capturing user responses.

## How It Works

### Frontend Flow
1. User clicks the microphone button in the chat
2. Audio is recorded using the browser's MediaRecorder API
3. When recording stops, the audio is sent directly to the backend via `/survey/:token/voice/send`
4. Backend saves the audio file and returns the file path
5. Frontend displays the voice file as a playable audio element in the chat
6. When user clicks send, the voice file path is sent to the backend as a message

### Backend Flow
1. `POST /survey/:token/voice/send` receives raw audio data
2. Audio is saved to `voice_files/` directory with naming pattern: `voice_{token}_{timestamp}.webm`
3. Response includes the file path: `/voice_files/{fileName}`
4. Voice file is added to session history as a user message
5. `GET /voice_files/:fileName` serves the audio file with proper MIME type

### Chat Display
- Voice files are displayed with a microphone icon and an HTML5 audio player
- Users can play, pause, and control volume
- Voice files are clearly distinguished from text messages

## File Structure

### Backend
- **Route**: `backend/src/routes/survey.ts`
  - `POST /:token/voice/send` - Receive and save voice files
  - `POST /:token/voice/transcribe` - Transcribe audio to text (legacy)
  - `POST /:token/voice/analyze` - Analyze voice input
  - `POST /:token/voice/speak/stream` - Generate speech from text

- **Storage**: `voice_files/` directory
  - Files are stored with pattern: `voice_{token}_{timestamp}.webm`
  - Served statically via Express middleware

### Frontend
- **Component**: `frontend/components/VoiceButtonAdvanced.tsx`
  - Records audio with waveform visualization
  - Sends audio directly to `/voice/send` endpoint
  - Returns voice file path to parent component

- **Integration**: `frontend/components/InterviewChat.tsx`
  - Displays voice files as playable audio elements
  - Handles voice file messages in chat history
  - Sends voice file paths as messages to backend

## Configuration

### Environment Variables
- `NEXT_PUBLIC_BACKEND_URL` - Backend URL for API calls (default: `http://localhost:5000`)

### Backend Middleware
The Express app includes middleware to handle raw audio:
```typescript
app.use('/survey/:token/voice/send', express.raw({ type: 'audio/*', limit: '50mb' }));
app.use('/survey/:token/voice/transcribe', express.raw({ type: 'audio/*', limit: '50mb' }));
app.use('/voice_files', express.static('voice_files'));
```

## Message Format

### Voice File Message
```typescript
interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
  voiceFile?: {
    filePath: string;      // e.g., "/voice_files/voice_token_1234567890.webm"
    fileName: string;      // e.g., "voice_token_1234567890.webm"
  };
}
```

### Backend Session History
```typescript
{
  role: "user",
  content: "[Voice Message: voice_token_1234567890.webm]",
  timestamp: Date.now()
}
```

## API Endpoints

### Send Voice File
```
POST /survey/:token/voice/send
Content-Type: audio/webm
Body: Raw audio buffer

Response:
{
  "success": true,
  "message": "Voice file received",
  "voiceFile": {
    "type": "voice",
    "fileName": "voice_token_1234567890.webm",
    "filePath": "/voice_files/voice_token_1234567890.webm",
    "size": 12345,
    "timestamp": 1234567890,
    "language": "en"
  },
  "sessionUpdated": true
}
```

### Get Voice File
```
GET /voice_files/:fileName

Response: Audio file with Content-Type: audio/webm
```

## Features

### Audio Quality Assessment
- Client-side quality check before sending
- Checks volume levels and noise
- Rejects audio if quality is too poor

### Waveform Visualization
- Real-time waveform display during recording
- Shows audio frequency data
- Visual feedback for recording status

### Recording Controls
- Start/stop recording with button
- Maximum recording time: 60 seconds
- Auto-stop at time limit

### Language Support
- Supports: Russian (ru), English (en), Turkish (tr)
- Language is stored with voice file metadata

## Security

### File Access Control
- Voice files are stored in isolated `voice_files/` directory
- Directory traversal prevention in file serving
- Files are served with proper MIME types
- Session token validation required

### File Cleanup
- Files are stored with timestamp for potential cleanup
- Consider implementing periodic cleanup of old files (>24 hours)

## Future Enhancements

1. **Voice File Cleanup**: Implement automatic deletion of old voice files
2. **Transcription Option**: Add option to transcribe voice files on demand
3. **Voice Analysis**: Analyze emotion, sentiment, and confidence from voice
4. **Voice Playback Speed**: Allow users to adjust playback speed
5. **Voice Download**: Allow users to download their voice files
6. **Voice Compression**: Compress voice files to reduce storage

## Testing

### Manual Testing
1. Start backend: `npm run dev` (in backend directory)
2. Start frontend: `npm run dev` (in frontend directory)
3. Open interview chat
4. Click microphone button
5. Record audio (at least 1 second)
6. Stop recording
7. Verify voice file appears in chat with audio player
8. Click send to submit voice file
9. Verify backend receives voice file message

### Expected Behavior
- Voice file displays with microphone icon
- Audio player is functional (play, pause, volume)
- Voice file path is sent to backend
- Session history includes voice file reference
