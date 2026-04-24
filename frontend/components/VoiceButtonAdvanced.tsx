"use client";

import { useState, useRef, useEffect } from 'react';

interface VoiceButtonAdvancedProps {
  token: string;
  language: 'ru' | 'en' | 'tr';
  onVoiceRecorded: (audioBlob: Blob, duration: number) => void;
  onError: (error: string) => void;
  onRecordingTime?: (time: number) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

interface RecordedVoice {
  blob: Blob;
  duration: number;
  waveform: number[];
}

export function VoiceButtonAdvanced({
  token,
  language,
  onVoiceRecorded,
  onError,
  onRecordingTime,
  onCancel,
  disabled,
}: VoiceButtonAdvancedProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [recordedVoice, setRecordedVoice] = useState<RecordedVoice | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldSendRef = useRef(true);
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording && recordingTime > 0) {
      onRecordingTime?.(recordingTime);
    }
  }, [recordingTime, isRecording, onRecordingTime]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      const audioContext = new (window as any).AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        if (!shouldSendRef.current) {
          shouldSendRef.current = true;
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const voice = {
          blob: audioBlob,
          duration: recordingTime,
          waveform,
        };
        setRecordedVoice(voice);
        
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
          
          onVoiceRecorded(audioBlob, recordingTime);
          
          setRecordedVoice(null);
          setWaveform([]);
          setRecordingTime(0);
        } catch (err: any) {
          onError(`Voice send error: ${err.message}`);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setRecordedVoice(null);

      timerRef.current = setInterval(() => {
        setRecordingTime(t => {
          if (t >= 60000) { 
            stopRecording();
            return t;
          }
          return t + 100;
        });
      }, 100);

      drawWaveform(analyser);
    } catch (err: any) {
      onError(`Microphone access denied: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) clearTimeout(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const drawWaveform = (analyser: AnalyserNode) => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      
      const samples = Array.from(dataArray).filter((_, i) => i % 4 === 0);
      setWaveform(samples.slice(0, 10));

      if (isRecording) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();
  };

  const sendVoice = async () => {
    shouldSendRef.current = true;
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) clearTimeout(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const sendVoiceFile = async () => {
    if (!recordedVoice) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const arrayBuffer = await recordedVoice.blob.arrayBuffer();

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
      
      onVoiceRecorded(recordedVoice.blob, recordedVoice.duration);
      
      setRecordedVoice(null);
      setWaveform([]);
      setRecordingTime(0);
    } catch (err: any) {
      onError(`Voice send error: ${err.message}`);
    }
  };

  const cancelRecording = () => {
    shouldSendRef.current = false;
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) clearTimeout(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
    
    setRecordedVoice(null);
    setWaveform([]);
    setRecordingTime(0);
    onCancel?.();
  };

  const togglePlayback = async () => {
    if (!recordedVoice) return;

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.src = URL.createObjectURL(recordedVoice.blob);
        audioRef.current.onended = () => setIsPlaying(false);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  if (isRecording) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={sendVoice}
          className="shrink-0 w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition"
          aria-label="Send recording"
          title="Send recording"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </button>

        <button
          onClick={cancelRecording}
          className="shrink-0 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition"
          aria-label="Cancel recording"
          title="Cancel recording"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>
    );
  }

  if (recordedVoice) {
    return null;
  }

  return (
    <button
      onClick={startRecording}
      disabled={disabled}
      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition ${
        'bg-blue-500 text-white hover:bg-blue-600'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
      aria-label="Start recording"
      title="Start recording"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <rect x="9" y="3" width="6" height="8" rx="3" ry="3" />
        <path d="M 7 11 Q 7 15 12 15 Q 17 15 17 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <rect x="11" y="15" width="2" height="4" />
      </svg>
    </button>
  );
}
