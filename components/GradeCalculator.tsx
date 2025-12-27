
import React, { useState } from 'react';
import { GradeState } from '../types';

const GradeCalculator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [grades, setGrades] = useState<GradeState>({
    currentGrade: 85,
    targetGrade: 90,
    finalWeight: 20
  });

  const calculateRequired = () => {
    const { currentGrade, targetGrade, finalWeight } = grades;
    const w = finalWeight / 100;
    const required = (targetGrade - currentGrade * (1 - w)) / w;
    return Math.round(required * 10) / 10;
  };

  const required = calculateRequired();

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-800">Target Calculator</h2>
        <p className="text-slate-500 font-medium">Find out exactly what you need on your final.</p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600 block">Current Grade (%)</label>
          <input 
            type="number" 
            value={grades.currentGrade}
            onChange={(e) => setGrades({...grades, currentGrade: Number(e.target.value)})}
            className="w-full bg-slate-50 text-slate-900 border-none rounded-xl p-4 text-xl font-bold focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600 block">Target Grade (%)</label>
          <input 
            type="number" 
            value={grades.targetGrade}
            onChange={(e) => setGrades({...grades, targetGrade: Number(e.target.value)})}
            className="w-full bg-slate-50 text-slate-900 border-none rounded-xl p-4 text-xl font-bold focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600 block">Final Exam Weight (%)</label>
          <div className="flex items-center space-x-4">
            <input 
              type="range" 
              min="1" max="100" 
              value={grades.finalWeight}
              onChange={(e) => setGrades({...grades, finalWeight: Number(e.target.value)})}
              className="flex-1 accent-indigo-600"
            />
            <span className="w-12 text-center font-bold text-indigo-600">{grades.finalWeight}%</span>
          </div>
        </div>
      </div>

      <div className={`p-8 rounded-3xl text-center space-y-2 transition-colors ${required > 100 ? 'bg-orange-50 border-2 border-orange-200' : 'bg-indigo-600 shadow-xl shadow-indigo-100'}`}>
        <p className={`text-sm font-medium ${required > 100 ? 'text-orange-600' : 'text-indigo-100'}`}>You need a score of</p>
        <h3 className={`text-5xl font-black ${required > 100 ? 'text-orange-700' : 'text-white'}`}>{required}%</h3>
        {required > 100 && <p className="text-orange-600 text-xs font-bold uppercase mt-2">Better study hard!</p>}
      </div>

      <button 
        onClick={onBack}
        className="w-full py-4 text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-slate-800 transition-colors"
      >
        Go Back
      </button>
    </div>
  );
};

export default GradeCalculator;
