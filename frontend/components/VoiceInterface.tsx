'use client';

import { useState, useRef, useEffect } from 'react';

interface VoiceInterfaceProps {
  token: string;
  language: 'ru' | 'en' | 'tr';
  onTranscribed: (text: string) => void;
  onError: (error: string) => void;
}

export function VoiceInterface({ token, language, onTranscribed, onError }: VoiceInterfaceProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceQuality, setVoiceQuality] = useState<any>(null);
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

      const noiseLevel = Math.max(0, 0.3 - volume);

      const clarity = Math.min(1, volume * 2);

      return {
        noiseLevel,
        clarity,
        volume,
        isAcceptable: volume > 0.1 && clarity > 0.3,
      };
    } catch (err) {
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
      setVoiceQuality(quality);

      if (!quality.isAcceptable) {
        onError(
          `Voice quality too poor. Noise: ${(quality.noiseLevel * 100).toFixed(0)}%, ` +
          `Clarity: ${(quality.clarity * 100).toFixed(0)}%`
        );
        setIsTranscribing(false);
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
      onTranscribed(result.text);
    } catch (err: any) {
      onError(`Transcription error: ${err.message}`);
    } finally {
      setIsTranscribing(false);
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

      if (!response.ok) {
        throw new Error('Text-to-speech failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (err: any) {
      onError(`Text-to-speech error: ${err.message}`);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setVoiceQuality(null);
  };

  return (
    <div className="voice-interface">
      <div className="voice-controls">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing}
          className={`voice-button ${isRecording ? 'recording' : ''}`}
        >
          {isRecording ? (
            <>
              <span className="recording-indicator"></span>
              Stop Recording
            </>
          ) : (
            <>
              🎤 Start Recording
            </>
          )}
        </button>

        {isTranscribing && (
          <div className="transcribing">
            <span className="spinner"></span>
            Transcribing...
          </div>
        )}
      </div>

      {voiceQuality && (
        <div className={`voice-quality ${voiceQuality.isAcceptable ? 'good' : 'poor'}`}>
          <div className="quality-bar">
            <div className="quality-label">Noise Level</div>
            <div className="quality-meter">
              <div
                className="quality-fill"
                style={{ width: `${voiceQuality.noiseLevel * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="quality-bar">
            <div className="quality-label">Clarity</div>
            <div className="quality-meter">
              <div
                className="quality-fill"
                style={{ width: `${voiceQuality.clarity * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="quality-bar">
            <div className="quality-label">Volume</div>
            <div className="quality-meter">
              <div
                className="quality-fill"
                style={{ width: `${voiceQuality.volume * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Transcript Display */}
      {transcript && (
        <div className="transcript">
          <div className="transcript-label">Transcribed:</div>
          <div className="transcript-text">{transcript}</div>
          <button onClick={clearTranscript} className="clear-button">
            Clear
          </button>
        </div>
      )}

s      <div className="voice-actions">
        <button
          onClick={() => speakText('Hello, how can I help you today?')}
          className="speak-button"
        >
          🔊 Hear Question
        </button>
      </div>

      <style jsx>{`
        .voice-interface {
          padding: 20px;
          border: 1px solid #e5e5ea;
          border-radius: 8px;
          background: #f9f9f9;
        }

        .voice-controls {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
        }

        .voice-button {
          padding: 12px 24px;
          background: #007aff;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s;
        }

        .voice-button:hover:not(:disabled) {
          background: #0051d5;
        }

        .voice-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .voice-button.recording {
          background: #ff3b30;
        }

        .recording-indicator {
          display: inline-block;
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .transcribing {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;
          font-size: 14px;
        }

        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #e5e5ea;
          border-top-color: #007aff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .voice-quality {
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          background: white;
        }

        .voice-quality.good {
          border: 1px solid #34c759;
          background: #f0fdf4;
        }

        .voice-quality.poor {
          border: 1px solid #ff3b30;
          background: #fef2f2;
        }

        .quality-bar {
          margin-bottom: 12px;
        }

        .quality-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }

        .quality-meter {
          height: 4px;
          background: #e5e5ea;
          border-radius: 2px;
          overflow: hidden;
        }

        .quality-fill {
          height: 100%;
          background: #007aff;
          transition: width 0.2s;
        }

        .transcript {
          padding: 12px;
          background: white;
          border: 1px solid #e5e5ea;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .transcript-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
        }

        .transcript-text {
          font-size: 16px;
          color: #000;
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .clear-button {
          padding: 8px 16px;
          background: #e5e5ea;
          color: #000;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .clear-button:hover {
          background: #d1d1d6;
        }

        .voice-actions {
          display: flex;
          gap: 12px;
        }

        .speak-button {
          padding: 12px 24px;
          background: #34c759;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .speak-button:hover {
          background: #30b84b;
        }
      `}</style>
    </div>
  );
}
