import React, { useState } from 'react';
import { Track } from '../types/dj';
import { Music2, Plus, Sparkles, CheckCircle2, Link, Wand2, Flame, Disc, Radio } from 'lucide-react';
import { CandidateEvaluation } from '../ai/djBrain';

interface PlaylistPanelProps {
  playlist: Track[];
  currentTrackId?: string;
  cuedTrackId?: string;
  playedTrackIds: Set<string>;
  evaluations: CandidateEvaluation[];
  onAddCustomTrack: (title: string, artist: string, bpm: number, key: string, genre: string) => void;
  onImportPlaylistUrl: (url: string) => void;
  onSelectAsNextForAI?: (track: Track) => void;
}

export const PlaylistPanel: React.FC<PlaylistPanelProps> = ({
  playlist,
  currentTrackId,
  cuedTrackId,
  playedTrackIds,
  evaluations,
  onAddCustomTrack,
  onImportPlaylistUrl,
  onSelectAsNextForAI,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newBpm, setNewBpm] = useState(126);
  const [newKey, setNewKey] = useState('8A');

  const evalMap = new Map(evaluations.map(e => [e.track.id, e]));

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onImportPlaylistUrl(urlInput);
    setUrlInput('');
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-88 bg-gradient-to-b from-[#10131d] via-[#0d1017] to-[#08090d] border border-slate-800/90 rounded-3xl p-5 shadow-2xl flex flex-col h-full backdrop-blur-2xl relative overflow-hidden">
      {/* Top subtle light bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 opacity-60" />

      {/* URL Playlist Resolver Box */}
      <div className="mb-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Link className="w-3.5 h-3.5" />
            STREAM RESOLVER
          </span>
          <span className="text-[10px] text-slate-500">SPOTIFY / YOUTUBE</span>
        </div>
        <form onSubmit={handleImport} className="flex gap-2">
          <input
            type="text"
            placeholder="Paste Playlist or Video URL..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 bg-[#06080d] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-md shadow-cyan-600/20 active:scale-95 shrink-0"
          >
            Import
          </button>
        </form>
      </div>

      {/* Playlist Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-black text-slate-200 uppercase tracking-wider">
            TRACK CRATE ({playlist.length})
          </span>
        </div>
        <button
          onClick={() => setShowAddModal(!showAddModal)}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors bg-cyan-950/40 border border-cyan-800/40 px-2 py-1 rounded-lg"
        >
          <Plus className="w-3 h-3" /> Add Track
        </button>
      </div>

      {/* Custom Track Modal */}
      {showAddModal && (
        <div className="bg-[#07090f] p-3 rounded-2xl border border-slate-800 mb-3 space-y-2 text-xs shadow-2xl">
          <input
            placeholder="Track Title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="w-full bg-[#0d1017] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200"
          />
          <input
            placeholder="Artist Name"
            value={newArtist}
            onChange={e => setNewArtist(e.target.value)}
            className="w-full bg-[#0d1017] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200"
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="BPM (e.g. 126)"
              value={newBpm}
              onChange={e => setNewBpm(Number(e.target.value))}
              className="w-1/2 bg-[#0d1017] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200"
            />
            <input
              placeholder="Camelot Key (e.g. 8A)"
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              className="w-1/2 bg-[#0d1017] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200"
            />
          </div>
          <button
            onClick={() => {
              if (newTitle && newArtist) {
                onAddCustomTrack(newTitle, newArtist, newBpm, newKey, 'Electronic');
                setNewTitle('');
                setNewArtist('');
                setShowAddModal(false);
              }
            }}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-1.5 rounded-xl text-xs shadow"
          >
            Add To Pool
          </button>
        </div>
      )}

      {/* Track List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scroll">
        {playlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4 text-slate-500">
            <Disc className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
            <p className="text-xs font-medium">No tracks in pool.</p>
            <p className="text-[11px] text-slate-600 mt-1">Paste a Spotify or YouTube link above to start.</p>
          </div>
        ) : (
          playlist.map((track, idx) => {
            const isPlaying = track.id === currentTrackId;
            const isCued = track.id === cuedTrackId;
            const isPlayed = playedTrackIds.has(track.id);
            const evaluation = evalMap.get(track.id);

            let cardBorder = 'border-slate-800/80 hover:border-slate-700 bg-[#090b10]/90';
            if (isPlaying) {
              cardBorder = 'border-cyan-500/60 bg-cyan-950/30 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/40';
            } else if (isCued) {
              cardBorder = 'border-fuchsia-500/60 bg-fuchsia-950/30 shadow-lg shadow-fuchsia-950/40 ring-1 ring-fuchsia-500/40';
            } else if (isPlayed) {
              cardBorder = 'border-slate-800/40 bg-[#06070a]/60 opacity-55';
            }

            return (
              <div
                key={track.id}
                className={`p-3 rounded-2xl border transition-all duration-200 ${cardBorder}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {/* Track index or live animated equalizer */}
                      {isPlaying ? (
                        <div className="flex items-end gap-0.5 h-3.5 w-3.5 shrink-0">
                          <span className="w-0.5 bg-cyan-400 rounded-full animate-eq-1" />
                          <span className="w-0.5 bg-cyan-300 rounded-full animate-eq-2" />
                          <span className="w-0.5 bg-cyan-400 rounded-full animate-eq-3" />
                          <span className="w-0.5 bg-cyan-300 rounded-full animate-eq-4" />
                        </div>
                      ) : isCued ? (
                        <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse shrink-0" />
                      ) : isPlayed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      ) : (
                        <span className="text-[10px] font-mono text-slate-600 font-bold shrink-0">
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                      )}

                      <h4 className="font-bold text-xs text-white truncate tracking-tight" title={track.title}>
                        {track.title}
                      </h4>
                    </div>

                    <p className="text-[10px] text-slate-400 truncate mt-0.5 ml-5">
                      {track.artist}
                    </p>
                  </div>

                  {/* Badges: Camelot Key, BPM, Peak Minute */}
                  <div className="flex items-center gap-1 font-mono text-[10px] shrink-0">
                    {track.mostPlayed && (
                      <span
                        className="text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold shadow-sm shadow-amber-500/10"
                        title={`Most Played / Peak Minute: ${formatTime(track.mostPlayed.startTime)} - ${formatTime(track.mostPlayed.endTime)}`}
                      >
                        <Flame className="w-2.5 h-2.5 fill-amber-400" />
                        {formatTime(track.mostPlayed.startTime)}
                      </span>
                    )}
                    <span className="text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded font-bold">
                      {track.key}
                    </span>
                    <span className="text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 rounded font-bold">
                      {track.bpm}
                    </span>
                  </div>
                </div>

                {/* Status Bar & Mix Next Button */}
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/60 gap-2">
                  {isPlaying ? (
                    <span className="text-[10px] text-cyan-400 font-mono font-black flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      LIVE ON AIR
                    </span>
                  ) : isCued ? (
                    <span className="text-[10px] text-fuchsia-400 font-mono font-black flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
                      NEXT IN MIX
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatTime(track.duration)}
                    </span>
                  )}

                  {!isPlaying && !isCued && (
                    <button
                      onClick={() => onSelectAsNextForAI && onSelectAsNextForAI(track)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1 shadow-sm active:scale-95"
                      title="Prioritize this song as the next AI mix"
                    >
                      <Wand2 className="w-3 h-3" /> Mix Next
                    </button>
                  )}
                </div>

                {/* AI Harmonic Compatibility Pill */}
                {evaluation && !isPlaying && !isPlayed && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-800/50 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500">Compatibility:</span>
                    <span
                      className={`font-black ${
                        evaluation.totalScore >= 0.85
                          ? 'text-emerald-400'
                          : evaluation.totalScore >= 0.70
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {(evaluation.totalScore * 100).toFixed(0)}% • {evaluation.suggestedStyle}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
