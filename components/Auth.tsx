
import React, { useState } from 'react';

interface AuthProps {
  onLogin: (name: string, email: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(name || 'Master Student', email || 'student@swipestudy.app');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-1000">
      <div className="space-y-4">
        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black italic mx-auto shadow-2xl shadow-indigo-200">SS</div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">SwipeStudy</h1>
        <p className="text-slate-500 max-w-[280px] mx-auto font-medium">Your personal academic powerhouse. Notes to flashcards in seconds.</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {!isLogin && (
          <input 
            type="text" 
            placeholder="Full Name" 
            required
            className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 text-slate-900 font-medium shadow-inner"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        )}
        <input 
          type="email" 
          placeholder="Email Address" 
          required
          className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 text-slate-900 font-medium shadow-inner"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input 
          type="password" 
          placeholder="Password" 
          required
          className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 text-slate-900 font-medium shadow-inner"
        />
        <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95">
          {isLogin ? 'Welcome Back' : 'Start Studying Free'}
        </button>
      </form>

      <button 
        onClick={() => setIsLogin(!isLogin)}
        className="text-indigo-600 font-bold text-sm hover:underline"
      >
        {isLogin ? "New here? Create Account" : "Already have an account? Login"}
      </button>
    </div>
  );
};

export default Auth;
