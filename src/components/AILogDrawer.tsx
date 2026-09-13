import React from 'react';
import { DJDecisionLog } from '../types/dj';
import { Terminal, X, Sparkles, Cpu, CheckCircle2 } from 'lucide-react';

interface AILogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: DJDecisionLog[];
}

export const AILogDrawer: React.FC<AILogDrawerProps> = ({ isOpen, onClose, logs }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[#120826]/95 border-l border-purple-800/40 p-5 shadow-2xl shadow-black z-50 backdrop-blur-2xl flex flex-col font-mono text-xs animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-800/40 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-fuchsia-400 animate-ping" />
          <Terminal className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-white tracking-wide">AI DJ DECISION STREAM</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-purple-400 hover:text-white hover:bg-purple-900/40 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[11px] text-purple-300/70 mb-3 font-sans leading-relaxed">
        Real-time telemetry of autonomous setlist decisions, YouTube heatmap peak detections, and harmonic crossfades.
      </p>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto space-y-2 custom-scroll pr-1 text-[11px]">
        {logs.length === 0 && (
          <div className="text-purple-400/50 italic py-6 text-center">
            Awaiting DJ engine decisions... Import a playlist to start.
          </div>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-900/30 hover:border-purple-700/50 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`font-black text-[10px] px-1.5 py-0.5 rounded ${
                log.type === 'TRACK_SELECTION' ? 'text-amber-300 bg-amber-500/15 border border-amber-500/30' :
                log.type === 'BEATMATCH' ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/30' :
                log.type === 'REMIX_TRIGGER' ? 'text-fuchsia-300 bg-fuchsia-500/15 border border-fuchsia-500/30' :
                'text-emerald-300 bg-emerald-500/15 border border-emerald-500/30'
              }`}>
                {log.type}
              </span>
              <span className="text-[10px] text-purple-400/60 font-mono">[{log.timestamp}]</span>
            </div>
            <p className="text-purple-100 font-sans leading-relaxed">{log.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
