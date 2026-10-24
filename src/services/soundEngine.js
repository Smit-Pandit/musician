// Web Audio API Synthesizer and Audio Analysis Engine for MUSICIANS
// Generates authentic analog synth melodies, basslines, and provides live waveform data

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.isPlaying = false;
    this.activeNodes = [];
    this.timerId = null;
    this.onEndedCallback = null;
    this.playbackProgress = 0;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Generates a deterministic, unique signature synth pattern for any track based on its metadata
  getPatternForTrack(track) {
    if (track?.synthPattern) return track.synthPattern;

    const id = track?.track_id || 1;
    const str = `${track?.title || 'Track'}-${track?.artist?.name || track?.artist_name || 'Artist'}-${track?.genre || 'Electronic'}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i) + id * 19;
      hash |= 0;
    }
    const absHash = Math.abs(hash);

    const scales = [
      // A Minor (Classic Synthwave)
      { bass: 55, notes: [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00] },
      // D Minor (Dark / Cyberpunk)
      { bass: 73.42, notes: [146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 349.23, 392.00] },
      // F Minor (Emotional / House)
      { bass: 43.65, notes: [174.61, 207.65, 233.08, 261.63, 311.13, 349.23, 415.30, 466.16] },
      // E Minor (Chillwave / Retro)
      { bass: 41.20, notes: [164.81, 196.00, 220.00, 246.94, 293.66, 329.63, 392.00, 440.00] },
      // C Minor (Heroic Neo-noir)
      { bass: 65.41, notes: [130.81, 155.56, 174.61, 196.00, 233.08, 261.63, 311.13, 392.00] }
    ];

    const scale = scales[absHash % scales.length];
    const waveTypes = ['sawtooth', 'square', 'triangle', 'sine'];
    const waveType = waveTypes[(absHash >> 3) % waveTypes.length];
    const bpm = 90 + (absHash % 45); // 90 to 135 BPM

    const sequenceLength = 6 + (absHash % 3);
    const notes = [];
    for (let i = 0; i < sequenceLength; i++) {
      const charCode = str.charCodeAt(i % str.length) || 0;
      const noteIdx = (absHash + i * 2 + charCode) % scale.notes.length;
      notes.push(scale.notes[noteIdx]);
    }

    return {
      bpm,
      notes,
      waveType,
      bassFreq: scale.bass,
      vibAmount: 2.5 + ((absHash % 25) / 10)
    };
  }

  // Play snippet of specific duration (e.g. 0.5s, 1.0s, 2.5s, 5.0s, or custom preview)
  playTrackSnippet(track, durationSec = 1.0, onEnded = null) {
    this.stop();
    this.initContext();
    this.onEndedCallback = onEnded;
    this.isPlaying = true;

    const pattern = this.getPatternForTrack(track);

    const now = this.ctx.currentTime;
    const noteDuration = 60 / pattern.bpm / 2; // eighth notes

    // Master Gain
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.01, now);
    masterGain.gain.exponentialRampToValueAtTime(0.35, now + 0.05);
    // Smooth fade out before end
    masterGain.gain.setValueAtTime(0.35, now + Math.max(0.05, durationSec - 0.08));
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    // Filter node for analog warmth
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(2800, now + durationSec * 0.5);

    // Connect chain
    masterGain.connect(filter);
    filter.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Play bass note
    const bassOsc = this.ctx.createOscillator();
    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(pattern.bassFreq || 55, now);
    const bassGain = this.ctx.createGain();
    bassGain.gain.setValueAtTime(0.4, now);
    bassOsc.connect(bassGain);
    bassGain.connect(masterGain);
    bassOsc.start(now);
    bassOsc.stop(now + durationSec);
    this.activeNodes.push(bassOsc);

    // Play melody arpeggio
    let stepTime = now;
    let noteIdx = 0;
    while (stepTime < now + durationSec) {
      const noteFreq = pattern.notes[noteIdx % pattern.notes.length];
      const osc = this.ctx.createOscillator();
      osc.type = pattern.waveType || 'sawtooth';
      osc.frequency.setValueAtTime(noteFreq, stepTime);

      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.25, stepTime);
      noteGain.gain.exponentialRampToValueAtTime(0.02, stepTime + Math.min(noteDuration * 0.9, durationSec));

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(stepTime);
      osc.stop(Math.min(stepTime + noteDuration, now + durationSec));
      this.activeNodes.push(osc);

      stepTime += noteDuration;
      noteIdx++;
    }

    // Schedule stop
    this.timerId = setTimeout(() => {
      this.isPlaying = false;
      this.activeNodes = [];
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
    }, durationSec * 1000);
  }

  stop() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.activeNodes.forEach(node => {
      try {
        node.stop();
        node.disconnect();
      } catch {
        // Ignore already stopped
      }
    });
    this.activeNodes = [];
    this.isPlaying = false;
    if (this.onEndedCallback) {
      this.onEndedCallback();
      this.onEndedCallback = null;
    }
  }

  // Get live frequency data for rendering waveform visualizer
  getWaveformData() {
    if (!this.analyser || !this.isPlaying) {
      return Array(16).fill(0.15);
    }
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    // Downsample to 16 bars
    const bars = [];
    const step = Math.floor(dataArray.length / 16) || 1;
    for (let i = 0; i < 16; i++) {
      const val = dataArray[i * step] || 0;
      bars.push(Math.max(0.1, val / 255));
    }
    return bars;
  }

  // Play sonic futuristic entry chime
  playEntryChime() {
    try {
      this.initContext();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // AudioContext audio unlock fallback
    }
  }

  // Play deep visceral Venom symbiote roar / surge on click
  playVenomRoar() {
    try {
      this.initContext();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.6);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(60, now + 0.6);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch {
      // Audio unlock fallback
    }
  }
}

export const soundEngine = new SoundEngine();
