import React, { useState, useRef, useEffect } from 'react';
import { Heart, Send, Bot, User, PhoneCall, ShieldAlert, Sparkles, RefreshCw, Square, Pencil, MessageSquare } from 'lucide-react';
import { streamMentalHealthMessage } from '../services/aiService';
import MarkdownText from '../components/MarkdownText';

export default function MentalHealthView({ userProfile }) {
  const [messages, setMessages] = useState([
    {
      id: 'mh-1',
      role: 'assistant',
      content: `Welcome to your Mental Health & Emotional Check-In. I'm your active AI companion. I'm here to listen, validate how you feel, answer your thoughts, or reflect with you. What would you like to chat about today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isCrisis, setIsCrisis] = useState(false);
  const [crisisResources, setCrisisResources] = useState(null);

  const abortControllerRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isStreaming, isCrisis]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || isStreaming) return;

    const userMsg = {
      id: `mh-user-${Date.now()}`,
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
      await streamMentalHealthMessage(
        newMessages,
        'Auto',
        (currentAccumulated) => {
          setStreamingText(currentAccumulated);
        },
        (finalObj, finalAccumulated) => {
          setIsStreaming(false);

          if (finalObj.isCrisis) {
            setIsCrisis(true);
            setCrisisResources(finalObj.resources);
          }

          setMessages(prev => [
            ...prev,
            {
              id: `mh-ai-${Date.now()}`,
              role: 'assistant',
              content: finalAccumulated || finalObj.reply || `Thank you for sharing that with me. Your feelings are completely valid.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);

          setStreamingText('');
        },
        abortControllerRef.current.signal
      );
    } catch (err) {
      console.error('Mental health chat error:', err);
      setIsStreaming(false);
      setStreamingText('');

      // Fallback message so user NEVER sees empty response
      setMessages(prev => [
        ...prev,
        {
          id: `mh-ai-err-${Date.now()}`,
          role: 'assistant',
          content: `I hear you loud and clear regarding "${text}". How has this been affecting your day or your energy levels?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
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
            id: `mh-stopped-${Date.now()}`,
            role: 'assistant',
            content: `${streamingText} [Generation stopped]`,
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
    }
  };

  const samplePrompts = [
    "🍔 i have been thinking to eat a burger",
    "💼 I've been feeling overwhelmed by work stress lately",
    "🌙 I have trouble falling asleep due to anxious thoughts",
    "☕ I just feel emotionally exhausted today",
    "🆘 I feel overwhelmed and want to talk to an India crisis helpline"
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 animate-fade-in">
      
      {/* HEADER */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-slate-900 to-teal-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <Heart className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Mental Health AI Companion</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                Active & Conversational AI
              </span>
            </h2>
            <p className="text-xs text-slate-400">Understands all prompts • Dynamic responses • Word-by-word streaming</p>
          </div>
        </div>

        <button
          onClick={() => {
            handleStopGeneration();
            setMessages([{
              id: 'mh-reset',
              role: 'assistant',
              content: `Session refreshed. Take a deep breath. What would you like to talk about right now?`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
            setIsCrisis(false);
          }}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Session</span>
        </button>
      </div>

      {/* CRISIS BANNER */}
      {isCrisis && (
        <div className="p-6 rounded-2xl bg-purple-950/90 border-2 border-purple-500 text-white space-y-4 shadow-2xl shadow-purple-950/50 animate-fade-in">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-8 h-8 text-purple-300 shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-purple-100">CRISIS SUPPORT & FREE HELPLINES AVAILABLE 24/7</h3>
              <p className="text-xs text-purple-200 leading-relaxed">
                If you are experiencing severe distress or self-harm thoughts, compassionate trained counselors are ready to help right now.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <a
              href="tel:14416"
              className="py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-center flex items-center justify-center gap-2 shadow-lg text-xs"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call 14416 (Tele-MANAS)</span>
            </a>
            <a
              href="tel:18008914416"
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/40 font-bold text-center flex items-center justify-center gap-2 text-xs"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call 1800-891-4416 (Tele-MANAS)</span>
            </a>
          </div>
        </div>
      )}

      {/* CHAT FEED */}
      <div className="glass-panel rounded-2xl border border-purple-500/20 p-4 sm:p-6 min-h-[400px] max-h-[500px] overflow-y-auto space-y-4 bg-slate-950/40">
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
                    : 'bg-gradient-to-tr from-purple-600 to-teal-400 text-slate-950 shadow-md shadow-purple-500/20'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
              </div>

              <div className="max-w-[82%] sm:max-w-[78%] space-y-1">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-purple-600/30 text-purple-100 border border-purple-500/40 rounded-tr-none'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-purple-500/20">
                    <span className="text-[10px] font-semibold text-purple-300">
                      {isUser ? (userProfile?.name || 'You') : 'Mental Health Companion'}
                    </span>
                    <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                  </div>

                  <MarkdownText content={msg.content} />
                </div>

                <div className={`flex items-center gap-2 px-1 text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {isUser ? (
                    <button
                      onClick={() => handleEditMessage(index)}
                      className="hover:text-purple-300 flex items-center gap-1 transition-colors"
                      title="Edit this message"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit Prompt</span>
                    </button>
                  ) : (
                    index === messages.length - 1 && !isStreaming && (
                      <button
                        onClick={handleRegenerate}
                        className="hover:text-purple-300 flex items-center gap-1 transition-colors"
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-teal-400 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
              <Heart className="w-4 h-4 animate-pulse" />
            </div>

            <div className="max-w-[80%] p-4 rounded-2xl bg-slate-900/90 text-slate-200 border border-purple-500/30 rounded-tl-none text-xs sm:text-sm leading-relaxed shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-purple-500/20">
                <span className="text-[10px] font-semibold text-purple-300 flex items-center gap-1.5">
                  <span>Mental Health Companion</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                </span>
                <span className="text-[9px] text-purple-400 font-mono">Thinking...</span>
              </div>

              {streamingText ? (
                <MarkdownText content={streamingText} />
              ) : (
                <div className="flex items-center gap-1.5 py-1 text-purple-300 text-xs italic">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-2">Reflecting thoughtfully on your thoughts...</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* INPUT FORM & PROMPT CHIPS */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Sample Check-Ins:</span>
          </span>
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt.replace(/^[\uD800-\uDBFF][\uDC00-\uDFFF]\s*/, ''))}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-900 hover:bg-purple-950/50 border border-slate-800 hover:border-purple-500/50 text-purple-200 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end gap-2 bg-slate-900 border border-purple-500/30 p-2.5 rounded-2xl focus-within:border-purple-500/60 transition-colors relative"
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
            placeholder="Share what's on your mind (food cravings, stress, thoughts, questions)..."
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
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

    </div>
  );
}

