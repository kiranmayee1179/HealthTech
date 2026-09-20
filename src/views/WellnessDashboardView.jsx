import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Activity, Plus, Moon, Droplets, Footprints, Smile, Sparkles, Calendar, TrendingUp, Filter, AlertCircle, X, Check } from 'lucide-react';
import { getWellnessLogs, saveWellnessLog } from '../utils/storage';
import { generateWeeklySummaryAI } from '../services/aiService';

export default function WellnessDashboardView({ onUpdateLogs }) {
  const [logs, setLogs] = useState([]);
  const [timeframe, setTimeframe] = useState(7); // 7 or 30 days
  const [showLogModal, setShowLogModal] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // New Log Form State
  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split('T')[0],
    mood: 4,
    moodLabel: 'Good',
    sleepHours: 7.5,
    waterLiters: 2.2,
    steps: 7500,
    exerciseMinutes: 30,
    symptoms: ''
  });

  useEffect(() => {
    const loaded = getWellnessLogs();
    setLogs(loaded);
    fetchAiSummary(loaded);
  }, []);

  const fetchAiSummary = async (currentLogs) => {
    setIsGeneratingSummary(true);
    try {
      const summary = await generateWeeklySummaryAI(currentLogs);
      setAiSummary(summary);
    } catch (err) {
      console.error('Error loading AI summary:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSaveLog = (e) => {
    e.preventDefault();
    const updated = saveWellnessLog(newLog);
    setLogs(updated);
    if (onUpdateLogs) onUpdateLogs(updated);
    setShowLogModal(false);
    fetchAiSummary(updated);
  };

  const displayData = logs.slice(-timeframe).map(item => ({
    ...item,
    formattedDate: item.date ? item.date.substring(5) : '',
  }));
  const hasLogs = logs.length > 0;

  const moodLabels = ['Very Low', 'Low', 'Neutral', 'Good', 'Great'];

  return (
    <div className="space-y-8 py-4 animate-fade-in">
      
      {/* TOP DASHBOARD HEADER & QUICK STATS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-health-400" />
            <span>Wellness & Health Signal Dashboard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Track daily biometric signals, mood trends, and AI wellness summaries</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setTimeframe(7)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                timeframe === 7 ? 'bg-health-600 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeframe(30)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                timeframe === 30 ? 'bg-health-600 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              30 Days
            </button>
          </div>

          <button
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-health-600 to-teal-500 hover:from-health-500 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-health-600/20 flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Log Today's Signals</span>
          </button>
        </div>
      </div>

      {/* AI WEEKLY SUMMARY CARD */}
      <div className="glass-panel p-6 rounded-2xl border border-health-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-health-950/40 relative overflow-hidden space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-health-500/20 border border-health-500/40 flex items-center justify-center text-health-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Weekly Health Summary</h3>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-health-500/20 text-health-300 border border-health-500/30 font-medium">
            Personalized Insights
          </span>
        </div>

        {isGeneratingSummary ? (
          <p className="text-xs text-slate-400 italic">Synthesizing recent health logs...</p>
        ) : (
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {aiSummary?.summaryText || "Keep logging daily signals to generate deeper AI health trend summaries."}
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium block">Avg Sleep (7d)</span>
            <span className="text-base font-bold text-teal-300">{aiSummary?.avgSleep || '--'}{aiSummary?.avgSleep ? ' hrs' : ''}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium block">Avg Mood Score</span>
            <span className="text-base font-bold text-emerald-300">{aiSummary?.avgMood || '--'}{aiSummary?.avgMood ? '/5' : ''}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium block">Active Logging</span>
            <span className="text-base font-bold text-health-300">{logs.length} Days</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium block">Guidance Status</span>
            <span className="text-base font-bold text-purple-300">Adaptive Active</span>
          </div>
        </div>
      </div>

      {!hasLogs && (
        <div className="glass-panel p-6 rounded-2xl border border-health-500/40 bg-health-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-health-400" />
              Your wellness dashboard is ready
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              There are no health records for this account yet. Add your first daily check-in to start seeing mood, sleep, hydration, activity, and symptom trends here.
            </p>
            <p className="text-xs text-slate-400">Your entries stay linked to this account and can be updated later.</p>
          </div>
          <button
            onClick={() => setShowLogModal(true)}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-health-600 hover:bg-health-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log First Check-in
          </button>
        </div>
      )}

      {/* TREND CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Mood & Sleep Dual-Axis Line Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smile className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Mood & Sleep Trends</h3>
            </div>
            <span className="text-[11px] text-slate-400">Scale: Mood (1-5), Sleep (hrs)</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="formattedDate" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" domain={[1, 5]} stroke="#10b981" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 12]} stroke="#38bdf8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line yAxisId="left" type="monotone" dataKey="mood" name="Mood Score (1-5)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="sleepHours" name="Sleep (Hours)" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Water & Movement Bar Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Water Intake & Steps</h3>
            </div>
            <span className="text-[11px] text-slate-400">Daily Hydration & Activity</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="formattedDate" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" domain={[0, 4]} stroke="#06b6d4" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 12000]} stroke="#22c55e" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="waterLiters" name="Water (Liters)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="steps" name="Steps" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* RECENT LOG TABLE */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Recent Health Log History</h3>
          <span className="text-xs text-slate-400">Showing last {timeframe} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Mood</th>
                <th className="py-2.5 px-3">Sleep</th>
                <th className="py-2.5 px-3">Water</th>
                <th className="py-2.5 px-3">Steps</th>
                <th className="py-2.5 px-3">Logged Symptoms / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.slice(-7).reverse().map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-300">{log.date}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded font-semibold ${
                      log.mood >= 4 ? 'bg-emerald-500/20 text-emerald-300' :
                      log.mood === 3 ? 'bg-amber-500/20 text-amber-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {log.mood}/5 ({log.moodLabel || moodLabels[log.mood - 1]})
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{log.sleepHours} hrs</td>
                  <td className="py-3 px-3 text-cyan-300">{log.waterLiters} L</td>
                  <td className="py-3 px-3 text-emerald-300">{log.steps?.toLocaleString()}</td>
                  <td className="py-3 px-3 text-slate-400 italic max-w-xs truncate">{log.symptoms || 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOG MODAL OVERLAY */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-health-400" />
                <span>Log Daily Health Signals</span>
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={newLog.date}
                    onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Mood Score (1-5)</label>
                  <select
                    value={newLog.mood}
                    onChange={(e) => {
                      const m = parseInt(e.target.value);
                      setNewLog({ ...newLog, mood: m, moodLabel: moodLabels[m - 1] });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value={5}>5 - Great / Energetic</option>
                    <option value={4}>4 - Good / Normal</option>
                    <option value={3}>3 - Neutral / Okay</option>
                    <option value={2}>2 - Low / Tired</option>
                    <option value={1}>1 - Very Low / Anxious</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Sleep (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="16"
                    value={newLog.sleepHours}
                    onChange={(e) => setNewLog({ ...newLog, sleepHours: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Water (Liters)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="6"
                    value={newLog.waterLiters}
                    onChange={(e) => setNewLog({ ...newLog, waterLiters: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Steps Count</label>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    max="50000"
                    value={newLog.steps}
                    onChange={(e) => setNewLog({ ...newLog, steps: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Symptoms or Daily Notes</label>
                <textarea
                  rows="2"
                  value={newLog.symptoms}
                  onChange={(e) => setNewLog({ ...newLog, symptoms: e.target.value })}
                  placeholder="e.g. Mild tension in shoulders, drank extra herbal tea"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-health-600 hover:bg-health-500 text-slate-950 font-bold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Log</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
