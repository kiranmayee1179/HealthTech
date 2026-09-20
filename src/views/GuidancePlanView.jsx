import React, { useState, useEffect } from 'react';
import { CalendarCheck, CheckCircle2, Circle, Wind, Droplets, Activity, Heart, ShieldAlert, Sparkles, Play, Pause, RotateCcw, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function GuidancePlanView({ logs = [], setActiveTab }) {
  // Check if low mood (<= 2) occurred for 3 or more days in recent logs
  const recent3 = logs.slice(-3);
  const isLowMoodTrend = recent3.length >= 3 && recent3.every(l => l.mood <= 2);

  const [tasks, setTasks] = useState([
    { id: 'task-1', title: 'Hydration Target', desc: 'Reach 2.5 Liters of fresh water today', icon: Droplets, completed: false, category: 'physical' },
    { id: 'task-2', title: '2-Minute Guided Box Breathing', desc: 'Inhale 4s, Hold 4s, Exhale 4s, Hold 4s', icon: Wind, completed: false, category: 'mental' },
    { id: 'task-3', title: 'Desk Ergonomics & Neck Stretch', desc: '3 gentle 30-second shoulder & cervical rolls', icon: Activity, completed: false, category: 'physical' },
    { id: 'task-4', title: 'Emotional Check-In Prompt', desc: 'Reflect on 1 positive thing or check in with Mental Mode', icon: Heart, completed: false, category: 'mental' },
  ]);

  // Breathing Timer state
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState('Inhale'); // Inhale, Hold, Exhale, Hold
  const [breathTimer, setBreathTimer] = useState(120); // 120 seconds total

  useEffect(() => {
    let interval;
    if (isBreathing && breathTimer > 0) {
      interval = setInterval(() => {
        setBreathTimer(prev => prev - 1);
      }, 1000);
    } else if (breathTimer === 0) {
      setIsBreathing(false);
      // Auto-complete breathing task
      toggleTask('task-2');
    }
    return () => clearInterval(interval);
  }, [isBreathing, breathTimer]);

  // Breath phase cycle every 4 seconds
  useEffect(() => {
    let cycle;
    if (isBreathing) {
      const phases = ['Inhale (4s)', 'Hold (4s)', 'Exhale (4s)', 'Rest (4s)'];
      let idx = 0;
      cycle = setInterval(() => {
        idx = (idx + 1) % phases.length;
        setBreathPhase(phases[idx]);
      }, 4000);
    }
    return () => clearInterval(cycle);
  }, [isBreathing]);

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextState = !t.completed;
        if (nextState) {
          // Trigger confetti effect
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 }
          });
        }
        return { ...t, completed: nextState };
      }
      return t;
    }));
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Personalized Daily Guidance Plan</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                Adaptive AI
              </span>
            </h2>
            <p className="text-xs text-slate-400">Tailored micro-habits based on your symptoms & health logs</p>
          </div>
        </div>

        {/* Progress Pill */}
        <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-medium block">Daily Progress</span>
            <span className="text-sm font-bold text-health-300">{completedCount} of {tasks.length} Completed</span>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-health-500 flex items-center justify-center text-xs font-bold text-white">
            {Math.round((completedCount / tasks.length) * 100)}%
          </div>
        </div>
      </div>

      {/* ADAPTIVE PLAN TRIGGER ALERT BANNER */}
      {isLowMoodTrend && (
        <div className="glass-panel p-6 rounded-2xl border-2 border-purple-500/60 bg-gradient-to-r from-purple-950/70 via-slate-900 to-purple-950/50 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-purple-300">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Adaptive AI Trigger: Low Mood Trend Detected</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 font-semibold">
              3+ Days Trigger
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">
            Your recent health logs indicate low mood for 3 consecutive days. We have automatically prioritized gentle mental wellness exercises and supportive resources into your guidance plan today.
          </p>
          <button
            onClick={() => setActiveTab('mental')}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Heart className="w-4 h-4" />
            <span>Open Mental Health Mode</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* INTERACTIVE BREATHING EXERCISE WIDGET */}
      <div className="glass-panel p-6 rounded-2xl border border-teal-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-teal-300" />
            <h3 className="text-sm font-bold text-white">2-Minute Box Breathing Exercise</h3>
          </div>
          <span className="text-xs font-mono text-teal-300 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            {Math.floor(breathTimer / 60)}:{(breathTimer % 60).toString().padStart(2, '0')}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          {/* Animated Circle */}
          <div className="flex flex-col items-center justify-center p-6 relative">
            <div className={`w-28 h-28 rounded-full bg-gradient-to-tr from-teal-500/30 to-health-400/20 border-2 border-teal-400 flex flex-col items-center justify-center text-center transition-all ${
              isBreathing ? 'animate-breath' : ''
            }`}>
              <span className="text-xs font-bold text-teal-200 uppercase tracking-widest">{breathPhase}</span>
            </div>
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <h4 className="text-xs font-semibold text-slate-200">How to practice Box Breathing:</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Breathe in deeply through your nose for 4 seconds, hold your lungs full for 4 seconds, exhale slowly through your mouth for 4 seconds, and rest for 4 seconds before repeating.
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
              <button
                onClick={() => setIsBreathing(!isBreathing)}
                className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                {isBreathing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isBreathing ? 'Pause' : 'Start Session'}</span>
              </button>

              <button
                onClick={() => {
                  setIsBreathing(false);
                  setBreathTimer(120);
                  setBreathPhase('Inhale');
                }}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DAILY ACTION TASKS CHECKLIST */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Today's Micro-Habit Checklist</h3>

        <div className="space-y-3">
          {tasks.map((task) => {
            const Icon = task.icon;
            return (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`glass-panel p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  task.completed
                    ? 'border-emerald-500/40 bg-emerald-950/20'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <button className="text-slate-400 hover:text-emerald-400 transition-colors">
                    {task.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-600" />
                    )}
                  </button>

                  <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-health-400">
                    <Icon className="w-4 h-4" />
                  </div>

                  <div>
                    <h4 className={`text-xs sm:text-sm font-bold ${task.completed ? 'text-slate-400 line-through' : 'text-white'}`}>
                      {task.title}
                    </h4>
                    <p className="text-[11px] text-slate-400">{task.desc}</p>
                  </div>
                </div>

                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                  task.completed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {task.completed ? 'Completed' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
