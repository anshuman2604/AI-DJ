import React, { useRef } from 'react';
import { Track } from '../types/dj';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Sparkles, Flame, Zap, Terminal, Disc, Heart } from 'lucide-react';
import { getTrackCoverImage } from '../utils/albumArt';

interface ModernBottomPlayerProps {
  currentTrack: Track | null;
  incomingTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isAutoDJActive: boolean;
  isTransitioning: boolean;
  mixDurationMode: 'QUICK' | 'RADIO' | 'FULL';
  crossfader: number;
  onPlayToggle: () => void;
  onSeek: (seconds: number) => void;
  onTriggerInstantMix: () => void;
  onToggleAutoDJ: () => void;
  onMixDurationModeChange: (mode: 'QUICK' | 'RADIO' | 'FULL') => void;
  onToggleLogs: () => void;
  isLogsOpen: boolean;
}

export const ModernBottomPlayer: React.FC<ModernBottomPlayerProps> = ({
  currentTrack,
  incomingTrack,
  isPlaying,
  currentTime,
  duration,
  isAutoDJActive,
  isTransitioning,
  mixDurationMode,
  crossfader,
  onPlayToggle,
  onSeek,
  onTriggerInstantMix,
  onToggleAutoDJ,
  onMixDurationModeChange,
  onToggleLogs,
  isLogsOpen,
}) => {
  const scrubberRef = useRef<HTMLDivElement | null>(null);

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || duration <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  const peakStart = currentTrack?.mostPlayed?.startTime;
  const peakEnd = currentTrack?.mostPlayed?.endTime;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#100724]/95 backdrop-blur-2xl border-t border-purple-800/40 px-4 md:px-8 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] shadow-2xl shadow-black">
      {/* Shimmering laser line on top when transitioning */}
      {isTransitioning && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-fuchsia-400 to-amber-400 animate-conduit-beam" />
      )}

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Track Information */}
        <div className="flex items-center gap-3.5 w-full md:w-1/4 min-w-0">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md shrink-0 bg-purple-950/60 border border-purple-700/40">
            <img
              src={getTrackCoverImage(currentTrack?.id || 'player')}
              alt={currentTrack?.title || 'Track'}
              className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-white shadow" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-white truncate">
                {currentTrack?.title || 'No song selected'}
              </h4>
              {isTransitioning && (
                <span className="shrink-0 text-[8px] font-black uppercase text-fuchsia-300 bg-fuchsia-500/20 px-1 py-0.5 rounded border border-fuchsia-500/30 animate-pulse">
                  MIXING
                </span>
              )}
            </div>
            <p className="text-[11px] text-purple-300/70 truncate">
              {currentTrack?.artist || 'Ready to mix'}
            </p>
            {currentTrack?.mostPlayed && (
              <div className="flex items-center gap-1 text-[9px] text-amber-400 font-bold mt-0.5">
                <Flame className="w-2.5 h-2.5" />
                <span>Peak {formatTime(currentTrack.mostPlayed.startTime)}</span>
              </div>
            )}
          </div>

          <button className="text-purple-400/60 hover:text-fuchsia-400 transition-colors p-1 shrink-0">
            <Heart className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Playback Controls & Progress Scrubber */}
        <div className="w-full md:w-2/4 flex flex-col items-center gap-1.5 max-w-xl">
          {/* Controls Buttons */}
          <div className="flex items-center gap-4">
            {/* Auto-DJ Toggle */}
            <button
              onClick={onToggleAutoDJ}
              className={`p-1.5 rounded-full border text-xs font-bold transition-all flex items-center gap-1 ${
                isAutoDJActive
                  ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                  : 'bg-purple-950/40 border-purple-800/40 text-purple-400/60'
              }`}
              title="Toggle AI Autonomous Mixing"
            >
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              <span className="text-[10px] hidden sm:inline">{isAutoDJActive ? 'AUTO ON' : 'MANUAL'}</span>
            </button>

            {/* Re-cue to Intro */}
            <button
              onClick={() => onSeek(0)}
              className="p-1.5 text-purple-300 hover:text-white transition-colors"
              title="Restart track"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            {/* Big Main Play/Pause Button (Screen 1 & 2 style) */}
            <button
              onClick={onPlayToggle}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-fuchsia-500 text-white flex items-center justify-center shadow-lg shadow-purple-900/60 transition-all active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Trigger Next Mix */}
            <button
              onClick={onTriggerInstantMix}
              className="p-1.5 text-purple-300 hover:text-fuchsia-400 transition-colors flex items-center gap-1"
              title="Instant Smooth Mix to Next Song"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* Scrubber Progress Bar with Peak Minute Segment */}
          <div className="w-full flex items-center gap-3">
            <span className="text-[10px] font-mono text-purple-300/80 w-8 text-right shrink-0">
              {formatTime(currentTime)}
            </span>

            <div
              ref={scrubberRef}
              onClick={handleScrubberClick}
              className="relative flex-1 h-1.5 bg-purple-950 rounded-full cursor-pointer overflow-hidden group hover:h-2 transition-all"
            >
              {/* Highlighted Peak Minute Bar */}
              {peakStart !== undefined && peakEnd !== undefined && duration > 0 && (
                <div
                  className="absolute top-0 bottom-0 bg-amber-500/40 z-0"
                  style={{
                    left: `${(peakStart / duration) * 100}%`,
                    width: `${((peakEnd - peakStart) / duration) * 100}%`,
                  }}
                />
              )}

              {/* Progress Fill */}
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-indigo-400 rounded-full relative z-10 transition-all duration-75"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <span className="text-[10px] font-mono text-purple-300/80 w-8 shrink-0">
              -{formatTime(Math.max(0, duration - currentTime))}
            </span>
          </div>

          {/* Up Next Preview Ticker */}
          {incomingTrack && (
            <div className="text-[10px] text-purple-300/70 font-mono truncate flex items-center gap-1">
              <span>Up Next:</span>
              <span className="text-white font-bold">{incomingTrack.title}</span>
              <span className="text-purple-400">({incomingTrack.bpm} BPM • {incomingTrack.key})</span>
            </div>
          )}
        </div>

        {/* Right: Pacing, Logs & Telemetry */}
        <div className="flex items-center gap-3 w-full md:w-1/4 justify-end">
          {/* Pacing Quick Switch */}
          <div className="flex items-center bg-black/40 border border-purple-800/40 rounded-xl p-0.5 text-[9px] font-bold">
            <button
              onClick={() => onMixDurationModeChange('QUICK')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                mixDurationMode === 'QUICK' ? 'bg-purple-600 text-white' : 'text-purple-400 hover:text-white'
              }`}
            >
              35s
            </button>
            <button
              onClick={() => onMixDurationModeChange('RADIO')}
              className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-0.5 ${
                mixDurationMode === 'RADIO' ? 'bg-amber-500 text-white' : 'text-purple-400 hover:text-white'
              }`}
            >
              <Flame className="w-2.5 h-2.5" />
              Peak
            </button>
            <button
              onClick={() => onMixDurationModeChange('FULL')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                mixDurationMode === 'FULL' ? 'bg-purple-600 text-white' : 'text-purple-400 hover:text-white'
              }`}
            >
              Full
            </button>
          </div>

          {/* AI Decision Stream Toggle */}
          <button
            onClick={onToggleLogs}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
              isLogsOpen
                ? 'bg-purple-600/40 border-purple-500 text-purple-200'
                : 'bg-purple-950/40 border-purple-800/40 text-purple-300 hover:text-white'
            }`}
            title="Toggle DJ Brain Telemetry"
          >
            <Terminal className="w-3.5 h-3.5 text-fuchsia-400" />
            <span className="hidden lg:inline text-[11px]">AI Log</span>
          </button>
        </div>
      </div>
    </div>
  );
};
