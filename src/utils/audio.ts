// Synthesized Web Audio API sound effects for PopDrop gamification
import { DropRarity } from "../types";

class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Play proximity unlock chime (upbeat ascending arpeggio when entering drop radius)
  playProximityUnlock() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.35);
      });
    } catch {
      // Audio fallback
    }
  }

  // Play claim victory sound with distinct audio cues tailored to Drop Rarity
  playClaimVictory(rarity: DropRarity = "Common") {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      switch (rarity) {
        case "Legendary":
          this.playLegendaryFanfare(ctx);
          break;
        case "Epic":
          this.playEpicHarmonics(ctx);
          break;
        case "Rare":
          this.playRareSparkle(ctx);
          break;
        case "Common":
        default:
          this.playCommonChime(ctx);
          break;
      }
    } catch {
      // Audio fallback
    }
  }

  // COMMON: Clean energetic two-tone ascending bell chime
  private playCommonChime(ctx: AudioContext) {
    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0, dur: 0.3, type: "sine" as OscillatorType, vol: 0.15 }, // C5
      { freq: 659.25, time: 0.12, dur: 0.45, type: "triangle" as OscillatorType, vol: 0.18 }, // E5
      { freq: 783.99, time: 0.24, dur: 0.6, type: "sine" as OscillatorType, vol: 0.2 }, // G5
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type;
      osc.frequency.setValueAtTime(n.freq, now + n.time);
      gain.gain.setValueAtTime(n.vol, now + n.time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur);
    });
  }

  // RARE: Shimmering high-resonance crystal arpeggio with futuristic cyber-gleam
  private playRareSparkle(ctx: AudioContext) {
    const now = ctx.currentTime;
    const arpeggio = [587.33, 739.99, 880.0, 1174.66, 1479.98, 1760.0]; // D5, F#5, A5, D6, F#6, A6

    arpeggio.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(0.14, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.5);
    });

    // Sub shimmer base
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(293.66, now); // D4
    subGain.gain.setValueAtTime(0.12, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.7);
  }

  // EPIC: Dramatic harmonic polyphonic synthesizer chords with rich vibrato
  private playEpicHarmonics(ctx: AudioContext) {
    const now = ctx.currentTime;
    // Step 1: Dramatic fanfare intro chord (A minor to C Major)
    const chord1 = [220, 277.18, 329.63, 440]; // A3, C#4, E4, A4
    const chord2 = [261.63, 329.63, 392.0, 523.25, 659.25]; // C4, E4, G4, C5, E5
    const chord3 = [293.66, 369.99, 440.0, 587.33, 880.0]; // D4, F#4, A4, D5, A5

    const playChord = (freqs: number[], startOffset: number, duration: number, vol: number) => {
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + startOffset);

        // Lowpass filter for smooth synth brass warmth
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1400, now + startOffset);
        filter.frequency.exponentialRampToValueAtTime(600, now + startOffset + duration);

        gain.gain.setValueAtTime(vol / freqs.length, now + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + startOffset);
        osc.stop(now + startOffset + duration);
      });
    };

    playChord(chord1, 0, 0.25, 0.28);
    playChord(chord2, 0.22, 0.35, 0.32);
    playChord(chord3, 0.45, 0.75, 0.38);
  }

  // LEGENDARY: Grand triumphant celestial fanfare with soaring octaves, golden shimmer & sub bass
  private playLegendaryFanfare(ctx: AudioContext) {
    const now = ctx.currentTime;

    // Deep sub-bass boom
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(110, now);
    subOsc.frequency.exponentialRampToValueAtTime(55, now + 0.8);
    subGain.gain.setValueAtTime(0.3, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 1.2);

    // Multi-stage triumphant brass arpeggiation & royal chord
    const sequence = [
      { freqs: [293.66, 440.0], time: 0.0, dur: 0.2, type: "sawtooth" as OscillatorType },
      { freqs: [369.99, 587.33], time: 0.15, dur: 0.2, type: "sawtooth" as OscillatorType },
      { freqs: [440.0, 659.25], time: 0.3, dur: 0.25, type: "sawtooth" as OscillatorType },
      { freqs: [587.33, 739.99, 880.0, 1174.66], time: 0.45, dur: 1.1, type: "sawtooth" as OscillatorType },
    ];

    sequence.forEach((step) => {
      step.freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = step.type;
        osc.frequency.setValueAtTime(freq, now + step.time);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2200, now + step.time);

        gain.gain.setValueAtTime(0.18 / step.freqs.length, now + step.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + step.time + step.dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + step.time);
        osc.stop(now + step.time + step.dur);
      });
    });

    // High golden shimmer bell glockenspiel
    const bellNotes = [1174.66, 1479.98, 1760.0, 2349.32];
    bellNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + 0.45 + idx * 0.09);

      gain.gain.setValueAtTime(0.1, now + 0.45 + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45 + idx * 0.09 + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + 0.45 + idx * 0.09);
      osc.stop(now + 0.45 + idx * 0.09 + 0.7);
    });
  }

  // Subtle walking step click
  playStepTick() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Audio fallback
    }
  }

  // Radar spatial scan ping
  playRadarPing() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio fallback
    }
  }

  // Quick light tap click
  playButtonTap() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  // Pop token reward collect blip
  playCollectPop() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }
}

export const soundManager = new SoundManager();
