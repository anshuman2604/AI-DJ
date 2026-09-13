import { Track, DeckState } from '../types/dj';

export class DeckEngine {
  public id: 'A' | 'B';
  public ctx: AudioContext;
  private source: AudioBufferSourceNode | null = null;
  public buffer: AudioBuffer | null = null;
  
  // 3-Band Equalizer (Pioneer DJ / Allen&Heath response)
  public lowFilter: BiquadFilterNode;
  public midFilter: BiquadFilterNode;
  public highFilter: BiquadFilterNode;
  public djFilter: BiquadFilterNode;
  public gainNode: GainNode;
  public outputNode: GainNode;

  private startCtxTime: number = 0;
  private startTrackOffset: number = 0;
  private currentRate: number = 1.0;
  private pauseOffset: number = 0;
  public isPlaying: boolean = false;
  public playbackRate: number = 1.0;
  public currentTrack: Track | null = null;

  constructor(id: 'A' | 'B', ctx: AudioContext) {
    this.id = id;
    this.ctx = ctx;

    // Low-shelf filter for Bass (cutting kicks/subs)
    this.lowFilter = ctx.createBiquadFilter();
    this.lowFilter.type = 'lowshelf';
    this.lowFilter.frequency.value = 250;

    // Peaking filter for Vocals / Midrange (cutting vocals when blending)
    this.midFilter = ctx.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = 1000;
    this.midFilter.Q.value = 0.7;

    // High-shelf filter for Hi-hats & Cymbals
    this.highFilter = ctx.createBiquadFilter();
    this.highFilter.type = 'highshelf';
    this.highFilter.frequency.value = 4000;

    // DJ Filter sweep (Highpass / Lowpass transition sweep)
    this.djFilter = ctx.createBiquadFilter();
    this.djFilter.type = 'lowpass';
    this.djFilter.frequency.value = 20000; // Transparent by default

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0.85; // Clean headroom to prevent clipping

    this.outputNode = ctx.createGain();
    this.outputNode.gain.value = 1.0;

    this.lowFilter.connect(this.midFilter);
    this.midFilter.connect(this.highFilter);
    this.highFilter.connect(this.djFilter);
    this.djFilter.connect(this.gainNode);
    this.gainNode.connect(this.outputNode);
  }

  public loadTrack(track: Track, buffer: AudioBuffer) {
    this.stop();
    this.currentTrack = track;
    this.buffer = buffer;
    this.pauseOffset = 0;
    this.startTrackOffset = 0;
    this.startCtxTime = 0;
  }

  public play(offsetSec?: number) {
    if (!this.buffer) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) {
      this.stop();
    }

    const startAt = offsetSec !== undefined ? offsetSec : this.pauseOffset;

    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.playbackRate.value = this.playbackRate;
    this.source.connect(this.lowFilter);

    this.source.onended = () => {
      this.isPlaying = false;
    };

    this.startTrackOffset = startAt;
    this.startCtxTime = this.ctx.currentTime;
    this.currentRate = this.playbackRate;

    this.source.start(0, startAt);
    this.isPlaying = true;
  }

  public pause() {
    if (!this.isPlaying) return;
    this.pauseOffset = this.getCurrentTime();
    this.stop();
  }

  public stop() {
    if (this.source) {
      try {
        this.source.stop();
        this.source.disconnect();
      } catch (e) {}
      this.source = null;
    }
    this.isPlaying = false;
    this.resetDJFilter();
  }

  public getCurrentTime(): number {
    if (!this.isPlaying) return this.pauseOffset;
    const dt = this.ctx.currentTime - this.startCtxTime;
    return Math.max(0, this.startTrackOffset + dt * this.currentRate);
  }

  /**
   * Smoothly changes playback rate.
   * If durationSec > 0, glides smoothly with linearRampToValueAtTime.
   * Eliminates abrupt pitch jumps and speed drops!
   */
  public glidePlaybackRate(targetRate: number, durationSec: number = 0) {
    if (this.isPlaying) {
      const dt = this.ctx.currentTime - this.startCtxTime;
      this.startTrackOffset = this.startTrackOffset + dt * this.currentRate;
      this.startCtxTime = this.ctx.currentTime;
    }
    this.playbackRate = targetRate;
    this.currentRate = targetRate;

    if (this.source) {
      const now = this.ctx.currentTime;
      this.source.playbackRate.cancelScheduledValues(now);
      this.source.playbackRate.setValueAtTime(this.source.playbackRate.value, now);
      if (durationSec > 0) {
        this.source.playbackRate.linearRampToValueAtTime(targetRate, now + durationSec);
      } else {
        this.source.playbackRate.setTargetAtTime(targetRate, now, 0.05);
      }
    }
  }

  public setPlaybackRate(rate: number) {
    this.glidePlaybackRate(rate, 0);
  }

  public setEQ(lowDb: number, midDb: number, highDb: number, rampSec: number = 0.05) {
    const now = this.ctx.currentTime;
    this.lowFilter.gain.setTargetAtTime(lowDb, now, rampSec);
    this.midFilter.gain.setTargetAtTime(midDb, now, rampSec);
    this.highFilter.gain.setTargetAtTime(highDb, now, rampSec);
  }

  public setVolume(vol: number) {
    this.gainNode.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.05);
  }

  /**
   * DJ Filter Sweep:
   * Highpass cuts bass & mids, leaving airy top end (iconic DJ build/exit).
   * Lowpass cuts highs, leaving deep bass/warmth.
   */
  public sweepDJFilter(type: 'highpass' | 'lowpass', freq: number, rampSec: number = 0.05) {
    const now = this.ctx.currentTime;
    this.djFilter.type = type;
    this.djFilter.frequency.setTargetAtTime(Math.max(20, Math.min(20000, freq)), now, rampSec);
  }

  public resetDJFilter() {
    this.djFilter.type = 'lowpass';
    this.djFilter.frequency.setValueAtTime(20000, this.ctx.currentTime);
  }
}

export class DJEngine {
  public ctx: AudioContext;
  public deckA: DeckEngine;
  public deckB: DeckEngine;
  public crossfaderNodeA: GainNode;
  public crossfaderNodeB: GainNode;
  public limiter: DynamicsCompressorNode;
  public masterGain: GainNode;
  private crossfaderVal: number = 0.0;

  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Master Limiter / Compressor: Prevents digital harsh clipping and distortion
    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.setValueAtTime(-1.5, this.ctx.currentTime); // -1.5 dBFS ceiling
    this.limiter.knee.setValueAtTime(4.0, this.ctx.currentTime);
    this.limiter.ratio.setValueAtTime(12.0, this.ctx.currentTime);
    this.limiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.limiter.release.setValueAtTime(0.15, this.ctx.currentTime);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.90; // Balanced output level

    this.limiter.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.crossfaderNodeA = this.ctx.createGain();
    this.crossfaderNodeB = this.ctx.createGain();

    this.deckA = new DeckEngine('A', this.ctx);
    this.deckB = new DeckEngine('B', this.ctx);

    this.deckA.outputNode.connect(this.crossfaderNodeA);
    this.deckB.outputNode.connect(this.crossfaderNodeB);

    this.crossfaderNodeA.connect(this.limiter);
    this.crossfaderNodeB.connect(this.limiter);

    this.setCrossfader(0.0);
  }

  // Smooth DJ Crossfader Curve (Smooth dipping curve, prevents loudness spikes)
  public setCrossfader(val: number) {
    this.crossfaderVal = Math.max(0, Math.min(1, val));
    // Constant acoustic power panning (sin/cos curve)
    const angle = this.crossfaderVal * 0.5 * Math.PI;
    const gainA = Math.cos(angle);
    const gainB = Math.sin(angle);

    this.crossfaderNodeA.gain.setTargetAtTime(gainA, this.ctx.currentTime, 0.04);
    this.crossfaderNodeB.gain.setTargetAtTime(gainB, this.ctx.currentTime, 0.04);
  }

  public getCrossfader(): number {
    return this.crossfaderVal;
  }
}
