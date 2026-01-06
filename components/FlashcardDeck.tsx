
import React, { useState } from 'react';
import { Flashcard, StudyMode } from '../types';

interface FlashcardDeckProps {
  cards: Flashcard[];
  mode: StudyMode;
  onFinish: (updatedCards: Flashcard[]) => void;
  onBack: () => void;
}

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards, mode, onFinish, onBack }) => {
  const [sessionCards, setSessionCards] = useState<Flashcard[]>(() => {
    let list = [...cards];
    if (mode === 'random') list = list.sort(() => Math.random() - 0.5);
    // Fix: Changed 'known' to 'mastered' to match Flashcard status type definition in types.ts
    if (mode === 'focused') list = list.filter(c => c.status !== 'mastered' || c.nextReview <= Date.now()).sort((a,b) => a.nextReview - b.nextReview);
    return list;
  });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const activeCard = sessionCards[currentIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    setSwipeDirection(direction);
    
    setTimeout(() => {
      const updated = [...sessionCards];
      const card = updated[currentIndex];
      
      if (direction === 'left') { // Mastered / Known
        const newInterval = card.interval === 0 ? 1 : card.interval * 2;
        updated[currentIndex] = {
          ...card,
          // Fix: Changed 'known' to 'mastered' to match Flashcard status type
          status: 'mastered',
          interval: newInterval,
          nextReview: Date.now() + (newInterval * 24 * 60 * 60 * 1000)
        };
      } else { // Review / Struggle
        updated[currentIndex] = {
          ...card,
          // Fix: Changed 'review' to 'learning' to match Flashcard status type
          status: 'learning',
          interval: 1,
          nextReview: Date.now() + (1 * 24 * 60 * 60 * 1000)
        };
      }
      
      setSessionCards(updated);
      setSwipeDirection(null);
      setIsFlipped(false);
      
      if (currentIndex < sessionCards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        onFinish(updated);
      }
    }, 300);
  };

  if (!activeCard) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 h-[70vh]">
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight italic">Session Clear!</h3>
        <p className="text-slate-500 font-medium max-w-[250px]">No cards need review in this mode right now.</p>
        <button onClick={onBack} className="bg-indigo-600 text-white px-8 py-4 rounded-3xl font-bold shadow-xl shadow-indigo-200 mt-4 transition-all hover:bg-indigo-700 active:scale-95">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 space-y-8 animate-in fade-in duration-500">
      <div className="w-full flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
        <button onClick={onBack} className="flex items-center space-x-1 text-slate-300 hover:text-slate-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
          <span>Exit Session</span>
        </button>
        <span>{currentIndex + 1} / {sessionCards.length}</span>
      </div>

      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
        <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / sessionCards.length) * 100}%` }} />
      </div>

      <div className={`relative w-full aspect-[3/4] perspective-1000 transition-transform duration-300 ${
        swipeDirection === 'left' ? '-translate-x-[150%] rotate-[-20deg] opacity-0' : 
        swipeDirection === 'right' ? 'translate-x-[150%] rotate-[20deg] opacity-0' : ''
      }`}>
        <div className={`w-full h-full cursor-pointer transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
          <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center border border-slate-100">
            <p className="text-2xl font-bold text-slate-800 leading-relaxed">{activeCard.front}</p>
            <p className="mt-8 text-slate-300 text-[10px] font-black uppercase tracking-widest">Tap to reveal answer</p>
          </div>
          <div className="absolute inset-0 backface-hidden bg-indigo-50 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center border border-indigo-100 rotate-y-180">
            <p className="text-xl font-medium text-slate-700 leading-relaxed">{activeCard.back}</p>
            <p className="mt-8 text-indigo-300 text-[10px] font-black uppercase tracking-widest">Tap to hide answer</p>
          </div>
        </div>
      </div>

      <div className="flex w-full justify-center space-x-12">
        <button onClick={() => handleSwipe('right')} className="flex flex-col items-center space-y-2 group">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all shadow-lg active:scale-90"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></div>
          <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Review</span>
        </button>
        <button onClick={() => handleSwipe('left')} className="flex flex-col items-center space-y-2 group">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-lg active:scale-90"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg></div>
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Mastered</span>
        </button>
      </div>
    </div>
  );
};

export default FlashcardDeck;
