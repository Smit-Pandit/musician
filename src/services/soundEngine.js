// Web Audio API Synthesizer and Audio Analysis Engine for SONIX
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

  // Play snippet of specific duration (e.g. 0.5s, 1.0s, 2.5s, 5.0s, or custom preview)
  playTrackSnippet(track, durationSec = 1.0, onEnded = null) {
    this.stop();
    this.initContext();
    this.onEndedCallback = onEnded;
    this.isPlaying = true;

    const pattern = track.synthPattern || {
      bpm: 110,
      notes: [220, 261.63, 293.66, 329.63],
      waveType: 'sawtooth',
      bassFreq: 55,
      vibAmount: 3
    };

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
}

export const soundEngine = new SoundEngine();
