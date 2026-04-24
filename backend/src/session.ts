import { v4 as uuidv4 } from "uuid";
import {
  InterviewSession,
  InterviewState,
  Language,
  DimensionKey,
  Demographics,
  InterviewEvent,
} from "./types";
import { DIMENSION_ORDER, getDimension } from "./dimensions";

const sessions = new Map<string, InterviewSession>();
const events: InterviewEvent[] = [];

function initCoverage(): InterviewSession["coverage"] {
  const coverage = {} as InterviewSession["coverage"];
  for (const key of DIMENSION_ORDER) {
    coverage[key] = { key, covered: false, turnCount: 0, signals: [], depthLevel: 1, coverageScore: 0 };
  }
  return coverage;
}

export function computeDimensionMetrics(
  turnCount: number,
  minTurns: number,
  maxTurns: number,
  signalCount: number
): { depthLevel: number; coverageScore: number } {
  const ratio = turnCount / Math.max(maxTurns, 1);
  const depthLevel = turnCount < minTurns ? 1 : ratio < 0.66 ? 2 : 3;
  const coverageScore = Math.min(signalCount / 5, 1);
  return { depthLevel, coverageScore };
}

export function createSession(
  projectId: string,
  demographicsEnabled: boolean
): InterviewSession {
  const token = uuidv4();
  const state: InterviewState = demographicsEnabled ? "INIT" : "INIT";
  const session: InterviewSession = {
    token,
    projectId,
    language: null,
    demographicsEnabled,
    demographics: null,
    demographicsSubmitted: false,
    started: false,
    finished: false,
    state,
    currentDimension: "D1",
    dimensionIndex: 0,
    coverage: initCoverage(),
    history: [],
    turnCount: 0,
    questionCount: 0,
    askedQuestionFps: [],
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  };
  sessions.set(token, session);
  return session;
}

export function getSession(token: string): InterviewSession | undefined {
  return sessions.get(token);
}

export function saveSession(session: InterviewSession): void {
  session.lastActivityAt = Date.now();
  sessions.set(session.token, session);
}

export function logEvent(
  token: string,
  event: string,
  detail?: string,
  dimension?: DimensionKey
): void {
  const entry: InterviewEvent = { token, event, timestamp: Date.now() };
  if (dimension !== undefined) entry.dimension = dimension;
  if (detail !== undefined) entry.detail = detail;
  events.push(entry);
}

export function advanceDimension(session: InterviewSession): boolean {
  const nextIndex = session.dimensionIndex + 1;

  const dim = getDimension(session.currentDimension);
  const cov = session.coverage[session.currentDimension];
  const { depthLevel, coverageScore } = computeDimensionMetrics(cov.turnCount, dim.minTurns, dim.maxTurns, cov.signals.length);
  cov.depthLevel = depthLevel;
  cov.coverageScore = coverageScore;
  cov.covered = true;

  if (nextIndex >= DIMENSION_ORDER.length) {
    session.finished = true;
    session.state = "COMPLETE";
    return false;
  }

  session.dimensionIndex = nextIndex;
  session.currentDimension = DIMENSION_ORDER[nextIndex]!;
  return true;
}


export function shouldAdvance(session: InterviewSession): boolean {
  const dim = getDimension(session.currentDimension);
  const cov = session.coverage[session.currentDimension];

  if (cov.turnCount >= dim.maxTurns) return true;

  if (cov.turnCount >= dim.minTurns && cov.coverageScore >= dim.coverageThreshold) return true;

  if (cov.turnCount >= dim.minTurns) {
    const recentUserMessages = session.history
      .filter((m) => m.role === "user")
      .slice(-2);
    const allTooShort = recentUserMessages.length >= 2 &&
      recentUserMessages.every((m) => m.content.trim().split(/\s+/).length <= 2);
    if (allTooShort) return true;
  }

  return false;
}

export function updateDimensionMetrics(session: InterviewSession): void {
  const dim = getDimension(session.currentDimension);
  const cov = session.coverage[session.currentDimension];
  const { depthLevel, coverageScore } = computeDimensionMetrics(cov.turnCount, dim.minTurns, dim.maxTurns, cov.signals.length);
  cov.depthLevel = depthLevel;
  cov.coverageScore = coverageScore;
}

export function getSessionSummary(session: InterviewSession) {
  return {
    token: session.token,
    projectId: session.projectId,
    language: session.language,
    finished: session.finished,
    state: session.state,
    currentDimension: session.finished ? null : session.currentDimension,
    turnCount: session.turnCount,
    questionCount: session.questionCount,
    coverage: session.coverage,
    demographics: session.demographics,
    createdAt: session.createdAt,
    lastActivityAt: session.lastActivityAt,
  };
}

export function getAllSessionsByProject(projectId: string): InterviewSession[] {
  return Array.from(sessions.values()).filter((s) => s.projectId === projectId);
}

export function getEvents(): InterviewEvent[] {
  return events;
}

export function getEventsByProject(projectId: string): InterviewEvent[] {
  const tokens = new Set(
    Array.from(sessions.values())
      .filter((s) => s.projectId === projectId)
      .map((s) => s.token)
  );
  return events.filter((e) => tokens.has(e.token));
}

function questionFp(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zа-яёçğışöü\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 6)
    .join(" ");
}

export function isQuestionAlreadyAsked(session: InterviewSession, question: string): boolean {
  if (!session.askedQuestionFps) session.askedQuestionFps = [];
  const fp = questionFp(question);
  if (!fp || fp.length < 5) return false;
  if (session.askedQuestionFps.includes(fp)) return true;
  const normalized = question.toLowerCase().trim().replace(/\s+/g, " ");
  if (session.askedQuestionFps.includes(`full:${normalized}`)) return true;
  const prefix = normalized.slice(0, 30);
  if (session.history
    .filter((m) => m.role === "assistant")
    .some((m) => m.content.toLowerCase().trim().replace(/\s+/g, " ").slice(0, 30) === prefix)) return true;
  const words = question.toLowerCase()
    .replace(/[^a-zа-яёçğışöü\s]/gi, "")
    .split(" ")
    .filter((w) => w.length > 5);
  const coveredWords = words.filter((w) => session.askedQuestionFps.includes(`word:${w}`));
  return coveredWords.length >= 2;
}

export function registerQuestion(session: InterviewSession, question: string): void {
  if (!session.askedQuestionFps) session.askedQuestionFps = [];
  const fp = questionFp(question);
  if (fp && fp.length >= 5 && !session.askedQuestionFps.includes(fp)) {
    session.askedQuestionFps.push(fp);
  }
  const normalized = question.toLowerCase().trim().replace(/\s+/g, " ");
  const fullKey = `full:${normalized}`;
  if (!session.askedQuestionFps.includes(fullKey)) {
    session.askedQuestionFps.push(fullKey);
  }
  const words = question.toLowerCase()
    .replace(/[^a-zа-яёçğışöü\s]/gi, "")
    .split(" ")
    .filter((w) => w.length > 5);
  for (const w of words) {
    if (!session.askedQuestionFps.includes(`word:${w}`)) {
      session.askedQuestionFps.push(`word:${w}`);
    }
  }
}
