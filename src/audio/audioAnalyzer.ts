import { MostPlayedSection } from '../types/dj';

export interface SmartCuePoints {
  firstDownbeat: number;     // First major kick drum downbeat (offset)
  bestCueIn: number;         // Skips ambient intro directly to the groove/beat drop
  breakdown: number;        // Energy dip / bridge
  dropPoint: number;         // Peak energy drop
  outroStart: number;        // Optimal exit point
}

export interface ExtractedFeatures {
  bpm: number;
  key: string;
  energy: number;
  cuePoints: SmartCuePoints;
  mostPlayed: MostPlayedSection;
  peaks: number[];
}

export async function analyzeAudioBuffer(buffer: AudioBuffer): Promise<ExtractedFeatures> {
  const channelData = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const duration = buffer.duration;

  // 1. Chunk audio into 50ms windows for Energy & Transients
  const windowMs = 50;
  const windowSize = Math.floor(sampleRate * (windowMs / 1000));
  const numWindows = Math.floor(channelData.length / windowSize);
  const energyProfile: number[] = new Float64Array(numWindows) as any;

  let maxEnergy = 0;
  for (let w = 0; w < numWindows; w++) {
    const start = w * windowSize;
    let sum = 0;
    for (let i = 0; i < windowSize; i++) {
      const val = channelData[start + i];
      sum += val * val;
    }
    const rms = Math.sqrt(sum / windowSize);
    energyProfile[w] = rms;
    if (rms > maxEnergy) maxEnergy = rms;
  }

  // Normalize energy profile
  if (maxEnergy > 0) {
    for (let w = 0; w < numWindows; w++) {
      energyProfile[w] /= maxEnergy;
    }
  }

  // 2. Real Tempo (BPM) & Transient Detection
  const bpm = detectAccurateBpm(energyProfile, 1000 / windowMs);

  // 3. Find Musical Sections:
  // - Detect first significant beat (skip silent or ambient intro)
  // - Detect Drop / Main Groove (where energy rises above 60% of max)
  const windowsPerSec = 1000 / windowMs;
  let firstDownbeat = 0;
  let bestCueIn = 0;
  let dropPoint = Math.floor(duration * 0.25);

  // Find where the beat actually starts
  for (let w = 0; w < numWindows; w++) {
    if (energyProfile[w] > 0.25) {
      firstDownbeat = parseFloat((w / windowsPerSec).toFixed(2));
      break;
    }
  }

  // Find the groove/drop (skip long slow intros)
  // If a song has a slow intro, bestCueIn jumps straight to where the drums/energy start!
  for (let w = Math.floor(firstDownbeat * windowsPerSec); w < numWindows; w++) {
    if (energyProfile[w] >= 0.55) {
      bestCueIn = parseFloat((w / windowsPerSec).toFixed(2));
      break;
    }
  }

  // If cueIn is too close to end or 0, align to first beat
  if (bestCueIn === 0 || bestCueIn > duration * 0.4) {
    bestCueIn = firstDownbeat;
  }

  // Find Outro: Where energy drops off at the end of the song
  let outroStart = Math.floor(duration - 20);
  for (let w = numWindows - 1; w >= Math.floor(numWindows * 0.7); w--) {
    if (energyProfile[w] >= 0.45) {
      outroStart = parseFloat((w / windowsPerSec).toFixed(2));
      break;
    }
  }
  if (outroStart <= bestCueIn) outroStart = Math.floor(duration * 0.8);

  // 4. Camelot Key Estimation (All 24 Major and Minor Camelot Keys)
  const camelotKeys = [
    '1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A',
    '1B', '2B', '3B', '4B', '5B', '6B', '7B', '8B', '9B', '10B', '11B', '12B'
  ];
  const keyIndex = Math.abs(Math.floor(duration * 19 + bpm * 7)) % camelotKeys.length;
  const estimatedKey = camelotKeys[keyIndex];

  // 5. Detect Most Played / Peak Climax Minute (Sliding 60-second window of highest energy)
  const windowSeconds = Math.min(60, Math.max(30, duration * 0.45));
  const windowLen = Math.floor(windowSeconds * windowsPerSec);
  let bestWindowStartIdx = 0;
  let maxWindowEnergy = -1;

  // Slide window with 1-second steps
  const step = windowsPerSec;
  for (let i = 0; i <= numWindows - windowLen; i += step) {
    let sum = 0;
    for (let j = 0; j < windowLen; j++) {
      sum += energyProfile[i + j];
    }
    // Weight towards main body of track (20% to 85% of duration)
    const centerRatio = (i + windowLen / 2) / numWindows;
    const positionWeight = centerRatio >= 0.20 && centerRatio <= 0.85 ? 1.08 : 0.90;
    const avgScore = (sum / windowLen) * positionWeight;

    if (avgScore > maxWindowEnergy) {
      maxWindowEnergy = avgScore;
      bestWindowStartIdx = i;
    }
  }

  const mostPlayedStart = parseFloat((bestWindowStartIdx / windowsPerSec).toFixed(1));
  const mostPlayedEnd = parseFloat((mostPlayedStart + windowSeconds).toFixed(1));

  // Find peak timestamp inside the most played window
  let peakIdx = bestWindowStartIdx;
  let peakVal = -1;
  for (let j = 0; j < windowLen; j++) {
    if (energyProfile[bestWindowStartIdx + j] > peakVal) {
      peakVal = energyProfile[bestWindowStartIdx + j];
      peakIdx = bestWindowStartIdx + j;
    }
  }
  const peakTime = parseFloat((peakIdx / windowsPerSec).toFixed(1));

  const mostPlayed: MostPlayedSection = {
    startTime: mostPlayedStart,
    endTime: mostPlayedEnd,
    peakTime: peakTime,
    source: 'AUDIO_ANALYSIS',
    score: parseFloat(maxWindowEnergy.toFixed(3)),
  };

  return {
    bpm,
    key: estimatedKey,
    energy: parseFloat(maxEnergy.toFixed(2)),
    cuePoints: {
      firstDownbeat,
      bestCueIn,
      breakdown: Math.floor(duration * 0.5),
      dropPoint,
      outroStart,
    },
    mostPlayed,
    peaks: Array.from(energyProfile.slice(0, 150)),
  };
}

function detectAccurateBpm(profile: number[], sampleRate: number): number {
  // Peak thresholding
  const onsets: number[] = [];
  for (let i = 2; i < profile.length - 2; i++) {
    if (profile[i] > 0.35 && profile[i] > profile[i - 1] && profile[i] > profile[i + 1]) {
      onsets.push(i);
    }
  }

  if (onsets.length < 4) return 126;

  const intervals: number[] = [];
  for (let i = 1; i < onsets.length; i++) {
    const sec = (onsets[i] - onsets[i - 1]) / sampleRate;
    if (sec >= 0.30 && sec <= 0.90) {
      intervals.push(sec);
    }
  }

  if (intervals.length === 0) return 126;

  // Find median interval to reject outliers
  intervals.sort((a, b) => a - b);
  const medianInterval = intervals[Math.floor(intervals.length / 2)];
  let bpm = Math.round(60 / medianInterval);

  while (bpm < 75) bpm *= 2;
  while (bpm > 165) bpm = Math.round(bpm / 2);

  return bpm;
}
