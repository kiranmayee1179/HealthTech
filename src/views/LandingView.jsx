import React from 'react';
import { Stethoscope, Activity, Heart, ShieldCheck, ArrowRight, Sparkles, CheckCircle2, Clock, AlertTriangle, Users } from 'lucide-react';

export default function LandingView({ setActiveTab, onStartIntakeWithText }) {
  const quickSymptoms = [
    "Dull headache after long screen time",
    "Sneezing & watery eyes since morning",
    "Sore neck & shoulder tightness",
    "Mild fatigue & trouble sleeping",
  ];

  return (
    <div className="space-y-16 py-6 animate-fade-in">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl glass-panel p-8 sm:p-12 border border-health-500/20">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-health-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-health-500/10 border border-health-500/30 text-health-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-health-400" />
            <span>AI Virtual Health Technician • HealthTech Hackathon Ready</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Calm, Competent <span className="bg-gradient-to-r from-health-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent">Health Intake & Guidance</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            VitalCheck AI asks smart, careful follow-up questions before triaging your symptoms, tracking daily health signals, and generating personalized care plans — always putting safety first.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <button
              onClick={() => setActiveTab('intake')}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-health-600 to-teal-500 hover:from-health-500 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-health-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <Stethoscope className="w-5 h-5" />
              <span>Start AI Symptom Intake</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Activity className="w-5 h-5 text-health-400" />
              <span>View Wellness Dashboard</span>
            </button>
          </div>

          {/* Quick Start Chips */}
          <div className="pt-4 border-t border-slate-800/80">
            <p className="text-xs font-semibold text-slate-400 mb-2">Try a sample symptom prompt:</p>
            <div className="flex flex-wrap gap-2">
              {quickSymptoms.map((sym, i) => (
                <button
                  key={i}
                  onClick={() => onStartIntakeWithText(sym)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-health-950/60 border border-slate-800 hover:border-health-500/40 text-xs text-slate-300 hover:text-white transition-all text-left flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-health-400 shrink-0" />
                  <span>"{sym}"</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* CORE VALUE PROPOSITION CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 glass-card-hover">
          <div className="w-12 h-12 rounded-xl bg-health-500/10 border border-health-500/30 flex items-center justify-center text-health-400">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Smart 2-4 Step Intake</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Unlike one-shot search engines, VitalCheck AI asks clarifying follow-up questions about severity, duration, and associated signs before offering triage.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 glass-card-hover">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Safety-First Triage Cards</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Categorizes urgency into clear bands (Self-Care, See Doctor Soon, Urgent Care Now) and lists plausible general possibilities without claiming diagnosis.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 glass-card-hover">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Mental Health & Wellness</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Integrates mood and sleep tracking, adaptive daily action plans, and a dedicated softer emotional check-in mode with built-in crisis safeguards.
          </p>
        </div>

      </section>

      {/* HOW VITALCHECK AI WORKS (STEP-BY-STEP) */}
      <section className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-white">How VitalCheck AI Works</h2>
          <p className="text-xs text-slate-400">Designed to mirror a real healthcare intake technician's protocol</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
          
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-health-500/20 text-health-300 text-xs font-bold flex items-center justify-center">1</div>
            <h4 className="font-semibold text-slate-200 text-sm">Describe Symptoms</h4>
            <p className="text-xs text-slate-400">Speak naturally about how you feel in plain language.</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-health-500/20 text-health-300 text-xs font-bold flex items-center justify-center">2</div>
            <h4 className="font-semibold text-slate-200 text-sm">AI Follow-Up Questions</h4>
            <p className="text-xs text-slate-400">AI clarifies duration, severity scale, and accompanying symptoms.</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-health-500/20 text-health-300 text-xs font-bold flex items-center justify-center">3</div>
            <h4 className="font-semibold text-slate-200 text-sm">Structured Triage Card</h4>
            <p className="text-xs text-slate-400">Get clear urgency levels, plausible possibilities, and next steps.</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-health-500/20 text-health-300 text-xs font-bold flex items-center justify-center">4</div>
            <h4 className="font-semibold text-slate-200 text-sm">Adaptive Care Plan</h4>
            <p className="text-xs text-slate-400">Log daily signals to receive personalized wellness guidance.</p>
          </div>

        </div>
      </section>

      {/* TRUST & DISCLAIMER HIGHLIGHT BANNER */}
      <section className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <ShieldCheck className="w-10 h-10 text-emerald-400 shrink-0" />
          <div>
            <h4 className="font-semibold text-white text-sm">Demo-Safe & Privacy Focused</h4>
            <p className="text-xs text-slate-400">All data remains stored locally in your browser. VitalCheck AI does not store real protected health information.</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('intake')}
          className="px-5 py-2.5 rounded-lg bg-health-600 hover:bg-health-500 text-slate-950 font-bold text-xs whitespace-nowrap transition-colors"
        >
          Begin Intake Now
        </button>
      </section>

    </div>
  );
}
