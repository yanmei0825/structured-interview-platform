"use client";

import { useState, useRef } from 'react';

interface VoiceButtonProps {
  token: string;
  language: 'ru' | 'en' | 'tr';
  onTranscribed: (text: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function VoiceButton({ token, language, onTranscribed, onError, disabled }: VoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

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
      onError(`Microphone access denied: ${err.message}`);
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
    setIsTranscribing(true);
    try {
      const quality = await assessQuality(audioBlob);

      if (!quality.isAcceptable) {
        onError(`Voice quality too poor`);
        setIsTranscribing(false);
        return;
      }

      const arrayBuffer = await audioBlob.arrayBuffer();

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const transcribeResponse = await fetch(`${backendUrl}/survey/${token}/voice/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'audio/wav',
        },
        body: arrayBuffer,
      });
     
      if (!transcribeResponse.ok) {
        const errorText = await transcribeResponse.text();
        console.error('Transcription error response:', errorText);
        throw new Error(`Transcription failed: ${transcribeResponse.status}`);
      }

      const result = await transcribeResponse.json();
      onTranscribed(result.text);
    } catch (err: any) {
      onError(`Transcription error: ${err.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <button
      onClick={() => (isRecording ? stopRecording() : startRecording())}
      disabled={disabled || isTranscribing}
      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition ${
        isRecording
          ? 'bg-red-500 text-white animate-pulse'
          : 'text-white/60 hover:text-white/80'
      } disabled:opacity-40`}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      title={isRecording ? 'Stop recording' : 'Start recording'}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
        <path d="M17 16.91c-1.48 1.46-3.51 2.36-5.7 2.36-2.2 0-4.2-.9-5.7-2.36M19 12h2c0 2.96-1.08 5.68-2.84 7.76l-1.46-1.46C18.15 17.6 19 15.03 19 12z" />
      </svg>
    </button>
  );
}
