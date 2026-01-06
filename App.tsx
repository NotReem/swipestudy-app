
import React, { useState, useEffect } from 'react';
import { AppView, Flashcard, Folder, StudyMode, User } from './types';
import Scanner from './components/Scanner';
import FlashcardDeck from './components/FlashcardDeck';
import LearnMode from './components/LearnMode';
import PracticeTest from './components/PracticeTest';
import GradeCalculator from './components/GradeCalculator';
import WorksheetSolver from './components/WorksheetSolver';
import AIChat from './components/AIChat';
import Auth from './components/Auth';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([
    { id: 'f1', name: 'General Notes', color: 'indigo', createdAt: Date.now() }
  ]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [activeMode, setActiveMode] = useState<StudyMode>('scheduled');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('ss_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    const savedCards = localStorage.getItem('ss_cards');
    if (savedCards) setCards(JSON.parse(savedCards));
    const savedFolders = localStorage.getItem('ss_folders');
    if (savedFolders) setFolders(JSON.parse(savedFolders));
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('ss_user', JSON.stringify(user));
    localStorage.setItem('ss_cards', JSON.stringify(cards));
    localStorage.setItem('ss_folders', JSON.stringify(folders));
  }, [user, cards, folders]);

  const handleLogin = (name: string, email: string) => setUser({ name, email });

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    const folder: Folder = { id: `folder-${Date.now()}`, name: newFolderName, color: 'indigo', createdAt: Date.now() };
    setFolders([...folders, folder]);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleStudyFinish = (updatedCards: Flashcard[]) => {
    const cardMap = new Map(updatedCards.map(c => [c.id, c]));
    setCards(prev => prev.map(c => cardMap.get(c.id) || c));
    setView('dashboard');
  };

  if (!user) return <Auth onLogin={handleLogin} />;

  const masteredCount = cards.filter(c => c.masteryScore >= 3).length;
  const progressPercent = cards.length ? Math.round((masteredCount / cards.length) * 100) : 0;

  const renderDashboard = () => (
    <div className="p-6 space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-start">
        <div onClick={() => setView('profile')} className="cursor-pointer group">
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-1 group-hover:text-indigo-600 transition-colors">Study Profile</p>
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">Hi, {user.name.split(' ')[0]}!</h1>
        </div>
        <button onClick={() => setIsChatOpen(true)} className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-100 hover:scale-110 transition-transform active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
        </button>
      </header>

      <div className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-slate-800 tracking-tight italic text-lg">Knowledge Mastery</h3>
          <span className="text-indigo-600 font-black text-xl">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
          <div className="bg-indigo-600 h-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="mt-4 flex justify-between items-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{masteredCount} of {cards.length} fully mastered</p>
          <div className="flex -space-x-2">
            {[1,2,3].map(i => <div key={i} className="w-5 h-5 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-[8px] font-black text-indigo-300 italic">★</div>)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setView('scanner')} className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] text-left hover:border-indigo-400 transition-all shadow-sm group">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          </div>
          <p className="font-black text-slate-800 text-sm">New Cards</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest italic">Text or Scan</p>
        </button>
        <button onClick={() => setView('solver')} className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] text-left hover:border-indigo-400 transition-all shadow-sm group">
          <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
          </div>
          <p className="font-black text-slate-800 text-sm">AI Solver</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest italic">Active</p>
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Active Decks</h2>
          <button onClick={() => setIsCreatingFolder(true)} className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline">+ New Folder</button>
        </div>

        {isCreatingFolder && (
          <div className="bg-indigo-50 p-6 rounded-[2rem] flex items-center space-x-3 animate-in slide-in-from-top-4 duration-300 border-2 border-indigo-100">
            <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Exam prep, Biology..." className="flex-1 bg-white text-slate-900 border-none rounded-xl p-4 text-sm font-bold shadow-inner" />
            <button onClick={createFolder} className="bg-indigo-600 text-white px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest">Create</button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {folders.map(f => {
            const folderCards = cards.filter(c => c.folderId === f.id);
            const mastered = folderCards.filter(c => c.masteryScore >= 3).length;
            return (
              <div key={f.id} className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-sm group hover:border-indigo-100 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center font-black text-xl italic shadow-sm">
                      {f.name[0]}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg">{f.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{folderCards.length} cards • {mastered} mastered</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                   <button 
                    disabled={folderCards.length === 0}
                    onClick={() => { setActiveMode('random'); setView('study'); setActiveFolderId(f.id); }}
                    className="py-4 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-indigo-50 hover:text-indigo-600 transition-all disabled:opacity-30"
                   >
                    SWIPE
                   </button>
                   <button 
                    disabled={folderCards.length === 0}
                    onClick={() => { setView('learn'); setActiveFolderId(f.id); }}
                    className="py-4 bg-indigo-50 text-indigo-700 rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-indigo-100 transition-all disabled:opacity-30"
                   >
                    LEARN
                   </button>
                   <button 
                    disabled={folderCards.length < 3}
                    onClick={() => { setView('test'); setActiveFolderId(f.id); }}
                    className="py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-30"
                   >
                    TEST
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="p-6 space-y-8 animate-in slide-in-from-right-10 duration-500">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-3xl font-black mx-auto shadow-2xl shadow-indigo-100 italic">SS</div>
        <div>
          <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter">{user.name}</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{user.email}</p>
        </div>
      </div>
      <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-8 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-50 pb-4">
          <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Studying Since</span>
          <span className="text-indigo-600 font-black">2024</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Account Type</span>
          <span className="text-emerald-500 font-black">AI Pro Unlimited</span>
        </div>
      </div>
      <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-5 bg-red-50 text-red-500 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all hover:bg-red-100">Sign Out</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-12 overflow-x-hidden relative">
      {view !== 'dashboard' && (
        <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex items-center justify-between">
          <button onClick={() => setView('dashboard')} className="flex items-center space-x-2 text-indigo-600 font-black hover:bg-indigo-50 px-4 py-2 rounded-2xl transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
            <span className="text-xs uppercase tracking-widest">Back</span>
          </button>
          <div className="text-slate-300 font-black text-[10px] uppercase tracking-[0.4em] italic">{view}</div>
        </nav>
      )}

      <main className="max-w-xl mx-auto">
        {view === 'dashboard' && renderDashboard()}
        {view === 'profile' && renderProfile()}
        {view === 'scanner' && (
          <Scanner 
            folders={folders}
            onFlashcardsGenerated={newCards => {
              setCards([...cards, ...newCards]);
              setView('dashboard');
            }}
            onBack={() => setView('dashboard')}
          />
        )}
        {view === 'study' && (
          <FlashcardDeck 
            cards={activeFolderId ? cards.filter(c => c.folderId === activeFolderId) : cards} 
            mode={activeMode}
            onFinish={handleStudyFinish}
            onBack={() => setView('dashboard')}
          />
        )}
        {view === 'learn' && (
          <LearnMode 
            cards={activeFolderId ? cards.filter(c => c.folderId === activeFolderId) : cards}
            onFinish={handleStudyFinish}
            onBack={() => setView('dashboard')}
          />
        )}
        {view === 'test' && (
          <PracticeTest 
            cards={activeFolderId ? cards.filter(c => c.folderId === activeFolderId) : cards}
            onBack={() => setView('dashboard')}
          />
        )}
        {view === 'calculator' && <GradeCalculator onBack={() => setView('dashboard')} />}
        {view === 'solver' && <WorksheetSolver onBack={() => setView('dashboard')} />}
      </main>

      <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default App;
