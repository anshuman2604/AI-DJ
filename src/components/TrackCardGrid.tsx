import React from 'react';
import { Track } from '../types/dj';
import { Play, Pause, Flame, Sparkles, Disc, Plus, Heart, Music, Check, ArrowRight } from 'lucide-react';
import { getTrackCoverImage, getTrackGradient } from '../utils/albumArt';
import { CandidateEvaluation } from '../ai/djBrain';

interface TrackCardGridProps {
  playlist: Track[];
  currentTrackId?: string;
  cuedTrackId?: string;
  playedTrackIds: Set<string>;
  evaluations: CandidateEvaluation[];
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onSelectAsNext: (track: Track) => void;
}

export const TrackCardGrid: React.FC<TrackCardGridProps> = ({
  playlist,
  currentTrackId,
  cuedTrackId,
  playedTrackIds,
  evaluations,
  isPlaying,
  onPlayTrack,
  onSelectAsNext,
}) => {
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const evalMap = new Map(evaluations.map(e => [e.track.id, e]));

  // Artist / Vibe Bubble Avatars (Matching Screen 2 top row)
  const vibeBubbles = [
    { name: 'You', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', isUser: true },
    { name: 'Festival', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&auto=format&fit=crop&q=80' },
    { name: 'Melodic', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80' },
    { name: 'Peak Club', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80' },
    { name: 'Deep Chill', img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&auto=format&fit=crop&q=80' },
    { name: 'Vocal House', img: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=150&auto=format&fit=crop&q=80' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Artist / Vibe Circles (Matching Screen 2) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-3.5">
          Vibe Curators & Energy Channels
        </h3>
        <div className="flex items-center gap-4 overflow-x-auto custom-scroll pb-2">
          {vibeBubbles.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
              <div className={`w-15 h-15 rounded-full p-0.5 transition-all duration-300 group-hover:scale-105 ${
                item.isUser
                  ? 'bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-indigo-500 shadow-md shadow-purple-900/50'
                  : 'bg-purple-900/50 group-hover:bg-purple-500/50'
              }`}>
                <div className="relative w-full h-full rounded-full overflow-hidden">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                  {item.isUser && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-semibold text-purple-200/90 group-hover:text-white transition-colors">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. "Made for you" Mix Highlights (Matching Screen 2 Featured Cards) */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            <span>Made for you</span>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-900/40 px-2 py-0.5 rounded-full border border-purple-800/40">
              Harmonic Mixes
            </span>
          </h3>
          <span className="text-xs font-semibold text-purple-400 hover:text-purple-300 cursor-pointer">
            auto-mixed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Festival Energy */}
          <div className="relative rounded-3xl overflow-hidden h-36 p-4.5 bg-gradient-to-br from-purple-900/70 via-indigo-950/60 to-[#120826] border border-purple-700/30 group hover:border-purple-500/50 transition-all shadow-lg flex flex-col justify-between">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-purple-500/20 blur-2xl group-hover:bg-purple-500/30 transition-all" />
            <div className="flex items-center justify-between z-10">
              <span className="text-[10px] font-black tracking-wider uppercase text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-400/30">
                ENERGY RUN
              </span>
              <Sparkles className="w-4 h-4 text-purple-300" />
            </div>
            <div className="z-10">
              <h4 className="text-base font-black text-white">Peak Hour Festival</h4>
              <p className="text-xs text-purple-300/80">Continuous 126-130 BPM handover</p>
            </div>
          </div>

          {/* Card 2: Peak Minute Focus */}
          <div className="relative rounded-3xl overflow-hidden h-36 p-4.5 bg-gradient-to-br from-amber-950/60 via-purple-950/60 to-[#120826] border border-amber-500/30 group hover:border-amber-500/50 transition-all shadow-lg flex flex-col justify-between">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-amber-500/20 blur-2xl group-hover:bg-amber-500/30 transition-all" />
            <div className="flex items-center justify-between z-10">
              <span className="text-[10px] font-black tracking-wider uppercase text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" />
                PEAK MINUTE
              </span>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div className="z-10">
              <h4 className="text-base font-black text-white">Most Replayed Hits</h4>
              <p className="text-xs text-purple-300/80">YouTube Heatmap Smart Ingress</p>
            </div>
          </div>

          {/* Card 3: Deep Melodic Blend */}
          <div className="hidden lg:flex relative rounded-3xl overflow-hidden h-36 p-4.5 bg-gradient-to-br from-fuchsia-950/60 via-indigo-950/60 to-[#120826] border border-fuchsia-700/30 group hover:border-fuchsia-500/50 transition-all shadow-lg flex-col justify-between">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-fuchsia-500/20 blur-2xl group-hover:bg-fuchsia-500/30 transition-all" />
            <div className="flex items-center justify-between z-10">
              <span className="text-[10px] font-black tracking-wider uppercase text-fuchsia-300 bg-fuchsia-500/20 px-2.5 py-0.5 rounded-full border border-fuchsia-400/30">
                HARMONIC
              </span>
              <Sparkles className="w-4 h-4 text-fuchsia-300" />
            </div>
            <div className="z-10">
              <h4 className="text-base font-black text-white">Camelot Wheel Flow</h4>
              <p className="text-xs text-purple-300/80">Zero harmonic dissonance</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. "Today hits" Track Playlist (Matching Screen 2 list) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black tracking-tight text-white">
              Playlist & Tracks
            </h3>
            <span className="text-xs font-bold text-purple-300 bg-purple-900/60 border border-purple-700/40 px-2 py-0.5 rounded-full">
              {playlist.length} track{playlist.length === 1 ? '' : 's'}
            </span>
          </div>
          <span className="text-xs font-semibold text-purple-400">
            Autonomous Set
          </span>
        </div>

        {playlist.length === 0 ? (
          <div className="bg-[#140a2b]/60 border border-dashed border-purple-800/40 rounded-3xl p-10 text-center">
            <Music className="w-10 h-10 text-purple-400/40 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-white mb-1">Your playlist is empty</h4>
            <p className="text-xs text-purple-300/70 max-w-sm mx-auto mb-4">
              Paste a YouTube playlist link in the search bar above or click "Add Audio" to load local MP3 tracks.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {playlist.map((track, idx) => {
              const isCurrent = track.id === currentTrackId;
              const isCued = track.id === cuedTrackId;
              const isPlayed = playedTrackIds.has(track.id);
              const evaluation = evalMap.get(track.id);

              return (
                <div
                  key={track.id}
                  className={`group relative rounded-2xl p-3.5 border transition-all duration-200 flex items-center gap-3.5 cursor-pointer ${
                    isCurrent
                      ? 'bg-purple-900/40 border-purple-500/70 shadow-lg shadow-purple-950/80 ring-1 ring-purple-500/40'
                      : isCued
                        ? 'bg-fuchsia-950/40 border-fuchsia-500/60 shadow-md shadow-fuchsia-950/40'
                        : 'bg-[#150a2b]/70 hover:bg-[#1f0f3f]/80 border-purple-900/30 hover:border-purple-700/50'
                  }`}
                  onClick={() => onPlayTrack(track)}
                >
                  {/* Track Thumbnail Art */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-md bg-purple-950/60 border border-purple-800/40">
                    <img
                      src={getTrackCoverImage(track.id)}
                      alt={track.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />

                    {/* Playing Equalizer Overlay */}
                    {isCurrent && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-0.5">
                        <div className="w-1 bg-fuchsia-400 rounded-full animate-eq-1" />
                        <div className="w-1 bg-purple-400 rounded-full animate-eq-2" />
                        <div className="w-1 bg-cyan-400 rounded-full animate-eq-3" />
                        <div className="w-1 bg-fuchsia-400 rounded-full animate-eq-4" />
                      </div>
                    )}

                    {/* Hover Play Button */}
                    {!isCurrent && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      </div>
                    )}
                  </div>

                  {/* Track Meta Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="text-xs font-bold text-white truncate leading-tight">
                        {track.title}
                      </h4>
                      {isCurrent && (
                        <span className="shrink-0 text-[8px] font-black uppercase text-fuchsia-300 bg-fuchsia-500/20 px-1.5 py-0.5 rounded border border-fuchsia-500/30">
                          ON AIR
                        </span>
                      )}
                      {isCued && !isCurrent && (
                        <span className="shrink-0 text-[8px] font-black uppercase text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30">
                          NEXT
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-purple-300/70 truncate mb-1">
                      {track.artist}
                    </p>

                    {/* Meta Badges */}
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-purple-400">
                      <span className="bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40 text-purple-300">
                        {track.bpm} BPM
                      </span>
                      <span className="bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40 text-purple-300">
                        Key {track.key}
                      </span>
                      {track.mostPlayed && (
                        <span className="bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-0.5 font-bold">
                          <Flame className="w-2.5 h-2.5 text-amber-400" />
                          {formatTime(track.mostPlayed.startTime)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Action: Cue Next */}
                  {!isCurrent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAsNext(track);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-xl bg-purple-800/50 hover:bg-purple-700 text-purple-200 transition-all text-[10px] font-bold shrink-0 flex items-center gap-1"
                      title="Prioritize this track to mix next"
                    >
                      <span>Mix Next</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
