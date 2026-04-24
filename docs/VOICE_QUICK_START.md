# Voice Message Feature - Quick Start Guide

## Installation & Setup

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```

Backend runs on: `http://localhost:5000`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:3000`

### 3. Verify Setup
```bash
# Check backend is running
curl http://localhost:5000/

# Expected response:
# {"status":"ok","service":"interview-backend"}
```

## Using Voice Messages

### Recording a Voice Message

1. **Open Interview Chat**
   - Navigate to http://localhost:3000
   - Start an interview session
   - Select language

2. **Click Microphone Button**
   - Blue microphone button appears in input area
   - Click to start recording

3. **Record Your Message**
   - Waveform animates in real-time
   - Timer shows elapsed time
   - Speak clearly and naturally
   - Maximum 60 seconds

4. **Stop Recording**
   - Click red stop button
   - Recording ends automatically

5. **Preview (Optional)**
   - Click green play button to preview
   - Click pause to stop preview
   - Adjust volume as needed

6. **Send Voice Message**
   - Click green send button (→)
   - Voice file uploads to backend
   - Message appears in chat with audio player

7. **Cancel (Optional)**
   - Click gray cancel button (✕) to discard
   - Start over with new recording

## File Structure

### Voice Files Storage
```
backend/voice_files/
├── voice_token_1234567890.webm
├── voice_token_1234567891.webm
└── voice_token_1234567892.webm
```

### File Naming
- Pattern: `voice_{token}_{timestamp}.webm`
- Example: `voice_ee1275c7-613b-4f1d-9a43-4a4821b8865f_1234567890.webm`

## API Endpoints

### Send Voice File
```bash
curl -X POST http://localhost:5000/survey/YOUR_TOKEN/voice/send \
  --data-binary @audio.webm \
  -H "Content-Type: audio/webm"
```

### Get Voice File
```bash
curl http://localhost:5000/voice_files/voice_token_timestamp.webm \
  -o downloaded_audio.webm
```

## Configuration

### Environment Variables

**Frontend (.env.local)**
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

**Backend (.env)**
```
PORT=5000
```

## Troubleshooting

### Microphone Not Working
```
1. Check browser permissions
   - Chrome: Settings → Privacy → Microphone
   - Firefox: Preferences → Privacy → Microphone
   - Safari: System Preferences → Security & Privacy → Microphone

2. Verify microphone is connected
   - Check system audio settings
   - Test with other apps

3. Check browser console
   - Open DevTools (F12)
   - Check Console tab for errors
```

### Audio Quality Too Poor
```
1. Reduce background noise
   - Move to quieter location
   - Close other applications

2. Speak clearly
   - Normal volume
   - Clear pronunciation
   - Avoid mumbling

3. Check microphone
   - Clean microphone
   - Check microphone settings
   - Try different microphone
```

### Voice File Not Sending
```
1. Check network connection
   - Verify internet is working
   - Check network tab in DevTools

2. Verify backend is running
   - curl http://localhost:5000/
   - Check backend console for errors

3. Check browser console
   - Open DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests
```

### Audio Player Not Working
```
1. Check browser support
   - Chrome 49+
   - Firefox 25+
   - Safari 14.1+
   - Edge 79+

2. Check audio file
   - Verify file exists in voice_files/
   - Check file size (should be >0 bytes)
   - Try downloading file directly

3. Try different browser
   - Test in Chrome, Firefox, Safari
   - Check if issue is browser-specific
```

## Testing Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Microphone button visible
- [ ] Recording starts on click
- [ ] Waveform displays during recording
- [ ] Timer counts up correctly
- [ ] Stop button works
- [ ] Playback UI appears
- [ ] Play/pause button works
- [ ] Duration displays correctly
- [ ] Send button uploads file
- [ ] Cancel button discards recording
- [ ] Voice message appears in chat
- [ ] Audio player works in chat
- [ ] Backend receives voice file
- [ ] Error messages display correctly

## Performance Tips

### Optimize Recording Quality
- Use good quality microphone
- Reduce background noise
- Speak at normal volume
- Avoid loud environments

### Optimize File Size
- Keep recordings under 60 seconds
- Use normal speaking pace
- Avoid long pauses
- Typical file size: 20-120KB

### Optimize Upload Speed
- Use stable internet connection
- Close other applications
- Avoid network congestion
- Typical upload time: <1 second

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 49+ | ✅ Supported |
| Firefox | 25+ | ✅ Supported |
| Safari | 14.1+ | ✅ Supported |
| Edge | 79+ | ✅ Supported |
| Opera | 36+ | ✅ Supported |
| Mobile Chrome | Latest | ✅ Supported |
| Mobile Safari | Latest | ✅ Supported |

## Common Issues & Solutions

### Issue: "Microphone access denied"
**Solution**: 
- Grant microphone permission in browser settings
- Reload page and try again
- Check system microphone settings

### Issue: "Voice quality too poor"
**Solution**:
- Reduce background noise
- Speak louder and clearer
- Check microphone is working
- Try different microphone

### Issue: "Voice send failed"
**Solution**:
- Check internet connection
- Verify backend is running
- Check browser console for errors
- Try again in a few seconds

### Issue: "Audio player not working"
**Solution**:
- Try different browser
- Check browser supports HTML5 audio
- Verify audio file was saved
- Check volume settings

## Advanced Usage

### Manual File Upload
```bash
# Upload voice file manually
curl -X POST http://localhost:5000/survey/YOUR_TOKEN/voice/send \
  --data-binary @my_audio.webm \
  -H "Content-Type: audio/webm"
```

### Download Voice File
```bash
# Download voice file
curl http://localhost:5000/voice_files/voice_token_timestamp.webm \
  -o my_audio.webm
```

### Check Voice Files
```bash
# List all voice files
ls -lh backend/voice_files/

# Check file size
du -sh backend/voice_files/

# Delete old files
find backend/voice_files/ -mtime +1 -delete
```

## Next Steps

1. **Test the feature**: Record and send a voice message
2. **Monitor storage**: Check `voice_files/` directory size
3. **Implement cleanup**: Add periodic cleanup of old files
4. **Add transcription**: Optionally transcribe voice to text
5. **Enhance UI**: Add visual feedback and animations
6. **Add analytics**: Track voice usage and storage

## Support

For issues or questions:
1. Check this guide for troubleshooting
2. Check browser console for errors (F12)
3. Check backend logs for errors
4. Review documentation files:
   - `VOICE_MESSAGE_UI_GUIDE.md` - UI/UX details
   - `VOICE_FILE_FEATURE.md` - Feature overview
   - `VOICE_MESSAGE_IMPLEMENTATION_COMPLETE.md` - Complete documentation

## Summary

The voice message feature is now ready to use! Users can:
- ✅ Record voice messages with real-time waveform
- ✅ Preview before sending
- ✅ Send voice files directly to chat
- ✅ Play voice messages with audio player
- ✅ Enjoy WhatsApp-style UI/UX

Happy voice messaging! 🎤
