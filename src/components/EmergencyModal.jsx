import React from 'react';
import { ShieldAlert, PhoneCall, AlertTriangle, X, ExternalLink } from 'lucide-react';

export default function EmergencyModal({ isOpen, onClose, data }) {
  if (!isOpen) return null;

  const title = data?.emergencyTitle || 'IMMEDIATE EMERGENCY ALERT';
  const message = data?.emergencyMessage || 'Your described symptoms or statement suggest a high-risk medical emergency or crisis.';
  const actions = data?.actions || [
    'Call 112 (India emergency services) immediately.',
    'For mental-health crisis support in India, call Tele-MANAS at 14416.',
    'Go directly to the nearest Emergency Room.'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border-2 border-red-500/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-red-950/50 space-y-6 relative overflow-hidden">
        
        {/* Glow Header Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
        
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-7 h-7 animate-bounce" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-slate-950 uppercase tracking-widest mb-1">
                Urgent Action Required
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Message */}
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-900/60 text-red-200 text-sm leading-relaxed flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p>{message}</p>
        </div>

        {/* Direct Tap-to-Call Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="tel:112"
            className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-center flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all transform active:scale-95"
          >
            <PhoneCall className="w-5 h-5" />
            <span>Call 112 (India Emergency)</span>
          </a>

          <a
            href="tel:14416"
            className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-center flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all transform active:scale-95"
          >
            <PhoneCall className="w-5 h-5" />
            <span>Call 14416 (Tele-MANAS)</span>
          </a>
        </div>

        {/* Recommended Immediate Actions */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Immediate Guidance Steps:</h4>
          <ul className="space-y-2">
            {actions.map((act, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Global Directory Link */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Need another region? Find a local helpline:</span>
          <a
            href="https://findahelpline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-health-400 hover:underline flex items-center gap-1 font-medium"
          >
            <span>findahelpline.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </div>
  );
}
