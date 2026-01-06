
import React, { useRef, useState } from 'react';
import { generateFlashcards, generateFlashcardsFromText } from '../services/geminiService';
import { Flashcard, Folder } from '../types';

interface ScannerProps {
  folders: Folder[];
  onFlashcardsGenerated: (cards: Flashcard[]) => void;
  onBack: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ folders, onFlashcardsGenerated, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'camera' | 'text'>('camera');
  const [selectedFolderId, setSelectedFolderId] = useState<string>(folders[0]?.id || '');
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFolderId) return;
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      try {
        const cards = await generateFlashcards(base64String, selectedFolderId);
        onFlashcardsGenerated(cards);
      } catch (err) {
        setError("Failed to process notes. Image too messy?");
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTextGenerate = async () => {
    if (!textInput.trim() || !selectedFolderId) return;
    setLoading(true);
    setError(null);
    try {
      const cards = await generateFlashcardsFromText(textInput, selectedFolderId);
      onFlashcardsGenerated(cards);
    } catch (err) {
      setError("Failed to generate from text.");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-slate-800 italic">Create Deck</h2>
        <div className="flex bg-slate-100 p-1 rounded-2xl w-fit mx-auto mt-4">
          <button 
            onClick={() => setMode('camera')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'camera' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
          >
            Camera
          </button>
          <button 
            onClick={() => setMode('text')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
          >
            Text Paste
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block text-center">Select Folder</label>
        <div className="flex overflow-x-auto pb-2 space-x-2 no-scrollbar">
          {folders.map(f => (
            <button 
              key={f.id}
              onClick={() => setSelectedFolderId(f.id)}
              className={`px-6 py-3 rounded-2xl text-sm font-bold border-2 whitespace-nowrap transition-all ${selectedFolderId === f.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-white text-slate-500'}`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {mode === 'camera' ? (
        <div 
          onClick={() => !loading && fileInputRef.current?.click()}
          className="aspect-[4/3] border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all relative overflow-hidden"
        >
          {loading ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-indigo-600 font-black animate-pulse uppercase text-xs tracking-widest">AI Scanning Notes...</p>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-50">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-indigo-600"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /></svg>
              </div>
              <p className="text-slate-800 font-black uppercase text-xs tracking-widest">Snap Hand-written Notes</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <textarea 
            className="w-full h-48 bg-slate-900 text-white placeholder-slate-500 border-2 border-slate-800 rounded-[2rem] p-6 text-sm font-medium focus:ring-4 focus:ring-indigo-900/20 focus:border-indigo-500 outline-none transition-all resize-none shadow-2xl"
            placeholder="Paste your notes, essay, or book chapter here..."
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
          />
          <button 
            onClick={handleTextGenerate}
            disabled={loading || !textInput.trim()}
            className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl shadow-indigo-100 disabled:opacity-30 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>Create Flashcards</span>}
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-center text-[10px] font-black uppercase tracking-widest bg-red-50 p-4 rounded-2xl border-2 border-red-100">{error}</p>}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
      <button onClick={onBack} className="w-full py-4 text-slate-400 font-bold hover:text-slate-800 transition-colors uppercase tracking-widest text-[10px]">Back to Dashboard</button>
    </div>
  );
};

export default Scanner;
