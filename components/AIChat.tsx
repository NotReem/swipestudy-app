
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { chatWithStudyAssistant } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string | null;
}

type ConnectionStatus = 'idle' | 'requesting-mic' | 'connecting' | 'active' | 'error';

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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
}

const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose, initialMessage }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('ss_chat_history');
    return saved ? JSON.parse(saved) : [
      { role: 'assistant', content: "Hi! I'm your study assistant. Tap the mic for a live voice session, or type below!" }
    ];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  
  const [liveTranscript, setLiveTranscript] = useState<{ user: string, model: string }>({ user: '', model: '' });
  const [inputLevel, setInputLevel] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const liveSessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen && initialMessage) {
      handleDirectMessage(initialMessage);
    }
  }, [isOpen, initialMessage]);

  useEffect(() => {
    localStorage.setItem('ss_chat_history', JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveTranscript, isOpen]);

  const handleDirectMessage = async (msg: string) => {
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const response = await chatWithStudyAssistant(msg);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Snagged. Try again?" }]);
    } finally {
      setLoading(false);
    }
  };

  const stopLiveSession = () => {
    setIsLive(false);
    setIsStarting(false);
    setStatus('idle');
    setLiveTranscript({ user: '', model: '' });
    setInputLevel(0);
    
    if (liveSessionRef.current) {
      try { liveSessionRef.current.close(); } catch (e) {}
      liveSessionRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    activeSourcesRef.current.forEach(s => { try { s.stop(); } catch (e) {} });
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    const ctxIn = audioContextInRef.current;
    if (ctxIn) {
      audioContextInRef.current = null;
      if (ctxIn.state !== 'closed') ctxIn.close().catch(() => {});
    }
    
    const ctxOut = audioContextOutRef.current;
    if (ctxOut) {
      audioContextOutRef.current = null;
      if (ctxOut.state !== 'closed') ctxOut.close().catch(() => {});
    }
  };

  useEffect(() => {
    if (!isOpen && (isLive || isStarting)) {
      stopLiveSession();
    }
    return () => {
      if (liveSessionRef.current || audioContextInRef.current) stopLiveSession();
    };
  }, [isOpen]);

  const startLiveSession = async () => {
    if (isLive || isStarting) {
      stopLiveSession();
      return;
    }

    setIsStarting(true);
    setStatus('requesting-mic');

    try {
      const ctxIn = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const ctxOut = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextInRef.current = ctxIn;
      audioContextOutRef.current = ctxOut;

      if (ctxIn.state === 'suspended') await ctxIn.resume();
      if (ctxOut.state === 'suspended') await ctxOut.resume();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!audioContextInRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      streamRef.current = stream;

      const analyser = ctxIn.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const micSource = ctxIn.createMediaStreamSource(stream);
      micSource.connect(analyser);

      const drawVolume = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setInputLevel(average);
        animationFrameRef.current = requestAnimationFrame(drawVolume);
      };
      drawVolume();

      const historyContext = messages.slice(-5).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

      setStatus('connecting');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: `You are SwipeStudy AI. Respond ONLY in English. Use conversation context: ${historyContext}`,
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            setStatus('active');
            setIsLive(true);
            setIsStarting(false);
            
            if (!audioContextInRef.current) return;
            const scriptProcessor = audioContextInRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const base64 = encode(new Uint8Array(int16.buffer));
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } });
              });
            };
            micSource.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              setLiveTranscript(prev => ({ ...prev, user: prev.user + message.serverContent!.inputTranscription!.text }));
            }
            if (message.serverContent?.outputTranscription) {
              setLiveTranscript(prev => ({ ...prev, model: prev.model + message.serverContent!.outputTranscription!.text }));
            }
            if (message.serverContent?.turnComplete) {
              setLiveTranscript(prev => {
                if (prev.user || prev.model) {
                  setMessages(h => [
                    ...h, 
                    ...(prev.user ? [{ role: 'user', content: prev.user } as Message] : []), 
                    ...(prev.model ? [{ role: 'assistant', content: prev.model } as Message] : [])
                  ]);
                }
                return { user: '', model: '' };
              });
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextOutRef.current && audioContextOutRef.current.state !== 'closed') {
              try {
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextOutRef.current, 24000, 1);
                const source = audioContextOutRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextOutRef.current.destination);
                const now = audioContextOutRef.current.currentTime;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                activeSourcesRef.current.add(source);
                source.onended = () => activeSourcesRef.current.delete(source);
              } catch (e) {}
            }

            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: () => {
            setStatus('error');
            stopLiveSession();
          },
          onclose: () => stopLiveSession()
        }
      });
      liveSessionRef.current = await sessionPromise;
    } catch (err) {
      setStatus('error');
      stopLiveSession();
    }
  };

  const handleSend = async () => {
    if (!input && !attachedImage) return;
    const userMsg = input;
    const img = attachedImage;
    setMessages(prev => [...prev, { role: 'user', content: userMsg, image: img || undefined }]);
    setInput('');
    setAttachedImage(null);
    setLoading(true);
    try {
      const response = await chatWithStudyAssistant(userMsg || "Explain this", img || undefined);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Snagged. Try again?" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAttachedImage((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  };

  const clearHistory = () => {
    const defaultMsg: Message[] = [{ role: 'assistant', content: "Hi! I'm your study assistant. Tap the mic for a live voice session, or type below!" }];
    setMessages(defaultMsg);
    localStorage.removeItem('ss_chat_history');
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:justify-end sm:p-4 pointer-events-none transition-all duration-300 ${isOpen ? 'bg-black/20 backdrop-blur-[2px] opacity-100' : 'opacity-0 invisible'}`}>
      <div className={`w-full sm:w-[420px] h-[85vh] sm:h-[650px] bg-white shadow-2xl rounded-t-[2.5rem] sm:rounded-3xl flex flex-col pointer-events-auto transition-transform duration-500 transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex flex-col items-center">
          <div className="w-12 h-1 bg-slate-200 rounded-full mt-3 mb-1 sm:hidden"></div>
          <div className="w-full p-4 border-b flex items-center justify-between bg-white rounded-t-[2.5rem] sm:rounded-t-3xl sticky top-0 z-10">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${isLive || isStarting ? 'bg-red-500 ring-4 ring-red-50' : 'bg-indigo-600'} rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-lg transition-all`}>
                {isLive || isStarting ? <div className="w-2 h-2 bg-white rounded-full animate-ping" /> : 'AI'}
              </div>
              <div>
                <h2 className="font-black text-slate-800 text-sm leading-none">Study Assistant</h2>
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {status === 'active' ? 'Live Voice active' : status === 'connecting' ? 'Connecting...' : status === 'requesting-mic' ? 'Mic Access...' : 'English Mode'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button onClick={clearHistory} className="p-2.5 text-slate-300 hover:text-slate-600 transition-colors" title="Clear History">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 6.65m-2.88 0L11.21 9m9.24-2.38 1.44.34m-1.44-.34L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
              </button>
              <button onClick={onClose} className="p-2.5 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-2xl text-slate-400 transition-all active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-[14px] relative ${m.role === 'user' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 shadow-sm rounded-tl-none'}`}>
                {m.image && <img src={`data:image/jpeg;base64,${m.image}`} className="rounded-xl mb-3 max-h-56 object-cover w-full border border-white/20" alt="Upload" />}
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              </div>
            </div>
          ))}

          {(liveTranscript.user || liveTranscript.model) && (
            <div className="space-y-3 pt-2">
              {liveTranscript.user && (
                <div className="flex justify-end animate-in fade-in">
                  <div className="max-w-[85%] p-4 rounded-2xl text-[14px] bg-indigo-500/80 text-white italic rounded-tr-none opacity-80">{liveTranscript.user}</div>
                </div>
              )}
              {liveTranscript.model && (
                <div className="flex justify-start animate-in fade-in">
                  <div className="max-w-[85%] p-4 rounded-2xl text-[14px] bg-white border border-indigo-100 text-indigo-700 font-medium rounded-tl-none">{liveTranscript.model}</div>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center space-x-3 text-indigo-400 p-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-indigo-200 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-5 bg-white border-t space-y-4 rounded-b-3xl">
          {attachedImage && (
            <div className="relative inline-block animate-in zoom-in">
              <img src={`data:image/jpeg;base64,${attachedImage}`} className="w-20 h-20 object-cover rounded-2xl border-2 border-indigo-500 shadow-xl" />
              <button onClick={() => setAttachedImage(null)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-xl hover:bg-red-600 border-2 border-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            {!isLive && !isStarting && (
              <button onClick={() => fileRef.current?.click()} className="p-3 text-indigo-600 bg-indigo-50 rounded-2xl hover:bg-indigo-100 transition-all active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
              </button>
            )}
            
            <div className="relative">
              <button onClick={startLiveSession} className={`p-3 rounded-2xl transition-all active:scale-90 ${isLive || isStarting ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  {isLive || isStarting ? <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />}
                </svg>
              </button>
              {(isLive || isStarting) && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-8 bg-red-100 rounded-full overflow-hidden flex flex-col justify-end h-10">
                  <div className="bg-red-500 transition-all duration-75 w-full" style={{ height: `${Math.min(100, inputLevel * 2.5)}%` }} />
                </div>
              )}
            </div>

            {isLive || isStarting ? (
              <div className="flex-1 bg-red-50 text-red-600 rounded-2xl p-3 text-sm font-black italic flex items-center justify-center space-x-2">
                <span className="flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </span>
                <span className="uppercase tracking-widest text-[10px]">{status === 'active' ? 'English Only' : 'Connecting...'}</span>
              </div>
            ) : (
              <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask anything in English..." className="flex-1 bg-slate-900 text-white border border-slate-800 rounded-2xl p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 shadow-inner" />
            )}

            {!isLive && !isStarting && (
              <button onClick={handleSend} disabled={!input && !attachedImage} className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-30 active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>
      <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleImage} />
    </div>
  );
};

export default AIChat;
