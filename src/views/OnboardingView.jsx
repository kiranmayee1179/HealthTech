import React, { useState } from 'react';
import { User, Activity, Heart, ShieldCheck, Check, ArrowRight, Sparkles, Scale } from 'lucide-react';
import { saveUserProfile } from '../utils/storage';

export default function OnboardingView({ userProfile, onCompleteOnboarding }) {
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    age: userProfile?.age || 30,
    ageRange: userProfile?.ageRange || '25-34',
    gender: userProfile?.gender || 'Prefer not to say',
    existingConditions: userProfile?.existingConditions || [],
    otherCondition: '',
    medications: userProfile?.medications || '',
    heightCm: userProfile?.heightCm || 170,
    weightKg: userProfile?.weightKg || 70,
    allergies: userProfile?.allergies || 'None',
  });

  const conditionOptions = [
    'Diabetes',
    'Asthma',
    'Heart Condition',
    'High Blood Pressure',
    'None',
  ];

  const toggleCondition = (cond) => {
    if (cond === 'None') {
      setFormData(prev => ({ ...prev, existingConditions: ['None'] }));
      return;
    }
    setFormData(prev => {
      const current = prev.existingConditions.filter(c => c !== 'None');
      const exists = current.includes(cond);
      const updated = exists ? current.filter(c => c !== cond) : [...current, cond];
      return { ...prev, existingConditions: updated };
    });
  };

  // Calculate live BMI
  const heightMeters = formData.heightCm / 100;
  const bmiVal = heightMeters > 0 ? (formData.weightKg / (heightMeters * heightMeters)).toFixed(1) : 0;
  let bmiCategory = 'Normal';
  if (bmiVal < 18.5) bmiCategory = 'Underweight';
  else if (bmiVal >= 25 && bmiVal < 30) bmiCategory = 'Overweight';
  else if (bmiVal >= 30) bmiCategory = 'Obese';

  const handleSubmit = (e) => {
    e.preventDefault();
    let finalConditions = [...formData.existingConditions];
    if (formData.otherCondition.trim()) {
      finalConditions.push(formData.otherCondition.trim());
    }

    const updatedProfile = saveUserProfile({
      ...formData,
      existingConditions: finalConditions,
      bmi: `${bmiVal} (${bmiCategory})`,
      isOnboarded: true,
    });

    onCompleteOnboarding(updatedProfile);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in space-y-6">
      
      {/* HEADER */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-health-500/10 border border-health-500/30 text-health-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-health-400" />
          <span>One-Time Health Profile Setup</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Welcome to VitalCheck AI</h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
          Please complete your baseline health profile. This allows our AI technician to provide personalized, age- & condition-aware triage guidance.
        </p>
      </div>

      {/* FORM CARD */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 text-xs">
        
        {/* BASIC DEMOGRAPHICS */}
        <div className="space-y-4 border-b border-slate-800 pb-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-health-400" />
            <span>1. Basic Patient Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Alex Demo"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Age (Years)</label>
              <input
                type="number"
                required
                min="1"
                max="120"
                value={formData.age}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 30;
                  let range = '25-34';
                  if (val < 25) range = '18-24';
                  else if (val >= 35 && val < 45) range = '35-44';
                  else if (val >= 45 && val < 55) range = '45-54';
                  else if (val >= 55) range = '55+';
                  setFormData({ ...formData, age: val, ageRange: range });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Biological Sex</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Intersex">Intersex</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </div>

        {/* EXISTING CONDITIONS (MULTI-SELECT) */}
        <div className="space-y-3 border-b border-slate-800 pb-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-health-400" />
            <span>2. Pre-Existing Conditions (Personalizes AI Triage Caution)</span>
          </h3>

          <div className="flex flex-wrap gap-2 pt-1">
            {conditionOptions.map((cond) => {
              const isSelected = formData.existingConditions.includes(cond);
              return (
                <button
                  type="button"
                  key={cond}
                  onClick={() => toggleCondition(cond)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-health-600/30 border-health-500 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-health-400" />}
                  <span>{cond}</span>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block font-medium text-slate-400 mb-1">Other Condition (Optional)</label>
            <input
              type="text"
              value={formData.otherCondition}
              onChange={(e) => setFormData({ ...formData, otherCondition: e.target.value })}
              placeholder="e.g. Migraines, Thyroid"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600"
            />
          </div>
        </div>

        {/* MEDICATIONS & BIOMETRICS */}
        <div className="space-y-4 border-b border-slate-800 pb-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-health-400" />
            <span>3. Medications & Biometrics</span>
          </h3>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Current Medications (Optional)</label>
            <input
              type="text"
              value={formData.medications}
              onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
              placeholder="e.g. Albuterol inhaler, Multivitamin"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Height (cm)</label>
              <input
                type="number"
                min="100"
                max="250"
                value={formData.heightCm}
                onChange={(e) => setFormData({ ...formData, heightCm: parseInt(e.target.value) || 170 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Weight (kg)</label>
              <input
                type="number"
                min="30"
                max="250"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: parseInt(e.target.value) || 70 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* Live BMI Preview Card */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-medium">Calculated BMI Index:</span>
            <span className="text-sm font-bold text-teal-300">{bmiVal} ({bmiCategory})</span>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-health-600 to-teal-500 hover:from-health-500 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-health-600/20 flex items-center justify-center gap-2 transition-all"
        >
          <span>Complete Profile & Access VitalCheck AI</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </form>

    </div>
  );
}
