'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DimensionKey, Language, sendMessageStream, getSession } from '../lib/api';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  timestamp: number;
}

const PLACEHOLDER: Record<Language, string> = {
  en: 'Ask anything',
  ru: 'Спросите что угодно',
  tr: 'Herhangi bir şey sorun',
};

const DIMENSION_NAMES: Record<DimensionKey, Record<Language, string>> = {
  D1: { en: 'Success', ru: 'Успех', tr: 'Başarı' },
  D2: { en: 'Security', ru: 'Безопасность', tr: 'Güvenlik' },
  D3: { en: 'Relationships', ru: 'Отношения', tr: 'İlişkiler' },
  D4: { en: 'Autonomy', ru: 'Автономия', tr: 'Özerklik' },
  D5: { en: 'Engagement', ru: 'Вовлеченность', tr: 'Bağlılık' },
  D6: { en: 'Recognition', ru: 'Признание', tr: 'Tanınma' },
  D7: { en: 'Learning', ru: 'Обучение', tr: 'Öğrenme' },
  D8: { en: 'Purpose', ru: 'Смысл', tr: 'Amaç' },
  D9: { en: 'Obstacles', ru: 'Препятствия', tr: 'Engeller' },
  D10: { en: 'Voice', ru: 'Голос', tr: 'Ses' },
};

interface Props {
  token: string;
  language: Language;
  initialDimension: DimensionKey;
}

export default function FaceToFaceInterview({ token, language, initialDimension }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [currentDim, setCurrentDim] = useState<DimensionKey>(initialDimension);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [botSpeaking, setBotSpeaking] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Microphone error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const assessQuality = async (audioBlob: Blob): Promise<any> => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window as any).AudioContext();
      const audioData = await audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioData.getChannelData(0);

      let sum = 0;
      for (let i = 0; i < channelData.length; i++) {
        sum += channelData[i] * channelData[i];
      }
      const rms = Math.sqrt(sum / channelData.length);
      const volume = Math.min(1, rms * 10);

      return {
        noiseLevel: Math.max(0, 0.3 - volume),
        clarity: Math.min(1, volume * 2),
        volume,
        isAcceptable: volume > 0.1 && volume * 2 > 0.3,
      };
    } catch {
      return {
        noiseLevel: 0,
        clarity: 0.5,
        volume: 0.5,
        isAcceptable: true,
      };
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsSpeaking(true);
    try {
      const quality = await assessQuality(audioBlob);

      if (!quality.isAcceptable) {
        setIsSpeaking(false);
        return;
      }

      const transcribeResponse = await fetch(`/survey/${token}/voice/transcribe`, {
        method: 'POST',
        body: audioBlob,
      });

      if (!transcribeResponse.ok) {
        throw new Error('Transcription failed');
      }

      const result = await transcribeResponse.json();
      setTranscript(result.text);
      setInput(result.text);

      await sendMessage(result.text);
    } catch (err: any) {
      console.error('Transcription error:', err);
    } finally {
      setIsSpeaking(false);
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading || finished) return;

    setMessages((p) => [...p, { role: 'user', content: messageText, timestamp: Date.now() }]);
    setInput('');
    setLoading(true);
    setBotSpeaking(true);

    try {
      let botReply = '';
      await sendMessageStream(token, messageText, (chunk) => {
        botReply += chunk;
        setMessages((p) => {
          const last = p[p.length - 1];
          if (!last || last.role !== 'assistant') {
            return [...p, { role: 'assistant', content: chunk, timestamp: Date.now() }];
          }
          return [...p.slice(0, -1), { ...last, content: botReply }];
        });
      });

      const session = await getSession(token);
      if (session.currentDimension) setCurrentDim(session.currentDimension);
      if (session.finished) setFinished(true);

      await speakText(botReply);
    } catch (err: any) {
      console.error('Send error:', err);
    } finally {
      setLoading(false);
      setBotSpeaking(false);
    }
  };

  const speakText = async (text: string) => {
    try {
      const response = await fetch(`/survey/${token}/voice/speak/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          speed: 1.0,
          pitch: 1.0,
          voiceGender: 'neutral',
        }),
      });

      if (!response.ok) return;

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (err: any) {
      console.error('TTS error:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
          <div>
            <h1 className="text-white font-semibold">Interview</h1>
            <p className="text-white/50 text-sm">{DIMENSION_NAMES[currentDim][language]}</p>
          </div>
        </div>
        <button className="text-white/50 hover:text-white/70 transition">⋯</button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 overflow-y-auto">
        <div className="w-full max-w-2xl">
          {/* Avatars Section */}
          <div className="flex justify-between items-end mb-12">
            {/* Bot Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div
                className={`w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-5xl shadow-lg transition-transform ${
                  botSpeaking ? 'scale-110' : 'scale-100'
                }`}
              >
                🤖
              </div>
              <div className="text-center">
                <p className="text-white/70 text-sm">Bot</p>
                {botSpeaking && <p className="text-blue-400 text-xs animate-pulse">Speaking...</p>}
              </div>
            </div>

            {/* User Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div
                className={`w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-5xl shadow-lg transition-transform ${
                  isRecording ? 'scale-110 ring-4 ring-red-400' : 'scale-100'
                }`}
              >
                👤
              </div>
              <div className="text-center">
                <p className="text-white/70 text-sm">You</p>
                {isRecording && <p className="text-red-400 text-xs animate-pulse">Recording...</p>}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white/5 rounded-2xl p-6 mb-8 max-h-64 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-white/40 text-center py-8">Start speaking to begin the interview</p>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-purple-600/50 text-white rounded-br-none'
                          : 'bg-blue-600/50 text-white rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Section */}
          <div className="flex gap-3">
            {/* Voice Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={loading || isSpeaking}
              className={`flex-1 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50`}
            >
              {isRecording ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Stop Recording
                </>
              ) : (
                <>
                  🎤 Start Speaking
                </>
              )}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={PLACEHOLDER[language]}
              disabled={loading || isRecording}
              className="flex-1 px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:border-white/40 transition disabled:opacity-50"
            />

            {/* Send Button */}
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim() || isRecording}
              className="px-6 py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50"
            >
              {loading ? '⏳' : '📤'}
            </button>
          </div>

          {/* Transcript Display */}
          {transcript && (
            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white/50 text-xs mb-2">Transcribed:</p>
              <p className="text-white text-sm">{transcript}</p>
            </div>
          )}

          {/* Finished Message */}
          {finished && (
            <div className="mt-4 p-4 bg-green-500/20 rounded-lg border border-green-500/50 text-center">
              <p className="text-green-400 font-semibold">Interview Complete</p>
              <p className="text-green-400/70 text-sm mt-1">Thank you for your time!</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10 text-center text-white/40 text-xs">
        <p>ChatGPT is AI and can make mistakes. Check important info.</p>
      </div>
    </div>
  );
}
