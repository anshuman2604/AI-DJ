import React, { useRef } from 'react';
import { Track } from '../types/dj';
import { Play, Pause, Disc3, RotateCcw, Flame, Sparkles, Activity } from 'lucide-react';

interface DJDeckProps {
  deckId: 'A' | 'B';
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  lowGain: number;
  midGain: number;
  highGain: number;
  isCued?: boolean;
  onPlayToggle: () => void;
  onRateChange: (rate: number) => void;
  onEQChange: (band: 'low' | 'mid' | 'high', val: number) => void;
  onSeek?: (seconds: number) => void;
}

export const DJDeck: React.FC<DJDeckProps> = ({
  deckId,
  track,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  lowGain,
  midGain,
  highGain,
  isCued,
  onPlayToggle,
  onRateChange,
  onEQChange,
  onSeek,
}) => {
  const waveformRef = useRef<HTMLDivElement | null>(null);

  const isDeckA = deckId === 'A';
  const themeColor = isDeckA ? 'cyan' : 'fuchsia';
  const accentGradient = isDeckA
    ? 'from-cyan-500 via-blue-500 to-indigo-600'
    : 'from-fuchsia-500 via-pink-500 to-rose-600';
  const glowBorder = isDeckA ? 'border-cyan-500/30 shadow-cyan-500/15' : 'border-fuchsia-500/30 shadow-fuchsia-500/15';
  const jogPulse = isDeckA ? 'glow-cyan-pulse' : 'glow-magenta-pulse';

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Handle Waveform Needle Drop Seek
  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current || !duration || !onSeek) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(fraction * duration);
  };

  // Convert EQ dB (-30 to +6) to rotary angle (-135deg to +45deg)
  const getKnobAngle = (db: number) => {
    const clamped = Math.max(-30, Math.min(6, db));
    return ((clamped - (-30)) / (6 - (-30))) * 180 - 135;
  };

  return (
    <div className={`flex-1 bg-gradient-to-b from-[#10131c] via-[#0d1017] to-[#090b10] border ${glowBorder} rounded-3xl p-5 shadow-2xl flex flex-col justify-between backdrop-blur-2xl relative overflow-hidden transition-all duration-300`}>
      {/* Top Subtle Ambient Light Strip */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accentGradient} opacity-75`} />

      {/* Deck Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-xs font-black rounded-lg uppercase tracking-widest text-white bg-gradient-to-r ${accentGradient} shadow-md shadow-${themeColor}-500/20 flex items-center gap-1.5`}>
              <Disc3 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin' : ''}`} />
              DECK {deckId}
            </span>
            {isCued && (
              <span className="animate-pulse text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI CUED
              </span>
            )}
          </div>
          {isPlaying && (
            <div className="flex items-end gap-0.5 h-3">
              <span className="w-0.5 bg-cyan-400 rounded-full animate-eq-1" />
              <span className="w-0.5 bg-cyan-300 rounded-full animate-eq-2" />
              <span className="w-0.5 bg-cyan-400 rounded-full animate-eq-3" />
              <span className="w-0.5 bg-cyan-300 rounded-full animate-eq-4" />
            </div>
          )}
        </div>

        {/* Live Audio Metrics */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="bg-[#0b0e14] border border-slate-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <span className="text-slate-500 text-[10px]">KEY:</span>
            <strong className="text-amber-400 text-xs font-black">{track ? track.key : '--'}</strong>
          </div>
          <div className="bg-[#0b0e14] border border-slate-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <span className="text-slate-500 text-[10px]">BPM:</span>
            <strong className={`text-${isDeckA ? 'cyan' : 'fuchsia'}-400 text-xs font-black`}>
              {track ? (track.bpm * playbackRate).toFixed(1) : '--'}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Track & Jog Platter Section */}
      <div className="flex items-center gap-6 my-4">
        {/* Authentic CDJ Tactile Jog Wheel */}
        <div className="relative shrink-0">
          <div className={`w-32 h-32 rounded-full bg-[#0a0c12] border-4 border-slate-800 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.8)] relative group ${isPlaying ? jogPulse : ''}`}>
            {/* Outer Strobe Knurled Ring */}
            <div className="absolute inset-1 rounded-full border border-dashed border-slate-700/50 opacity-60 pointer-events-none" />

            {/* Textured Vinyl Record Surface (Spins when playing) */}
            <div className={`absolute inset-2 rounded-full vinyl-grooves ${isPlaying ? 'animate-spin-slow' : ''}`}>
              {/* Vinyl Sheen Overlay */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
            </div>

            {/* Circular LCD Position Gauge (SVG) */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 128 128">
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                className={isDeckA ? 'stroke-cyan-400' : 'stroke-fuchsia-400'}
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                style={{ transition: 'stroke-dashoffset 0.1s linear' }}
              />
            </svg>

            {/* Center Jog LCD Display */}
            <div className="relative w-16 h-16 rounded-full bg-[#07090e] border border-slate-800 flex flex-col items-center justify-center text-center shadow-inner z-10">
              <span className="text-[10px] font-mono text-slate-400 font-bold leading-none">
                {formatTime(currentTime)}
              </span>
              <span className="text-[8px] font-mono text-slate-500 mt-0.5">
                -{formatTime(Math.max(0, duration - currentTime))}
              </span>
              <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isPlaying ? (isDeckA ? 'bg-cyan-400 shadow-[0_0_6px_#00f0ff]' : 'bg-fuchsia-400 shadow-[0_0_6px_#ff007f]') : 'bg-slate-700'}`} />
            </div>
          </div>
        </div>

        {/* Track Title & Badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
              {track ? track.genre : 'NO AUDIO LOADED'}
            </span>
            {track?.energy !== undefined && (
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded flex items-center gap-1">
                <Activity className="w-2.5 h-2.5" /> Energy: {Math.round(track.energy * 100)}%
              </span>
            )}
          </div>

          <h3 className="text-xl font-black text-white truncate tracking-tight" title={track?.title}>
            {track ? track.title : 'Empty Deck'}
          </h3>
          <p className="text-xs text-slate-400 truncate mt-0.5 font-medium">
            {track ? track.artist : 'Waiting for track assignment...'}
          </p>

          {/* Most Played Minute / Peak Climax Indicator */}
          {track?.mostPlayed && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border border-amber-500/40 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm shadow-amber-500/10">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse fill-amber-400/30" />
                <span className="text-[11px] font-mono font-bold text-amber-300 tracking-wide">
                  PEAK MINUTE: {formatTime(track.mostPlayed.startTime)} – {formatTime(track.mostPlayed.endTime)}
                </span>
                <span className="text-[9px] font-mono text-amber-500 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30">
                  {track.mostPlayed.source === 'YOUTUBE_HEATMAP' ? 'VIRAL REPLAY' : 'MAX ENERGY'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* High-Resolution RGB Reactive Waveform with Peak Minute Glow */}
      <div className="my-2">
        <div
          ref={waveformRef}
          onClick={handleWaveformClick}
          className="h-16 bg-[#06080d] rounded-xl p-2 flex items-center gap-0.5 overflow-hidden relative border border-slate-800/90 cursor-pointer group shadow-inner"
          title="Click to needle-drop / seek"
        >
          {/* Highlighted "Most Played Minute" Peak Zone */}
          {track?.mostPlayed && duration > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-amber-500/20 border-l-2 border-r-2 border-amber-400/80 pointer-events-none z-0 shadow-[inset_0_0_15px_rgba(245,158,11,0.25)] flame-shimmer"
              style={{
                left: `${(track.mostPlayed.startTime / duration) * 100}%`,
                width: `${((track.mostPlayed.endTime - track.mostPlayed.startTime) / duration) * 100}%`,
              }}
            >
              <div className="absolute top-1 left-1.5 text-[9px] font-mono font-black text-amber-300 flex items-center gap-1 uppercase tracking-wider bg-black/60 px-1.5 py-0.5 rounded border border-amber-400/40">
                <Flame className="w-2.5 h-2.5 fill-amber-400" /> PEAK ZONE
              </div>
            </div>
          )}

          {/* 64 Multi-band Frequency Colored Waveform Bars */}
          {Array.from({ length: 64 }).map((_, i) => {
            const hRaw = 18 + Math.sin(i * 0.35) * 45 + ((i * 7) % 23);
            const height = Math.min(95, Math.max(15, hRaw));
            const isPlayed = (i / 64) * 100 <= progress;
            const inPeak = track?.mostPlayed && duration > 0 &&
              (i / 64) * duration >= track.mostPlayed.startTime &&
              (i / 64) * duration <= track.mostPlayed.endTime;

            let barColor = 'bg-slate-800';
            if (isPlayed) {
              if (inPeak) {
                barColor = 'bg-gradient-to-t from-amber-500 to-yellow-300 shadow-[0_0_6px_#f59e0b]';
              } else {
                barColor = isDeckA
                  ? 'bg-gradient-to-t from-blue-500 to-cyan-400 shadow-[0_0_6px_#00f0ff]'
                  : 'bg-gradient-to-t from-purple-500 to-fuchsia-400 shadow-[0_0_6px_#ff007f]';
              }
            } else if (inPeak) {
              barColor = 'bg-amber-800/80';
            }

            return (
              <div
                key={i}
                className={`flex-1 rounded-xs transition-all duration-75 z-10 ${barColor}`}
                style={{ height: `${height}%` }}
              />
            );
          })}

          {/* Live Laser Playhead Sweep */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_12px_#ffffff] z-30 pointer-events-none"
            style={{ left: `${progress}%` }}
          >
            <div className={`w-2 h-2 rounded-full -ml-[3px] -top-1 absolute ${isDeckA ? 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]' : 'bg-fuchsia-400 shadow-[0_0_8px_#ff007f]'}`} />
          </div>
        </div>

        {/* Time Bar */}
        <div className="flex justify-between text-xs font-mono text-slate-400 mt-1 px-1">
          <span>{formatTime(currentTime)}</span>
          <span className="text-[10px] text-slate-500 font-bold">CLICK WAVEFORM TO SCRUB</span>
          <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
        </div>
      </div>

      {/* 3-Band Pro Rotary Equalizer Knobs */}
      <div className="grid grid-cols-3 gap-3 my-2 p-3 bg-[#080a0f] rounded-2xl border border-slate-800/70">
        {/* HI Knob */}
        <div className="flex flex-col items-center">
          <div className="flex justify-between w-full text-[10px] font-mono text-slate-400 px-1 mb-1">
            <span className="font-bold">HI</span>
            <span className={highGain !== 0 ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
              {highGain > 0 ? `+${highGain.toFixed(0)}` : highGain.toFixed(0)}dB
            </span>
          </div>
          <div className="relative w-11 h-11 rounded-full bg-[#121620] border-2 border-slate-700/80 flex items-center justify-center shadow-md">
            <div
              className="w-1 h-4 bg-cyan-400 rounded-full absolute top-1 shadow-[0_0_6px_#00f0ff] transition-transform duration-75 origin-bottom"
              style={{ transform: `rotate(${getKnobAngle(highGain)}deg)` }}
            />
            <div className="w-5 h-5 rounded-full bg-[#090b10] border border-slate-700 flex items-center justify-center text-[8px] font-mono text-slate-400">
              0
            </div>
          </div>
          <input
            type="range"
            min="-30"
            max="6"
            step="1"
            value={highGain}
            onChange={(e) => onEQChange('high', parseFloat(e.target.value))}
            className="w-full mt-2 accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* MID Knob */}
        <div className="flex flex-col items-center">
          <div className="flex justify-between w-full text-[10px] font-mono text-slate-400 px-1 mb-1">
            <span className="font-bold">MID</span>
            <span className={midGain !== 0 ? 'text-indigo-400 font-bold' : 'text-slate-500'}>
              {midGain > 0 ? `+${midGain.toFixed(0)}` : midGain.toFixed(0)}dB
            </span>
          </div>
          <div className="relative w-11 h-11 rounded-full bg-[#121620] border-2 border-slate-700/80 flex items-center justify-center shadow-md">
            <div
              className="w-1 h-4 bg-indigo-400 rounded-full absolute top-1 shadow-[0_0_6px_#818cf8] transition-transform duration-75 origin-bottom"
              style={{ transform: `rotate(${getKnobAngle(midGain)}deg)` }}
            />
            <div className="w-5 h-5 rounded-full bg-[#090b10] border border-slate-700 flex items-center justify-center text-[8px] font-mono text-slate-400">
              0
            </div>
          </div>
          <input
            type="range"
            min="-30"
            max="6"
            step="1"
            value={midGain}
            onChange={(e) => onEQChange('mid', parseFloat(e.target.value))}
            className="w-full mt-2 accent-indigo-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* LOW (BASS) Knob */}
        <div className="flex flex-col items-center">
          <div className="flex justify-between w-full text-[10px] font-mono text-slate-400 px-1 mb-1">
            <span className="font-bold">LOW (BASS)</span>
            <span className={lowGain !== 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
              {lowGain > 0 ? `+${lowGain.toFixed(0)}` : lowGain.toFixed(0)}dB
            </span>
          </div>
          <div className="relative w-11 h-11 rounded-full bg-[#121620] border-2 border-slate-700/80 flex items-center justify-center shadow-md">
            <div
              className="w-1 h-4 bg-amber-400 rounded-full absolute top-1 shadow-[0_0_6px_#f59e0b] transition-transform duration-75 origin-bottom"
              style={{ transform: `rotate(${getKnobAngle(lowGain)}deg)` }}
            />
            <div className="w-5 h-5 rounded-full bg-[#090b10] border border-slate-700 flex items-center justify-center text-[8px] font-mono text-slate-400">
              0
            </div>
          </div>
          <input
            type="range"
            min="-30"
            max="6"
            step="1"
            value={lowGain}
            onChange={(e) => onEQChange('low', parseFloat(e.target.value))}
            className="w-full mt-2 accent-amber-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Hardware Stomp Buttons & Tempo Fader */}
      <div className="flex items-center justify-between gap-4 mt-2">
        {/* Play/Pause Stomp Button */}
        <button
          onClick={onPlayToggle}
          disabled={!track}
          className={`flex-1 py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-95 border ${
            isPlaying
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400 text-slate-950 shadow-amber-500/30'
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 border-emerald-400/40 text-white shadow-emerald-500/20'
          }`}
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>

        {/* Tempo Slider */}
        <div className="flex items-center gap-2.5 bg-[#0b0e14] px-3.5 py-2.5 rounded-2xl border border-slate-800 shrink-0">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 font-bold">TEMPO</span>
            <span className="text-xs font-mono font-black text-cyan-400">
              {((playbackRate - 1) * 100 >= 0 ? '+' : '') + ((playbackRate - 1) * 100).toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="0.90"
            max="1.10"
            step="0.005"
            value={playbackRate}
            onChange={(e) => onRateChange(parseFloat(e.target.value))}
            className="w-24 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            title="Pitch & Tempo Speed Slider"
          />
          <button
            onClick={() => onRateChange(1.0)}
            className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
            title="Reset to 1.0x native speed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
