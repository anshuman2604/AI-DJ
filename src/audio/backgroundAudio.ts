/**
 * iOS & Mobile Background Audio Keep-Alive Manager
 * 
 * Mobile Safari / iOS WebKit suspends pure Web Audio (AudioContext) when the app
 * is minimized, locked, or backgrounded UNLESS an HTMLAudioElement (<audio>)
 * is actively playing.
 * 
 * This module creates a hardware-accelerated silent audio loop that attaches
 * to the iOS Media Player session, allowing WebAudio to continue playing
 * seamlessly in the background and on the lock screen.
 */

const FALLBACK_SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

class BackgroundAudioManager {
  private silentAudio: HTMLAudioElement | null = null;
  private wakeLock: any = null;
  public isKeepAliveActive: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initSilentAudio();
      this.setupLifecycleListeners();
    }
  }

  private initSilentAudio() {
    try {
      this.silentAudio = new Audio('/silence.mp3');
      this.silentAudio.loop = true;
      this.silentAudio.preload = 'auto';
      // Low volume keeps the iOS media hardware session alive without generating audible noise
      this.silentAudio.volume = 0.01;
      (this.silentAudio as any).playsInline = true;

      this.silentAudio.onerror = () => {
        if (this.silentAudio) {
          this.silentAudio.src = FALLBACK_SILENT_WAV;
        }
      };
    } catch (e) {
      console.warn('[BackgroundAudio] Init error:', e);
    }
  }

  public startKeepAlive(ctx?: AudioContext | null) {
    this.isKeepAliveActive = true;

    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (this.silentAudio) {
      this.silentAudio.play().catch(() => {
        // May wait for first explicit user gesture
      });
    }

    this.requestWakeLock();
  }

  public stopKeepAlive() {
    this.isKeepAliveActive = false;

    if (this.silentAudio) {
      this.silentAudio.pause();
    }

    this.releaseWakeLock();
  }

  private setupLifecycleListeners() {
    // When the screen locks or app switches to background
    document.addEventListener('visibilitychange', () => {
      if (this.isKeepAliveActive && this.silentAudio) {
        if (this.silentAudio.paused) {
          this.silentAudio.play().catch(() => {});
        }
      }
    });

    // iOS app resume or page restore
    window.addEventListener('pageshow', () => {
      if (this.isKeepAliveActive && this.silentAudio?.paused) {
        this.silentAudio.play().catch(() => {});
      }
    });
  }

  private async requestWakeLock() {
    if ('wakeLock' in navigator && !this.wakeLock) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      } catch (e) {}
    }
  }

  private async releaseWakeLock() {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
      } catch (e) {}
    }
  }
}

export const backgroundAudio = new BackgroundAudioManager();
