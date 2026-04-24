"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DimensionKey, Language, sendMessageStream, getSession } from "../lib/api";
import DimensionProgress from "./DimensionProgress";
import { VoiceButton } from "./VoiceButton";
import { VoiceButtonAdvanced } from "./VoiceButtonAdvanced";

interface Message {
  role: "assistant" | "user";
  content: string;
  streaming?: boolean;
  timestamp?: number;
  voiceFile?: {
    filePath: string;
    fileName: string;
  };
}

const MAX_CHARS = 1200;

const PLACEHOLDER: Record<Language, string> = {
  en: "Type your answer...",
  ru: "Napishite otvet...",
  tr: "Cevabinizi yazin...",
};

const FINISHED_MSG: Record<Language, string> = {
  en: "Interview complete. Thank you.",
  ru: "Intervyu zaversheno. Spasibo.",
  tr: "Gorusme tamamlandi. Tesekkurler.",
};

const HEADER_LABEL: Record<Language, { active: string; done: string }> = {
  en: { active: "Interview", done: "Completed" },
  ru: { active: "Intervyu", done: "Zaversheno" },
  tr: { active: "Gorusme", done: "Tamamlandi" },
};

interface Props {
  token: string;
  language: Language;
  intro: string;
  initialDimension: DimensionKey;
  initialCoverage: Record<DimensionKey, { covered: boolean; turnCount: number }>;
}

export default function InterviewChat({ token, language, intro, initialDimension, initialCoverage }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: intro }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [currentDim, setCurrentDim] = useState<DimensionKey | null>(initialDimension);
  const [coverage, setCoverage] = useState(initialCoverage);
  const [error, setError] = useState<string | null>(null);
  const [showMobileProgress, setShowMobileProgress] = useState(false);
  const [recordingTime, setRecordingTime] = useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (finished) {
      const timer = setTimeout(() => {
        router.push(`/report?token=${token}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [finished, token, router]);

  const adjustHeight = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  };

  const syncCoverage = useCallback(async () => {
    try {
      const state = await getSession(token);
      if (state.coverage) setCoverage(state.coverage as Record<DimensionKey, { covered: boolean; turnCount: number }>);
    } catch {}
  }, [token]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || finished) return;
    if (text.length > MAX_CHARS) return;

    const isVoiceFile = text.startsWith('/voice_files/');
    
    setMessages((p) => [...p, { 
      role: "user", 
      content: isVoiceFile ? "[Voice Message]" : text, 
      timestamp: Date.now(),
      voiceFile: isVoiceFile ? { filePath: text, fileName: text.split('/').pop() || '' } : undefined,
    }]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setError(null);
    setLoading(true);
    setMessages((p) => [...p, { role: "assistant", content: "", streaming: true, timestamp: Date.now() }]);

    try {
      const messageToSend = isVoiceFile ? `[Voice: ${text}]` : text;
      const result = await sendMessageStream(token, messageToSend, (chunk) => {
        setMessages((p) => {
          const last = p[p.length - 1];
          if (!last || last.role !== "assistant") return p;
          return [...p.slice(0, -1), { ...last, content: last.content + chunk }];
        });
      });

      setMessages((p) => {
        const last = p[p.length - 1];
        if (!last) return p;
        return [...p.slice(0, -1), { role: "assistant", content: last.content }];
      });

      if (result.dimension) setCurrentDim(result.dimension);
      if (result.finished) {
        setFinished(true);
        setCurrentDim(null);
        setCoverage((prev) => {
          const next = { ...prev };
          (Object.keys(next) as DimensionKey[]).forEach((k) => {
            next[k] = { ...next[k]!, covered: true };
          });
          return next;
        });
      } else {
        await syncCoverage();
      }
    } catch (e: any) {
      setMessages((p) => p.slice(0, -2));
      setInput(text);
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [input, loading, finished, token, syncCoverage]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const charsLeft = MAX_CHARS - input.length;
  const charsWarning = charsLeft < 100;
  const completedCount = Object.values(coverage).filter((c) => c.covered).length;
  const currentDimIndex = currentDim ? parseInt(currentDim.slice(1)) : 0;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex gap-4 w-full h-screen min-h-0">
      <aside className="hidden lg:flex flex-col w-52 shrink-0 bg-[#111] rounded-2xl p-4 border border-white/8">
        <p className="text-white/30 text-xs uppercase tracking-widest mb-3 px-1">Progress</p>
        <DimensionProgress current={currentDim} coverage={coverage} />
      </aside>

      <div className="flex flex-col flex-1 min-h-0 bg-[#111] rounded-2xl border border-white/8 overflow-hidden h-screen">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${finished ? "bg-white/30" : "bg-green-400"}`} />
            <span className="text-white/60 text-sm">
              {finished ? HEADER_LABEL[language].done : HEADER_LABEL[language].active}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {currentDim && !finished && (
              <span className="text-white/30 text-xs font-mono">{currentDim}</span>
            )}
            <button
              onClick={() => setShowMobileProgress((p) => !p)}
              className="lg:hidden flex items-center gap-1.5 text-white/40 hover:text-white/70 transition text-xs"
              aria-label="Toggle progress"
            >
              <span>{completedCount}/10</span>
            </button>
          </div>
        </div>

        {showMobileProgress && (
          <div className="lg:hidden border-b border-white/8 px-4 py-3 bg-[#0e0e0e]">
            <DimensionProgress current={currentDim} coverage={coverage} />
          </div>
        )}

        {!finished && (
          <div className="lg:hidden h-0.5 bg-white/5">
            <div className="h-full bg-white/20 transition-all duration-500" style={{ width: `${(currentDimIndex / 10) * 100}%` }} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto response-scroll px-5 py-4 flex flex-col gap-4 min-h-0">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-[#222] text-white rounded-br-sm" : "bg-white/5 text-white/85 rounded-bl-sm"}`}>
                {m.voiceFile ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 3a1 1 0 011 1v5h2V4a1 1 0 112 0v5a7 7 0 11-14 0V4a1 1 0 012 0v5V4a1 1 0 011-1h6z" />
                    </svg>
                    <audio 
                      controls 
                      className="h-6 flex-1"
                      src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}${m.voiceFile.filePath}`}
                    />
                  </div>
                ) : (
                  <>
                    {m.content}
                    {m.streaming && m.content === "" && (
                      <span className="inline-flex gap-1 items-center h-4">
                        {[0, 1, 2].map((j) => (
                          <span key={j} className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
                        ))}
                      </span>
                    )}
                    {m.streaming && m.content !== "" && (
                      <span className="inline-block w-0.5 h-3.5 bg-white/50 ml-0.5 animate-pulse align-middle" />
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {finished && (
            <div className="text-center text-white/30 text-xs py-2">{FINISHED_MSG[language]}</div>
          )}
          <div ref={bottomRef} />
        </div>

        {!finished && (
          <div className="shrink-0 border-t border-white/8 px-4 py-3">
            {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
            
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 flex items-center">
                <button
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 transition"
                  aria-label="Add"
                >
                  <span className="text-xl leading-none">+</span>
                </button>

                {/* Text Input */}
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); adjustHeight(); }}
                  onKeyDown={handleKey}
                  placeholder={PLACEHOLDER[language]}
                  disabled={loading}
                  maxLength={MAX_CHARS}
                  className="flex-1 bg-transparent text-white text-sm placeholder-white/40 outline-none resize-none ml-2"
                  style={{ minHeight: "24px", maxHeight: "100px" }}
                />
              </div>

              {recordingTime !== null && (
                <div className="text-blue-400 font-mono text-sm min-w-12 text-right">
                  {formatTime(recordingTime)}
                </div>
              )}

              <VoiceButtonAdvanced
                token={token}
                language={language}
                onRecordingTime={(time) => setRecordingTime(time)}
                onCancel={() => setRecordingTime(null)}
                onVoiceRecorded={async (audioBlob, duration) => {
                  setRecordingTime(null);
                  try {
                    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
                    const arrayBuffer = await audioBlob.arrayBuffer();

                    const sendResponse = await fetch(`${backendUrl}/survey/${token}/voice/send`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'audio/webm',
                      },
                      body: arrayBuffer,
                    });

                    if (!sendResponse.ok) {
                      const errorText = await sendResponse.text();
                      console.error('Voice send error response:', errorText);
                      throw new Error(`Voice send failed: ${sendResponse.status}`);
                    }

                    const result = await sendResponse.json();
                    
                    setMessages((p) => [...p, { 
                      role: "user", 
                      content: "[Voice Message]", 
                      timestamp: Date.now(),
                      voiceFile: { 
                        filePath: result.voiceFile.filePath, 
                        fileName: result.voiceFile.fileName 
                      },
                    }]);

                    setError(null);
                    setLoading(true);
                    setMessages((p) => [...p, { role: "assistant", content: "", streaming: true, timestamp: Date.now() }]);

                    const messageResult = await sendMessageStream(token, `[Voice: ${result.voiceFile.filePath}]`, (chunk) => {
                      setMessages((p) => {
                        const last = p[p.length - 1];
                        if (!last || last.role !== "assistant") return p;
                        return [...p.slice(0, -1), { ...last, content: last.content + chunk }];
                      });
                    });

                    setMessages((p) => {
                      const last = p[p.length - 1];
                      if (!last) return p;
                      return [...p.slice(0, -1), { role: "assistant", content: last.content }];
                    });

                    if (messageResult.dimension) setCurrentDim(messageResult.dimension);
                    if (messageResult.finished) {
                      setFinished(true);
                      setCurrentDim(null);
                      setCoverage((prev) => {
                        const next = { ...prev };
                        (Object.keys(next) as DimensionKey[]).forEach((k) => {
                          next[k] = { ...next[k]!, covered: true };
                        });
                        return next;
                      });
                    } else {
                      await syncCoverage();
                    }
                  } catch (e: any) {
                    setError(e?.message ?? "Something went wrong");
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={(error) => {
                  setRecordingTime(null);
                  setError(error);
                }}
                disabled={loading}
              />

              <button
                onClick={handleSend}
                disabled={loading || !input.trim() || input.length > MAX_CHARS}
                className="shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send"
                title="Send message"
              >
                {loading ? (
                  <span className="w-3 h-3 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16346272 C3.34915502,0.9 2.40734225,1.00636533 1.77946707,1.4776575 C0.994623095,2.10604706 0.837654326,3.0486314 1.15159189,3.99701575 L3.03521743,10.4380088 C3.03521743,10.5951061 3.19218622,10.7522035 3.50612381,10.7522035 L16.6915026,11.5376905 C16.6915026,11.5376905 17.1624089,11.5376905 17.1624089,12.0089827 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}