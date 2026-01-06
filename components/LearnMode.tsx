
import React, { useState, useEffect } from 'react';
import { Flashcard, QuestionType, StudyConfig, TestQuestion } from '../types';
import { evaluateAnswer, generatePracticeTest } from '../services/geminiService';

interface LearnModeProps {
  cards: Flashcard[];
  onFinish: (updatedCards: Flashcard[]) => void;
  onBack: () => void;
  onAskAI?: (message: string) => void;
}

const LearnMode: React.FC<LearnModeProps> = ({ cards, onFinish, onBack, onAskAI }) => {
  const [setup, setSetup] = useState(true);
  const [config, setConfig] = useState<StudyConfig>({
    questionTypes: ['multiple-choice', 'written'],
    itemCount: Math.min(cards.length, 10)
  });

  const [loading, setLoading] = useState(false);
  const [sessionQuestions, setSessionQuestions] = useState<TestQuestion[]>([]);
  const [currentRoundQueue, setCurrentRoundQueue] = useState<string[]>([]); // Array of Question IDs
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [masteredCardsInSession, setMasteredCardsInSession] = useState<Flashcard[]>([]);
  const [activeCards, setActiveCards] = useState<Flashcard[]>([]);

  const toggleType = (type: QuestionType) => {
    setConfig(prev => ({
      ...prev,
      questionTypes: prev.questionTypes.includes(type) 
        ? prev.questionTypes.filter(t => t !== type) 
        : [...prev.questionTypes, type]
    }));
  };

  const startLearning = async () => {
    if (config.questionTypes.length === 0) return;
    setLoading(true);
    
    try {
      const selectedCards = cards.filter(c => c.masteryScore < 3).slice(0, config.itemCount);
      setActiveCards(selectedCards);
      const questions = await generatePracticeTest(selectedCards, config.questionTypes, selectedCards.length);
      setSessionQuestions(questions);
      setCurrentRoundQueue(questions.map(q => q.id));
      setSetup(false);
    } catch (e) {
      alert("AI failed to prepare questions. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (overrideAnswer?: string) => {
    const finalAnswer = overrideAnswer || userAnswer;
    if (!finalAnswer.trim() || evaluating || feedback) return;
    
    setEvaluating(true);
    const questionId = currentRoundQueue[currentIndex];
    const question = sessionQuestions.find(q => q.id === questionId)!;
    const cardIndex = sessionQuestions.indexOf(question);
    const card = activeCards[cardIndex];

    try {
      const result = await evaluateAnswer(question.question, question.correctAnswer, finalAnswer);
      setFeedback({ isCorrect: result.isCorrect, text: result.feedback });
      
      const updatedCard: Flashcard = {
        ...card,
        masteryScore: result.isCorrect ? card.masteryScore + 1 : Math.max(0, card.masteryScore - 1),
        lastAttemptCorrect: result.isCorrect
      };

      setActiveCards(prev => prev.map((c, i) => i === cardIndex ? updatedCard : c));

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
    const isCorrect = feedback?.isCorrect;
    const questionId = currentRoundQueue[currentIndex];
    setFeedback(null);
    setUserAnswer('');

    let newQueue = [...currentRoundQueue];
    if (!isCorrect) {
      newQueue.push(questionId);
    }

    if (currentIndex < newQueue.length - 1) {
      setCurrentRoundQueue(newQueue);
      setCurrentIndex(prev => prev + 1);
    } else {
      const remainingQuestions = sessionQuestions.filter((q, idx) => {
        const c = activeCards[idx];
        return c.masteryScore < 3;
      }).map(q => q.id);

      if (remainingQuestions.length === 0) {
        const finalCards = cards.map(c => masteredCardsInSession.find(m => m.id === c.id) || c);
        onFinish(finalCards);
      } else {
        setCurrentRoundQueue(remainingQuestions);
        setCurrentIndex(0);
      }
    }
  };

  if (setup) return (
    <div className="p-8 space-y-8 animate-in fade-in zoom-in duration-500 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black italic text-slate-800">Learn Setup</h2>
        <p className="text-slate-500 font-medium">AI rounds will verify your mastery.</p>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Question Types</p>
        <div className="grid grid-cols-1 gap-3">
          {(['multiple-choice', 'true-false', 'written'] as QuestionType[]).map(type => (
            <button key={type} onClick={() => toggleType(type)} className={`p-5 rounded-[1.5rem] border-2 flex items-center justify-between transition-all ${config.questionTypes.includes(type) ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-white text-slate-400'}`}>
              <span className="font-black uppercase text-xs tracking-wider">{type.replace('-', ' ')}</span>
              {config.questionTypes.includes(type) && <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[10px]">✓</div>}
            </button>
          ))}
        </div>
      </div>

      <button onClick={startLearning} disabled={config.questionTypes.length === 0 || loading} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2">
        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>Start Session</span>}
      </button>
      <button onClick={onBack} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Back</button>
    </div>
  );

  const activeQuestionId = currentRoundQueue[currentIndex];
  const activeQuestion = sessionQuestions.find(q => q.id === activeQuestionId);
  const cardIndex = sessionQuestions.findIndex(q => q.id === activeQuestionId);
  const activeCard = activeCards[cardIndex];

  if (!activeQuestion) return null;

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 max-w-md mx-auto pb-24">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exit</button>
        <div className="flex space-x-1">
          {[1,2,3].map(i => (
            <div key={i} className={`w-3 h-3 rounded-full transition-colors ${activeCard.masteryScore >= i ? 'bg-emerald-500' : 'bg-slate-200'}`} />
          ))}
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentIndex + 1} / {currentRoundQueue.length}</span>
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-50 text-center space-y-6">
        <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-500 text-[10px] font-black uppercase tracking-widest rounded-full">
          {activeQuestion.type.replace('-', ' ')}
        </div>
        <h2 className="text-2xl font-black text-slate-800 leading-tight">{activeQuestion.question}</h2>
      </div>

      <div className="space-y-4">
        {!feedback ? (
          <div className="space-y-4">
            {activeQuestion.type === 'multiple-choice' || activeQuestion.type === 'true-false' ? (
              <div className="grid grid-cols-1 gap-3">
                {(activeQuestion.type === 'true-false' ? ['True', 'False'] : activeQuestion.options)?.map(opt => (
                  <button key={opt} onClick={() => { setUserAnswer(opt); handleSubmit(opt); }} className={`p-5 rounded-[1.5rem] border-2 text-left transition-all ${userAnswer === opt ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-white text-slate-700 hover:border-slate-200 shadow-sm'}`}>
                    <span className="font-bold text-sm">{opt}</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <textarea className="w-full bg-slate-900 text-white placeholder-slate-500 border-2 border-slate-800 rounded-[2rem] p-6 text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-900/10 outline-none transition-all h-32 resize-none shadow-2xl" placeholder="Explain the concept in your own words..." value={userAnswer} onChange={e => setUserAnswer(e.target.value)} />
                <button onClick={() => handleSubmit()} disabled={!userAnswer.trim() || evaluating} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2">
                  {evaluating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>Verify Answer</span>}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className={`p-8 rounded-[2rem] space-y-4 animate-in zoom-in ${feedback.isCorrect ? 'bg-emerald-50 border-2 border-emerald-100' : 'bg-red-50 border-2 border-red-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${feedback.isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>
                  {feedback.isCorrect ? '✓' : '!'}
                </div>
                <p className="text-sm font-black uppercase tracking-wider text-slate-800">{feedback.isCorrect ? 'Correct' : 'Needs Review'}</p>
              </div>
              {onAskAI && (
                <button 
                  onClick={() => onAskAI(`I was just studying this question in Learn mode and got it ${feedback.isCorrect ? 'right, but I want to know more' : 'wrong'}.\n\nQuestion: ${activeQuestion.question}\nMy Answer: ${userAnswer}\nCorrect Answer: ${activeQuestion.correctAnswer}\nAI Feedback: ${feedback.text}\n\nCan you explain this to me in more detail?`)}
                  className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-110 transition-transform active:scale-90"
                  title="Ask AI for a deep explanation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
                </button>
              )}
            </div>
            <p className="text-sm font-medium text-slate-700 leading-relaxed">{feedback.text}</p>
            {!feedback.isCorrect && (
              <div className="p-4 bg-white/60 rounded-xl border border-red-100 text-xs text-slate-600">
                <span className="font-bold text-slate-400 block mb-1">CORRECT ANSWER:</span>
                {activeQuestion.correctAnswer}
              </div>
            )}
            <button onClick={nextCard} className={`w-full py-4 rounded-2xl font-black shadow-lg transition-transform active:scale-95 ${feedback.isCorrect ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
              {feedback.isCorrect ? 'Mastery Increasing...' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnMode;
