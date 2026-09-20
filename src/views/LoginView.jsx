import React, { useState } from 'react';
import { Stethoscope, Sparkles, Zap, ArrowRight, ShieldCheck, Lock, Mail, User, AlertCircle } from 'lucide-react';
import { loginUser, signupUser, demoLoginUser } from '../utils/storage';

export default function LoginView({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your full name.');
        const user = signupUser(email, password, name);
        onLoginSuccess(user);
      } else {
        const user = loginUser(email, password);
        onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleDemoClick = () => {
    const user = demoLoginUser();
    onLoginSuccess(user);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4 animate-fade-in">
      <div className="w-full max-w-md space-y-6">
        
        {/* BRAND HEADER */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-health-600 to-teal-400 flex items-center justify-center mx-auto shadow-xl shadow-health-500/20">
            <Stethoscope className="w-8 h-8 text-slate-950" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            VitalCheck <span className="bg-gradient-to-r from-health-300 to-teal-300 bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            AI-Powered Virtual Health Technician for intake, triage, & wellness guidance
          </p>
        </div>

        {/* ONE-CLICK DEMO ACCOUNT BUTTON FOR JUDGES */}
        <div className="glass-panel p-5 rounded-2xl border-2 border-health-500/50 bg-gradient-to-r from-slate-900 via-health-950/40 to-slate-900 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-health-300">
              <Zap className="w-4 h-4 fill-health-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">Fast Hackathon Judging</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-health-500/20 text-health-300 font-semibold border border-health-500/30">
              1-Click Ready
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Skip typing during judging! Log straight into pre-seeded <strong>Alex Demo</strong> (Age 34, mild asthma, 14 days of wellness charts & past triage history).
          </p>

          <button
            onClick={handleDemoClick}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-health-500 via-teal-400 to-emerald-400 hover:from-health-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-health-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Try Demo Account (Instant Login)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* REGULAR AUTH CARD */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          
          {/* TAB SWITCHER */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`py-2 rounded-lg transition-colors ${!isSignUp ? 'bg-health-600 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`py-2 rounded-lg transition-colors ${isSignUp ? 'bg-health-600 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {isSignUp && (
              <div>
                <label className="block font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Sarah Jenkins"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:border-health-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@vitalcheck.ai"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:border-health-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:border-health-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>{isSignUp ? 'Create Health Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* DEMO CREDENTIALS HINT */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Demo Credentials: <strong>demo@vitalcheck.ai</strong> / <strong>Demo1234</strong></span>
        </div>

      </div>
    </div>
  );
}
