import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  ListMusic,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Flame,
  Sparkles,
  Zap,
  Plus,
  Compass,
  Radio,
  Sliders,
  X
} from 'lucide-react';
import { Track } from '../types/dj';
import { WaveTerrain } from './WaveTerrain';
import { getTrackCoverImage } from '../utils/albumArt';

interface ModernPlayerStageProps {
  currentTrack: Track | null;
  nextTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isTransitioning: boolean;
  isAutoDJActive: boolean;
  mixDurationMode: 'QUICK' | 'RADIO' | 'FULL';
  playlist: Track[];
  onPlayToggle: () => void;
  onSeek: (seconds: number) => void;
  onTriggerInstantMix: () => void;
  onToggleAutoDJ: () => void;
  onModeChange: (mode: 'QUICK' | 'RADIO' | 'FULL') => void;
  onImportUrl: (url: string) => void;
  onSelectTrack: (track: Track) => void;
  isAnalyzing: boolean;
}

export const ModernPlayerStage: React.FC<ModernPlayerStageProps> = ({
  currentTrack,
  nextTrack,
  isPlaying,
  currentTime,
  duration,
  isTransitioning,
  isAutoDJActive,
  mixDurationMode,
  playlist,
  onPlayToggle,
  onSeek,
  onTriggerInstantMix,
  onToggleAutoDJ,
  onModeChange,
  onImportUrl,
  onSelectTrack,
  isAnalyzing,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [importUrlInput, setImportUrlInput] = useState('');
  const scrubberRef = useRef<HTMLDivElement>(null);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
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

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrlInput.trim()) return;
    onImportUrl(importUrlInput.trim());
    setImportUrlInput('');
  };

  const peakStart = currentTrack?.mostPlayed?.startTime;
  const peakEnd = currentTrack?.mostPlayed?.endTime;
  const isInsidePeak = peakStart !== undefined && peakEnd !== undefined && currentTime >= peakStart && currentTime <= peakEnd;

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col justify-between bg-gradient-to-b from-[#140a28] via-[#0d051c] to-[#080214] text-white px-4 sm:px-6 md:px-8 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] select-none overflow-x-hidden">
      {/* Dynamic Mood Backdrop Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[450px] md:w-[600px] h-[320px] sm:h-[450px] md:h-[600px] rounded-full bg-purple-600/20 blur-[100px] sm:blur-[130px] pointer-events-none" />
      {isTransitioning && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[500px] h-[380px] sm:h-[500px] rounded-full bg-fuchsia-500/25 blur-[120px] pointer-events-none animate-pulse" />
      )}

      {/* 1. TOP HEADER (Matching new design.png) */}
      <header className="relative z-20 flex items-center justify-between w-full max-w-lg mx-auto py-2">
        <button
          onClick={() => setIsQueueOpen(true)}
          className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/5 active:scale-95"
          title="Open Queue"
        >
          <Compass className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h1 className="text-xs sm:text-sm font-semibold text-white/90 tracking-tight truncate max-w-[200px] sm:max-w-[280px]">
            {currentTrack?.genre || 'AI DJ Master Set'}
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-purple-300/60 mt-0.5">
            {isTransitioning ? '⚡ LIVE REMIX' : 'NOW PLAYING'}
          </p>
        </div>

        <button
          onClick={() => setIsQueueOpen(true)}
          className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/5 active:scale-95"
          title="Options & Queue"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </header>

      {/* 2. HERO CENTERPIECE: FLOATING ALBUM ART (Matching new design.png) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full my-auto">
        <div className="relative group my-2 sm:my-4">
          {/* Ambient Glow Aura */}
          <div
            className="absolute inset-0 rounded-3xl blur-2xl opacity-60 scale-95 transition-opacity duration-700 pointer-events-none"
            style={{
              backgroundImage: `url(${getTrackCoverImage(currentTrack?.id || 'aura')})`,
              backgroundSize: 'cover',
            }}
          />

          {/* Elevated Cover Card */}
          <div className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 bg-purple-950/40">
            <img
              src={getTrackCoverImage(currentTrack?.id || 'live')}
              alt={currentTrack?.title || 'Cover Art'}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-105' : 'scale-100'
              }`}
            />

            {/* Subtle Overlay Playing Pill */}
            {isTransitioning ? (
              <div className="absolute top-3 left-3 right-3 bg-fuchsia-950/80 backdrop-blur-md border border-fuchsia-500/50 rounded-full py-1 px-3 flex items-center justify-center gap-1.5 shadow-lg animate-pulse">
                <Zap className="w-3.5 h-3.5 text-fuchsia-400 fill-fuchsia-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-fuchsia-200">
                  Live DJ Remix Mashup
                </span>
              </div>
            ) : isInsidePeak ? (
              <div className="absolute top-3 left-3 right-3 bg-amber-950/80 backdrop-blur-md border border-amber-500/50 rounded-full py-1 px-3 flex items-center justify-center gap-1.5 shadow-lg animate-pulse">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-200">
                  Peak Climax Chorus
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Track Title & Artist */}
        <div className="text-center mt-3 sm:mt-5 px-4 w-full">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight truncate drop-shadow-sm">
            {currentTrack?.title || 'Import Playlist to Start'}
          </h2>
          <p className="text-sm sm:text-base font-medium text-white/60 truncate mt-1">
            {currentTrack?.artist || 'Autonomous AI DJ System'}
          </p>
        </div>

        {/* 3. MULTI-LAYERED WAVE ENERGY TERRAIN (Matching new design.png) */}
        <WaveTerrain
          isPlaying={isPlaying}
          isTransitioning={isTransitioning}
          progressPercent={progressPercent}
          lyricsText={
            currentTrack?.mostPlayed
              ? `🔥 Peak Energy at ${formatTime(currentTrack.mostPlayed.startTime)} • Intelligent Downbeat Lock`
              : "Harmonic beat sync locked • Clean 3-band crossover"
          }
        />
      </main>

      {/* 4. BOTTOM CONTROLS & SCRUBBER SECTION (Matching new design.png) */}
      <footer className="relative z-20 w-full max-w-lg mx-auto flex flex-col gap-3 pb-2">
        {/* Scrubber Progress Bar */}
        <div className="w-full flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-white/50 px-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div
            ref={scrubberRef}
            onClick={handleScrubberClick}
            className="relative w-full h-1.5 bg-white/10 hover:h-2 rounded-full cursor-pointer transition-all group overflow-hidden"
          >
            {/* Highlighted Peak Minute Section */}
            {peakStart !== undefined && peakEnd !== undefined && duration > 0 && (
              <div
                className="absolute top-0 bottom-0 bg-amber-500/40 z-0"
                style={{
                  left: `${(peakStart / duration) * 100}%`,
                  width: `${((peakEnd - peakStart) / duration) * 100}%`,
                }}
              />
            )}

            {/* Played Progress Bar */}
            <div
              className={`absolute top-0 left-0 bottom-0 rounded-full transition-all duration-100 ${
                isTransitioning
                  ? 'bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400'
                  : 'bg-white'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Primary Row Controls: Shuffle, Previous, Play/Pause, Next/Remix, Repeat */}
        <div className="flex items-center justify-between px-2 pt-1 sm:pt-2">
          {/* Auto-DJ Toggle (Shuffle Icon) */}
          <button
            onClick={onToggleAutoDJ}
            className={`p-2 rounded-full transition-colors ${
              isAutoDJActive
                ? 'text-fuchsia-400 hover:text-fuchsia-300 drop-shadow-[0_0_8px_rgba(217,70,239,0.6)]'
                : 'text-white/40 hover:text-white/70'
            }`}
            title="Toggle Autonomous AI DJ"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Re-cue to Beginning */}
          <button
            onClick={() => onSeek(0)}
            className="p-2 text-white/80 hover:text-white transition-colors active:scale-95"
            title="Restart track from intro"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          {/* Main Play / Pause Button */}
          <button
            onClick={onPlayToggle}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-2xl shadow-purple-900/60"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current text-black" />
            ) : (
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current text-black ml-0.5" />
            )}
          </button>

          {/* Remix Now / Next Track */}
          <button
            onClick={onTriggerInstantMix}
            className="p-2 text-white/80 hover:text-fuchsia-400 transition-colors active:scale-95"
            title="Trigger Instant Smooth AI Remix"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>

          {/* Mode Switch / Repeat */}
          <button
            onClick={() => {
              const nextMode = mixDurationMode === 'RADIO' ? 'QUICK' : mixDurationMode === 'QUICK' ? 'FULL' : 'RADIO';
              onModeChange(nextMode);
            }}
            className={`p-2 rounded-full transition-colors ${
              mixDurationMode !== 'RADIO' ? 'text-cyan-400' : 'text-white/40 hover:text-white/70'
            }`}
            title={`Mode: ${mixDurationMode} (Tap to change)`}
          >
            <Repeat className="w-5 h-5" />
          </button>
        </div>

        {/* Secondary Row: Queue List & Heart Favorite */}
        <div className="flex items-center justify-between px-3 pt-1 text-white/60">
          <button
            onClick={() => setIsQueueOpen(true)}
            className="p-1.5 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Open Playlist Queue"
          >
            <ListMusic className="w-4 h-4" />
            <span className="text-[11px] text-white/70">{playlist.length} Tracks</span>
          </button>

          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`p-1.5 transition-colors ${
              isLiked ? 'text-rose-500 fill-rose-500' : 'hover:text-rose-400'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Bottom Teaser Handle ("More from the artist / Playlist") */}
        <button
          onClick={() => setIsQueueOpen(true)}
          className="w-full py-1 flex flex-col items-center justify-center text-white/40 hover:text-white/70 transition-colors group cursor-pointer"
        >
          <span className="text-[10px] font-semibold tracking-wider uppercase text-white/50 group-hover:text-white/80">
            More from the artist / Queue
          </span>
          <ChevronUp className="w-3.5 h-3.5 mt-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </footer>

      {/* 5. SLIDE-UP PLAYLIST & AI CONTROLS DRAWER (Modal on Mobile / Responsive on Desktop) */}
      {isQueueOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col justify-end transition-opacity duration-300">
          <div className="relative w-full max-w-lg mx-auto bg-[#130726] border-t border-purple-800/40 rounded-t-3xl max-h-[85dvh] flex flex-col shadow-2xl shadow-black overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-fuchsia-400" />
                <h3 className="font-bold text-sm text-white">Playlist Queue & AI Controls</h3>
              </div>
              <button
                onClick={() => setIsQueueOpen(false)}
                className="p-1.5 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-4">
              {/* YouTube Link Import Input */}
              <form onSubmit={handleImportSubmit} className="flex items-center gap-2">
                <input
                  type="url"
                  value={importUrlInput}
                  onChange={e => setImportUrlInput(e.target.value)}
                  placeholder="Paste YouTube song or playlist URL..."
                  className="flex-1 bg-black/40 border border-purple-800/50 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-fuchsia-500"
                />
                <button
                  type="submit"
                  disabled={isAnalyzing || !importUrlInput.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1"
                >
                  {isAnalyzing ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </>
                  )}
                </button>
              </form>

              {/* DJ Remix Pacing Mode Selector */}
              <div className="bg-black/30 border border-white/10 rounded-2xl p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300/80 mb-2">
                  AI Remix Pacing Mode
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
                  {(['QUICK', 'RADIO', 'FULL'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => onModeChange(mode)}
                      className={`py-2 px-2 rounded-xl transition-all text-center ${
                        mixDurationMode === mode
                          ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-900/60'
                          : 'bg-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      {mode === 'QUICK' ? '⚡ Fast (45s)' : mode === 'RADIO' ? '🎵 Club (80s)' : '📀 Full'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Up Next Teaser Card */}
              {nextTrack && (
                <div className="bg-purple-950/40 border border-fuchsia-500/30 rounded-2xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={getTrackCoverImage(nextTrack.id)}
                      alt={nextTrack.title}
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider">
                        Next Up (Cued)
                      </div>
                      <div className="text-xs font-bold text-white truncate">{nextTrack.title}</div>
                      <div className="text-[11px] text-white/50 truncate">{nextTrack.artist}</div>
                    </div>
                  </div>
                  <button
                    onClick={onTriggerInstantMix}
                    className="px-3 py-1.5 bg-fuchsia-600/30 border border-fuchsia-500/60 text-fuchsia-200 text-xs font-bold rounded-xl hover:bg-fuchsia-600/50 transition-colors shrink-0"
                  >
                    Mix Now
                  </button>
                </div>
              )}

              {/* Playlist Tracks List */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 px-1 mb-1">
                  Playlist Tracks ({playlist.length})
                </div>
                {playlist.map((track, idx) => {
                  const isCurrent = currentTrack?.id === track.id;
                  return (
                    <div
                      key={track.id || idx}
                      onClick={() => onSelectTrack(track)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-purple-600/20 border border-purple-500/40 text-white'
                          : 'hover:bg-white/5 text-white/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-white/40 w-4 text-center">
                          {idx + 1}
                        </span>
                        <img
                          src={getTrackCoverImage(track.id)}
                          alt={track.title}
                          className="w-9 h-9 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold truncate text-white">
                            {track.title}
                          </h4>
                          <p className="text-[11px] text-white/50 truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-white/40 shrink-0">
                        {track.mostPlayed && (
                          <Flame className="w-3 h-3 text-amber-400" />
                        )}
                        <span>{formatTime(track.duration)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
