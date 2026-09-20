import React, { useState, useEffect, useRef } from 'react';
import { Stethoscope, Send, User, Bot, ShieldAlert, CheckCircle2, RotateCcw, Sparkles, HelpCircle, PhoneCall, Info, Globe, Square, Pencil, RefreshCw, PanelLeft, Plus } from 'lucide-react';
import { streamIntakeMessage } from '../services/aiService';
import { saveTriageEntry } from '../utils/storage';
import MarkdownText from '../components/MarkdownText';
import ChatSidebar from '../components/ChatSidebar';

export default function IntakeChatView({ initialPrompt, userProfile, onTriageComplete }) {
  const [selectedLanguage, setSelectedLanguage] = useState('Auto');
  const [sessions, setSessions] = useState([
    { id: 'sess-1', title: 'Screen Headache Intake', date: new Date().toISOString() }
  ]);
  const [activeSessionId, setActiveSessionId] = useState('sess-1');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 'msg-init',
      role: 'assistant',
      content: `Hello ${userProfile?.name ? userProfile.name.split(' ')[0] : 'there'}. I'm your VitalCheck AI health technician. Please describe how you feel in English, Tenglish, or your preferred language.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState(initialPrompt || '');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyData, setEmergencyData] = useState(null);
  const [triageCard, setTriageCard] = useState(null);

  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, isStreaming, triageCard, isEmergency]);

  useEffect(() => {
    if (initialPrompt && messages.length === 1) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || isStreaming || isEmergency) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);
    setStreamingText('');

    abortControllerRef.current = new AbortController();

    try {
      await streamIntakeMessage(
        newMessages,
        userProfile,
        selectedLanguage,
        (currentAccumulated) => {
          setStreamingText(currentAccumulated);
        },
        (finalObj, finalAccumulated) => {
          setIsStreaming(false);

          if (finalObj.isEmergency) {
            setIsEmergency(true);
            setEmergencyData(finalObj);
            return;
          }

          if (finalObj.isFinalTriage && finalObj.triageCard) {
            setTriageCard(finalObj.triageCard);

            setMessages(prev => [
              ...prev,
              {
                id: `msg-final-${Date.now()}`,
                role: 'assistant',
                content: finalAccumulated || finalObj.triageCard.summary || "Here is your completed triage card:",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);

            saveTriageEntry({
              symptomSummary: finalObj.triageCard.summary || text.substring(0, 70),
              urgency: finalObj.triageCard.urgency,
              urgencyColor: finalObj.triageCard.urgencyColor,
              explanations: finalObj.triageCard.explanations,
              nextSteps: finalObj.triageCard.nextSteps,
              messagesCount: newMessages.length,
            });

          } else {
            setMessages(prev => [
              ...prev,
              {
                id: `msg-ai-${Date.now()}`,
                role: 'assistant',
                content: finalAccumulated || finalObj.followUpQuestion || `Could you clarify how long you've had this symptom?`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          }

          setStreamingText('');
        },
        abortControllerRef.current.signal
      );
    } catch (err) {
      console.error('Error during streaming intake:', err);
      setIsStreaming(false);
      setStreamingText('');
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      if (streamingText) {
        setMessages(prev => [
          ...prev,
          {
            id: `msg-stopped-${Date.now()}`,
            role: 'assistant',
            content: `${streamingText} [Generation stopped by user]`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setStreamingText('');
      }
    }
  };

  const handleRegenerate = () => {
    if (isStreaming || messages.length <= 1) return;
    const lastUserIdx = messages.findLastIndex(m => m.role === 'user');
    if (lastUserIdx !== -1) {
      const sliced = messages.slice(0, lastUserIdx);
      const lastUserContent = messages[lastUserIdx].content;
      setMessages(sliced);
      setTriageCard(null);
      handleSend(lastUserContent);
    }
  };

  const handleEditMessage = (index) => {
    if (isStreaming) return;
    const msgToEdit = messages[index];
    if (msgToEdit && msgToEdit.role === 'user') {
      setInput(msgToEdit.content);
      const sliced = messages.slice(0, index);
      setMessages(sliced);
      setTriageCard(null);
    }
  };

  const handleNewChat = () => {
    handleStopGeneration();
    const newId = `sess-${Date.now()}`;
    setSessions(prev => [{ id: newId, title: `Intake Session #${prev.length + 1}`, date: new Date().toISOString() }, ...prev]);
    setActiveSessionId(newId);
    setMessages([
      {
        id: 'msg-new-init',
        role: 'assistant',
        content: `New intake session started. Please describe how you feel in basic English or your preferred language.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setInput('');
    setIsEmergency(false);
    setEmergencyData(null);
    setTriageCard(null);
  };

  const presetSymptoms = [
    "🌟 Ee symptoms enduku vasthayo chepthara?", // Tenglish direct question test!
    "🌟 Naaku 2 days nundi thala noppiga undi", // Tenglish symptom test
    "🌟 Mujhe 2 din se sar dard hai", // Hinglish
    "Why does this screen headache happen?", // English question test
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 animate-fade-in">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-health-500/40 text-slate-300 hover:text-white transition-colors"
            title="Open Chat Sessions History"
          >
            <PanelLeft className="w-5 h-5 text-health-400" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-health-500/20 border border-health-500/40 flex items-center justify-center text-health-400 shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Symptom Intake Agent</span>
              <span className="text-xs px-2 py-0.5 rounded bg-health-500/20 text-health-300 font-semibold">
                Direct Q&A & Tenglish
              </span>
            </h2>
            <p className="text-xs text-slate-400">Answers direct questions first • No template fillers • Language lock</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          
          <button
            onClick={handleNewChat}
            className="px-3 py-1.5 rounded-lg bg-health-600 hover:bg-health-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200">
            <Globe className="w-3.5 h-3.5 text-health-400 shrink-0" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="Auto">🌐 Auto-Detect & Match</option>
              <option value="Telugu_Tenglish">🇮🇳 Telugu (Tenglish / Romanized)</option>
              <option value="Telugu_Native">🇮🇳 Telugu (తెలుగు Script)</option>
              <option value="Hindi_Hinglish">🇮🇳 Hindi (Hinglish / Romanized)</option>
              <option value="Hindi_Native">🇮🇳 Hindi (हिन्दी Script)</option>
              <option value="English">🇺🇸 Basic English</option>
              <option value="Spanish">🇪🇸 Español</option>
              <option value="French">🇫🇷 Français</option>
            </select>
          </div>

        </div>
      </div>

      <ChatSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewChat={handleNewChat}
        onDeleteSession={(id) => setSessions(prev => prev.filter(s => s.id !== id))}
      />

      {isEmergency && (
        <div className="p-6 rounded-2xl bg-red-950/90 border-2 border-red-500 text-white space-y-4 shadow-2xl shadow-red-950/50 animate-fade-in">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-8 h-8 text-red-400 shrink-0 animate-bounce mt-1" />
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-red-200">
                {emergencyData?.emergencyTitle || 'CRITICAL EMERGENCY DETECTED'}
              </h3>
              <p className="text-xs text-red-300 leading-relaxed">
                {emergencyData?.emergencyMessage}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <a
              href="tel:112"
              className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-center flex items-center justify-center gap-2 shadow-lg text-sm"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call 112 (India Emergency)</span>
            </a>
            <a
              href="tel:14416"
              className="py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-center flex items-center justify-center gap-2 shadow-lg text-sm"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call 14416 (Tele-MANAS)</span>
            </a>
          </div>
        </div>
      )}

      {/* MESSAGES CONTAINER */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-4 sm:p-6 min-h-[400px] max-h-[520px] overflow-y-auto space-y-5">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`group flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  isUser
                    ? 'bg-slate-700 text-slate-200 border border-slate-600'
                    : 'bg-gradient-to-tr from-health-600 to-teal-400 text-slate-950 shadow-md shadow-health-500/20'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="max-w-[82%] sm:max-w-[78%] space-y-1">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-health-600/30 text-slate-100 border border-health-500/40 rounded-tr-none'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-slate-800/60">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {isUser ? (userProfile?.name || 'You') : 'VitalCheck AI Tech'}
                    </span>
                    <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                  </div>

                  <MarkdownText content={msg.content} />
                </div>

                <div className={`flex items-center gap-2 px-1 text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {isUser ? (
                    <button
                      onClick={() => handleEditMessage(index)}
                      className="hover:text-health-300 flex items-center gap-1 transition-colors"
                      title="Edit this prompt"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit Prompt</span>
                    </button>
                  ) : (
                    index === messages.length - 1 && !isStreaming && (
                      <button
                        onClick={handleRegenerate}
                        className="hover:text-health-300 flex items-center gap-1 transition-colors"
                        title="Regenerate AI response"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Regenerate Response</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isStreaming && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-health-600 to-teal-400 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
              <Bot className="w-4 h-4" />
            </div>

            <div className="max-w-[80%] p-4 rounded-2xl bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none text-xs sm:text-sm leading-relaxed shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-slate-800/60">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <span>VitalCheck AI Tech</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-health-400 animate-ping" />
                </span>
                <span className="text-[9px] text-health-400 font-mono">Streaming...</span>
              </div>

              {streamingText ? (
                <MarkdownText content={streamingText} />
              ) : (
                <div className="flex items-center gap-1.5 py-1 text-slate-400 text-xs italic">
                  <span className="w-2 h-2 rounded-full bg-health-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-health-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-health-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-2">Evaluating intent & generating response...</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {triageCard && (
        <div className="glass-panel p-6 rounded-2xl border-2 border-health-500/50 space-y-5 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 shadow-2xl animate-slide-up">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-health-400" />
              <h3 className="text-base font-bold text-white">VitalCheck Triage Card</h3>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 font-mono">
              Intake #{Math.floor(1000 + Math.random() * 9000)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 gap-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Urgency Level</span>
              <div className="flex items-center gap-2">
                <span className={`text-base font-extrabold ${
                  triageCard.urgencyColor === 'green' ? 'text-emerald-400' :
                  triageCard.urgencyColor === 'amber' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {triageCard.urgency}
                </span>
              </div>
            </div>

            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
              triageCard.urgencyColor === 'green' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' :
              triageCard.urgencyColor === 'amber' ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' :
              'bg-red-500/10 border-red-500/40 text-red-300'
            }`}>
              {triageCard.urgency}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-health-400" />
              <span>Explanations:</span>
            </h4>
            <ul className="space-y-1.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              {triageCard.explanations?.map((exp, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-health-400 shrink-0 mt-1.5" />
                  <span>{exp}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Recommended Next Steps:</h4>
            <div className="p-4 rounded-xl bg-health-950/30 border border-health-500/30 text-slate-200 text-xs leading-relaxed">
              {triageCard.nextSteps}
            </div>
          </div>
        </div>
      )}

      {/* MULTILINE INPUT AREA */}
      {!isEmergency && (
        <div className="space-y-3">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-health-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Live Hackathon Presets:</span>
            </span>
            {presetSymptoms.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setInput(preset.replace('🌟 ', ''))}
                className="text-[11px] px-2.5 py-1 rounded-md bg-slate-900 hover:bg-health-950/60 border border-slate-800 hover:border-health-500/50 text-slate-200 font-medium transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-2xl focus-within:border-health-500/60 transition-colors relative"
          >
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask a direct question or describe symptoms in English, Tenglish ('Ee symptoms enduku...')..."
              disabled={isStreaming}
              className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none resize-none min-h-[44px] max-h-[120px]"
            />

            {isStreaming ? (
              <button
                type="button"
                onClick={handleStopGeneration}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-colors"
                title="Stop AI Generation"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-health-600 to-teal-500 hover:from-health-500 hover:to-teal-400 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

        </div>
      )}

    </div>
  );
}
