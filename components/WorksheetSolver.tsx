
import React, { useState, useRef } from 'react';
import { solveWorksheet } from '../services/geminiService';

const WorksheetSolver: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const solution = await solveWorksheet(base64);
      setResult(solution);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-slate-800">Worksheet Solver</h2>
      </div>

      {!result && !loading && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-4 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-all group"
        >
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-indigo-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <p className="text-lg font-bold text-slate-700">Snap a Worksheet</p>
          <p className="text-slate-500">Get step-by-step solutions instantly</p>
        </div>
      )}

      {loading && (
        <div className="py-20 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-indigo-600 font-bold animate-pulse italic">Gemini is solving your worksheet...</p>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 prose prose-indigo max-w-none">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Solutions Found</h3>
            <button onClick={() => setResult(null)} className="text-sm font-bold text-indigo-600 hover:underline">Clear</button>
          </div>
          <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
            {result}
          </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFile} />
    </div>
  );
};

export default WorksheetSolver;
