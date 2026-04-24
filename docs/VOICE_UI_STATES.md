# Voice Message UI States - Visual Reference

## State 1: Default (Ready to Record)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [+]  [Type your answer...]                    [🎤] [→]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

- Blue microphone button
- Text input field visible
- Send button visible
- Ready to record or type
```

## State 2: Recording (Actively Recording)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [+]  [■] ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁  0:05                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

- Red stop button (■)
- Live waveform visualization
- Recording timer (MM:SS)
- Expands to full width
- No text input visible
```

## State 3: Playback (Ready to Send)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [+]  [▶] ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁  0:12  [→] [✕]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

- Green play/pause button (▶)
- Waveform visualization
- Duration display (0:12)
- Green send button (→)
- Gray cancel button (✕)
- Expands to full width
- No text input visible
```

## Chat Display - Voice Message

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Assistant: Hey — thanks for taking the time...            │
│                                                             │
│                                    [🎤] [▶] 0:12 [15:34]  │
│                                                             │
│  [+]  [Type your answer...]                    [🎤] [→]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

- Voice message appears in chat
- Microphone icon indicator
- Audio player with play button
- Duration display
- Timestamp
```

## Button States

### Microphone Button (Default)
```
┌─────┐
│ 🎤  │  Blue background
│     │  Hover: Darker blue
└─────┘  Disabled: Faded
```

### Stop Button (Recording)
```
┌─────┐
│ ■   │  Red background
│     │  Hover: Darker red
└─────┘  Animated pulse
```

### Play/Pause Button (Playback)
```
┌─────┐
│ ▶   │  Green background (play)
│     │  Hover: Darker green
└─────┘

┌─────┐
│ ⏸   │  Green background (pause)
│     │  Hover: Darker green
└─────┘
```

### Send Button (Playback)
```
┌─────┐
│ →   │  Green background
│     │  Hover: Darker green
└─────┘
```

### Cancel Button (Playback)
```
┌─────┐
│ ✕   │  Gray background
│     │  Hover: Darker gray
└─────┘
```

## Waveform Visualization

### Recording (Blue)
```
▁▂▃▄▅▆▇█▇▆▅▄▃▂▁
```
- Real-time frequency data
- Updates every frame
- Blue color (#3B82F6)
- 20 bars displayed

### Playback (Green)
```
▁▂▃▄▅▆▇█▇▆▅▄▃▂▁
```
- Static waveform
- Green color (#22C55E)
- 20 bars displayed

## Timer Display

### Recording
```
0:05  (5 seconds)
0:30  (30 seconds)
1:00  (60 seconds - max)
```

### Duration
```
0:12  (12 seconds)
0:45  (45 seconds)
1:00  (60 seconds)
```

## Color Scheme

| State | Color | Hex | Usage |
|-------|-------|-----|-------|
| Recording | Blue | #3B82F6 | Microphone button, waveform |
| Recording Stop | Red | #EF4444 | Stop button |
| Playback | Green | #22C55E | Play button, send button, waveform |
| Cancel | Gray | #9CA3AF | Cancel button |
| Background | Dark | #111111 | Chat background |
| Text | White | #FFFFFF | Text content |

## Responsive Design

### Desktop (>1024px)
```
Full width input area
Buttons on right side
Waveform takes up space
```

### Tablet (768px - 1024px)
```
Full width input area
Buttons on right side
Waveform takes up space
```

### Mobile (<768px)
```
Full width input area
Buttons stack vertically
Waveform takes up space
Optimized for touch
```

## Accessibility

### Keyboard Navigation
```
Tab → Microphone button
Enter/Space → Start recording
Tab → Stop button
Enter/Space → Stop recording
Tab → Play button
Enter/Space → Play/pause
Tab → Send button
Enter/Space → Send
Tab → Cancel button
Enter/Space → Cancel
```

### Screen Reader Labels
```
"Start recording"
"Stop recording"
"Play voice message"
"Pause voice message"
"Send voice message"
"Cancel recording"
```

## Animation States

### Recording
```
Microphone button: Pulse animation
Waveform: Continuous update
Timer: Increments every 100ms
```

### Playback
```
Play button: Static
Waveform: Static
Duration: Static
```

### Sending
```
Send button: Disabled
Loading spinner: Animated
```

## Error States

### Microphone Access Denied
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Microphone access denied                                 │
│                                                             │
│  [+]  [Type your answer...]                    [🎤] [→]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Audio Quality Too Poor
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Voice quality too poor                                   │
│                                                             │
│  [+]  [Type your answer...]                    [🎤] [→]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Send Failed
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Voice send failed                                        │
│                                                             │
│  [+]  [▶] ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁  0:12  [→] [✕]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Loading States

### Uploading Voice File
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [+]  [▶] ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁  0:12  [⟳] [✕]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

- Send button shows loading spinner
- Other buttons disabled
```

### Processing Response
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Assistant: [⟳⟳⟳]                                          │
│                                                             │
│  [+]  [Type your answer...]                    [🎤] [→]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

- Animated loading dots
- Input disabled
- Microphone disabled
```

## Summary

The voice message UI provides three clear states:

1. **Default**: Ready to record or type
2. **Recording**: Active recording with waveform and timer
3. **Playback**: Preview with send/cancel options

Each state has distinct visual indicators, colors, and controls to guide the user through the voice message workflow.
