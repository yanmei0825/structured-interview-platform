# LLM System - Quick Reference Guide

## Overview
The interview bot uses a sophisticated LLM system with strict constraints, natural language, and anti-manipulation measures to conduct structured workplace experience interviews.

---

## Core Components

### 1. System Prompt (`backend/src/llm-prompt.ts`)
- **Purpose**: Governs LLM behavior during interviews
- **Size**: ~2,500 tokens
- **Key Rules**: Language lock, dimension lock, no jailbreak, no AI disclosure, question deduplication
- **Generated**: Dynamically per session with current language and dimension

### 2. Structured Input (`backend/src/prompt.ts`)
- **Purpose**: Provides LLM with structured context instead of free-form history
- **Format**: JSON with 12 fields
- **Key Fields**: dimension, language, question_goal, asked_questions (blocklist), required_signal
- **Generated**: Per LLM call based on session state

### 3. LLM Integration (`backend/src/llm.ts`)
- **Purpose**: Calls LLM with system prompt and structured input
- **Providers**: Claude, OpenAI, Groq
- **Features**: Usage tracking, error handling, streaming support
- **Fallback**: Uses fallback questions if LLM fails or returns duplicate

### 4. Survey Routes (`backend/src/routes/survey.ts`)
- **Purpose**: Integrates LLM into interview flow
- **Endpoints**: POST /:token/message, POST /:token/message/stream
- **Flow**: processMessage → getLLMReply → validateReply → registerQuestion

---

## Key Features

### Language Lock
```
Interview language: English/Russian/Turkish
↓
LLM MUST respond ONLY in that language
↓
If user writes in different language:
  → LLM responds with language-lock message
  → Interview continues in original language
```

### Dimension Lock
```
Current dimension: D1-D10
↓
LLM MUST stay focused on that dimension
↓
If user goes off-topic:
  → LLM gently redirects to current dimension
  → Interview continues on current dimension
```

### Question Deduplication
```
All previously asked questions → Blocklist
↓
LLM receives full blocklist
↓
LLM MUST NOT repeat any question
↓
If LLM returns duplicate:
  → Fallback question used
  → Question registered to prevent future repeats
```

### Signal Extraction
```
User response → Extract signal keywords
↓
Signal keywords per dimension (10+ per dimension)
↓
Signals tracked per dimension
↓
Used to determine question progression
```

### Sentiment Detection
```
User response → Analyze emotional tone
↓
Positive/Negative/Neutral
↓
Logged for analytics
↓
Used to adjust follow-up questions
```

---

## Question Types

### extract_fact (Turn 1)
- Ask for a specific, concrete fact
- Example: "What project are you most proud of?"
- Used when: First turn of dimension

### extract_example (Turn 2-3)
- Ask for a specific example or story
- Example: "Tell me about a time when you had to make a decision on your own."
- Used when: Fewer than 2 signals captured

### deepen (Turn 4+)
- Ask a follow-up that goes deeper
- Example: "What was your role in making that happen?"
- Used when: 2+ signals captured

---

## Fallback System

### When Fallback is Used
1. LLM returns empty response
2. LLM returns duplicate question
3. LLM fails with error
4. Validation fails
5. Question already asked

### Fallback Questions
- 3 per dimension per language
- Proven to work and elicit good responses
- Ensures interview continues even if LLM fails

### Fallback Selection
```
Try LLM → If fails/duplicate:
  ↓
Try pickFresh() → Find fresh question from dimension
  ↓
Try getFallback() → Use fallback question
  ↓
Use default → Use first fallback question
```

---

## Data Flow

```
User sends message
    ↓
POST /:token/message
    ↓
processMessage()
  - Validate input
  - Extract signals
  - Detect sentiment
  - Check for guard conditions
    ↓
If guard hit → Return guard reply
    ↓
getLLMReply(session)
  - buildSystemPrompt() → Create system prompt
  - buildLLMInput() → Create structured input
  - buildUserMessage() → Wrap as JSON
  - Call LLM (Claude/OpenAI/Groq)
  - parseLLMOutput() → Extract question
    ↓
isReplyDuplicate() → Check for duplicates
    ↓
If duplicate → Use fallback
    ↓
validateReply() → Validate question quality
    ↓
registerQuestion() → Add to blocklist
    ↓
Return question to user
```

---

## Configuration

### Environment Variables
```bash
# LLM Provider
LLM_PROVIDER=claude|openai|groq

# API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk-...

# Models
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
OPENAI_MODEL=gpt-4o-mini

# Mock Mode (for testing)
MOCK_LLM=true|false

# Proxy (optional)
PROXY_URL=http://proxy:port
LLM_BASE_URL=https://custom-api-endpoint
```

### LLM Config
```typescript
const LLM_CONFIG = {
  temperature: 0.5,           // Balanced creativity
  max_tokens: 150,            // Max response length
  min_tokens: 20,             // Avoid empty responses
  frequency_penalty: 0.5,     // Reduce repetition
  presence_penalty: 0.2,      // Encourage diversity
  stop: ["\n\n", "?\n", "Human:", "User:", "Interviewer:"],
};
```

---

## Monitoring & Logging

### Events Logged
- `llm_usage`: Token usage per call
- `question_generated`: Generated question
- `fallback_used`: When fallback was used
- `llm_error`: LLM errors
- `reply_violations`: Validation violations
- `sentiment_positive|negative|neutral`: Sentiment detected

### Usage Tracking
```typescript
interface UsageRecord {
  token: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  timestamp: number;
}
```

### Metrics
- Total tokens used
- Total calls made
- Average tokens per call
- Error rate
- Fallback rate

---

## Troubleshooting

### LLM Returns Empty Response
- Check API key configuration
- Check network connectivity
- Check LLM provider status
- Fallback will be used automatically

### LLM Returns Duplicate Question
- Duplicate detection triggered
- Fallback question used
- Question registered to prevent future repeats

### LLM Returns Invalid JSON
- parseLLMOutput() handles gracefully
- Fallback question used
- Error logged

### Interview Stuck on Same Dimension
- Check if dimension lock is working
- Check if signals are being extracted
- Check if question progression is working
- Review logs for errors

### Language Switching Not Prevented
- Check if language lock is in system prompt
- Check if language is being passed to LLM
- Verify LLM is responding in correct language

---

## Performance Tips

### Optimize Token Usage
- Keep system prompt concise (already optimized)
- Use structured input instead of free-form history
- Limit history to recent messages (MAX_HISTORY_MESSAGES = 28)
- Use fallback questions to reduce LLM calls

### Optimize Response Time
- Use streaming for real-time feedback
- Cache fallback questions
- Pre-compute signal keywords
- Use mock mode for testing

### Optimize Reliability
- Use fallback system for all failures
- Monitor error rates
- Track duplicate rates
- Review logs regularly

---

## Testing

### Unit Tests
```bash
# Test signal extraction
npm test -- extractSignals

# Test sentiment detection
npm test -- detectSentiment

# Test duplicate detection
npm test -- isReplyDuplicate

# Test LLM input building
npm test -- buildLLMInput
```

### Integration Tests
```bash
# Test with mock LLM
MOCK_LLM=true npm test

# Test with real LLM
npm test -- --real-llm

# Test streaming
npm test -- --streaming
```

### End-to-End Tests
```bash
# Test complete interview
npm test -- --e2e

# Test language lock
npm test -- --language-lock

# Test dimension lock
npm test -- --dimension-lock

# Test jailbreak resistance
npm test -- --jailbreak
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| LLM returns duplicate | Blocklist not passed | Check buildLLMInput() |
| Language switches | Language lock not enforced | Check system prompt |
| Bot goes off-topic | Dimension lock not enforced | Check system prompt |
| Empty responses | LLM error or timeout | Check error logs, use fallback |
| Slow responses | LLM latency | Use streaming, optimize prompts |
| High token usage | Large history | Trim history, use structured input |
| Jailbreak succeeds | System prompt too weak | Review and strengthen rules |

---

## Files Reference

| File | Purpose |
|------|---------|
| `backend/src/llm-prompt.ts` | System prompt and fallback questions |
| `backend/src/prompt.ts` | Structured input and signal extraction |
| `backend/src/llm.ts` | LLM integration and API calls |
| `backend/src/routes/survey.ts` | Survey routes and interview flow |
| `backend/src/dimensions.ts` | Dimension definitions and questions |
| `backend/src/guards.ts` | Input validation and guard replies |
| `backend/src/session.ts` | Session management |

---

## Next Steps

### Phase 1 (Current)
- ✅ Strict constraint enforcement
- ✅ Natural language implementation
- ✅ Structured input system
- ✅ Anti-manipulation measures
- ✅ Multi-language support

### Phase 2 (Future)
- [ ] Context-aware questions (reference previous answers)
- [ ] Dynamic difficulty adjustment
- [ ] User response style learning
- [ ] Advanced sentiment analysis
- [ ] Confidence scoring

### Phase 3 (Future)
- [ ] Predictive analytics
- [ ] Anomaly detection
- [ ] Personalized question ordering
- [ ] Real-time insights
- [ ] Advanced reporting

---

## Support

For issues or questions:
1. Check logs: `backend/logs/`
2. Review documentation: `LLM_PROMPT_IMPROVEMENTS_COMPLETE.md`
3. Check verification report: `LLM_SYSTEM_VERIFICATION.md`
4. Review this guide: `LLM_QUICK_REFERENCE.md`

---

**Status**: ✅ PRODUCTION READY

**Last Updated**: April 24, 2026

**Version**: 1.0.0
