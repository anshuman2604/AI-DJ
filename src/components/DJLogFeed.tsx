import React from 'react';
import { DJDecisionLog } from '../types/dj';
import { Cpu, Terminal } from 'lucide-react';

interface DJLogFeedProps {
  logs: DJDecisionLog[];
}

export const DJLogFeed: React.FC<DJLogFeedProps> = ({ logs }) => {
  return (
    <div className="bg-[#0b0f17] border border-slate-800/90 rounded-2xl p-3.5 shadow-2xl shadow-black/60 flex flex-col font-mono text-xs relative overflow-hidden">
      {/* Hardware Chassis Top Accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500/50 via-indigo-500/40 to-fuchsia-500/50" />

      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">
            DSP TELEMETRY & REMIX AUDIT LOG
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>PHRASE ENGINE LIVE</span>
          <span className="text-slate-700">|</span>
          <span>44.1 kHz 24-BIT</span>
        </div>
      </div>

      <div className="h-28 overflow-y-auto space-y-1.5 custom-scroll text-[11px] pr-1">
        {logs.length === 0 && (
          <div className="text-slate-600 italic py-2">
            Awaiting autonomous DJ engine telemetry... Load a playlist to start.
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-2 leading-relaxed hover:bg-slate-900/60 p-0.5 rounded transition-colors">
            <span className="text-slate-600 shrink-0 font-mono text-[10px]">[{log.timestamp}]</span>
            <span className={`font-black shrink-0 text-[10px] px-1.5 py-0.2 rounded ${
              log.type === 'TRACK_SELECTION' ? 'text-amber-300 bg-amber-500/10 border border-amber-500/20' :
              log.type === 'BEATMATCH' ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/20' :
              log.type === 'REMIX_TRIGGER' ? 'text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-500/20' : 
              'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
            }`}>
              {log.type}
            </span>
            <span className="text-slate-300">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

