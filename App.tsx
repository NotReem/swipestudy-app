
import React, { useState, useEffect } from 'react';
import { AppView, Flashcard, Folder, StudyMode, User } from './types';
import Scanner from './components/Scanner';
import FlashcardDeck from './components/FlashcardDeck';
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

  const handleLogin = (name: string, email: string) => {
    setUser({ name, email });
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    const folder: Folder = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      color: 'indigo',
      createdAt: Date.now()
    };
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

  const masteredCount = cards.filter(c => c.status === 'known').length;
  const progressPercent = cards.length ? Math.round((masteredCount / cards.length) * 100) : 0;

  const renderDashboard = () => (
    <div className="p-6 space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-start">
        <div onClick={() => setView('profile')} className="cursor-pointer group">
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1 group-hover:text-indigo-600 transition-colors">Study Profile</p>
          <h1 className="text-3xl font-black text-slate-900 italic">Hi, {user.name.split(' ')[0]}!</h1>
        </div>
        <button 
          onClick={() => setIsChatOpen(true)} 
          className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 hover:scale-110 transition-transform active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
        </button>
      </header>

      <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-slate-800 tracking-tight italic">Total Mastery</h3>
          <span className="text-indigo-600 font-black">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-600 h-full transition-all duration-1000 ease-out" 
            style={{ width: `${progressPercent}%` }} 
          />
        </div>
        <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          {masteredCount} of {cards.length} terms memorized
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setView('scanner')} className="p-6 bg-white border-2 border-slate-100 rounded-3xl text-left hover:border-indigo-400 transition-all shadow-sm group">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /></svg>
          </div>
          <p className="font-black text-slate-800 tracking-tight">New Notes</p>
          <p className="text-xs text-slate-400 font-bold uppercase mt-1 italic">UNLIMITED</p>
        </button>
        <button 
          onClick={() => setView('solver')} 
          className="p-6 bg-white border-2 border-slate-100 rounded-3xl text-left hover:border-indigo-400 transition-all shadow-sm group"
        >
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
          </div>
          <p className="font-black text-slate-800 tracking-tight">Solvers</p>
          <p className="text-xs text-slate-400 font-bold uppercase mt-1 italic">FULL ACCESS</p>
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800">My Folders</h2>
          <button onClick={() => setIsCreatingFolder(true)} className="text-indigo-600 font-bold text-sm hover:underline">+ Create</button>
        </div>

        {isCreatingFolder && (
          <div className="bg-indigo-50 p-4 rounded-3xl flex items-center space-x-2 animate-in slide-in-from-top-2">
            <input 
              autoFocus 
              value={newFolderName} 
              onChange={e => setNewFolderName(e.target.value)} 
              placeholder="Folder Name..." 
              className="flex-1 bg-white text-slate-900 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500" 
            />
            <button onClick={createFolder} className="bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold text-sm">Add</button>
            <button onClick={() => setIsCreatingFolder(false)} className="text-slate-400 p-2"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {folders.map(f => {
            const folderCards = cards.filter(c => c.folderId === f.id);
            const dueCount = folderCards.filter(c => c.nextReview <= Date.now()).length;
            
            return (
              <div key={f.id} className="bg-white border-2 border-slate-100 rounded-3xl p-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black">
                    {f.name[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800">{f.name}</h3>
                    <p className="text-xs font-bold text-slate-400">{folderCards.length} cards • {dueCount} due</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                   <button 
                    disabled={folderCards.length === 0}
                    onClick={() => { setActiveMode('focused'); setView('study'); }}
                    className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-black hover:bg-indigo-50 hover:text-indigo-600 transition-colors disabled:opacity-30"
                   >
                    FOCUSED
                   </button>
                   <button 
                    disabled={folderCards.length === 0}
                    onClick={() => { setActiveMode('random'); setView('study'); }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-md disabled:opacity-30"
                   >
                    START
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={() => setView('calculator')} className="w-full p-4 bg-slate-100 rounded-2xl text-slate-500 font-bold text-sm flex items-center justify-center space-x-2 hover:bg-slate-200 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-3-9.75v3m-3 3V18m3-3V6.75M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21h10.5a2.25 2.25 0 0 0 2.25-2.25V5.25a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 6.75 21Z" /></svg>
        <span>Grade Target Calculator</span>
      </button>
    </div>
  );

  const renderProfile = () => (
    <div className="p-6 space-y-8 animate-in slide-in-from-right-10 duration-500">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-3xl font-black mx-auto shadow-2xl shadow-indigo-100">
          {user.name[0]}
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">{user.name}</h2>
          <p className="text-slate-400 font-bold">{user.email}</p>
        </div>
      </div>

      <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-50 pb-4">
          <span className="text-slate-500 font-bold text-sm">Access Level</span>
          <span className="text-indigo-600 font-black">Full Unlimited</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-bold text-sm">Account Status</span>
          <span className="text-emerald-500 font-black">Active</span>
        </div>
      </div>

      <div className="space-y-3">
        <button 
          onClick={() => { localStorage.clear(); window.location.reload(); }}
          className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-black transition-all hover:bg-red-100"
        >
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-12 overflow-x-hidden relative">
      {view !== 'dashboard' && (
        <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex items-center justify-between">
          <button 
            onClick={() => setView('dashboard')}
            className="flex items-center space-x-2 text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            <span>Back Home</span>
          </button>
          <div className="text-slate-400 font-black text-xs uppercase tracking-widest italic">
            {view}
          </div>
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
            cards={cards} 
            mode={activeMode}
            onFinish={handleStudyFinish}
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
