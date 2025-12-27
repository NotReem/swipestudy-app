
import React, { useState, useRef, useEffect } from 'react';
import { chatWithStudyAssistant } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose }) => {
  // Use a ref or keep state here; it will persist as long as App keeps AIChat mounted.
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your study assistant. Send me a photo of your notes for a summary, or ask me anything!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input && !attachedImage) return;
    const userMsg = input;
    const img = attachedImage;
    
    setMessages(prev => [...prev, { role: 'user', content: userMsg, image: img || undefined }]);
    setInput('');
    setAttachedImage(null);
    setLoading(true);

    try {
      const response = await chatWithStudyAssistant(userMsg || "Summarize this note", img || undefined);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I hit a snag. Try again?" }]);
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

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:justify-end sm:p-4 pointer-events-none transition-all duration-300 ${isOpen ? 'bg-black/20 backdrop-blur-[2px] opacity-100' : 'opacity-0 invisible'}`}>
      <div 
        className={`w-full sm:w-[420px] h-[85vh] sm:h-[650px] bg-white shadow-2xl rounded-t-[2.5rem] sm:rounded-3xl flex flex-col pointer-events-auto transition-transform duration-500 transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Header with drag handle visual */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-1 bg-slate-200 rounded-full mt-3 mb-1 sm:hidden"></div>
          <div className="w-full p-4 border-b flex items-center justify-between bg-white rounded-t-[2.5rem] sm:rounded-t-3xl sticky top-0 z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-100">AI</div>
              <div>
                <h2 className="font-black text-slate-800 text-sm leading-none">Study Assistant</h2>
                <div className="flex items-center space-x-1 mt-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Conversation Saved</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2.5 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-2xl text-slate-400 transition-all active:scale-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-[14px] ${m.role === 'user' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 shadow-sm rounded-tl-none'}`}>
                {m.image && <img src={`data:image/jpeg;base64,${m.image}`} className="rounded-xl mb-3 max-h-56 object-cover w-full border border-white/20" alt="Upload" />}
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center space-x-3 text-indigo-400 p-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-indigo-200 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest italic">Thinking...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="p-5 bg-white border-t space-y-4 rounded-b-3xl">
          {attachedImage && (
            <div className="relative inline-block animate-in zoom-in">
              <img src={`data:image/jpeg;base64,${attachedImage}`} className="w-20 h-20 object-cover rounded-2xl border-2 border-indigo-500 shadow-xl shadow-indigo-100" />
              <button onClick={() => setAttachedImage(null)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-xl hover:bg-red-600 transition-colors border-2 border-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
          <div className="flex items-center space-x-3">
            <button onClick={() => fileRef.current?.click()} className="p-3.5 text-indigo-600 bg-indigo-50 rounded-2xl hover:bg-indigo-100 transition-all active:scale-90" title="Upload notes">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
            </button>
            <input 
              type="text" 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSend()} 
              placeholder="Ask anything or upload notes..." 
              className="flex-1 bg-slate-50 text-slate-900 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 shadow-inner" 
            />
            <button 
              onClick={handleSend} 
              disabled={!input && !attachedImage}
              className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-30 disabled:shadow-none active:scale-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
            </button>
          </div>
        </div>
      </div>
      <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleImage} />
    </div>
  );
};

export default AIChat;
