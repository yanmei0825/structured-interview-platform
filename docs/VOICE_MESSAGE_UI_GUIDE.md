# Voice Message UI - WhatsApp Style Implementation

## Overview
The voice recording interface now matches WhatsApp's voice message UI with three distinct states:

1. **Default State**: Show microphone button
2. **Recording State**: Show waveform, timer, and stop button
3. **Playback State**: Show play/pause, waveform, duration, send, and cancel buttons

## UI States

### 1. Default State (Ready to Record)
- Blue microphone button
- Clicking starts recording
- Button shows: `🎤`

### 2. Recording State (Actively Recording)
- Red stop button (left side)
- Live waveform visualization (center)
- Recording timer (right side)
- Format: `MM:SS`
- Clicking stop button ends recording

### 3. Playback State (Ready to Send)
- Green play/pause button (left)
- Waveform visualization (center)
- Duration display (right)
- Green send button (→)
- Gray cancel button (X)
- User can:
  - Play/pause to preview
  - Send to submit voice message
  - Cancel to discard and re-record

## Component Structure

### VoiceButtonAdvanced.tsx
```typescript
interface VoiceButtonAdvancedProps {
  token: string;
  language: 'ru' | 'en' | 'tr';
  onVoiceRecorded: (audioBlob: Blob, duration: number) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

interface RecordedVoice {
  blob: Blob;
  duration: number;
  waveform: number[];
}
```

### State Management
- `isRecording`: Boolean - Currently recording
- `recordingTime`: Number - Elapsed time in milliseconds
- `waveform`: Number[] - Frequency data for visualization
- `recordedVoice`: RecordedVoice | null - Recorded audio data
- `isPlaying`: Boolean - Currently playing preview

## Features

### Recording
- **Start**: Click microphone button
- **Stop**: Click red stop button or auto-stop at 60 seconds
- **Waveform**: Real-time frequency visualization
- **Timer**: Shows elapsed time in MM:SS format
- **Quality Check**: Validates audio before allowing send

### Playback
- **Play/Pause**: Toggle preview playback
- **Duration**: Shows total recording length
- **Waveform**: Displays recorded audio frequencies
- **Send**: Transmit voice message to backend
- **Cancel**: Discard recording and start over

### Error Handling
- Microphone access denied
- Audio quality too poor
- Network errors during send
- Backend errors

## Integration with InterviewChat

### Flow
1. User clicks microphone button
2. Recording UI appears with waveform
3. User stops recording
4. Playback UI appears with send/cancel options
5. User clicks send
6. Voice file is uploaded to backend
7. Voice message appears in chat
8. Backend processes voice message
9. Bot responds

### Message Format
```typescript
interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
  voiceFile?: {
    filePath: string;
    fileName: string;
  };
}
```

### Voice File Display
- Voice files show with microphone icon
- HTML5 audio player with controls
- Play, pause, volume controls
- Progress bar for seeking

## Styling

### Colors
- **Recording**: Blue (#3B82F6) - Active recording
- **Recording Stop**: Red (#EF4444) - Stop button
- **Playback**: Green (#22C55E) - Ready to send
- **Cancel**: Gray (#9CA3AF) - Discard option

### Layout
- Recording: `[Stop] [Waveform] [Timer]`
- Playback: `[Play] [Waveform] [Duration] [Send] [Cancel]`
- Default: `[Microphone]`

## API Integration

### Send Voice File
```typescript
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const arrayBuffer = await audioBlob.arrayBuffer();

const response = await fetch(`${backendUrl}/survey/${token}/voice/send`, {
  method: 'POST',
  headers: {
    'Content-Type': 'audio/webm',
  },
  body: arrayBuffer,
});

const result = await response.json();
// result.voiceFile contains: { filePath, fileName, size, timestamp, language }
```

### Backend Response
```json
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

## Browser Compatibility

### Required APIs
- `MediaRecorder` - Audio recording
- `AudioContext` - Frequency analysis
- `getUserMedia` - Microphone access
- `Blob` - Audio data handling
- `URL.createObjectURL` - Audio preview

### Supported Browsers
- Chrome 49+
- Firefox 25+
- Safari 14.1+
- Edge 79+

## Performance

### Audio Format
- **Codec**: Opus (WebM container)
- **Sample Rate**: 48kHz (browser default)
- **Channels**: Mono
- **Bitrate**: ~128kbps

### File Size
- 1 second: ~2KB
- 10 seconds: ~20KB
- 60 seconds: ~120KB

### Network
- Upload time: <1 second for typical message
- Playback: Immediate (HTML5 audio)

## Accessibility

### Keyboard Navigation
- Tab to microphone button
- Enter/Space to start recording
- Tab to stop button
- Enter/Space to stop recording
- Tab to play/pause button
- Tab to send button
- Tab to cancel button

### Screen Readers
- Button labels: "Start recording", "Stop recording", "Play", "Pause", "Send voice", "Cancel"
- Aria labels for all controls
- Status updates for recording state

### Visual Indicators
- Color changes for different states
- Waveform visualization
- Timer display
- Button state changes

## Troubleshooting

### Microphone Not Working
1. Check browser permissions
2. Verify microphone is connected
3. Check browser console for errors
4. Try different browser

### Audio Quality Issues
1. Check microphone placement
2. Reduce background noise
3. Speak clearly and at normal volume
4. Check microphone settings

### Send Fails
1. Check network connection
2. Verify backend is running
3. Check browser console for errors
4. Verify token is valid

### Playback Issues
1. Check audio file was saved
2. Verify browser supports HTML5 audio
3. Check volume settings
4. Try different browser

## Future Enhancements

1. **Voice Transcription**: Add option to transcribe voice to text
2. **Voice Effects**: Add filters or effects
3. **Voice Compression**: Reduce file size
4. **Voice Encryption**: Encrypt audio in transit
5. **Voice Analytics**: Analyze emotion, sentiment, confidence
6. **Voice Playback Speed**: Adjust playback speed
7. **Voice Download**: Allow users to download voice files
8. **Voice Sharing**: Share voice messages with others

## Testing Checklist

- [ ] Microphone button appears
- [ ] Recording starts on click
- [ ] Waveform displays during recording
- [ ] Timer counts up correctly
- [ ] Stop button works
- [ ] Playback UI appears after recording
- [ ] Play/pause button works
- [ ] Duration displays correctly
- [ ] Send button uploads file
- [ ] Cancel button discards recording
- [ ] Voice message appears in chat
- [ ] Audio player works in chat
- [ ] Backend receives voice file
- [ ] Error messages display correctly
- [ ] Works on mobile browsers
- [ ] Works on desktop browsers
