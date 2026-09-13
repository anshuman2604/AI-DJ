import React, { useRef } from 'react';
import { Track } from '../types/dj';
import { Sparkles, Flame, Zap, ArrowRight, Music, Play, Pause, Activity, Disc, Radio, ShieldCheck, CheckCircle2, Sliders, Waves } from 'lucide-react';
import { getTrackCoverImage } from '../utils/albumArt';

interface AIMixStageProps {
  currentTrack: Track | null;
  incomingTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  crossfader: number; // 0 to 1
  isTransitioning: boolean;
  activeRemixStyle: string;
  onPlayToggle: () => void;
  onTriggerInstantMix: () => void;
  onSeek: (seconds: number) => void;
}

export const AIMixStage: React.FC<AIMixStageProps> = ({
  currentTrack,
  incomingTrack,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  crossfader,
  isTransitioning,
  activeRemixStyle,
  onPlayToggle,
  onTriggerInstantMix,
  onSeek,
}) => {
  const waveformRef = useRef<HTMLDivElement | null>(null);

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  // Handle Waveform Needle Drop
  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current || duration <= 0) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  const peakStart = currentTrack?.mostPlayed?.startTime;
  const peakEnd = currentTrack?.mostPlayed?.endTime;
  const bpm = currentTrack?.bpm || 124;
  const secondsPerBeat = 60 / bpm;
  const phraseStep = secondsPerBeat * 16;

  // Real DJ remix trigger aligned to 16-beat downbeat right after peak climax chorus
  const idealTrigger = peakEnd && peakEnd > 30 
    ? peakEnd 
    : (currentTrack?.duration ? Math.min(85, currentTrack.duration * 0.45) : 80);
  const cadenceTargetTime = Math.max(phraseStep * 2, Math.round(idealTrigger / phraseStep) * phraseStep);

  const isPrePeak = peakStart !== undefined && currentTime < peakStart;
  const isInsidePeak = peakStart !== undefined && peakEnd !== undefined && currentTime >= peakStart && currentTime <= peakEnd;
  const isRemixCueing = currentTime > (peakEnd || 60) && currentTime < cadenceTargetTime;
  const isAtCadence = currentTime >= cadenceTargetTime;

  // ----------------------------------------------------
  // 1. ACTIVE AI MIXING STAGE (When isTransitioning === true)
  // ----------------------------------------------------
  if (isTransitioning) {
    const blendPercent = Math.round(crossfader * 100);

    return (
      <div className="relative rounded-3xl overflow-hidden border border-fuchsia-500/50 p-6 md:p-8 bg-gradient-to-r from-purple-950 via-fuchsia-950 to-indigo-950 shadow-2xl shadow-purple-950/80 animate-mixing-wave glow-purple-pulse">
        {/* Shimmering Animated Top Light Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400 animate-pulse" />

        {/* Header Ribbon with Vocal Clash Guard Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-fuchsia-800/40 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-fuchsia-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-fuchsia-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-fuchsia-400" />
              INTELLIGENT AI HARMONIC REMIX IN PROGRESS
            </span>
            <span className="text-[10px] font-mono bg-fuchsia-500/20 text-fuchsia-200 px-2 py-0.5 rounded-full border border-fuchsia-500/30">
              {activeRemixStyle.replace('_', ' ')}
            </span>
            <span className="hidden sm:flex text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              ZERO VOCAL CLASH GUARD
            </span>
          </div>

          <button
            onClick={onTriggerInstantMix}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-600 hover:from-amber-400 hover:to-fuchsia-500 text-white text-xs font-bold shadow-lg shadow-fuchsia-950/60 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Drop Immediately</span>
          </button>
        </div>

        {/* Dual Song Crossfade Arena */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 items-center">
          {/* Outgoing Song (Left Deck) */}
          <div className="lg:col-span-3 flex items-center gap-4 bg-black/40 border border-purple-800/40 rounded-2xl p-4 backdrop-blur-md">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg shrink-0">
              <img
                src={getTrackCoverImage(currentTrack?.id || 'out')}
                alt={currentTrack?.title || 'Outgoing'}
                className="w-full h-full object-cover animate-spin-slow opacity-80"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-[10px] font-black uppercase text-purple-200 bg-black/60 px-1.5 py-0.5 rounded">
                  FADING OUT
                </span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                CURRENT SONG (POST-PEAK)
              </span>
              <h3 className="text-base font-black text-white truncate">
                {currentTrack?.title || 'Current Track'}
              </h3>
              <p className="text-xs text-purple-300/80 truncate mb-1.5">
                {currentTrack?.artist || 'Artist'}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-mono text-purple-300">
                <span className="bg-purple-900/60 px-2 py-0.5 rounded border border-purple-700/40">
                  {currentTrack?.bpm || 124} BPM
                </span>
                <span className="bg-purple-900/60 px-2 py-0.5 rounded border border-purple-700/40">
                  Key {currentTrack?.key || '8A'}
                </span>
                <span className="text-fuchsia-400 font-bold">
                  Power {100 - blendPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Center Animated Energy Conduit & Spectrogram */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center gap-2">
            <div className="relative w-full flex items-center justify-center">
              <div className="w-full h-1 bg-purple-900/60 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-fuchsia-400 to-indigo-500 animate-conduit-beam" />
              </div>
              <div className="absolute w-10 h-10 rounded-full bg-fuchsia-600 border-2 border-white shadow-xl shadow-fuchsia-500/50 flex items-center justify-center text-white text-xs font-black animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            {/* Dynamic Equalizer Spectrum Bars */}
            <div className="flex items-end gap-1 h-8 mt-2">
              {[1, 2, 3, 4, 3, 2, 4, 1].map((b, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full bg-gradient-to-t from-purple-500 to-fuchsia-400 animate-eq-${(i % 4) + 1}`}
                  style={{ height: `${20 + b * 18}%` }}
                />
              ))}
            </div>
            <span className="text-[9px] font-mono text-fuchsia-300 font-bold">
              CROSSFADE {blendPercent}%
            </span>
          </div>

          {/* Incoming Song (Right Deck) */}
          <div className="lg:col-span-3 flex items-center gap-4 bg-black/40 border border-fuchsia-600/50 rounded-2xl p-4 backdrop-blur-md shadow-lg shadow-fuchsia-950/40">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg shrink-0">
              <img
                src={getTrackCoverImage(incomingTrack?.id || 'in')}
                alt={incomingTrack?.title || 'Incoming'}
                className="w-full h-full object-cover animate-spin-slow"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <span className="text-[10px] font-black uppercase text-fuchsia-200 bg-fuchsia-950/80 px-1.5 py-0.5 rounded border border-fuchsia-500/40">
                  ENTERING INTRO
                </span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider block">
                NEXT SONG (STARTING 0:00)
              </span>
              <h3 className="text-base font-black text-white truncate">
                {incomingTrack?.title || 'Next Track'}
              </h3>
              <p className="text-xs text-fuchsia-300/80 truncate mb-1.5">
                {incomingTrack?.artist || 'Artist'}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-mono text-fuchsia-200">
                <span className="bg-fuchsia-950/70 px-2 py-0.5 rounded border border-fuchsia-700/40">
                  {incomingTrack?.bpm || 124} BPM
                </span>
                <span className="bg-fuchsia-950/70 px-2 py-0.5 rounded border border-fuchsia-700/40">
                  Key {incomingTrack?.key || '9A'}
                </span>
                <span className="text-emerald-400 font-bold">
                  Power {blendPercent}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stem / Frequency Handover Real-Time Radar */}
        <div className="mt-5 pt-4 border-t border-fuchsia-800/40 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="bg-black/30 border border-purple-800/40 rounded-xl p-2.5">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-purple-300 font-bold">🎙️ VOCALS & LYRICS</span>
              <span className={blendPercent >= 50 ? 'text-emerald-400 font-bold' : 'text-fuchsia-400 font-bold'}>
                {blendPercent < 50 ? 'Deck B Ducked (-24dB)' : 'Deck B Vocals Live (0dB)'}
              </span>
            </div>
            <p className="text-[10px] text-purple-400/80 font-sans">
              Zero vocal clash: Outgoing vocals finish before incoming lyrics open.
            </p>
          </div>

          <div className="bg-black/30 border border-purple-800/40 rounded-xl p-2.5">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-purple-300 font-bold">🥁 KICK & SUB-BASS</span>
              <span className={blendPercent >= 50 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {blendPercent < 50 ? 'Deck A Sub (0dB)' : 'Deck B Bass Drop (0dB)'}
              </span>
            </div>
            <p className="text-[10px] text-purple-400/80 font-sans">
              Equal-power 3-band crossover eliminates low-end distortion.
            </p>
          </div>

          <div className="bg-black/30 border border-purple-800/40 rounded-xl p-2.5">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-purple-300 font-bold">⏱️ PHRASE LOCK</span>
              <span className="text-cyan-400 font-bold">16-Beat Downbeat</span>
            </div>
            <p className="text-[10px] text-purple-400/80 font-sans">
              Tempo aligned at {playbackRate.toFixed(3)}x with 20s gentle post-mix settle.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. DISCOVER HERO BANNER (Normal Playback - Screen 2 style)
  // ----------------------------------------------------
  return (
    <div className="relative rounded-3xl overflow-hidden border border-purple-700/30 p-6 md:p-8 bg-gradient-to-r from-[#2c1354] via-[#210c44] to-[#160830] shadow-2xl shadow-purple-950/60 space-y-6">
      {/* Background Decorative Gradient Wave / Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-fuchsia-600/10 blur-3xl pointer-events-none" />

      {/* Main Playing Row */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left Track Info & Album Art */}
        <div className="flex items-center gap-5 w-full lg:w-auto">
          {/* Album Cover Art */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl overflow-hidden shadow-2xl shadow-purple-950/80 border border-purple-500/30 bg-purple-900/40">
              <img
                src={getTrackCoverImage(currentTrack?.id || 'live')}
                alt={currentTrack?.title || 'Cover'}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-105' : 'scale-100'
                }`}
              />
            </div>
            {/* Play/Pause Float Overlay */}
            <button
              onClick={onPlayToggle}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl backdrop-blur-sm"
            >
              <div className="w-12 h-12 rounded-full bg-white/90 text-purple-950 flex items-center justify-center shadow-lg">
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </div>
            </button>
          </div>

          <div className="min-w-0 flex-1">
            {/* Badge Indicator */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                PLAYING FULL SONG (START TO FINISH)
              </span>
              {isInsidePeak && (
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1 animate-pulse">
                  <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                  PEAK CLIMAX ACTIVE
                </span>
              )}
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight truncate">
              {currentTrack?.title || 'No Track Playing'}
            </h2>
            <p className="text-sm font-semibold text-purple-300/80 truncate mb-3">
              {currentTrack?.artist || 'Import playlist URL or upload audio to start'}
            </p>

            {/* Tags & Time */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="bg-purple-950/70 text-purple-200 border border-purple-800/50 px-2.5 py-1 rounded-xl">
                {currentTrack?.bpm || 124} BPM
              </span>
              <span className="bg-purple-950/70 text-purple-200 border border-purple-800/50 px-2.5 py-1 rounded-xl">
                Key {currentTrack?.key || '8A'}
              </span>
              {currentTrack?.mostPlayed && (
                <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1 font-bold">
                  <Flame className="w-3 h-3 text-amber-400" />
                  Peak Climax: {formatTime(currentTrack.mostPlayed.startTime)} - {formatTime(currentTrack.mostPlayed.endTime)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center / Waveform Scrubber with Peak Minute Highlight */}
        <div className="w-full lg:flex-1 max-w-xl flex flex-col justify-center gap-2">
          <div className="flex items-center justify-between text-xs font-mono text-purple-300">
            <span className="font-bold text-white">{formatTime(currentTime)}</span>
            <span className="text-purple-400/80 text-[11px]">
              {isPrePeak ? 'Building up to peak energy...' : isInsidePeak ? '🔥 Peak minute in progress!' : 'Post-peak resolution (Transition ready)'}
            </span>
            <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
          </div>

          {/* Interactive Waveform Container */}
          <div
            ref={waveformRef}
            onClick={handleWaveformClick}
            className="h-12 bg-purple-950/60 border border-purple-800/50 rounded-2xl p-1.5 cursor-pointer relative flex items-end gap-0.5 overflow-hidden hover:border-purple-500/60 transition-all group"
            title="Click anywhere to needle drop seek"
          >
            {/* Peak Minute Zone Marker Background */}
            {peakStart !== undefined && peakEnd !== undefined && duration > 0 && (
              <div
                className="absolute top-0 bottom-0 bg-gradient-to-r from-amber-500/20 via-orange-500/30 to-amber-500/20 border-x border-amber-500/50 pointer-events-none z-0"
                style={{
                  left: `${(peakStart / duration) * 100}%`,
                  width: `${((peakEnd - peakStart) / duration) * 100}%`,
                }}
              >
                <div className="absolute top-1 right-1 text-[8px] font-black uppercase text-amber-300 flex items-center gap-0.5">
                  <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  PEAK
                </div>
              </div>
            )}

            {/* Simulated 48 Frequency Waveform Bars */}
            {Array.from({ length: 48 }).map((_, idx) => {
              const barFrac = idx / 48;
              const isPast = barFrac <= progressPercent / 100;
              const pseudoHeight = Math.sin(idx * 0.4) * 35 + 50 + (idx % 3) * 10;
              const inPeakZone = peakStart !== undefined && peakEnd !== undefined && duration > 0 &&
                (barFrac >= peakStart / duration && barFrac <= peakEnd / duration);

              return (
                <div
                  key={idx}
                  className={`flex-1 rounded-full transition-all duration-150 z-10 ${
                    inPeakZone
                      ? isPast
                        ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                        : 'bg-amber-600/60'
                      : isPast
                        ? 'bg-gradient-to-t from-purple-400 to-fuchsia-400 shadow-sm'
                        : 'bg-purple-800/40'
                  }`}
                  style={{
                    height: `${pseudoHeight}%`,
                    transform: isPlaying && isPast ? 'scaleY(1.05)' : 'scaleY(1)',
                  }}
                />
              );
            })}

            {/* Playhead Needle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg shadow-white z-20 pointer-events-none"
              style={{ left: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right "Up Next" Teaser Card */}
        {incomingTrack && (
          <div className="w-full lg:w-64 bg-black/40 border border-purple-800/50 rounded-2xl p-3.5 backdrop-blur-md shrink-0 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1">
                <Disc className="w-3 h-3 text-purple-400" />
                QUEUED NEXT (NATURAL INTRO)
              </span>
              <button
                onClick={onTriggerInstantMix}
                className="text-[10px] font-bold text-fuchsia-400 hover:text-fuchsia-300 transition-colors flex items-center gap-0.5"
                title="Transition to this track now"
              >
                <span>Mix Now</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-purple-700/40">
                <img
                  src={getTrackCoverImage(incomingTrack.id)}
                  alt={incomingTrack.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white truncate">
                  {incomingTrack.title}
                </h4>
                <p className="text-[11px] text-purple-300/80 truncate">
                  {incomingTrack.artist}
                </p>
                <div className="flex items-center gap-1 text-[9px] font-mono text-purple-400 mt-0.5">
                  <span>{incomingTrack.bpm} BPM</span>
                  <span>•</span>
                  <span>Key {incomingTrack.key}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. TRANSPARENT AI DJ BRAIN HUD & SONG JOURNEY ROADMAP */}
      <div className="relative z-10 pt-4 border-t border-purple-800/40">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-fuchsia-400" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              AI DJ Brain // Musical Progression & Lyric Guard
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Zero Lyric Clash Active
          </span>
        </div>

        {/* 5-Phase Song Journey Breadcrumbs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-3 font-mono text-[11px]">
          {/* Phase 1: Intro & Verses */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            isPrePeak && currentTime < (peakStart ? peakStart - 20 : 30)
              ? 'bg-purple-900/50 border-purple-500/70 text-white shadow-md'
              : currentTime > (peakStart || 60)
                ? 'bg-black/30 border-purple-900/30 text-purple-400/60'
                : 'bg-black/40 border-purple-800/40 text-purple-300'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-bold mb-0.5">
              <span>PHASE 1</span>
              {isPrePeak && currentTime < (peakStart ? peakStart - 20 : 30) && (
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-ping" />
              )}
            </div>
            <div className="font-sans font-bold text-xs">Intro & Verse</div>
            <div className="text-[10px] text-purple-300/70">From 0:00 start</div>
          </div>

          {/* Phase 2: Buildup */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            isPrePeak && currentTime >= (peakStart ? peakStart - 20 : 30)
              ? 'bg-purple-900/50 border-purple-500/70 text-white shadow-md'
              : 'bg-black/30 border-purple-900/30 text-purple-300'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-bold mb-0.5">
              <span>PHASE 2</span>
              {isPrePeak && currentTime >= (peakStart ? peakStart - 20 : 30) && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
              )}
            </div>
            <div className="font-sans font-bold text-xs">Buildup</div>
            <div className="text-[10px] text-purple-300/70">Tension climb</div>
          </div>

          {/* Phase 3: Peak Climax Minute */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            isInsidePeak
              ? 'bg-amber-950/60 border-amber-500/80 text-amber-200 shadow-lg shadow-amber-950/50 animate-pulse'
              : 'bg-black/30 border-purple-900/30 text-purple-300'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-bold mb-0.5 text-amber-400">
              <span className="flex items-center gap-1">
                <Flame className="w-2.5 h-2.5" /> PHASE 3
              </span>
              {isInsidePeak && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
            </div>
            <div className="font-sans font-bold text-xs text-white">Peak Climax</div>
            <div className="text-[10px] text-amber-400/80">
              {peakStart ? `${formatTime(peakStart)} - ${formatTime(peakEnd || peakStart + 60)}` : 'Main Chorus'}
            </div>
          </div>

          {/* Phase 4: DJ Remix Cue & Downbeat Lock */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            isRemixCueing
              ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-200 shadow-md animate-pulse'
              : 'bg-black/30 border-purple-900/30 text-purple-300'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-bold mb-0.5 text-cyan-400">
              <span className="flex items-center gap-1">
                <Waves className="w-2.5 h-2.5" /> PHASE 4
              </span>
              {isRemixCueing && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
            </div>
            <div className="font-sans font-bold text-xs text-white">Remix Cue</div>
            <div className="text-[10px] text-cyan-300/80">Locking phrase</div>
          </div>

          {/* Phase 5: Live DJ Mashup & Bass Swap */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            isAtCadence
              ? 'bg-fuchsia-950/60 border-fuchsia-500/80 text-fuchsia-200 shadow-md animate-pulse'
              : 'bg-black/30 border-purple-900/30 text-purple-300'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-bold mb-0.5 text-fuchsia-400">
              <span className="flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> PHASE 5
              </span>
              {isAtCadence && <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-ping" />}
            </div>
            <div className="font-sans font-bold text-xs text-white">Live Mashup</div>
            <div className="text-[10px] text-fuchsia-300/80">At {formatTime(cadenceTargetTime)}</div>
          </div>
        </div>

        {/* AI Strategy Readout */}
        <div className="bg-black/40 border border-purple-800/40 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-purple-200">
          <div className="flex items-center gap-2">
            <span className="text-purple-400 font-bold">🧠 AI DJ Strategy:</span>
            <span>
              {isPrePeak
                ? 'Playing track story from intro 0:00 through buildup. Lyrics fully active.'
                : isInsidePeak
                  ? 'Delivering peak climax chorus! Idle deck preloaded and tempo-synced.'
                  : isRemixCueing
                    ? `Peak hook complete! Readying live remix drop on phrase downbeat at ${formatTime(cadenceTargetTime)}.`
                    : 'Remix point reached! Frequency crossover, bass swap, and filter sweep active.'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-purple-400">
            <span>Next Ingress: <strong className="text-white">0:00 (Natural Intro)</strong></span>
            <span>•</span>
            <span>Cadence: <strong className="text-fuchsia-300">{formatTime(cadenceTargetTime)}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
