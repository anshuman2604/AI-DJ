// Generates synthetic electronic music tracks with distinct BPM, key, and structure
// so users can test full AI DJ mixing immediately with real audio without needing MP3 files
export function createSyntheticTrack(
  audioCtx: AudioContext,
  title: string,
  artist: string,
  bpm: number,
  keyNote: number, // MIDI note (e.g. 57 for A3)
  keyName: string,
  durationSec: number = 32
): AudioBuffer {
  const sampleRate = audioCtx.sampleRate;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = audioCtx.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const secondsPerBeat = 60 / bpm;
  const totalBeats = Math.floor(durationSec / secondsPerBeat);

  for (let beat = 0; beat < totalBeats; beat++) {
    const beatTime = beat * secondsPerBeat;
    const startSample = Math.floor(beatTime * sampleRate);

    // 1. Kick drum on every beat (4-on-the-floor)
    const kickSamples = Math.floor(sampleRate * 0.25);
    for (let i = 0; i < kickSamples && startSample + i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = 130 * Math.exp(-t * 22) + 45;
      const env = Math.exp(-t * 14);
      const val = Math.sin(2 * Math.PI * freq * t) * env * 0.65;
      left[startSample + i] += val;
      right[startSample + i] += val;
    }

    // 2. Hi-hat on offbeats
    const offbeatSample = startSample + Math.floor(sampleRate * (secondsPerBeat / 2));
    const hatSamples = Math.floor(sampleRate * 0.06);
    for (let i = 0; i < hatSamples && offbeatSample + i < numSamples; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 50);
      const noise = (Math.random() * 2 - 1) * env * 0.25;
      left[offbeatSample + i] += noise * 0.8;
      right[offbeatSample + i] += noise * 0.8;
    }

    // 3. Bass synth on beat 2 & 4
    if (beat % 2 === 1) {
      const bassFreq = 440 * Math.pow(2, (keyNote - 69 - 12) / 12);
      const bassSamples = Math.floor(sampleRate * (secondsPerBeat * 0.8));
      for (let i = 0; i < bassSamples && startSample + i < numSamples; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 4);
        // Sawtooth approximation
        let val = 0;
        for (let h = 1; h <= 4; h++) {
          val += (Math.sin(2 * Math.PI * bassFreq * h * t) / h) * env * 0.2;
        }
        left[startSample + i] += val;
        right[startSample + i] += val;
      }
    }

    // 4. Melodic chord arpeggio
    const chordNotes = [keyNote, keyNote + 3, keyNote + 7, keyNote + 10]; // Minor 7th
    const note = chordNotes[beat % chordNotes.length];
    const synthFreq = 440 * Math.pow(2, (note - 69) / 12);
    const synthSamples = Math.floor(sampleRate * (secondsPerBeat * 0.5));
    for (let i = 0; i < synthSamples && startSample + i < numSamples; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 6);
      const val = Math.sin(2 * Math.PI * synthFreq * t) * env * 0.22;
      left[startSample + i] += val * 0.7;
      right[startSample + i] += val * 0.9; // Stereo panning
    }
  }

  // Normalize buffer
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      if (Math.abs(data[i]) > max) max = Math.abs(data[i]);
    }
    if (max > 0.95) {
      const scale = 0.95 / max;
      for (let i = 0; i < data.length; i++) {
        data[i] *= scale;
      }
    }
  }

  return buffer;
}
