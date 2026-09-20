import React, { useState } from 'react';
import { History, User, ShieldCheck, Save, RotateCcw, Stethoscope, ChevronRight, Check, Trash2, Sparkles, AlertCircle } from 'lucide-react';
import { saveUserProfile, getTriageHistory, resetAllData } from '../utils/storage';

export default function HistoryProfileView({ userProfile, onUpdateProfile, onDataReset, setActiveTab }) {
  const [profile, setProfile] = useState(userProfile || {});
  const [history, setHistory] = useState(getTriageHistory());
  const [isSaved, setIsSaved] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const conditionOptions = [
    'Diabetes',
    'Asthma',
    'Heart Condition',
    'High Blood Pressure',
    'None',
  ];

  const toggleCondition = (cond) => {
    let current = Array.isArray(profile.existingConditions) ? profile.existingConditions : [];
    if (cond === 'None') {
      setProfile({ ...profile, existingConditions: ['None'] });
      return;
    }
    current = current.filter(c => c !== 'None');
    const exists = current.includes(cond);
    const updated = exists ? current.filter(c => c !== cond) : [...current, cond];
    setProfile({ ...profile, existingConditions: updated });
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updated = saveUserProfile(profile);
    if (onUpdateProfile) onUpdateProfile(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleResetData = () => {
    if (window.confirm("Reset all local health logs and triage history to default demo seeds?")) {
      const reset = resetAllData();
      setProfile(reset.profile);
      setHistory(reset.triageHistory || []);
      if (onDataReset) onDataReset(reset);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-health-500/20 border border-health-500/40 flex items-center justify-center text-health-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Intake History & Health Profile</h2>
            <p className="text-xs text-slate-400">Manage patient demographics and review past triage records</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Stored Locally • Demo Only</span>
        </div>
      </div>

      {/* LIVE DEMO MOMENT BANNER */}
      <div className="glass-panel p-5 rounded-2xl border-2 border-health-500/40 bg-gradient-to-r from-slate-900 via-health-950/30 to-slate-900 space-y-2">
        <div className="flex items-center gap-2 text-health-300">
          <Sparkles className="w-4 h-4 text-health-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Live Judging Moment</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Change age (e.g., from 34 to 68) or add <strong>High Blood Pressure</strong> below, then start a new symptom intake. The AI technician will visibly adapt its caution and triage urgency to the updated profile!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* EDIT PROFILE FORM */}
        <div className="md:col-span-1 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-health-400" />
              <h3 className="text-sm font-bold text-white">Edit Profile</h3>
            </div>
          </div>

          {isSaved && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
              <Check className="w-4 h-4" />
              <span>Profile Updated! AI Prompts Adapted.</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Age (Years)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={profile.age || 34}
                onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 34 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold text-health-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Pre-Existing Conditions</label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {conditionOptions.map((cond) => {
                  const currentConds = Array.isArray(profile.existingConditions) ? profile.existingConditions : [];
                  const isSelected = currentConds.includes(cond);
                  return (
                    <button
                      type="button"
                      key={cond}
                      onClick={() => toggleCondition(cond)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                        isSelected
                          ? 'bg-health-600/30 border-health-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cond}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Current Medications</label>
              <input
                type="text"
                value={profile.medications || ''}
                onChange={(e) => setProfile({ ...profile, medications: e.target.value })}
                placeholder="e.g. Albuterol, Lisinopril"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-health-600 to-teal-500 hover:from-health-500 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Save & Adapt AI Profile</span>
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={handleResetData}
              className="w-full py-2 rounded-lg bg-red-950/40 hover:bg-red-950/80 border border-red-900/40 text-red-400 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Seed Data</span>
            </button>
          </div>
        </div>

        {/* PAST TRIAGE TIMELINE */}
        <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-health-400" />
              <span>Past Symptom Check-Ins ({history.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Click entry to expand details</span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {history.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8">No intake history recorded yet.</p>
            ) : (
              history.map((entry) => {
                const isSelected = selectedEntry?.id === entry.id;
                return (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedEntry(isSelected ? null : entry)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-health-500/60 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                            entry.urgency === 'Self-Care' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                            entry.urgency === 'See a Doctor Soon' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                            'bg-red-500/20 text-red-300 border-red-500/40'
                          }`}>
                            {entry.urgency}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(entry.date).toLocaleDateString()} {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{entry.symptomSummary}</h4>
                      </div>

                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>

                    {isSelected && (
                      <div className="mt-4 pt-3 border-t border-slate-800 space-y-3 text-xs animate-fade-in">
                        <div>
                          <span className="font-semibold text-slate-300 block mb-1">Plausible Possibilities:</span>
                          <ul className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                            {entry.explanations?.map((exp, i) => (
                              <li key={i} className="text-slate-400 text-[11px] flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-health-400" />
                                <span>{exp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <span className="font-semibold text-slate-300 block mb-1">Next Steps Guidance:</span>
                          <p className="text-slate-300 bg-health-950/20 p-2.5 rounded-lg border border-health-500/30 text-[11px] leading-relaxed">
                            {entry.nextSteps}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
