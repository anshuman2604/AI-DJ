import { Track, RemixStyle, DJDecisionLog } from '../types/dj';

export function calculateHarmonicScore(keyA: string, keyB: string): { score: number; reason: string } {
  if (keyA === keyB) {
    return { score: 1.0, reason: 'Identical key harmonic lock' };
  }

  const numA = parseInt(keyA);
  const letterA = keyA.slice(-1);
  const numB = parseInt(keyB);
  const letterB = keyB.slice(-1);

  if (numA === numB && letterA !== letterB) {
    return { score: 0.9, reason: 'Relative major/minor harmonic shift' };
  }

  const diff = Math.abs(numA - numB);
  if (letterA === letterB && (diff === 1 || diff === 11)) {
    return { score: 0.85, reason: 'Adjacent Camelot energy modulation' };
  }

  if (letterA === letterB && (diff === 2 || diff === 10)) {
    return { score: 0.7, reason: 'Energy boost modulation (+2)' };
  }

  return { score: 0.3, reason: 'Key clash - requires stem filtering/acappella cut' };
}

export function calculateBpmScore(bpmA: number, bpmB: number): { score: number; targetRate: number; reason: string } {
  if (!bpmA || !bpmB) {
    return { score: 0.8, targetRate: 1.0, reason: 'Estimated tempo' };
  }
  const ratio = bpmB / bpmA;
  const absDeltaRatio = Math.abs(1 - ratio);

  // Exact or near-exact match (< 2% change)
  if (absDeltaRatio <= 0.02) {
    return { score: 1.0, targetRate: bpmA / bpmB, reason: 'Identical tempo (pure zero pitch change)' };
  }

  // Very close match (< 4% change)
  if (absDeltaRatio <= 0.04) {
    return { score: 0.95, targetRate: bpmA / bpmB, reason: 'Harmonic tempo match (smooth blend)' };
  }

  // Gentle pitch bend (< 6% change)
  if (absDeltaRatio <= 0.06) {
    return { score: 0.85, targetRate: bpmA / bpmB, reason: 'Gentle tempo nudge' };
  }

  // Half-time match (e.g. 70 bpm with 140 bpm, or 65 with 130)
  const halfRatio = (bpmB * 0.5) / bpmA;
  if (Math.abs(1 - halfRatio) <= 0.04) {
    return { score: 0.85, targetRate: (bpmA / (bpmB * 0.5)), reason: 'Half-time sync' };
  }

  // Double-time match (e.g. 140 bpm with 70 bpm)
  const doubleRatio = (bpmB * 2) / bpmA;
  if (Math.abs(1 - doubleRatio) <= 0.04) {
    return { score: 0.85, targetRate: (bpmA / (bpmB * 2)), reason: 'Double-time sync' };
  }

  // Large tempo delta - penalty so AI chooses a closer song first!
  return { score: Math.max(0.1, 0.6 - absDeltaRatio), targetRate: 1.0, reason: `Tempo delta ${Math.round(Math.abs(bpmA - bpmB))} BPM too wide` };
}

export interface CandidateEvaluation {
  track: Track;
  totalScore: number;
  harmonicScore: number;
  bpmScore: number;
  energyScore: number;
  suggestedStyle: RemixStyle;
  explanation: string;
}

export function evaluatePlaylistCandidates(
  currentTrack: Track,
  playlist: Track[],
  playedTrackIds: Set<string>,
  targetVibe: 'BUILD' | 'MAINTAIN' | 'CHILL' = 'BUILD'
): CandidateEvaluation[] {
  let unplayed = playlist.filter(t => t.id !== currentTrack.id && !playedTrackIds.has(t.id));
  if (unplayed.length === 0 && playlist.length > 1) {
    unplayed = playlist.filter(t => t.id !== currentTrack.id);
  }
  if (unplayed.length === 0) return [];

  const evaluations: CandidateEvaluation[] = unplayed.map(track => {
    const harmonic = calculateHarmonicScore(currentTrack.key, track.key);
    const bpm = calculateBpmScore(currentTrack.bpm, track.bpm);

    let energyScore = 0.5;
    const energyDelta = track.energy - currentTrack.energy;
    if (targetVibe === 'BUILD') {
      energyScore = energyDelta >= 0 && energyDelta <= 0.25 ? 1.0 : (energyDelta > 0 ? 0.8 : 0.4);
    } else if (targetVibe === 'MAINTAIN') {
      energyScore = 1.0 - Math.min(1.0, Math.abs(energyDelta) * 2);
    } else {
      energyScore = energyDelta <= 0 ? 1.0 : 0.3;
    }

    let style: RemixStyle = 'SMOOTH_BLEND';
    if (harmonic.score >= 0.85 && bpm.score >= 0.9) {
      style = 'SMOOTH_BLEND';
    } else if (harmonic.score < 0.6 && bpm.score >= 0.9) {
      style = 'ACAPELLA_DROP';
    } else if (bpm.score < 0.6) {
      style = 'QUICK_CUT';
    } else {
      style = 'ENERGY_BOOST';
    }

    const totalScore = (harmonic.score * 0.45) + (bpm.score * 0.45) + (energyScore * 0.10);
    const explanation = `Match ${(totalScore * 100).toFixed(0)}% • ${harmonic.reason} • ${bpm.reason}`;

    return {
      track,
      totalScore,
      harmonicScore: harmonic.score,
      bpmScore: bpm.score,
      energyScore,
      suggestedStyle: style,
      explanation
    };
  });

  return evaluations.sort((a, b) => b.totalScore - a.totalScore);
}

export interface TransitionPlan {
  phraseBeats: number;          // 8, 16, or 32 beats
  durationMs: number;           // Exact duration in ms based on tempo
  blendBpm: number;             // Tempo to execute the mix at
  tempTargetRate: number;       // Rate nudge for incoming deck
  outgoingTriggerTime: number;  // Timestamp in seconds on outgoing track when transition should start
  incomingCueIn: number;        // Timestamp on incoming track to start playing
  style: RemixStyle;
  explanation: string;
}

/**
 * Dynamically plans the exact transition duration, phrase alignment,
 * and cue-in timestamps based on the outgoing track's Most Played Minute
 * and the incoming track's drop point.
 */
export function calculateTransitionPlan(
  outgoingTrack: Track,
  incomingTrack: Track,
  mixDurationMode: 'QUICK' | 'RADIO' | 'FULL' = 'RADIO'
): TransitionPlan {
  const bpmOut = outgoingTrack.bpm || 124;
  const bpmIn = incomingTrack.bpm || 124;
  const blendBpm = bpmOut;
  const secondsPerBeat = 60 / blendBpm;

  const harmonic = calculateHarmonicScore(outgoingTrack.key, incomingTrack.key);
  const bpmMatch = calculateBpmScore(bpmOut, bpmIn);

  // 1. Determine transition duration (16 beats = 4 bars, or 24 beats = 6 bars)
  let phraseBeats = 16;
  if (mixDurationMode === 'QUICK' || bpmMatch.score < 0.6) {
    phraseBeats = 16; // 4 bars punchy DJ cut
  } else if (harmonic.score >= 0.80 && bpmMatch.score >= 0.85) {
    phraseBeats = 24; // 6 bars lavish harmonic mashup
  } else {
    phraseBeats = 16; // 4 bars standard club blend
  }

  const durationSec = phraseBeats * secondsPerBeat;
  const durationMs = Math.round(durationSec * 1000);

  // 2. Tempo sync rate (clamped +/- 4%)
  const rawRate = bpmOut / bpmIn;
  const tempTargetRate = Math.max(0.96, Math.min(1.04, rawRate));

  // 3. Real DJ Set Pacing & Exit Timing:
  // - Track plays intro (0:00), verse 1, buildup, and the peak climax chorus!
  // - The transition triggers right as the chorus climax finishes, NOT at the end of the song!
  // - The crowd gets the full climax energy without the track dragging on for 3-4 minutes.
  const phraseStep = secondsPerBeat * 16; // 16-beat phrase (4 bars)
  const duration = outgoingTrack.duration || 180;
  let idealTriggerTime: number;

  if (mixDurationMode === 'QUICK') {
    // Quick / Festival Mix: 45s to 60s per track
    if (outgoingTrack.mostPlayed?.peakTime) {
      idealTriggerTime = outgoingTrack.mostPlayed.peakTime + 8;
    } else {
      idealTriggerTime = Math.min(50, duration * 0.35);
    }
  } else if (mixDurationMode === 'RADIO') {
    // Radio / Club DJ Mix: ~65s to 95s per track
    // Plays intro, verse, buildup, and the entire peak climax minute / chorus!
    if (outgoingTrack.mostPlayed?.endTime && outgoingTrack.mostPlayed.endTime > 30) {
      // Trigger right around the completion of the peak chorus
      idealTriggerTime = outgoingTrack.mostPlayed.endTime;
    } else if (outgoingTrack.mostPlayed?.peakTime) {
      idealTriggerTime = outgoingTrack.mostPlayed.peakTime + 16;
    } else if (outgoingTrack.cuePoints?.drop && outgoingTrack.cuePoints.drop > 25) {
      idealTriggerTime = outgoingTrack.cuePoints.drop + phraseStep * 2;
    } else {
      // Default pop/EDM structure: 1st chorus peak ends around 70s to 85s
      idealTriggerTime = Math.min(85, duration * 0.45);
    }
  } else {
    // FULL mode: Plays full song, blends at outro
    idealTriggerTime = Math.max(60, duration - phraseStep * 2.5);
  }

  // Snap outgoingTriggerTime to the nearest 16-beat musical downbeat
  let outgoingTriggerTime = Math.round(idealTriggerTime / phraseStep) * phraseStep;

  // Safeguards:
  // Must play at least 2 full phrases (32 beats) so track has time to establish
  outgoingTriggerTime = Math.max(phraseStep * 2, outgoingTriggerTime);
  // Ensure we never run out of audio before the mix completes
  if (duration > 30) {
    outgoingTriggerTime = Math.min(outgoingTriggerTime, duration - durationSec - 10);
  }

  // 4. Incoming Cue-In:
  // Starts naturally from 0:00 (or natural cue point) snapped to the downbeat
  let incomingCueIn = Math.max(0, incomingTrack.cuePoints?.introStart || 0);
  const inBeatSec = 60 / (incomingTrack.bpm || 124);
  incomingCueIn = Math.round(incomingCueIn / inBeatSec) * inBeatSec;

  let style: RemixStyle = 'SMOOTH_BLEND';
  if (phraseBeats === 16 && mixDurationMode === 'QUICK') style = 'QUICK_CUT';
  else if (harmonic.score >= 0.85) style = 'SMOOTH_BLEND';
  else if (harmonic.score < 0.6) style = 'ACAPELLA_DROP';
  else style = 'ENERGY_BOOST';

  const explanation = `${phraseBeats} Beats (${durationSec.toFixed(1)}s blend) • Remix Drop @ ${outgoingTriggerTime.toFixed(0)}s • Ingress @ 0:00 (Natural Intro)`;

  return {
    phraseBeats,
    durationMs,
    blendBpm,
    tempTargetRate,
    outgoingTriggerTime,
    incomingCueIn,
    style,
    explanation,
  };
}
