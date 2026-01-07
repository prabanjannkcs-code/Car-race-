
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { GameStatus } from '../types';

interface RaceEngineerProps {
  gameStatus: GameStatus;
  score: number;
  speed: number;
}

const RaceEngineer: React.FC<RaceEngineerProps> = ({ gameStatus, score, speed }) => {
  const [isEngineerActive, setIsEngineerActive] = useState(false);
  const [messages, setMessages] = useState<{role: 'ai' | 'system', text: string}[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const lastScoreRef = useRef(0);

  // Implementation of base64 decoding helper as per guidelines
  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const connectEngineer = async () => {
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `You are a high-energy AI Race Engineer for a cyberpunk neon car game. 
          Your job is to provide short, snappy, futuristic advice, encouragement, or witty remarks. 
          When the user is driving, keep it short. When they crash, offer a futuristic burn or encouragement to reboot. 
          Use terms like 'Neon-grid', 'Flux-capacity', 'Override', 'Protocol'.`,
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsEngineerActive(true);
            setMessages(prev => [{role: 'system', text: 'Race Engineer online.'}, ...prev]);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decodeBase64(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: (e) => {
            console.error('Race Engineer error:', e);
            setIsEngineerActive(false);
            setIsConnecting(false);
          },
          onclose: () => {
            setIsEngineerActive(false);
          }
        }
      });

      // Send initial context
      sessionPromise.then(session => {
        session.sendRealtimeInput({
          media: {
             data: btoa("Driver initialized. Status: READY."),
             mimeType: "text/plain"
          } as any
        });
      });

    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  // Automated commentary triggers
  useEffect(() => {
    if (!isEngineerActive) return;

    const triggerMessage = (text: string) => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: text,
        config: {
          systemInstruction: "You are a short-spoken futuristic race engineer. Give a 1-sentence reactive comment."
        }
      }).then(res => {
        if (res.text) {
          setMessages(prev => [{role: 'ai', text: res.text!}, ...prev].slice(0, 10));
        }
      });
    };

    if (gameStatus === GameStatus.GAMEOVER) {
      triggerMessage(`Driver crashed with a score of ${Math.floor(score)}. Give a gritty cyberpunk encouragement to try again.`);
    } else if (gameStatus === GameStatus.PLAYING) {
      if (score > 1000 && lastScoreRef.current <= 1000) {
        triggerMessage(`Driver reached a high score milestone of 1000. Express excitement!`);
      }
    }
    lastScoreRef.current = score;
  }, [gameStatus, score, isEngineerActive]);

  return (
    <div className="flex flex-col h-full font-sans">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-cyan-400 font-orbitron text-sm tracking-widest uppercase flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isEngineerActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
          Race Engineer
        </h3>
        {!isEngineerActive && (
          <button 
            onClick={connectEngineer}
            disabled={isConnecting}
            className="text-[10px] bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
          >
            {isConnecting ? 'CONNECTING...' : 'INITIALIZE LINK'}
          </button>
        )}
      </div>

      <div className="flex-grow flex flex-col gap-3 overflow-y-auto pr-2">
        {messages.length === 0 && (
          <div className="text-slate-600 text-xs italic text-center mt-10">
            Link the AI Engineer for real-time tactical advice.
          </div>
        )}
        {messages.map((m, i) => (
          <div 
            key={i} 
            className={`p-3 rounded-lg text-xs leading-relaxed border ${
              m.role === 'system' 
                ? 'bg-slate-800/50 border-slate-700 text-slate-400' 
                : 'bg-cyan-500/5 border-cyan-500/20 text-cyan-100'
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="text-[10px] text-slate-500 uppercase tracking-tighter mb-2">Telemetry Data</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-black/40 p-2 rounded border border-white/5">
            <div className="text-[8px] text-slate-600">VELOCITY</div>
            <div className="text-white font-orbitron text-xs">{Math.floor(speed * 10)}u</div>
          </div>
          <div className="bg-black/40 p-2 rounded border border-white/5">
            <div className="text-[8px] text-slate-600">STABILITY</div>
            <div className="text-green-500 font-orbitron text-xs">NOMINAL</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceEngineer;
