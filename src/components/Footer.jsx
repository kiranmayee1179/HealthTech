import React from 'react';
import { ShieldCheck, PhoneCall, Info } from 'lucide-react';

export default function Footer({ onTriggerEmergency }) {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800/80 py-8 px-4 mt-16 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Mandatory Disclaimer Box */}
        <div className="flex items-start gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800 max-w-3xl">
          <Info className="w-5 h-5 text-health-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-slate-200">Persistent Safety Disclaimer</h4>
            <p className="leading-relaxed text-slate-400">
              VitalCheck AI provides general health educational guidance only and is <span className="text-white font-medium">not a substitute for professional medical advice, diagnosis, or treatment</span>. Always consult a qualified healthcare provider for medical concerns. In India, call 112 for a medical emergency.
            </p>
          </div>
        </div>

        {/* Emergency Quick Hotlines */}
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <button
            onClick={onTriggerEmergency}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-red-950/60 border border-red-800/50 text-red-300 hover:bg-red-900/40 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <PhoneCall className="w-4 h-4 text-red-400 animate-pulse" />
            <span>India Emergency & Crisis Helplines</span>
          </button>
          
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Local Storage Demo • No HIPAA Data Saved</span>
          </div>
        </div>

      </div>
      <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-slate-900 text-center text-slate-400 text-[11px]">
        VitalCheck AI • Hackathon HealthTech Track • Built for city health & wellness empowerment
      </div>
    </footer>
  );
}
