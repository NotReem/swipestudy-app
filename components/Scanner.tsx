
import React, { useRef, useState } from 'react';
import { generateFlashcards } from '../services/geminiService';
import { Flashcard, Folder } from '../types';

interface ScannerProps {
  folders: Folder[];
  onFlashcardsGenerated: (cards: Flashcard[]) => void;
  onBack: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ folders, onFlashcardsGenerated, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(folders[0]?.id || '');
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
        setError("Failed to process notes. Make sure the image is clear.");
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-800 italic">Snap Notes</h2>
        <p className="text-slate-500 font-medium">Turn handwriting into study power.</p>
      </div>

      <div className="space-y-4">
        <label className="text-sm font-bold text-slate-700 uppercase tracking-widest text-center block">Save To</label>
        <div className="grid grid-cols-2 gap-2">
          {folders.map(f => (
            <button 
              key={f.id}
              onClick={() => setSelectedFolderId(f.id)}
              className={`p-3 rounded-2xl text-sm font-bold border-2 transition-all ${selectedFolderId === f.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-white text-slate-500'}`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        className="aspect-[4/3] border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all group overflow-hidden relative"
      >
        {loading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-indigo-600 font-black animate-pulse uppercase text-xs tracking-widest">Generating Flashcards...</p>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-indigo-50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-indigo-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              </svg>
            </div>
            <p className="text-slate-800 font-black uppercase text-sm tracking-widest">Snap or Upload</p>
          </>
        )}
      </div>

      {error && <p className="text-red-500 text-center text-sm font-bold bg-red-50 p-4 rounded-2xl">{error}</p>}

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
      
      <button onClick={onBack} className="w-full py-4 text-slate-400 font-bold hover:text-slate-800 transition-colors uppercase tracking-widest text-xs">Back to Dashboard</button>
    </div>
  );
};

export default Scanner;
