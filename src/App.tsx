import React, { useState, useEffect, useRef } from 'react';
import { DJEngine } from './audio/webAudioEngine';
import { createSyntheticTrack } from './audio/synthTrack';
import { analyzeAudioBuffer } from './audio/audioAnalyzer';
import { askGeminiCreativeDirector } from './ai/geminiDirector';
import { Track, DJDecisionLog } from './types/dj';
import { evaluatePlaylistCandidates, CandidateEvaluation, calculateTransitionPlan } from './ai/djBrain';
import { MusicSidebar } from './components/MusicSidebar';
import { MusicHeader } from './components/MusicHeader';
import { AIMixStage } from './components/AIMixStage';
import { TrackCardGrid } from './components/TrackCardGrid';
import { ModernBottomPlayer } from './components/ModernBottomPlayer';
import { AILogDrawer } from './components/AILogDrawer';
import { getTrackCoverImage } from './utils/albumArt';

const BACKEND_BASE = typeof window !== 'undefined'
  ? (window.location.port === '5173'
      ? `http://${window.location.hostname}:8001`
      : '')
  : 'http://127.0.0.1:8001';

export default function App() {
  const engineRef = useRef<DJEngine | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Gemini & Vibe State
  const [apiKey, setApiKey] = useState<string>('');
  const [vibePrompt, setVibePrompt] = useState<string>('Build energetic festival vibe');

  // Deck Tracks
  const [trackA, setTrackA] = useState<Track | null>(null);
  const [trackB, setTrackB] = useState<Track | null>(null);

  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [activeDeck, setActiveDeck] = useState<'A' | 'B'>('A');
  const activeDeckRef = useRef<'A' | 'B'>('A');

  const updateActiveDeck = (deck: 'A' | 'B') => {
    activeDeckRef.current = deck;
    setActiveDeck(deck);
  };
  const [crossfader, setCrossfader] = useState<number>(0);
  const [isAutoDJActive, setIsAutoDJActive] = useState<boolean>(false);
  const [playedTrackIds, setPlayedTrackIds] = useState<Set<string>>(new Set());
  const [evaluations, setEvaluations] = useState<CandidateEvaluation[]>([]);
  const [logs, setLogs] = useState<DJDecisionLog[]>([]);
  const [activeRemixStyle, setActiveRemixStyle] = useState<string>('SMOOTH_BLEND');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isPreloading, setIsPreloading] = useState<boolean>(false);
  const [mixDurationMode, setMixDurationMode] = useState<'QUICK' | 'RADIO' | 'FULL'>('RADIO');
  const [activeTab, setActiveTab] = useState<'discover' | 'library' | 'favorites' | 'director' | 'logs'>('discover');
  const [isLogsOpen, setIsLogsOpen] = useState<boolean>(false);

  // Deck Audio Metrics
  const [deckAState, setDeckAState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 32,
    playbackRate: 1.0,
    lowGain: 0,
    midGain: 0,
    highGain: 0,
  });

  const [deckBState, setDeckBState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 32,
    playbackRate: 1.0,
    lowGain: 0,
    midGain: 0,
    highGain: 0,
  });

  const addLog = (type: DJDecisionLog['type'], message: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setLogs(prev => [{ id: Math.random().toString(), timestamp: time, type, message }, ...prev.slice(0, 40)]);
  };

  // 1. Initialize Audio Engine
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    const engine = new DJEngine();
    engineRef.current = engine;
    engine.setCrossfader(0);
    setCrossfader(0);
    addLog('TRACK_SELECTION', 'DJ Engine ready. Paste your playlist URL above to begin autonomous mixing.');
  }, []);

  // iOS Lock Screen & Control Center MediaSession Integration
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    const currentTrack = activeDeck === 'A' ? trackA : trackB;
    const isPlaying = activeDeck === 'A' ? deckAState.isPlaying : deckBState.isPlaying;

    if (currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title || 'AI DJ Mix',
        artist: currentTrack.artist || 'AI Autonomous DJ',
        album: 'AI Live DJ Set',
        artwork: [
          { src: getTrackCoverImage(currentTrack.id), sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      try {
        navigator.mediaSession.setActionHandler('play', () => {
          handlePlayToggle(activeDeck);
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          handlePlayToggle(activeDeck);
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          executeDynamicRemixMashup();
        });
      } catch (e) {}
    }
  }, [activeDeck, trackA, trackB, deckAState.isPlaying, deckBState.isPlaying]);

  // 2. Playback Tracker & Phrase Watcher
  useEffect(() => {
    const timer = setInterval(() => {
      if (!engineRef.current) return;
      const engine = engineRef.current;

      setDeckAState(prev => ({
        ...prev,
        isPlaying: engine.deckA.isPlaying,
        currentTime: engine.deckA.getCurrentTime(),
        duration: engine.deckA.currentTrack?.duration || prev.duration,
      }));

      setDeckBState(prev => ({
        ...prev,
        isPlaying: engine.deckB.isPlaying,
        currentTime: engine.deckB.getCurrentTime(),
        duration: engine.deckB.currentTrack?.duration || prev.duration,
      }));

      // Autonomous Musical DJ Strategy Watcher
      if (isAutoDJActive && !isTransitioning) {
        const liveActive = activeDeckRef.current;
        const playingDeck = liveActive === 'A' ? engine.deckA : engine.deckB;
        const currentPlayingTrack = liveActive === 'A' ? trackA : trackB;
        const nextDeckTrack = liveActive === 'A' ? trackB : trackA;

        if (playingDeck.isPlaying && currentPlayingTrack) {
          const curTime = playingDeck.getCurrentTime();
          const duration = currentPlayingTrack.duration;

          // Preload next track immediately onto idle deck so it is always ready to drop
          if (!nextDeckTrack && !isPreloading) {
            const idleDeck = liveActive === 'A' ? 'B' : 'A';
            cueNextBestTrack(idleDeck);
          }

          // Calculate dynamic transition plan aligned to 16-beat downbeat
          const plan = calculateTransitionPlan(
            currentPlayingTrack,
            nextDeckTrack || currentPlayingTrack,
            mixDurationMode
          );
          const targetTriggerTime = plan.outgoingTriggerTime;

          // Reliable DJ trigger: Mix at the phrase-aligned downbeat, or fallback 12s before track end
          const shouldMix = (curTime >= targetTriggerTime) || (duration > 20 && curTime >= duration - 12);

          if (shouldMix) {
            executeDynamicRemixMashup();
          }
        }
      }
    }, 60);

    return () => clearInterval(timer);
  }, [isAutoDJActive, isTransitioning, isPreloading, activeDeck, trackA, trackB, playlist, playedTrackIds, apiKey, vibePrompt, mixDurationMode]);

  // Fast audio stream resolver
  const ensureTrackAudioBuffer = async (track: Track): Promise<AudioBuffer | null> => {
    if (track.audioBuffer) return track.audioBuffer;
    if (!engineRef.current) return null;

    addLog('TRACK_SELECTION', `Loading & caching audio for "${track.title}"...`);

    try {
      let targetUrl = track.audioUrl;
      if (track.id && (!targetUrl || !targetUrl.startsWith('http'))) {
        targetUrl = `${BACKEND_BASE}/api/stream?id=${track.id}`;
      } else if (targetUrl && targetUrl.includes('/api/stream-url')) {
        targetUrl = targetUrl.replace('/api/stream-url', '/api/stream');
      }

      const res = await fetch(targetUrl!);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const arrayBuf = await res.arrayBuffer();
      const decoded = await engineRef.current.ctx.decodeAudioData(arrayBuf);
      track.audioBuffer = decoded;

      // Fast audio analysis in background
      analyzeAudioBuffer(decoded).then(f => {
        track.bpm = f.bpm;
        track.key = f.key;
        track.energy = f.energy;
        track.cuePoints = {
          introStart: f.cuePoints.firstDownbeat,
          bestCueIn: f.cuePoints.bestCueIn,
          breakdown: f.cuePoints.breakdown,
          drop: f.cuePoints.dropPoint,
          chorusDrop: f.cuePoints.dropPoint,
          outroStart: f.cuePoints.outroStart,
        };
        if (!track.mostPlayed) {
          track.mostPlayed = f.mostPlayed;
        }
        setPlaylist(prev => prev.map(t => t.id === track.id ? { ...t, bpm: f.bpm, key: f.key, energy: f.energy, cuePoints: track.cuePoints, mostPlayed: track.mostPlayed } : t));
      });

      // Concurrently query YouTube official heatmap if video ID is present
      if (track.id && (!track.mostPlayed || track.mostPlayed.source !== 'YOUTUBE_HEATMAP')) {
        fetch(`${BACKEND_BASE}/api/track-meta?id=${track.id}`)
          .then(r => r.ok ? r.json() : null)
          .then(meta => {
            if (meta?.most_played) {
              track.mostPlayed = {
                startTime: meta.most_played.start,
                endTime: meta.most_played.end,
                peakTime: meta.most_played.peak,
                source: 'YOUTUBE_HEATMAP',
                score: meta.most_played.score,
              };
              setPlaylist(prev => prev.map(t => t.id === track.id ? { ...t, mostPlayed: track.mostPlayed } : t));
              const mStart = Math.floor(track.mostPlayed.startTime / 60) + ':' + Math.floor(track.mostPlayed.startTime % 60).toString().padStart(2, '0');
              const mEnd = Math.floor(track.mostPlayed.endTime / 60) + ':' + Math.floor(track.mostPlayed.endTime % 60).toString().padStart(2, '0');
              addLog('TRACK_SELECTION', `🔥 Most Replayed Minute detected for "${track.title}": ${mStart} - ${mEnd} (YouTube Heatmap)`);
            }
          })
          .catch(() => {});
      }

      return decoded;
    } catch (err: any) {
      console.error('Failed to stream audio:', err);
      addLog('TRACK_SELECTION', `Audio load error for "${track.title}": ${err.message}`);
      return null;
    }
  };

  // Helper to load track onto deck and auto-sync tempo to active playing track
  // Helper to load track onto deck and auto-sync tempo to active playing track
  const loadTrackToDeckWithTempoSync = async (track: Track, targetDeckId: 'A' | 'B') => {
    if (!engineRef.current) return;
    const engine = engineRef.current;
    const targetEngine = targetDeckId === 'A' ? engine.deckA : engine.deckB;
    const currentPlayingTrack = targetDeckId === 'A' ? trackB : trackA;

    // STRICT SAFETY GUARD: If target deck is currently playing audio, NEVER stop or reload it!
    if (targetEngine.isPlaying) {
      console.warn(`[SAFETY GUARD] Prevented attempt to load "${track.title}" onto actively playing Deck ${targetDeckId}!`);
      return;
    }

    addLog('TRACK_SELECTION', `Loading "${track.title}" onto Deck ${targetDeckId}...`);
    const buf = await ensureTrackAudioBuffer(track);
    if (!buf) return;

    // Re-verify after buffer load in case state changed
    if (targetEngine.isPlaying) {
      console.warn(`[SAFETY GUARD] Deck ${targetDeckId} started playing while fetching audio. Aborting load.`);
      return;
    }

    targetEngine.loadTrack(track, buf);

    if (currentPlayingTrack && currentPlayingTrack.bpm > 0 && track.bpm > 0) {
      const rawRate = currentPlayingTrack.bpm / track.bpm;
      const clampedRate = Math.max(0.96, Math.min(1.04, rawRate));
      targetEngine.setPlaybackRate(clampedRate);
      if (targetDeckId === 'A') setDeckAState(p => ({ ...p, playbackRate: clampedRate }));
      else setDeckBState(p => ({ ...p, playbackRate: clampedRate }));
      addLog('BEATMATCH', `Harmonic Cue Rate: Deck ${targetDeckId} aligned at ${clampedRate.toFixed(3)}x`);
    } else {
      targetEngine.setPlaybackRate(1.0);
      if (targetDeckId === 'A') setDeckAState(p => ({ ...p, playbackRate: 1.0 }));
      else setDeckBState(p => ({ ...p, playbackRate: 1.0 }));
    }

    if (targetDeckId === 'A') {
      setTrackA(track);
      setDeckAState(p => ({ ...p, duration: Math.round(buf.duration), isPlaying: false, currentTime: 0 }));
    } else {
      setTrackB(track);
      setDeckBState(p => ({ ...p, duration: Math.round(buf.duration), isPlaying: false, currentTime: 0 }));
    }

    addLog('TRACK_SELECTION', `Deck ${targetDeckId} is ready: "${track.title}"`);
  };

  const handleLoadTrackToDeck = async (track: Track, targetDeckId: 'A' | 'B') => {
    await loadTrackToDeckWithTempoSync(track, targetDeckId);
  };

  const handleSelectAsNextForAI = async (track: Track) => {
    const liveActive = activeDeckRef.current;
    const targetDeckId = liveActive === 'A' ? 'B' : 'A';
    addLog('TRACK_SELECTION', `User prioritized "${track.title}" as next mix.`);
    await loadTrackToDeckWithTempoSync(track, targetDeckId);
  };

  const cueNextBestTrack = async (targetId?: 'A' | 'B'): Promise<Track | null> => {
    if (!engineRef.current || isPreloading) return null;
    const engine = engineRef.current;

    // Detect actual playing deck from Web Audio state
    const isAPlaying = engine.deckA.isPlaying;
    const isBPlaying = engine.deckB.isPlaying;

    let liveActiveDeck: 'A' | 'B' = activeDeckRef.current;
    if (isBPlaying && !isAPlaying) liveActiveDeck = 'B';
    else if (isAPlaying && !isBPlaying) liveActiveDeck = 'A';

    // The idle deck to cue onto is strictly the idle deck
    const targetDeckId: 'A' | 'B' = targetId || (liveActiveDeck === 'A' ? 'B' : 'A');
    const targetEngine = targetDeckId === 'A' ? engine.deckA : engine.deckB;

    if (targetEngine.isPlaying) {
      console.warn(`[CUE GUARD] Deck ${targetDeckId} is currently playing! Aborting cue.`);
      return null;
    }

    const currentPlayingTrack = liveActiveDeck === 'A' ? trackA : trackB;
    if (!currentPlayingTrack) return null;

    setIsPreloading(true);
    let unplayed = playlist.filter(t => t.id !== currentPlayingTrack.id && !playedTrackIds.has(t.id));
    if (unplayed.length === 0 && playlist.length > 1) {
      addLog('TRACK_SELECTION', 'End of pool reached. Resetting history for seamless continuous mix.');
      setPlayedTrackIds(new Set([currentPlayingTrack.id]));
      unplayed = playlist.filter(t => t.id !== currentPlayingTrack.id);
    }
    if (unplayed.length === 0) {
      setIsPreloading(false);
      return null;
    }

    let selectedTrack: Track | undefined;
    let chosenStyle: string = 'SMOOTH_BLEND';
    let reasoning: string = '';

    if (apiKey.trim()) {
      addLog('TRACK_SELECTION', 'Asking Gemini Creative Director for harmonic setlist progression...');
      const geminiDecision = await askGeminiCreativeDirector(apiKey, vibePrompt, currentPlayingTrack, unplayed);
      if (geminiDecision) {
        selectedTrack = playlist.find(t => t.id === geminiDecision.selectedTrackId);
        chosenStyle = geminiDecision.transitionStyle;
        reasoning = `Gemini: ${geminiDecision.creativeReasoning}`;
      }
    }

    if (!selectedTrack) {
      const candidates = evaluatePlaylistCandidates(currentPlayingTrack, playlist, playedTrackIds, 'BUILD');
      setEvaluations(candidates);
      if (candidates.length > 0) {
        selectedTrack = candidates[0].track;
        chosenStyle = candidates[0].suggestedStyle;
        reasoning = candidates[0].explanation;
      }
    }

    if (!selectedTrack) {
      selectedTrack = unplayed[0];
    }

    await loadTrackToDeckWithTempoSync(selectedTrack, targetDeckId);
    setActiveRemixStyle(chosenStyle);

    addLog('TRACK_SELECTION', `AI Auto-Selected "${selectedTrack.title}" for Deck ${targetDeckId}. ${reasoning}`);

    setIsPreloading(false);
    return selectedTrack;
  };

  const executeDynamicRemixMashup = async () => {
    if (!engineRef.current || isTransitioning) return;
    const engine = engineRef.current;
    const incomingDeckId = activeDeck === 'A' ? 'B' : 'A';
    const incomingDeck = incomingDeckId === 'A' ? engine.deckA : engine.deckB;
    const outgoingDeck = incomingDeckId === 'A' ? engine.deckB : engine.deckA;
    let incomingTrack = incomingDeckId === 'A' ? trackA : trackB;
    const currentPlayingTrack = incomingDeckId === 'A' ? trackB : trackA;

    if (!incomingTrack) {
      addLog('TRANSITION_START', `Preloading next song for Deck ${incomingDeckId}...`);
      incomingTrack = await cueNextBestTrack();
      if (!incomingTrack) return;
    }

    setIsTransitioning(true);

    // Dynamic transition plan based on BOTH songs' structural characteristics and Most Played Minute
    const plan = currentPlayingTrack
      ? calculateTransitionPlan(currentPlayingTrack, incomingTrack, mixDurationMode)
      : {
          durationMs: 14000,
          tempTargetRate: 1.0,
          incomingCueIn: incomingTrack.cuePoints?.bestCueIn || 0,
          phraseBeats: 16,
          style: 'SMOOTH_BLEND' as const,
          explanation: 'Standard phrase mix'
        };

    const tempTargetRate = plan.tempTargetRate;
    incomingDeck.setPlaybackRate(tempTargetRate);
    if (incomingDeckId === 'A') setDeckAState(p => ({ ...p, playbackRate: tempTargetRate }));
    else setDeckBState(p => ({ ...p, playbackRate: tempTargetRate }));
    addLog('BEATMATCH', `Harmonic Tempo Lock: Deck ${incomingDeckId} aligned at ${tempTargetRate.toFixed(3)}x for mix`);

    const dropTimestamp = plan.incomingCueIn;
    addLog('REMIX_TRIGGER', `AI Ingress: Deck ${incomingDeckId} entering at ${dropTimestamp.toFixed(1)}s (${plan.phraseBeats} Beats, ${(plan.durationMs / 1000).toFixed(1)}s dynamic blend)`);

    // Clean initial EQ staging: Cut sub-bass (-24dB) and duck vocals (-24dB) on incoming to guarantee ZERO vocal clash!
    incomingDeck.setEQ(-24, -24, -3, 0.05);
    if (incomingDeckId === 'A') setDeckAState(p => ({ ...p, lowGain: -24, midGain: -24, highGain: -3 }));
    else setDeckBState(p => ({ ...p, lowGain: -24, midGain: -24, highGain: -3 }));
    addLog('BEATMATCH', `🛡️ Vocal Clash Guard: Deck ${incomingDeckId} vocals ducked (-24dB). Layering intro drums under outgoing song.`);

    incomingDeck.play(dropTimestamp);

    const startTime = Date.now();
    const durationMs = plan.durationMs; // Dynamic duration matched to phrase beats!
    const startXF = crossfader;
    const targetXF = incomingDeckId === 'B' ? 1.0 : 0.0;

    const remixInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Smoothstep S-curve for the crossfader (starts gently like a whisper, natural middle, unhurried landing)
      const smoothProgress = progress * progress * (3 - 2 * progress);
      const currentXF = startXF + (targetXF - startXF) * smoothProgress;
      engine.setCrossfader(currentXF);
      setCrossfader(currentXF);

      // 1. Bass (Low frequency) Handover:
      let outLow = 0;
      let inLow = -24;
      if (progress < 0.40) {
        outLow = 0;
        inLow = -24;
      } else if (progress <= 0.60) {
        const u = (progress - 0.40) / 0.20;
        const smoothU = u * u * (3 - 2 * u); // Smoothstep curve
        outLow = -24 * smoothU;
        inLow = -24 * (1 - smoothU);
      } else {
        outLow = -24;
        inLow = 0;
      }

      // 2. Vocal / Lyric Collision Prevention (Mid frequency):
      // Incoming vocals are ducked to -24dB while outgoing lyrics finish.
      // At the exact phrase downbeat (progress ~ 0.50), outgoing mid drops and incoming mid opens cleanly!
      let outMid = 0;
      let inMid = -24;
      if (progress < 0.46) {
        outMid = 0;
        inMid = -24; // Ducked: zero vocal clash
      } else if (progress <= 0.54) {
        const u = (progress - 0.46) / 0.08;
        const smoothU = u * u * (3 - 2 * u);
        outMid = -24 * smoothU;
        inMid = -24 * (1 - smoothU);
      } else {
        outMid = -24; // Outgoing vocals silenced
        inMid = 0;    // Incoming vocals 100% crystal clear
      }

      // 3. High frequency & DJ Filter Sweep:
      // Incoming high enters softly (-16dB) and rises to 0dB by p=0.40 (seamless rhythm underlay)
      const inHigh = progress < 0.40 ? -16 * (1 - progress / 0.40) : 0;
      const outHigh = progress < 0.50 ? 0 : -20 * Math.pow((progress - 0.50) / 0.50, 1.3);

      incomingDeck.setEQ(inLow, inMid, inHigh, 0.05);
      outgoingDeck.setEQ(outLow, outMid, outHigh, 0.05);

      // DJ Filter Sweep: from p=0.45 onwards, sweep High-Pass Filter on outgoing deck to dissolve sound
      if (progress < 0.45) {
        outgoingDeck.resetDJFilter();
        incomingDeck.resetDJFilter();
      } else {
        const u = (progress - 0.45) / 0.55;
        const hpfFreq = 20 + 2600 * Math.pow(u, 2);
        outgoingDeck.sweepDJFilter('highpass', hpfFreq, 0.05);
        incomingDeck.resetDJFilter();
      }

      if (incomingDeckId === 'A') {
        setDeckAState(p => ({ ...p, lowGain: Math.round(inLow), midGain: Math.round(inMid), highGain: Math.round(inHigh) }));
        setDeckBState(p => ({ ...p, lowGain: Math.round(outLow), midGain: Math.round(outMid), highGain: Math.round(outHigh) }));
      } else {
        setDeckBState(p => ({ ...p, lowGain: Math.round(inLow), midGain: Math.round(inMid), highGain: Math.round(inHigh) }));
        setDeckAState(p => ({ ...p, lowGain: Math.round(outLow), midGain: Math.round(outMid), highGain: Math.round(outHigh) }));
      }

      // Phase 4: Mix Complete
      if (progress >= 1) {
        clearInterval(remixInterval);

        // 1. Stop and reset outgoing deck
        outgoingDeck.stop();
        outgoingDeck.resetDJFilter();
        outgoingDeck.setEQ(0, 0, 0);

        // 2. Incoming deck is at full unity
        incomingDeck.resetDJFilter();
        incomingDeck.setEQ(0, 0, 0);
        engine.setCrossfader(targetXF);
        setCrossfader(targetXF);

        // 3. CLEAR outgoing deck state so the watcher immediately cues Song 3, Song 4, etc.!
        if (incomingDeckId === 'A') {
          setTrackB(null);
          setDeckBState(p => ({ ...p, isPlaying: false, currentTime: 0, duration: 0, lowGain: 0, midGain: 0, highGain: 0, playbackRate: 1.0 }));
        } else {
          setTrackA(null);
          setDeckAState(p => ({ ...p, isPlaying: false, currentTime: 0, duration: 0, lowGain: 0, midGain: 0, highGain: 0, playbackRate: 1.0 }));
        }

        // 4. Smoothly glide playbackRate back to native 1.0x over 20 seconds (NO sudden pitch/speed drops!)
        if (Math.abs(tempTargetRate - 1.0) > 0.005) {
          incomingDeck.glidePlaybackRate(1.0, 20.0);
          addLog('BEATMATCH', `Imperceptible Tempo Return: Deck ${incomingDeckId} smoothly settling to native speed over 20s`);

          const startSettle = Date.now();
          const settleDuration = 20000;
          const settleTimer = setInterval(() => {
            const frac = Math.min(1, (Date.now() - startSettle) / settleDuration);
            const curRate = tempTargetRate + (1.0 - tempTargetRate) * frac;
            if (incomingDeckId === 'A') {
              setDeckAState(p => ({ ...p, playbackRate: curRate }));
            } else {
              setDeckBState(p => ({ ...p, playbackRate: curRate }));
            }
            if (frac >= 1) clearInterval(settleTimer);
          }, 250);
        } else {
          incomingDeck.setPlaybackRate(1.0);
          if (incomingDeckId === 'A') setDeckAState(p => ({ ...p, playbackRate: 1.0 }));
          else setDeckBState(p => ({ ...p, playbackRate: 1.0 }));
        }

        // 5. Synchronously update active deck and mark track played
        updateActiveDeck(incomingDeckId);
        setPlayedTrackIds(prev => new Set([...prev, incomingTrack!.id]));
        setIsTransitioning(false);
        addLog('TRANSITION_START', `Remix Complete! Deck ${incomingDeckId} ("${incomingTrack!.title}") is now live. Idle deck ready for next song.`);

        // Cue next track onto the IDLE deck (outgoing deck)
        const idleDeckId = incomingDeckId === 'A' ? 'B' : 'A';
        setTimeout(() => {
          cueNextBestTrack(idleDeckId);
        }, 1000);
      }
    }, 40);
  };

  const handlePlayToggle = async (deckId: 'A' | 'B') => {
    if (!engineRef.current) return;
    const deck = deckId === 'A' ? engineRef.current.deckA : engineRef.current.deckB;
    const targetTrack = deckId === 'A' ? trackA : trackB;

    if (deck.isPlaying) {
      deck.pause();
    } else {
      if (targetTrack && !targetTrack.audioBuffer) {
        const buf = await ensureTrackAudioBuffer(targetTrack);
        if (buf) deck.loadTrack(targetTrack, buf);
      }
      deck.play();
    }
  };

  const handleRateChange = (deckId: 'A' | 'B', rate: number) => {
    if (!engineRef.current) return;
    const deck = deckId === 'A' ? engineRef.current.deckA : engineRef.current.deckB;
    deck.setPlaybackRate(rate);
    if (deckId === 'A') setDeckAState(p => ({ ...p, playbackRate: rate }));
    else setDeckBState(p => ({ ...p, playbackRate: rate }));
  };

  const handleEQChange = (deckId: 'A' | 'B', band: 'low' | 'mid' | 'high', val: number) => {
    if (!engineRef.current) return;
    const deck = deckId === 'A' ? engineRef.current.deckA : engineRef.current.deckB;
    const state = deckId === 'A' ? deckAState : deckBState;
    const low = band === 'low' ? val : state.lowGain;
    const mid = band === 'mid' ? val : state.midGain;
    const high = band === 'high' ? val : state.highGain;
    deck.setEQ(low, mid, high);

    if (deckId === 'A') setDeckAState(p => ({ ...p, [band + 'Gain']: val }));
    else setDeckBState(p => ({ ...p, [band + 'Gain']: val }));
  };

  const handleSeek = (deckId: 'A' | 'B', sec: number) => {
    if (!engineRef.current) return;
    const deck = deckId === 'A' ? engineRef.current.deckA : engineRef.current.deckB;
    const targetTrack = deckId === 'A' ? trackA : trackB;
    if (!targetTrack) return;

    deck.play(sec);
    if (deckId === 'A') {
      setDeckAState(p => ({ ...p, currentTime: sec, isPlaying: true }));
    } else {
      setDeckBState(p => ({ ...p, currentTime: sec, isPlaying: true }));
    }
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    addLog('REMIX_TRIGGER', `Needle dropped on Deck ${deckId} at ${m}:${s < 10 ? '0' : ''}${s}`);
  };

  const handleDirectPlayTrack = async (track: Track) => {
    if (!engineRef.current) return;
    const engine = engineRef.current;
    const targetDeckId = activeDeckRef.current;
    await loadTrackToDeckWithTempoSync(track, targetDeckId);
    const targetDeck = targetDeckId === 'A' ? engine.deckA : engine.deckB;
    const startOffset = 0; // Natural start from the beginning 0:00
    targetDeck.play(startOffset);
    if (targetDeckId === 'A') {
      setDeckAState(p => ({ ...p, isPlaying: true, currentTime: startOffset }));
    } else {
      setDeckBState(p => ({ ...p, isPlaying: true, currentTime: startOffset }));
    }
    setPlayedTrackIds(prev => new Set([...prev, track.id]));
    addLog('TRACK_SELECTION', `Now Playing: "${track.title}" from beginning (BPM ${track.bpm}, Key ${track.key})`);
  };

  const handleToggleAutoDJ = () => {
    const nextState = !isAutoDJActive;
    setIsAutoDJActive(nextState);
    addLog('TRACK_SELECTION', nextState ? 'Autonomous AI DJ activated. Letting AI curate and mix...' : 'AI DJ set to Manual Mode.');
    if (nextState && !deckAState.isPlaying && !deckBState.isPlaying) {
      handlePlayToggle(activeDeck);
    }
  };

  const handleImportPlaylistUrl = async (url: string) => {
    addLog('TRACK_SELECTION', `Resolving: ${url}`);
    setIsAnalyzing(true);

    try {
      const response = await fetch(`${BACKEND_BASE}/api/resolve?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error('Resolver backend failed to fetch track metadata');

      const data = await response.json();
      if (!data.tracks || data.tracks.length === 0) {
        addLog('TRACK_SELECTION', 'No tracks found in link.');
        return;
      }

      addLog('TRACK_SELECTION', `Found ${data.tracks.length} track(s)!`);

      const newTracks: Track[] = data.tracks.map((t: any, index: number) => {
        const mostPlayed = t.most_played ? {
          startTime: t.most_played.start,
          endTime: t.most_played.end,
          peakTime: t.most_played.peak,
          source: 'YOUTUBE_HEATMAP' as const,
          score: t.most_played.score,
        } : undefined;

        return {
          id: t.id || Math.random().toString(),
          title: t.title,
          artist: t.artist,
          duration: t.duration || 180,
          bpm: 124,
          key: '8A',
          energy: 0.8,
          genre: 'YouTube Stream',
          audioUrl: `${BACKEND_BASE}/api/stream?id=${t.id}`,
          mostPlayed,
          cuePoints: {
            introStart: 0,
            bestCueIn: 0,
            breakdown: Math.floor((t.duration || 180) * 0.4),
            drop: 0,
            chorusDrop: Math.floor((t.duration || 180) * 0.35),
            outroStart: Math.floor((t.duration || 180) * 0.82),
          }
        };
      });

      setPlaylist(newTracks);
      setPlayedTrackIds(new Set());
      addLog('TRACK_SELECTION', `Imported ${newTracks.length} song(s). AI DJ is taking control...`);

      // Auto-load track 1 to Deck A and begin playback seamlessly from 0:00
      if (newTracks.length > 0 && engineRef.current) {
        const first = newTracks[0];
        setTrackA(first);
        updateActiveDeck('A');
        setIsAutoDJActive(true);
        engineRef.current.setCrossfader(0);
        setCrossfader(0);

        ensureTrackAudioBuffer(first).then(buf => {
          if (buf && engineRef.current) {
            engineRef.current.deckA.loadTrack(first, buf);
            engineRef.current.deckA.play(0);
            setDeckAState(p => ({
              ...p,
              isPlaying: true,
              duration: Math.round(buf.duration),
              currentTime: 0,
              playbackRate: 1.0,
            }));
            setPlayedTrackIds(new Set([first.id]));
            addLog('TRACK_SELECTION', `AI Auto-Started: "${first.title}". Playing from intro through peak climax.`);
          }
        });

        // Background analyzer for all remaining imported playlist tracks
        (async () => {
          for (let i = 1; i < newTracks.length; i++) {
            const trackItem = newTracks[i];
            try {
              const buf = await ensureTrackAudioBuffer(trackItem);
              if (buf) {
                const feats = await analyzeAudioBuffer(buf);
                trackItem.bpm = feats.bpm;
                trackItem.key = feats.key;
                trackItem.energy = feats.energy;
                trackItem.cuePoints = {
                  introStart: feats.cuePoints.firstDownbeat,
                  bestCueIn: feats.cuePoints.bestCueIn,
                  breakdown: feats.cuePoints.breakdown,
                  drop: feats.cuePoints.dropPoint,
                  chorusDrop: feats.cuePoints.dropPoint,
                  outroStart: feats.cuePoints.outroStart,
                };
                if (!trackItem.mostPlayed) {
                  trackItem.mostPlayed = feats.mostPlayed;
                }
                setPlaylist(prev => prev.map(p => p.id === trackItem.id ? { ...trackItem } : p));
                const peakStr = trackItem.mostPlayed ? ` • 🔥 Peak: ${Math.floor(trackItem.mostPlayed.startTime / 60)}:${Math.floor(trackItem.mostPlayed.startTime % 60).toString().padStart(2, '0')}` : '';
                addLog('TRACK_SELECTION', `Analyzed "${trackItem.title}": ${feats.bpm} BPM, Key ${feats.key}${peakStr}`);
              }
            } catch (e) {
              console.warn(`Background analysis skipped for ${trackItem.title}:`, e);
            }
          }
        })();
      }
    } catch (err: any) {
      console.error(err);
      addLog('TRACK_SELECTION', `Import Error: Make sure backend is running on port 8001. (${err.message})`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !engineRef.current) return;

    setIsAnalyzing(true);
    addLog('TRACK_SELECTION', `Analyzing: ${file.name}...`);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await engineRef.current.ctx.decodeAudioData(arrayBuffer);
      const features = await analyzeAudioBuffer(audioBuffer);

      const newTrack: Track = {
        id: Math.random().toString(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local File',
        duration: Math.round(audioBuffer.duration),
        bpm: features.bpm,
        key: features.key,
        energy: features.energy,
        genre: 'User File',
        audioBuffer,
        mostPlayed: features.mostPlayed,
        cuePoints: {
          introStart: features.cuePoints.firstDownbeat,
          bestCueIn: features.cuePoints.bestCueIn,
          breakdown: features.cuePoints.breakdown,
          drop: features.cuePoints.dropPoint,
          chorusDrop: features.cuePoints.dropPoint,
          outroStart: features.cuePoints.outroStart
        }
      };

      setPlaylist(prev => [...prev, newTrack]);
      addLog('TRACK_SELECTION', `Loaded "${newTrack.title}" (${features.bpm} BPM, ${features.key}, Cue-In: ${features.cuePoints.bestCueIn}s)`);
    } catch (err) {
      console.error(err);
      addLog('TRACK_SELECTION', 'Failed to decode audio file.');
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-music-mesh text-slate-100 flex overflow-hidden">
      {/* 1. Left Sidebar Navigation (Matching Screen 3 of Reference Image) */}
      <MusicSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isAutoDJActive={isAutoDJActive}
        onToggleAutoDJ={handleToggleAutoDJ}
        mixDurationMode={mixDurationMode}
        onMixDurationModeChange={setMixDurationMode}
        isTransitioning={isTransitioning}
      />

      {/* 2. Main Music App Experience (Matching Screen 2 of Reference Image) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto custom-scroll pb-32">
        {/* Top Search & Import Header */}
        <MusicHeader
          onImportUrl={handleImportPlaylistUrl}
          onFileUpload={handleFileUpload}
          isAnalyzing={isAnalyzing}
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          vibePrompt={vibePrompt}
          onVibePromptChange={setVibePrompt}
        />

        {/* Main Content Area */}
        <main className="p-5 md:p-8 space-y-7 max-w-7xl w-full mx-auto">
          {/* Animated AI Mix Stage / Discover Hero Banner (Animated when AI mixing!) */}
          <AIMixStage
            currentTrack={activeDeck === 'A' ? trackA : trackB}
            incomingTrack={activeDeck === 'A' ? trackB : trackA}
            isPlaying={activeDeck === 'A' ? deckAState.isPlaying : deckBState.isPlaying}
            currentTime={activeDeck === 'A' ? deckAState.currentTime : deckBState.currentTime}
            duration={activeDeck === 'A' ? deckAState.duration : deckBState.duration}
            playbackRate={activeDeck === 'A' ? deckAState.playbackRate : deckBState.playbackRate}
            crossfader={crossfader}
            isTransitioning={isTransitioning}
            activeRemixStyle={activeRemixStyle}
            onPlayToggle={() => handlePlayToggle(activeDeck)}
            onTriggerInstantMix={executeDynamicRemixMashup}
            onSeek={(sec) => handleSeek(activeDeck, sec)}
          />

          {/* Tracks Playlist & Made for You (Screen 2 style) */}
          <TrackCardGrid
            playlist={playlist}
            currentTrackId={activeDeck === 'A' ? trackA?.id : trackB?.id}
            cuedTrackId={activeDeck === 'A' ? trackB?.id : trackA?.id}
            playedTrackIds={playedTrackIds}
            evaluations={evaluations}
            isPlaying={activeDeck === 'A' ? deckAState.isPlaying : deckBState.isPlaying}
            onPlayTrack={handleDirectPlayTrack}
            onSelectAsNext={handleSelectAsNextForAI}
          />
        </main>
      </div>

      {/* 3. Floating Modern Bottom Player Dock */}
      <ModernBottomPlayer
        currentTrack={activeDeck === 'A' ? trackA : trackB}
        incomingTrack={activeDeck === 'A' ? trackB : trackA}
        isPlaying={activeDeck === 'A' ? deckAState.isPlaying : deckBState.isPlaying}
        currentTime={activeDeck === 'A' ? deckAState.currentTime : deckBState.currentTime}
        duration={activeDeck === 'A' ? deckAState.duration : deckBState.duration}
        isAutoDJActive={isAutoDJActive}
        isTransitioning={isTransitioning}
        mixDurationMode={mixDurationMode}
        crossfader={crossfader}
        onPlayToggle={() => handlePlayToggle(activeDeck)}
        onSeek={(sec) => handleSeek(activeDeck, sec)}
        onTriggerInstantMix={executeDynamicRemixMashup}
        onToggleAutoDJ={handleToggleAutoDJ}
        onMixDurationModeChange={setMixDurationMode}
        onToggleLogs={() => setIsLogsOpen(!isLogsOpen)}
        isLogsOpen={isLogsOpen}
      />

      {/* 4. AI Decision Stream Slide-Over Drawer */}
      <AILogDrawer
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        logs={logs}
      />
    </div>
  );
}
