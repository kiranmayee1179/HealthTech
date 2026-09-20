import React from 'react';
import { Plus, MessageSquare, Trash2, X, Stethoscope, ChevronRight } from 'lucide-react';

export default function ChatSidebar({
  isOpen,
  onClose,
  sessions = [],
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      />

      {/* Sidebar Drawer */}
      <div className="relative w-80 max-w-full bg-slate-900 border-r border-slate-800 p-4 shadow-2xl flex flex-col justify-between z-10 animate-slide-right">
        
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-health-400" />
              <h3 className="text-sm font-bold text-white">Chat Sessions</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-health-600 to-teal-500 hover:from-health-500 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Intake Chat</span>
          </button>

          {/* Sessions List */}
          <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block px-1">Recent Conversations</span>

            {sessions.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 text-center">No active chat sessions yet.</p>
            ) : (
              sessions.map((sess) => {
                const isActive = sess.id === activeSessionId;
                return (
                  <div
                    key={sess.id}
                    onClick={() => {
                      onSelectSession(sess.id);
                      onClose();
                    }}
                    className={`group flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'bg-slate-800 border-health-500/50 text-white font-semibold shadow'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-health-400' : 'text-slate-500'}`} />
                      <span className="truncate max-w-[170px]">{sess.title || 'Intake Session'}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(sess.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-all"
                      title="Delete Session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          VitalCheck AI • Session History
        </div>

      </div>
    </div>
  );
}
