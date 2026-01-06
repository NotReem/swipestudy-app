
import React, { useState, useEffect } from 'react';
import { Flashcard, QuestionType, StudyConfig } from '../types';
import { evaluateAnswer } from '../services/geminiService';

interface LearnModeProps {
  cards: Flashcard[];
  onFinish: (updatedCards: Flashcard[]) => void;
  onBack: () => void;
}

const LearnMode: React.FC<LearnModeProps> = ({ cards, onFinish, onBack }) => {
  const [setup, setSetup] = useState(true);
  const [config, setConfig] = useState<StudyConfig>({
    questionTypes: ['written'],
    itemCount: Math.min(cards.length, 10)
  });

  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);
  const [currentRoundQueue, setCurrentRoundQueue] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [masteredCardsInSession, setMasteredCardsInSession] = useState<Flashcard[]>([]);

  const toggleType = (type: QuestionType) => {
    setConfig(prev => ({
      ...prev,
      questionTypes: prev.questionTypes.includes(type) 
        ? prev.questionTypes.filter(t => t !== type) 
        : [...prev.questionTypes, type]
    }));
  };

  const startLearning = () => {
    if (config.questionTypes.length === 0) return;
    const initial = cards.filter(c => c.masteryScore < 3).slice(0, config.itemCount);
    setSessionCards(initial);
    setCurrentRoundQueue(initial);
    setSetup(false);
  };

  const handleSubmit = async () => {
    if (!userAnswer.trim() || evaluating || feedback) return;
    setEvaluating(true);
    const card = currentRoundQueue[currentIndex];
    try {
      const result = await evaluateAnswer(card.front, card.back, userAnswer);
      setFeedback({ isCorrect: result.isCorrect, text: result.feedback });
      
      const updatedCard: Flashcard = {
        ...card,
        masteryScore: result.isCorrect ? card.masteryScore + 1 : Math.max(0, card.masteryScore - 1),
        lastAttemptCorrect: result.isCorrect
      };

      // Keep track of mastered vs still learning
      if (updatedCard.masteryScore >= 3) {
        setMasteredCardsInSession(prev => [...prev, updatedCard]);
      }
    } catch (e) {
      alert("AI eval failed. Try again.");
    } finally {
      setEvaluating(false);
    }
  };

  const nextCard = () => {
    const card = currentRoundQueue[currentIndex];
    const updatedCard = {
      ...card,
      masteryScore: feedback?.isCorrect ? card.masteryScore + 1 : Math.max(0, card.masteryScore - 1),
      lastAttemptCorrect: feedback?.isCorrect
    };

    setFeedback(null);
    setUserAnswer('');

    // If wrong, push to the end of the current round queue
    let newQueue = [...currentRoundQueue];
    if (!updatedCard.lastAttemptCorrect) {
       newQueue.push(updatedCard);
    }
    
    // Update the card state in the queue
    newQueue[currentIndex] = updatedCard;

    if (currentIndex < newQueue.length - 1) {
      setCurrentRoundQueue(newQueue);
      setCurrentIndex(prev => prev + 1);
    } else {
      // Round Complete
      const remaining = newQueue.filter(c => c.masteryScore < 3 && c.lastAttemptCorrect === false);
      if (remaining.length === 0) {
        onFinish(cards.map(c => masteredCardsInSession.find(m => m.id === c.id) || c));
      } else {
        setCurrentRoundQueue(remaining);
        setCurrentIndex(0);
      }
    }
  };

  if (setup) return (
    <div className="p-8 space-y-8 animate-in fade-in zoom-in duration-500 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black italic text-slate-800">Learn Setup</h2>
        <p className="text-slate-500 font-medium">AI will verify your understanding in rounds.</p>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Question Types</p>
        <div className="grid grid-cols-1 gap-3">
          {(['multiple-choice', 'true-false', 'written'] as QuestionType[]).map(type => (
            <button 
              key={type}
              onClick={() => toggleType(type)}
              className={`p-5 rounded-[1.5rem] border-2 flex items-center justify-between transition-all ${config.questionTypes.includes(type) ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-white text-slate-400'}`}
            >
              <span className="font-black uppercase text-xs tracking-wider">{type.replace('-', ' ')}</span>
              {config.questionTypes.includes(type) && <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[10px]">✓</div>}
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={startLearning}
        disabled={config.questionTypes.length === 0}
        className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
      >
        Start Round 1
      </button>
      <button onClick={onBack} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Back</button>
    </div>
  );

  const activeCard = currentRoundQueue[currentIndex];
  if (!activeCard) return null;

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 max-w-md mx-auto">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exit</button>
        <div className="flex space-x-1">
          {[1,2,3].map(i => (
            <div key={i} className={`w-3 h-3 rounded-full ${activeCard.masteryScore >= i ? 'bg-emerald-500' : 'bg-slate-100'}`} />
          ))}
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentIndex + 1} / {currentRoundQueue.length}</span>
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-50 text-center space-y-6">
        <h2 className="text-2xl font-black text-slate-800 leading-tight">{activeCard.front}</h2>
      </div>

      <div className="space-y-4">
        {!feedback ? (
          <>
            <textarea
              className="w-full bg-slate-900 text-white placeholder-slate-500 border border-slate-800 rounded-[2rem] p-6 text-sm font-medium focus:border-indigo-500 focus:bg-slate-800 outline-none transition-all h-32 resize-none shadow-2xl"
              placeholder="Explain the concept..."
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
            />
            <button 
              onClick={handleSubmit}
              disabled={!userAnswer.trim() || evaluating}
              className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2"
            >
              {evaluating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>Verify Mastery</span>}
            </button>
          </>
        ) : (
          <div className={`p-8 rounded-[2rem] space-y-4 animate-in zoom-in ${feedback.isCorrect ? 'bg-emerald-50 border-2 border-emerald-100' : 'bg-red-50 border-2 border-red-100'}`}>
            <p className="text-sm font-medium text-slate-700">{feedback.text}</p>
            {!feedback.isCorrect && (
              <div className="p-4 bg-white rounded-xl border border-red-100 text-xs text-slate-600">
                <span className="font-bold text-slate-400 block mb-1">REFERENCE:</span>
                {activeCard.back}
              </div>
            )}
            <button onClick={nextCard} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">
              {feedback.isCorrect ? 'Mastering...' : 'I will re-do this'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnMode;
