import React from 'react';
import { Stethoscope, Activity, Heart, CalendarCheck, History, User, ShieldAlert, Sparkles, LogOut } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onTriggerEmergency, currentUser, onLogout }) {
  const navItems = [
    { id: 'landing', label: 'Home', icon: Sparkles },
    { id: 'intake', label: 'Symptom Intake', icon: Stethoscope, badge: 'AI Triage' },
    { id: 'dashboard', label: 'Wellness Dashboard', icon: Activity },
    { id: 'guidance', label: 'Daily Plan', icon: CalendarCheck },
    { id: 'mental', label: 'Mental Health', icon: Heart, badge: 'Softer Mode' },
    { id: 'history', label: 'History & Profile', icon: History },
  ];

  const profile = currentUser?.profile || {};

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-health-600 to-teal-400 flex items-center justify-center shadow-lg shadow-health-500/20 group-hover:scale-105 transition-transform">
            <Stethoscope className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-health-300 transition-colors">
                VitalCheck
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-health-500/20 text-health-300 border border-health-500/30 font-medium">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">VIRTUAL HEALTH TECHNICIAN</p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'text-white bg-health-600/30 border border-health-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-health-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                    isActive ? 'bg-health-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Active User Badge & Actions */}
        <div className="flex items-center gap-2">
          {currentUser && (
            <div 
              onClick={() => setActiveTab('history')}
              className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs cursor-pointer hover:border-health-500/40 transition-colors"
              title="Click to edit health profile"
            >
              <div className="w-6 h-6 rounded-full bg-health-500/20 text-health-300 flex items-center justify-center font-bold text-[10px]">
                {profile.name ? profile.name[0] : 'P'}
              </div>
              <div className="text-left">
                <span className="font-bold text-white block text-[11px] leading-none">{profile.name || 'Patient'}</span>
                <span className="text-[9px] text-slate-400 leading-none">Age {profile.age || 34}</span>
              </div>
            </div>
          )}

          <button
            onClick={onTriggerEmergency}
            className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Immediate Emergency Helpline"
          >
            <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">Emergency</span>
          </button>
          
          <button
            onClick={() => setActiveTab('intake')}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-health-600 to-teal-500 hover:from-health-500 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-health-600/20 transition-all transform active:scale-95 flex items-center gap-1"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Intake</span>
          </button>

          {currentUser && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

      {/* Mobile Sub-Navigation Row */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-slate-800/60 bg-slate-950/80 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors ${
                isActive ? 'text-health-400 font-bold bg-health-500/10' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
