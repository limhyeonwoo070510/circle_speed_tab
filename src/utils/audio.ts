/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class SoundEffects {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy initialize to bypass browser autoplay policies
  }

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      } catch (e) {
        console.warn('AudioContext not supported:', e);
      }
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
  }

  public getMute(): boolean {
    return this.isMuted;
  }

  public play(type: 'perfect' | 'good' | 'miss' | 'gameover' | 'start' | 'combo') {
    if (this.isMuted) return;

    this.init();
    if (!this.ctx) return;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      switch (type) {
        case 'perfect': {
          // Sharp bright chime/bell sound
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now); // A5
          osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08); // E6 slide up
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.18);
          break;
        }
        case 'good': {
          // Warm chime sound
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, now); // D5
          osc.frequency.setValueAtTime(659.25, now + 0.05); // E5
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }
        case 'miss': {
          // Deep hollow dull buzz
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.linearRampToValueAtTime(80, now + 0.2);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc.start(now);
          osc.stop(now + 0.22);
          break;
        }
        case 'combo': {
          // Dual pleasant minor chords / game coin
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.setValueAtTime(659.25, now + 0.07); // E5
          osc.frequency.setValueAtTime(783.99, now + 0.14); // G5
          osc.frequency.setValueAtTime(1046.50, now + 0.21); // C6
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
          break;
        }
        case 'start': {
          // Retro game starting melody (rapid rising synth)
          osc.type = 'sine';
          osc.frequency.setValueAtTime(329.63, now); // E4
          osc.frequency.setValueAtTime(392.00, now + 0.05); // G4
          osc.frequency.setValueAtTime(523.25, now + 0.10); // C5
          osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        }
        case 'gameover': {
          // Disappointing down-ward melody
          osc.type = 'sine';
          osc.frequency.setValueAtTime(220, now); // A3
          osc.frequency.linearRampToValueAtTime(110, now + 0.6); // descending
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
          osc.start(now);
          osc.stop(now + 0.7);
          break;
        }
      }
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  }
}

export const audioService = new SoundEffects();
