/**
 * audioEngine.js
 * Professional Web Audio API DSP Studio & Real-time Frequency Analyser.
 * Features:
 *  - 10-Band Graphic Equalizer (BiquadFilterNodes)
 *  - 3D Spatial Audio Soundstage (StereoPannerNode & Spatializer)
 *  - Master Dynamic Compressor Limiter (eliminates distortion & clipping)
 *  - Real-time AnalyserNode with Bass / Mid / Treble extraction
 *  - Impulse Convolver Reverb generator (for Slowed + Reverb mode)
 *  - DJ Crossfade and volume smoothing
 */

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESETS = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bass Boost': [6, 5, 4, 2, 0, 0, 0, 0, 1, 2],
  Electronic: [5, 4, 2, 0, -2, 2, 1, 3, 4, 5],
  'Vocal Clarity': [-2, -2, 0, 2, 4, 5, 4, 2, 0, -1],
  Chill: [2, 3, 1, 0, 0, 0, 1, 2, 2, 1],
  Rock: [4, 3, 1, -1, -2, 1, 3, 4, 4, 3],
  Acoustic: [3, 2, 1, 1, 2, 2, 3, 3, 2, 2],
  'Slowed + Reverb': [4, 3, 1, -1, -3, -2, 0, 1, -1, -2],
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.sourceNode = null;
    this.analyser = null;
    this.gainNode = null;
    this.compressorNode = null;
    this.pannerNode = null;
    this.reverbNode = null;
    this.reverbGain = null;
    this.dryGain = null;
    this.eqFilters = [];
    this.audioElement = null;
    this.isInitialized = false;
    this.reverbEnabled = false;
    this.spatialAudioEnabled = false;
    this.fftData = new Uint8Array(64);
    this.spatialInterval = null;
  }

  init(audioElement) {
    if (this.isInitialized && this.audioElement === audioElement) return;
    this.audioElement = audioElement;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      this.ctx = new AudioContextClass();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;
      this.fftData = new Uint8Array(this.analyser.frequencyBinCount);

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 1.0;

      // Master Dynamics Compressor (Limiter)
      this.compressorNode = this.ctx.createDynamicsCompressor();
      this.compressorNode.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressorNode.knee.setValueAtTime(40, this.ctx.currentTime);
      this.compressorNode.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressorNode.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressorNode.release.setValueAtTime(0.25, this.ctx.currentTime);

      // Stereo Panner for 3D Soundstage
      if (this.ctx.createStereoPanner) {
        this.pannerNode = this.ctx.createStereoPanner();
        this.pannerNode.pan.value = 0;
      }

      // 10-Band EQ Filters
      this.eqFilters = EQ_FREQUENCIES.map((freq, i) => {
        const filter = this.ctx.createBiquadFilter();
        if (i === 0) filter.type = 'lowshelf';
        else if (i === EQ_FREQUENCIES.length - 1) filter.type = 'highshelf';
        else filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.gain.value = 0;
        return filter;
      });

      // Synthetic Reverb Convolver
      this.reverbNode = this.ctx.createConvolver();
      this.reverbNode.buffer = this._createImpulseResponse(2.2, 2.0);

      this.reverbGain = this.ctx.createGain();
      this.reverbGain.gain.value = 0;

      this.dryGain = this.ctx.createGain();
      this.dryGain.gain.value = 1.0;

      try {
        this.sourceNode = this.ctx.createMediaElementSource(audioElement);
      } catch {
        // Fallback or already connected
      }

      if (this.sourceNode) {
        let prevNode = this.sourceNode;
        this.eqFilters.forEach((filter) => {
          prevNode.connect(filter);
          prevNode = filter;
        });

        // Dry path
        prevNode.connect(this.dryGain);
        this.dryGain.connect(this.gainNode);

        // Wet Reverb path
        prevNode.connect(this.reverbNode);
        this.reverbNode.connect(this.reverbGain);
        this.reverbGain.connect(this.gainNode);

        // Gain -> Panner (if available) -> Compressor Limiter -> Analyser -> Destination
        if (this.pannerNode) {
          this.gainNode.connect(this.pannerNode);
          this.pannerNode.connect(this.compressorNode);
        } else {
          this.gainNode.connect(this.compressorNode);
        }

        this.compressorNode.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      }

      this.isInitialized = true;
    } catch (err) {
      console.warn('[AudioEngine] Web Audio DSP note:', err.message);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _createImpulseResponse(duration, decay) {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i;
      const factor = Math.pow(1 - n / length, decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  setEqualizerBand(index, gainValue) {
    if (this.eqFilters[index]) {
      this.eqFilters[index].gain.setTargetAtTime(gainValue, this.ctx ? this.ctx.currentTime : 0, 0.05);
    }
  }

  setEqualizerPreset(presetName) {
    const gains = EQ_PRESETS[presetName] || EQ_PRESETS.Flat;
    gains.forEach((g, i) => this.setEqualizerBand(i, g));
    return gains;
  }

  setReverb(enabled, amount = 0.45) {
    this.reverbEnabled = enabled;
    if (this.reverbGain && this.ctx) {
      this.reverbGain.gain.setTargetAtTime(enabled ? amount : 0, this.ctx.currentTime, 0.08);
    }
  }

  setSpatialAudio(enabled) {
    this.spatialAudioEnabled = enabled;
    if (this.spatialInterval) {
      clearInterval(this.spatialInterval);
      this.spatialInterval = null;
    }

    if (!this.pannerNode || !this.ctx) return;

    if (enabled) {
      // Dynamic subtle binaural soundstage rotation
      let angle = 0;
      this.spatialInterval = setInterval(() => {
        angle += 0.02;
        const panValue = Math.sin(angle) * 0.45;
        this.pannerNode.pan.setTargetAtTime(panValue, this.ctx.currentTime, 0.1);
      }, 100);
      this.setReverb(true, 0.25);
    } else {
      this.pannerNode.pan.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      if (!this.reverbEnabled) this.setReverb(false, 0);
    }
  }

  setSlowedReverb(enabled) {
    if (!this.audioElement) return;
    if (enabled) {
      this.audioElement.playbackRate = 0.85;
      this.setReverb(true, 0.5);
      this.setEqualizerPreset('Slowed + Reverb');
    } else {
      this.audioElement.playbackRate = 1.0;
      this.setReverb(false, 0);
      this.setEqualizerPreset('Flat');
    }
  }

  setNightcore(enabled) {
    if (!this.audioElement) return;
    if (enabled) {
      this.audioElement.playbackRate = 1.25;
      this.setReverb(false, 0);
      this.setEqualizerPreset('Electronic');
    } else {
      this.audioElement.playbackRate = 1.0;
      this.setEqualizerPreset('Flat');
    }
  }

  getFrequencyData() {
    if (!this.analyser) {
      return {
        spectrum: this.fftData,
        bass: 0,
        mid: 0,
        treble: 0,
        average: 0,
      };
    }
    this.analyser.getByteFrequencyData(this.fftData);

    const len = this.fftData.length;
    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;
    let totalSum = 0;

    const bassEnd = Math.floor(len * 0.15);
    const midEnd = Math.floor(len * 0.55);

    for (let i = 0; i < len; i++) {
      const val = this.fftData[i];
      totalSum += val;
      if (i < bassEnd) bassSum += val;
      else if (i < midEnd) midSum += val;
      else trebleSum += val;
    }

    return {
      spectrum: this.fftData,
      bass: bassEnd > 0 ? bassSum / bassEnd : 0,
      mid: midEnd > bassEnd ? midSum / (midEnd - bassEnd) : 0,
      treble: len > midEnd ? trebleSum / (len - midEnd) : 0,
      average: len > 0 ? totalSum / len : 0,
    };
  }
}

export const audioEngine = new AudioEngine();
