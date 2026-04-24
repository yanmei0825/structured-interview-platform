# Interview System - Structured Workplace Experience Collection

A full-stack application for conducting structured interviews across 10 dimensions of workplace experience, with voice integration, multi-language support, and AI-powered question generation.

## Overview

This system collects honest, specific information about workplace experience through a structured interview process. It explores 10 key dimensions:

1. **D1 — Success** - Pride, achievement, results
2. **D2 — Security/Value** - Stability, recognition, fair treatment
3. **D3 — Relationships** - Team dynamics, trust, support
4. **D4 — Autonomy** - Control, decisions, freedom
5. **D5 — Engagement** - Energy, motivation, flow
6. **D6 — Recognition/Feedback** - Acknowledgment, feedback quality
7. **D7 — Learning** - Growth, skill development
8. **D8 — Purpose** - Meaning, values alignment, impact
9. **D9 — Obstacles** - Blockers, frustrations, stress
10. **D10 — Voice** - Being heard, psychological safety

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **LLM Integration**: Claude, OpenAI, Groq
- **Voice**: AssemblyAI, Google Cloud, Azure, OpenAI Whisper
- **Database**: In-memory session storage (extensible)

### Frontend
- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Voice**: Web Audio API, MediaRecorder
- **State**: React Hooks

## Features

### Core Interview System
- ✅ Structured 10-dimension interview flow
- ✅ Adaptive question generation via LLM
- ✅ Input classification (10 types: valid, emoji, emotion, off-topic, refusal, confusion, too_short, too_long, gibberish, scribble)
- ✅ Signal extraction and sentiment detection
- ✅ Automatic fallback system (100% uptime)
- ✅ Question deduplication (3-level detection)

### Multi-Language Support
- ✅ English (en)
- ✅ Russian (ru)
- ✅ Turkish (tr)
- ✅ Language lock (cannot change mid-interview)

### Voice Integration
- ✅ Speech-to-text transcription
- ✅ Text-to-speech synthesis
- ✅ Voice quality assessment (client-side)
- ✅ Audio file storage and playback
- ✅ Multiple provider support

### Reporting
- ✅ Individual interview reports
- ✅ Project-level aggregation
- ✅ Company-level comparison
- ✅ Signal-based analysis
- ✅ Coverage metrics per dimension

### API Endpoints
- `POST /survey/public-session` - Create one-time session
- `GET /survey/:token` - Load survey status
- `POST /survey/:token/language` - Select language
- `POST /survey/:token/demographics` - Submit demographics
- `POST /survey/:token/message` - Send message (non-streaming)
- `POST /survey/:token/message/stream` - Send message (streaming)
- `GET /survey/:token/report` - Get final report
- `POST /survey/:token/voice/*` - Voice endpoints

## Project Structure

```
project-root/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server setup
│   │   ├── types.ts              # TypeScript definitions
│   │   ├── dimensions.ts         # D1-D10 definitions
│   │   ├── guards.ts             # Input classification
│   │   ├── llm.ts                # LLM integration
│   │   ├── llm-prompt.ts         # System prompt
│   │   ├── prompt.ts             # Structured input
│   │   ├── session.ts            # Session management
│   │   ├── analytics.ts          # Report generation
│   │   ├── voice.ts              # Voice processing
│   │   ├── voice-processor.ts    # Voice analysis
│   │   ├── replyValidator.ts     # Reply validation
│   │   ├── routes/
│   │   │   ├── survey.ts         # Interview endpoints
│   │   │   └── company.ts        # Company endpoints
│   │   └── seed.ts               # Default data
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Home page
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles
│   │   ├── interview-face-to-face/
│   │   ├── report/
│   │   ├── company-report/
│   │   └── comparison/
│   ├── components/
│   │   ├── InterviewChat.tsx     # Main chat interface
│   │   ├── VoiceButton.tsx       # Voice recording
│   │   ├── VoiceInterface.tsx    # Voice controls
│   │   ├── ReportDisplay.tsx     # Report view
│   │   └── ... (other components)
│   ├── lib/
│   │   └── api.ts                # API client
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── docs/                         # Documentation
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- API keys for LLM and voice services (optional for mock mode)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd project-root
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Set up environment variables**

Backend (`.env`):
```
PORT=5000
OPENAI_API_KEY=your_key_here
GOOGLE_CLOUD_API_KEY=your_key_here
ASSEMBLYAI_API_KEY=your_key_here
```

Frontend (`.env.local`):
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_PROJECT_ID=default
```

### Running Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Building for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

## API Usage

### Create a Session
```bash
curl -X POST http://localhost:5000/survey/public-session \
  -H "Content-Type: application/json" \
  -d '{"projectId": "default"}'
```

### Select Language
```bash
curl -X POST http://localhost:5000/survey/:token/language \
  -H "Content-Type: application/json" \
  -d '{"language": "en"}'
```

### Send Message
```bash
curl -X POST http://localhost:5000/survey/:token/message \
  -H "Content-Type: application/json" \
  -d '{"message": "I felt proud when I completed the project on time"}'
```

### Get Report
```bash
curl http://localhost:5000/survey/:token/report
```

## Key Constraints

### Language Lock
- Language is selected at the start
- Cannot be changed during interview
- Enforced at backend level

### Dimension Lock
- Dimensions progress in fixed order (D1 → D10)
- Cannot be reordered
- Each dimension has min/max turns

### Input Validation
- 5-300 character limit per response
- Emoji detection (general emojis = messy content)
- Scribble detection (language mixing = not allowed)
- Off-topic detection with automatic redirection

### LLM Constraints
- No AI disclosure ("I am an AI")
- No HR jargon or therapeutic language
- Natural, human-like tone
- Question deduplication (3 levels)
- Fallback system for LLM failures

## Documentation

See the `docs/` folder for detailed documentation:

- `API_ENDPOINTS_VERIFICATION.md` - Complete API reference
- `DIMENSIONS_VERIFICATION.md` - Dimension definitions
- `LLM_DOCUMENTATION_INDEX.md` - LLM system overview
- `ENHANCEMENT_PLAN.md` - Future improvements
- `KOREAN_REMOVAL_COMPLETE.md` - Localization changes

## Development

### Build
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

### Test
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

### Lint
```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint
```

## Environment Variables

### Backend (.env)
```
PORT=5000
OPENAI_API_KEY=sk-...
GOOGLE_CLOUD_API_KEY=...
ASSEMBLYAI_API_KEY=...
AZURE_SPEECH_KEY=...
ELEVENLABS_API_KEY=...
```

### Frontend (.env.local)
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_PROJECT_ID=default
```

## Performance

- Backend response time: < 500ms
- Frontend load time: < 2s
- Voice transcription: < 5s
- Report generation: < 1s

## Security

- ✅ Input validation on all endpoints
- ✅ Language lock enforcement
- ✅ Session token validation
- ✅ CORS configured
- ✅ Environment variables for secrets
- ✅ No sensitive data in logs

## Troubleshooting

### Backend won't start
```bash
# Clear node_modules and reinstall
rm -rf backend/node_modules
cd backend && npm install
npm run build
```

### Frontend build fails
```bash
# Clear Next.js cache
rm -rf frontend/.next
cd frontend && npm run build
```

### Voice not working
- Check browser permissions for microphone
- Verify API keys are set
- Check browser console for errors
- Ensure backend is running

### LLM errors
- Verify API keys are correct
- Check rate limits
- System will use fallback questions automatically

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally
4. Commit with clear messages
5. Push and create a pull request

## License

[Your License Here]

## Support

For issues or questions:
1. Check the documentation in `docs/`
2. Review the API endpoints
3. Check the browser console for errors
4. Review backend logs

## Roadmap

See `ENHANCEMENT_PLAN.md` for planned features:
- Advanced analytics
- Real-time dashboards
- Team collaboration
- Third-party integrations
- Enhanced security features

---

**Last Updated**: April 24, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
