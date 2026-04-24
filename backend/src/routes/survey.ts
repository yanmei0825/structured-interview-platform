import { Router, Request, Response } from "express";
import {
  createSession, getSession, saveSession, logEvent,
  advanceDimension, shouldAdvance, getSessionSummary, updateDimensionMetrics,
  isQuestionAlreadyAsked, registerQuestion,
} from "../session";
import { classifyInput, getGuardReply, isDuplicateQuestion, stripEmoji } from "../guards";
import { getLLMReply, streamLLMReply } from "../llm";
import { extractSignals, detectSentiment, isReplyDuplicate } from "../prompt";
import { validateReply } from "../replyValidator";
import { Language, InterviewSession, DimensionKey } from "../types";
import { getDimension, DIMENSION_ORDER } from "../dimensions";
import { getProject } from "../store";
import { speechToText, textToSpeech, TTSOptions } from "../voice";
import { analyzeVoiceInput, assessVoiceQuality, tokenizeText, enforceCharacterLimit } from "../voice-processor";
import * as fs from "fs";
import * as path from "path";

const router = Router();

const voiceStoragePath = path.join(process.cwd(), "voice_files");
if (!fs.existsSync(voiceStoragePath)) {
  fs.mkdirSync(voiceStoragePath, { recursive: true });
}

router.post("/:token/voice/send", async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    
    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const session = getSession(token);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (!session.language) {
      return res.status(400).json({ error: "Language not selected" });
    }

    const audioBuffer = req.body;
    if (!audioBuffer || (Buffer.isBuffer(audioBuffer) && audioBuffer.length === 0)) {
      return res.status(400).json({ error: "No audio provided" });
    }

    console.log(`[Voice Send] Token: ${token}, Audio size: ${Buffer.isBuffer(audioBuffer) ? audioBuffer.length : 'unknown'}`);

    const voiceFileName = `voice_${token}_${Date.now()}.webm`;
    const voiceFilePath = path.join(voiceStoragePath, voiceFileName);

    fs.writeFileSync(voiceFilePath, audioBuffer);
    console.log(`[Voice Send] Saved: ${voiceFilePath}`);

    const voiceMessage = {
      type: "voice",
      fileName: voiceFileName,
      filePath: `/voice_files/${voiceFileName}`,
      size: Buffer.isBuffer(audioBuffer) ? audioBuffer.length : 0,
      timestamp: Date.now(),
      language: session.language,
    };

    session.history.push({
      role: "user",
      content: `[Voice Message: ${voiceFileName}]`,
      timestamp: Date.now(),
    });

    logEvent(token, "voice_sent", voiceFileName, session.currentDimension);
    saveSession(session);

    res.json({
      success: true,
      message: "Voice file received",
      voiceFile: voiceMessage,
      sessionUpdated: true,
    });
  } catch (err: any) {
    console.error("[Voice Send Error]", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/:token/voice/transcribe", async (req: Request, res: Response) => {
  console.log("-=-=-=-------------------");
  try {
    const token = req.params.token as string;
    
    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const session = getSession(token);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (!session.language) {
      return res.status(400).json({ error: "Language not selected" });
    }

    const audioBuffer = req.body;
    if (!audioBuffer || (Buffer.isBuffer(audioBuffer) && audioBuffer.length === 0)) {
      return res.status(400).json({ error: "No audio provided" });
    }

    console.log(`[Voice Transcribe] Token: ${token}, Audio size: ${Buffer.isBuffer(audioBuffer) ? audioBuffer.length : 'unknown'}`);

    const result = await speechToText(audioBuffer, session.language);

    logEvent(token, "voice_transcribed", result.text.slice(0, 80), session.currentDimension);

    session.history.push({
      role: "user",
      content: result.text,
      timestamp: Date.now(),
    });
    saveSession(session);

    res.json({
      text: result.text,
      confidence: result.confidence,
      language: result.language,
      duration: result.duration,
    });
  } catch (err: any) {
    console.error("[Voice Transcribe Error]", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/:token/voice/speak/stream", async (req: Request, res: Response) => {

  try {
    const token = req.params.token as string;
    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const { text, speed, pitch, voiceGender } = req.body;

    const session = getSession(token);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (!session.language) {
      return res.status(400).json({ error: "Language not selected" });
    }

    if (!text || text.length === 0) {
      return res.status(400).json({ error: "No text provided" });
    }

    console.log(`[Voice Speak] Token: ${token}, Text: ${text.slice(0, 50)}`);

    const options: TTSOptions = {
      speed: speed ?? 1.0,
      pitch: pitch ?? 1.0,
      voiceGender: voiceGender ?? "neutral",
    };

    const result = await textToSpeech(text, session.language, options);

    logEvent(token, "voice_generated_stream", text.slice(0, 80));

    res.setHeader("Content-Type", result.mimeType);
    res.send(Buffer.from(result.audioBuffer));
  } catch (err: any) {
    console.error("[Voice Speak Stream Error]", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/:token/voice/analyze", async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const { text, language, confidence, duration } = req.body as {
      text?: string;
      language?: Language;
      confidence?: number;
      duration?: number;
    };

    if (!text || !language) {
      return res.status(400).json({ error: "text and language are required" });
    }

    const session = getSession(token);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const limitResult = enforceCharacterLimit(text, 500, 100, language);

    const qualityMetrics = assessVoiceQuality(new ArrayBuffer(0), duration ?? 0);

    const analysis = analyzeVoiceInput(
      limitResult.truncated,
      language,
      qualityMetrics,
      confidence ?? 0.85
    );

    logEvent(token, "voice_analyzed", `${analysis.wordCount} words, ${analysis.sentiment}`, session.currentDimension);

    res.json(analysis);
  } catch (err: any) {
    console.error("[Voice Analyze Error]", err);
    res.status(500).json({ error: err.message });
  }
});


interface ProcessResult {
  reply: string;
  dimension: DimensionKey | null;
  finished: boolean;
  guardHit: boolean;
}

async function processMessage(session: InterviewSession, message: string): Promise<ProcessResult> {
  const lang = session.language!;

  let processedMessage = message;
  if (message.includes("[Voice:")) {
    const voiceMatch = message.match(/\[Voice: (\/voice_files\/[^\]]+)\]/);
    if (voiceMatch && voiceMatch[1]) {
      const voiceFilePath = voiceMatch[1];
      const fullPath = path.join(process.cwd(), voiceFilePath);
      
      try {
        if (fs.existsSync(fullPath)) {
          const audioBuffer = fs.readFileSync(fullPath);
          const transcriptionResult = await speechToText(audioBuffer as any, lang);
          processedMessage = transcriptionResult.text;
          console.log(`[Voice Transcription] Transcribed: ${processedMessage}`);
        } else {
          console.warn(`[Voice Transcription] File not found: ${fullPath}`);
          processedMessage = "I sent a voice message but it couldn't be transcribed.";
        }
      } catch (err: any) {
        console.error(`[Voice Transcription Error]`, err);
        processedMessage = "I sent a voice message but there was an error transcribing it.";
      }
    }
  }

  const inputClass = classifyInput(processedMessage, lang);
  logEvent(session.token, "user_response_received", processedMessage.slice(0, 80), session.currentDimension);
  logEvent(session.token, "input_classified", inputClass, session.currentDimension);

  const cleanMessage = (inputClass === "emoji_mixed" || inputClass === "emotion")
    ? stripEmoji(processedMessage) : processedMessage;

  const isPassThrough = inputClass === "valid_answer" || inputClass === "emoji_mixed" || inputClass === "emotion";

  if (!isPassThrough) {
    const guardReply = getGuardReply(inputClass, lang);
    let reply = guardReply;

    if (inputClass === "off_topic") {
      const dim = getDimension(session.currentDimension);
      reply = `${guardReply} ${dim.starterQuestions[lang][0]!}`;
    } else if (inputClass === "refusal") {
      session.history.push({ role: "user", content: processedMessage, timestamp: Date.now() });
      session.history.push({ role: "assistant", content: guardReply, timestamp: Date.now() });
      const advanced = advanceDimension(session);
      let finalReply = guardReply;
      if (advanced && !session.finished) {
        const nextDim = getDimension(session.currentDimension);
        const nextQ = nextDim.starterQuestions[lang][0]!;
        finalReply = `${guardReply} ${nextQ}`;
        session.history[session.history.length - 1] = { role: "assistant", content: finalReply, timestamp: Date.now() };
      }
      saveSession(session);
      return { reply: finalReply, dimension: session.currentDimension, finished: session.finished, guardHit: true };
    } else if (inputClass === "confusion") {
      const dim = getDimension(session.currentDimension);
      const probes = dim.probeQuestions[lang];
      const usedAssistant = session.history
        .filter((m) => m.role === "assistant")
        .map((m) => m.content.toLowerCase());
      const freshProbe = probes.find(
        (p) => !usedAssistant.some((used) => used.includes(p.toLowerCase().slice(0, 15)))
      ) ?? probes[session.coverage[session.currentDimension].turnCount % probes.length] ?? probes[0]!;
      reply = freshProbe;
    } else if (inputClass === "too_long") {
      session.coverage[session.currentDimension].turnCount++;
      session.turnCount++;
      updateDimensionMetrics(session);
      session.history.push({ role: "user", content: processedMessage.slice(0, 200) + "...", timestamp: Date.now() });
      session.history.push({ role: "assistant", content: guardReply, timestamp: Date.now() });
      saveSession(session);
      return { reply: guardReply, dimension: session.currentDimension, finished: session.finished, guardHit: true };
    } else if (inputClass === "gibberish" || inputClass === "too_short") {
      const dim = getDimension(session.currentDimension);
      const idx = session.coverage[session.currentDimension].turnCount % dim.starterQuestions[lang].length;
      reply = `${guardReply} ${dim.starterQuestions[lang][idx] ?? dim.starterQuestions[lang][0]!}`;
    }

    session.history.push({ role: "user", content: message, timestamp: Date.now() });
    session.history.push({ role: "assistant", content: reply, timestamp: Date.now() });
    saveSession(session);
    return { reply, dimension: session.currentDimension, finished: session.finished, guardHit: true };
  }

  const signals = extractSignals(cleanMessage, session.currentDimension);
  const sentiment = detectSentiment(cleanMessage);
  session.coverage[session.currentDimension].signals.push(...signals);
  session.coverage[session.currentDimension].turnCount++;
  session.turnCount++;
  logEvent(session.token, `sentiment_${sentiment}`, undefined, session.currentDimension);
  updateDimensionMetrics(session);
  session.history.push({ role: "user", content: cleanMessage, timestamp: Date.now() });

  if (inputClass === "emotion") {
    const ack = getGuardReply("emotion", lang);
    session.history.push({ role: "assistant", content: ack, timestamp: Date.now() });
  }

  if (shouldAdvance(session)) {
    const prevDim = session.currentDimension;
    const hasNext = advanceDimension(session);
    logEvent(session.token, "dimension_completed", prevDim, prevDim as any);
    if (!hasNext) {
      const closing = getClosingMessage(lang);
      session.history.push({ role: "assistant", content: closing, timestamp: Date.now() });
      saveSession(session);
      logEvent(session.token, "interview_completed", `turns=${session.turnCount}`);
      return { reply: closing, dimension: null, finished: true, guardHit: false };
    }
    logEvent(session.token, "dimension_started", session.currentDimension, session.currentDimension);
  }

  
  const isFirstTurnOfDimension = session.coverage[session.currentDimension].turnCount === 1;
  if (isFirstTurnOfDimension) {
    const dim = getDimension(session.currentDimension);
    const starters = dim.starterQuestions[lang];
    const freshStarter = pickFresh(starters, session.history, session.askedQuestionFps)
      ?? getFallback(lang, session.currentDimension, session.history);
    const finalStarter = safeAddBotQuestion(session, freshStarter, lang);
    saveSession(session);
    logEvent(session.token, "question_generated", finalStarter.slice(0, 80), session.currentDimension);
    session.questionCount++;
    return { reply: finalStarter, dimension: session.currentDimension, finished: false, guardHit: true };
  }

  return { reply: "", dimension: session.currentDimension, finished: false, guardHit: false };
}

function safeAddBotQuestion(
  session: InterviewSession,
  question: string,
  lang: Language
): string {
  if (isQuestionAlreadyAsked(session, question)) {
    const dim = getDimension(session.currentDimension);
    const fresh = pickFresh([...dim.probeQuestions[lang], ...dim.starterQuestions[lang]], session.history, session.askedQuestionFps)
      ?? getFallback(lang, session.currentDimension, session.history);
    const finalQ = fresh ?? question;
    registerQuestion(session, finalQ);
    session.history.push({ role: "assistant", content: finalQ, timestamp: Date.now() });
    return finalQ;
  }
  registerQuestion(session, question);
  session.history.push({ role: "assistant", content: question, timestamp: Date.now() });
  return question;
}
function pickFresh(
  candidates: string[],
  history: { role: string; content: string }[],
  askedFps?: string[]
): string | undefined {
  const usedFps = new Set([
    ...history.filter((m) => m.role === "assistant").map((m) => fp6(m.content)),
    ...(askedFps ?? []),
  ]);
  const usedKeywords = new Set(
    history
      .filter((m) => m.role === "assistant")
      .flatMap((m) =>
        m.content.toLowerCase()
          .replace(/[^a-zа-яёçğışöü\s]/gi, "")
          .split(" ")
          .filter((w) => w.length > 5)
      )
  );
  
  const filtered = candidates.filter((q) => {
    if (usedFps.has(fp6(q))) return false;
    
    const qWords = q.toLowerCase()
      .replace(/[^a-zа-яёçğışöü\s]/gi, "")
      .split(" ")
      .filter((w) => w.length > 4);
    const overlap = qWords.filter(w => usedKeywords.has(w)).length;

    return overlap < 2;
  });

  if (filtered.length === 0) return undefined;

  return filtered[Math.floor(Math.random() * filtered.length)]!;
}

function fp6(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-zа-яёçğışöü\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 10)
    .join(" ");
}

router.post("/public-session", (req: Request, res: Response) => {
  const { projectId } = req.body as { projectId?: string };
  if (!projectId) return res.status(400).json({ error: "projectId is required" });
  const project = getProject(projectId);
  if (!project) return res.status(404).json({ error: "Project not found" });
  const session = createSession(projectId, project.demographicsEnabled);
  logEvent(session.token, "session_created", projectId);
  return res.status(201).json({ token: session.token });
});

router.get("/:token", (req: Request, res: Response) => {
  const session = getSession(String(req.params["token"]));
  if (!session) return res.status(404).json({ error: "Session not found" });
  return res.json(getSessionSummary(session));
});

router.post("/:token/language", async (req: Request, res: Response) => {
  const session = getSession(String(req.params["token"]));
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (session.started) return res.status(409).json({ error: "Language already locked." });

  const { language } = req.body as { language?: string };
  if (!language || !["ru", "en", "tr"].includes(language))
    return res.status(400).json({ error: "language must be one of: ru, en, tr" });

  const project = getProject(session.projectId);
  if (project && !project.allowedLanguages.includes(language as Language))
    return res.status(400).json({ error: `Language '${language}' is not allowed for this project.` });

  session.language = language as Language;
  session.state = "LANGUAGE_SELECTED";
  logEvent(session.token, "language_selected", language);

  if (!session.demographicsEnabled) {
    session.started = true;
    session.state = "INTERVIEW";
    const intro = await getIntroMessage(session);
    session.history.push({ role: "assistant", content: intro, timestamp: Date.now() });
    saveSession(session);
    logEvent(session.token, "interview_started", session.projectId);
    logEvent(session.token, "dimension_started", session.currentDimension, session.currentDimension);
    return res.json({ message: "Language set. Interview started.", intro });
  }

  saveSession(session);
  return res.json({ message: "Language set. Please submit demographics." });
});

router.post("/:token/demographics", async (req: Request, res: Response) => {
  const session = getSession(String(req.params["token"]));
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (!session.demographicsEnabled) return res.status(400).json({ error: "Demographics not enabled." });
  if (session.demographicsSubmitted) return res.status(409).json({ error: "Demographics already submitted." });
  if (!session.language) return res.status(400).json({ error: "Set language before submitting demographics." });

  const body = req.body as Record<string, string | undefined>;
  const { fullName, department, position, ...rest } = body;
  session.demographics = {
    ...(fullName !== undefined && { fullName }),
    ...(department !== undefined && { department }),
    ...(position !== undefined && { position }),
    ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)),
  };
  session.demographicsSubmitted = true;
  session.started = true;
  session.state = "INTERVIEW";
  logEvent(session.token, "demographics_submitted");

  const intro = await getIntroMessage(session);
  session.history.push({ role: "assistant", content: intro, timestamp: Date.now() });
  saveSession(session);
  logEvent(session.token, "interview_started", session.projectId);
  logEvent(session.token, "dimension_started", session.currentDimension, session.currentDimension);
  return res.json({ message: "Demographics saved. Interview started.", intro });
});

router.post("/:token/message", async (req: Request, res: Response) => {
  const session = getSession(String(req.params["token"]));
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (!session.started) return res.status(400).json({ error: "Interview not started yet." });
  if (session.finished) return res.status(400).json({ error: "Interview already finished." });

  const { message } = req.body as { message?: string };
  if (!message || typeof message !== "string") return res.status(400).json({ error: "message is required" });

  const lang = session.language!;
  const result = await processMessage(session, message);

  if (result.guardHit || result.finished) {
    return res.json({ reply: result.reply, dimension: result.dimension, finished: result.finished });
  }

  try {
    let reply = await getLLMReply(session);
    
    if (!reply || isReplyDuplicate(reply, session.history) || isDuplicateQuestion(reply, session.history) || isQuestionAlreadyAsked(session, reply)) {
      logEvent(session.token, "fallback_used", "duplicate_blocked", session.currentDimension);
      const dim = getDimension(session.currentDimension);
      reply = pickFresh(dim.probeQuestions[lang], session.history, session.askedQuestionFps)
        ?? getFallback(lang, session.currentDimension, session.history)
        ?? dim.probeQuestions[lang][0]!;
    }
    
    const previousReplies = session.history.filter((m) => m.role === "assistant").map((m) => m.content);
    const { reply: validated, violations } = validateReply(reply, lang, previousReplies);
    if (violations.length > 0) logEvent(session.token, "reply_violations", violations.join(","), session.currentDimension);
    
    if (isReplyDuplicate(validated, session.history) || isQuestionAlreadyAsked(session, validated)) {
      logEvent(session.token, "fallback_used", "duplicate_after_validation", session.currentDimension);
      const dim = getDimension(session.currentDimension);
      const finalReply = pickFresh(dim.probeQuestions[lang], session.history, session.askedQuestionFps)
        ?? getFallback(lang, session.currentDimension, session.history)
        ?? dim.probeQuestions[lang][0]!;
      registerQuestion(session, finalReply);
      session.history.push({ role: "assistant", content: finalReply, timestamp: Date.now() });
      saveSession(session);
      logEvent(session.token, "question_generated", finalReply.slice(0, 80), session.currentDimension);
      session.questionCount++;
      return res.json({ reply: finalReply, dimension: session.currentDimension, finished: session.finished });
    }
    
    registerQuestion(session, validated);
    session.history.push({ role: "assistant", content: validated, timestamp: Date.now() });
    saveSession(session);
    logEvent(session.token, "question_generated", validated.slice(0, 80), session.currentDimension);
    session.questionCount++;
    return res.json({ reply: validated, dimension: session.currentDimension, finished: session.finished });
  } catch (err: any) {
    console.error("[LLM ERROR]", err?.message);
    logEvent(session.token, "llm_error", err?.message);
    const fallback = getFallback(lang, session.currentDimension, session.history);
    logEvent(session.token, "fallback_used", "llm_error", session.currentDimension);
    session.history.push({ role: "assistant", content: fallback, timestamp: Date.now() });
    saveSession(session);
    return res.status(500).json({ reply: fallback, error: "LLM unavailable", finished: false });
  }
});

router.post("/:token/message/stream", async (req: Request, res: Response) => {
  const session = getSession(String(req.params["token"]));
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (!session.started || session.finished) return res.status(400).json({ error: "Interview not active." });

  const { message } = req.body as { message?: string };
  if (!message || typeof message !== "string") return res.status(400).json({ error: "message is required" });

  const lang = session.language!;
  const result = await processMessage(session, message);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  if (result.guardHit || result.finished) {
    res.write(`data: ${JSON.stringify({ chunk: result.reply, done: false })}\n\n`);
    res.write(`data: ${JSON.stringify({ chunk: "", done: true, dimension: result.dimension, finished: result.finished })}\n\n`);
    res.end();
    return;
  }

  try {
    let full = "";
    await streamLLMReply(session, (chunk) => { full += chunk; });

    const historyQuestions = session.history
      .filter((m) => m.role === "assistant")
      .map((m) => m.content.trim());

    const fullTrimmed = full.trim();
    const isExactDuplicate = historyQuestions.some((q) => q === fullTrimmed);
    const isFingerprintDuplicate = historyQuestions.some((q) => fp6(q) === fp6(fullTrimmed));
    const isSubstringDuplicate = historyQuestions.some((q) =>
      q.toLowerCase().includes(fullTrimmed.toLowerCase().slice(0, 30)) ||
      fullTrimmed.toLowerCase().includes(q.toLowerCase().slice(0, 30))
    );

    let finalReply = full;
    if (!full || isExactDuplicate || isFingerprintDuplicate || isSubstringDuplicate
        || isQuestionAlreadyAsked(session, full)) {
      logEvent(session.token, "fallback_used", "duplicate_blocked", session.currentDimension);
      const dim = getDimension(session.currentDimension);
      const allCandidates = [
        ...dim.probeQuestions[lang],
        ...dim.starterQuestions[lang],
      ];
      finalReply = pickFresh(allCandidates, session.history, session.askedQuestionFps)
        ?? pickFresh(Object.values(dim.probeQuestions).flat(), session.history, session.askedQuestionFps)
        ?? `${dim.probeQuestions[lang][0]!}`;
    } else {
      const previousReplies = session.history.filter((m) => m.role === "assistant").map((m) => m.content);
      const { reply: v, violations } = validateReply(full, lang, previousReplies);
      if (violations.length > 0) logEvent(session.token, "reply_violations", violations.join(","), session.currentDimension);
      finalReply = v;
      if (isQuestionAlreadyAsked(session, finalReply)) {
        const dim = getDimension(session.currentDimension);
        finalReply = pickFresh([...dim.probeQuestions[lang], ...dim.starterQuestions[lang]], session.history, session.askedQuestionFps)
          ?? dim.probeQuestions[lang][0]!;
      }
    }

    res.write(`data: ${JSON.stringify({ chunk: finalReply, done: false })}\n\n`);
    registerQuestion(session, finalReply);
    session.history.push({ role: "assistant", content: finalReply, timestamp: Date.now() });
    saveSession(session);
    logEvent(session.token, "question_generated", finalReply.slice(0, 80), session.currentDimension);
    session.questionCount++;
    res.write(`data: ${JSON.stringify({ chunk: "", done: true, dimension: session.currentDimension, finished: session.finished })}\n\n`);
    res.end();
  } catch (err: any) {
    const fallback = getFallback(lang, session.currentDimension, session.history);
    logEvent(session.token, "fallback_used", "llm_error", session.currentDimension);
    logEvent(session.token, "llm_error", String(err?.message ?? "unknown"));
    res.write(`data: ${JSON.stringify({ chunk: fallback, done: true, error: true })}\n\n`);
    res.end();
  }
});

router.get("/:token/report", (req: Request, res: Response) => {
  const session = getSession(String(req.params["token"]));
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (!session.finished) return res.status(400).json({ error: "Interview not completed yet" });

  const lang = session.language as Language;
  const report = generateReport(session, lang);
  return res.json(report);
});

async function getIntroMessage(session: InterviewSession): Promise<string> {
  const lang = session.language as Language;
  const intros: Record<Language, string> = {
    en: "Hey — thanks for taking the time. This is a short anonymous conversation about your work experience. No right or wrong answers, just your honest take. Ready to start?",
    ru: "Привет — спасибо, что нашёл время. Это короткий анонимный разговор о твоём рабочем опыте. Нет правильных или неправильных ответов — только твой честный взгляд. Готов начать?",
    tr: "Merhaba — zaman ayırdığın için teşekkürler. Bu, iş deneyimin hakkında kısa ve anonim bir konuşma. Doğru ya da yanlış cevap yok — sadece dürüst görüşün. Başlamaya hazır mısın?",
  };
  return intros[lang];
}

function getClosingMessage(lang: Language): string {
  const msgs: Record<Language, string> = {
    en: "That's everything — thanks for sharing. Your responses have been recorded.",
    ru: "Это всё — спасибо, что поделился. Твои ответы записаны.",
    tr: "Hepsi bu kadar — paylaştığın için teşekkürler. Yanıtların kaydedildi.",
  };
  return msgs[lang];
}

function getFallback(lang: Language, dim?: string, history?: { role: string; content: string }[]): string {
  const dimPools: Record<string, Record<Language, string[]>> = {
    D1: {
      en: [
        "What measurable impact did that achievement have on your team or project?",
        "What would your team or project have missed without your specific contribution?",
        "How did you approach this differently than others might have?",
        "What was the most challenging part of making this happen?",
      ],
      ru: [
        "Kakoy izmerimyy effekt eto dostizheniye okazalo na tvoyu komandu ili proyekt?",
        "Chto tvoya komanda ili proyekt poteryali by bez tvoego vklada?",
        "Kak ty podoshel k etomu inache, chem mogли by drugiye?",
        "Kakaya byla samaya slozhna chast' v tom, chtoby eto sdelat'?",
      ],
      tr: [
        "Bu başarının ekibine veya projeye ölçülebilir etkisi ne oldu?",
        "Ekibiniz veya projeniz senin katkın olmadan neyi kaybederdi?",
        "Bunu başkaları nasıl yaklaşabilirdi, sen nasıl yaklaştın?",
        "Bunu gerçekleştirmenin en zor kısmı neydi?",
      ],
    },
    D2: {
      en: [
        "How long has your sense of job stability been affected by this situation?",
        "What specific event at work first made you question your stability or value here?",
        "What would make you feel more secure in your position?",
        "How has this affected your confidence in your role?",
      ],
      ru: [
        "Kak davno tvoyё oshchushcheniye stabilnosti raboty zatronutо etim?",
        "Kakaya konkretna situatsiya na rabote zastavila tebya chuvstvovat sebya nedootsenённym?",
        "Chto sdelalo by tebya bolee uverennym v svoey pozitsii?",
        "Kak eto povliyalo na tvoyu uverennost' v svoey roli?",
      ],
      tr: [
        "İş istikrarı hissiniz ne zamandır bundan etkileniyor?",
        "İşte sizi değersiz hissettiren belirli bir durum neydi?",
        "Pozisyonunuzda daha güvende hissetmek için ne gerekir?",
        "Bu, rolünüzdeki güveninizi nasıl etkiledi?",
      ],
    },
    D3: {
      en: [
        "What specific action did you or the other person take that changed the dynamic?",
        "How did that conflict or collaboration affect your day-to-day work output?",
        "What made this relationship different from others at work?",
        "How has this relationship evolved over time?",
      ],
      ru: [
        "Kakoye konkretnoye deystviye predprinyal ty ili drugoy chelovek, chto izmenilo dinamiku?",
        "Kak tot konflikt ili sotrudnichestvo povliyali na tvoy yezhednevnyy rabochiy rezul'tat?",
        "Chto sdelalo etu otnosheniya drugoy, chem drugiye na rabote?",
        "Kak eta otnosheniya evolyutsionirovali so vremenem?",
      ],
      tr: [
        "Dinamiği değiştiren somut bir eylem neydi — sizin mi yoksa karşı tarafın mı?",
        "O çatışma veya iş birliği günlük iş çıktınızı nasıl etkiledi?",
        "Bu ilişkiyi işte diğerlerinden farklı yapan neydi?",
        "Bu ilişki zaman içinde nasıl gelişti?",
      ],
    },
    D4: {
      en: [
        "What happened when you pushed back or proposed a different approach?",
        "How did the lack of control over that task affect the final outcome?",
        "When did you last feel you had real ownership over a decision?",
        "What would change if you had more say in how you work?",
      ],
      ru: [
        "Chto proishodilo, kogda ty vozrazhal ili predlagal drugoy podhod?",
        "Kak otsutstviye kontrolya nad etim zadaniyem povliyalo na konechnyy rezul'tat?",
        "Kogda ty posledny raz chuvstvoval, chto u tebya byla real'naya vlast' nad resheniyem?",
        "Chto izmenilos' by, esli by u tebya bylo bol'she slova v tom, kak ty rabotaesh'?",
      ],
      tr: [
        "Karşı çıktığınızda veya farklı bir yaklaşım önerdiğinizde ne oldu?",
        "O görev üzerindeki kontrol eksikliği nihai sonucu nasıl etkiledi?",
        "En son ne zaman bir karar üzerinde gerçek sahiplik hissettiniz?",
        "Nasıl çalıştığınız konusunda daha fazla söz hakkınız olsaydı ne değişirdi?",
      ],
    },
    D5: {
      en: [
        "What specific task or project at work drains your energy most consistently?",
        "How has that energy drain affected your output or quality of work?",
        "What part of your work genuinely excites you?",
        "How often do you experience that energizing feeling?",
      ],
      ru: [
        "Kakoye konkretnoye zadaniye ili proyekt na rabote naibolee posledovatel'no istoshchayet tvoyu energiyu?",
        "Kak eto istoshcheniye energii povliyalo na tvoy rezul'tat ili kachestvo raboty?",
        "Kakaya chast' tvoyey raboty po-nastoyashchemu vozbuzhda'et tebya?",
        "Kak chasto ty ispytyvayesh' eto oshchushcheniye energii?",
      ],
      tr: [
        "İşte enerjinizi en tutarlı şekilde tüketen belirli bir görev veya proje nedir?",
        "Bu enerji tükenmesi çıktınızı veya iş kalitenizi nasıl etkiledi?",
        "İşinizin hangi kısmı sizi gerçekten heyecanlandırıyor?",
        "Bu enerji verici hissi ne sıklıkla yaşıyorsunuz?",
      ],
    },
    D6: {
      en: [
        "What specific feedback at work actually changed how you approached your tasks?",
        "What type of recognition from your manager or team matters most to your work?",
        "When did you last feel truly seen for your contributions?",
        "What would meaningful recognition look like to you?",
      ],
      ru: [
        "Kakoy konkretnyy otzyv na rabote real'no izmenil tvoy podhod k zadaniyam?",
        "Kakoy vid priznaniya so storony rukovoditelya ili komandy naibolee vazhen dlya tvoyey raboty?",
        "Kogda ty posledny raz chuvstvoval sebya po-nastoyashchemu vidennym za svoy vklad?",
        "Kak vyglyadelo by dlya tebya znachimoe priznanie?",
      ],
      tr: [
        "İşteki hangi spesifik geri bildirim görevlerinize yaklaşımınızı gerçekten değiştirdi?",
        "Yöneticinizden veya ekibinizden hangi tür tanınma işiniz için en önemli?",
        "En son ne zaman katkılarınız için gerçekten görülmüş hissettiniz?",
        "Sizin için anlamlı tanınma nasıl görünürdü?",
      ],
    },
    D7: {
      en: [
        "What specific skill have you developed at work in the last few months — how did you apply it?",
        "How has your skill level in your current role changed since you started?",
        "What's something you wish you had more opportunity to learn?",
        "How do you typically approach learning new things at work?",
      ],
      ru: [
        "Kakoy konkretnyy navyk ty razvil na rabote za posledniye neskol'ko mesyatsev — kak ty yego primenyaesh?",
        "Kak tvoy uroven' navykov v tekushchey roli izmenilsya s teh por, kak ty nachal?",
        "Chto ty khotel by imet' bol'she vozmozhnosti uchit'sya?",
        "Kak ty obychno podkhod'ish' k izucheniyu novykh veshchey na rabote?",
      ],
      tr: [
        "Son birkaç ayda işte geliştirdiğiniz belirli bir beceri nedir — nasıl uyguladınız?",
        "Mevcut rolünüzdeki beceri düzeyiniz başladığınızdan beri nasıl değişti?",
        "Öğrenme fırsatı daha fazla olmasını istediğiniz bir şey var mı?",
        "Genellikle işte yeni şeyler öğrenmeye nasıl yaklaşıyorsunuz?",
      ],
    },
    D8: {
      en: [
        "What work have you done here that felt pointless — what made it feel that way?",
        "How has your sense of purpose in this role changed since you started?",
      ],
      ru: [
        "Kakuyu rabotu ty zdes' delal, kotoraya kazalas' bessmyslennoy — chto zastavilo yeyo tak kazat'sya?",
        "Kak tvoyё oshchushcheniye smysla v etoy roli izmenilos' s teh por, kak ty nachal?",
      ],
      tr: [
        "Burada anlamsız hissettiren hangi işi yaptınız — onu böyle hissettiren neydi?",
        "Bu roldeki amaç duygunuz başladığınızdan beri nasıl değişti?",
      ],
    },
    D9: {
      en: [
        "How has that obstacle affected the quality or timeline of your work output?",
      ],
      ru: [
        "Kak eto prepyatstviye povliyalo na kachestvo ili sroki tvoyego rabochego rezul'tata?",
      ],
      tr: [
        "Bu engel iş çıktınızın kalitesini veya zamanlamasını nasıl etkiledi?",
      ],
    },
    D10: {
      en: [
        "What specific outcome resulted from raising — or not raising — that concern at work?",
        "What would need to change at work for you to feel safe speaking up?",
      ],
      ru: [
        "Kakoy konkretnyy rezul'tat posledoval iz-za togo, chto ty podnyal — ili ne podnyal — etu problemu na rabote?",
        "Chto dolzhno bylo by izmenit'sya na rabote, chtoby ty chuvstvoval sebya v bezopasnosti, vyskazyvayas'?",
      ],
      tr: [
        "O endişeyi işte dile getirmekten — veya getirmemekten — ne gibi somut bir sonuç doğdu?",
        "Sesini yükseltmekte güvende hissetmek için işte ne değişmesi gerekirdi?",
      ],
    },
  };

  const pool = (dim && dimPools[dim]) ? dimPools[dim][lang] : [];

  if (pool.length === 0) {
    return lang === "ru" ? "Mozhesh li rasskazat' mne bol'she?" : lang === "tr" ? "Bana daha fazla anlatabilir misin?" : "Can you elaborate on that?";
  }

  const used = new Set(
    (history ?? [])
      .filter(m => m.role === "assistant")
      .map(m => fp6(m.content))
  );

  const fresh = pool.filter((q: string) => !used.has(fp6(q)));

  const source = fresh.length > 0 ? fresh : pool;

  return source[Math.floor(Math.random() * source.length)]!;
}

interface DimensionReport {
  key: DimensionKey;
  name: string;
  focus: string;
  turnCount: number;
  coverageScore: number;
  depthLevel: number;
  signals: string[];
  status: "deep" | "moderate" | "light" | "skipped";
}

interface InterviewReport {
  token: string;
  projectId: string;
  language: Language;
  demographics: Record<string, any> | null;
  completedAt: number;
  totalTurns: number;
  totalQuestions: number;
  dimensions: DimensionReport[];
  summary: {
    overallCoverage: number;
    strongDimensions: string[];
    weakDimensions: string[];
    keyThemes: string[];
  };
}

function generateReport(session: InterviewSession, lang: Language): InterviewReport {
  const dimensions: DimensionReport[] = [];
  let totalCoverage = 0;
  let coveredCount = 0;

  for (const key of DIMENSION_ORDER) {
    const dim = getDimension(key);
    const cov = session.coverage[key as DimensionKey];

    let status: "deep" | "moderate" | "light" | "skipped" = "skipped";
    if (cov.depthLevel === 3) status = "deep";
    else if (cov.depthLevel === 2) status = "moderate";
    else if (cov.turnCount > 0) status = "light";

    if (cov.covered) {
      totalCoverage += cov.coverageScore;
      coveredCount++;
    }

    dimensions.push({
      key,
      name: dim.name[lang],
      focus: dim.focus[lang],
      turnCount: cov.turnCount,
      coverageScore: cov.coverageScore,
      depthLevel: cov.depthLevel,
      signals: cov.signals,
      status,
    });
  }

  const overallCoverage = coveredCount > 0 ? totalCoverage / coveredCount : 0;
  const strongDimensions = dimensions
    .filter((d) => d.status === "deep")
    .map((d) => d.name);
  const weakDimensions = dimensions
    .filter((d) => d.status === "skipped" || d.status === "light")
    .map((d) => d.name);

  const allSignals = dimensions.flatMap((d) => d.signals);
  const keyThemes = extractKeyThemes(allSignals, lang);

  return {
    token: session.token,
    projectId: session.projectId,
    language: lang,
    demographics: session.demographics,
    completedAt: Date.now(),
    totalTurns: session.turnCount,
    totalQuestions: session.questionCount,
    dimensions,
    summary: {
      overallCoverage: Math.round(overallCoverage * 100) / 100,
      strongDimensions,
      weakDimensions,
      keyThemes,
    },
  };
}

function extractKeyThemes(signals: string[], lang: Language): string[] {
  const themes: Record<string, number> = {};

  for (const signal of signals) {
    const normalized = signal.toLowerCase().trim();
    themes[normalized] = (themes[normalized] || 0) + 1;
  }

  const sorted = Object.entries(themes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme);

  return sorted;
}

export default router;

