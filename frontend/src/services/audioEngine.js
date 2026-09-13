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

export const EQ_BAND_INFO = [
  { freq: 32, label: '32Hz', name: 'Sub-Bass', range: '20-40Hz' },
  { freq: 64, label: '64Hz', name: 'Bass', range: '40-80Hz' },
  { freq: 125, label: '125Hz', name: 'Punch', range: '80-200Hz' },
  { freq: 250, label: '250Hz', name: 'Low-Mid', range: '200-400Hz' },
  { freq: 500, label: '500Hz', name: 'Midrange', range: '400-800Hz' },
  { freq: 1000, label: '1kHz', name: 'Upper-Mid', range: '800-1.5kHz' },
  { freq: 2000, label: '2kHz', name: 'Presence', range: '1.5-3kHz' },
  { freq: 4000, label: '4kHz', name: 'Brilliance', range: '3-6kHz' },
  { freq: 8000, label: '8kHz', name: 'Treble', range: '6-12kHz' },
  { freq: 16000, label: '16kHz', name: 'Air', range: '12-20kHz' },
];

export const EQ_PRESETS = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bass Boost': [6, 5, 4, 2, 0, 0, 0, 0, 1, 2],
  'Bass Reducer': [-6, -5, -3, -1, 0, 0, 0, 0, 0, 0],
  Electronic: [5, 4, 2, 0, -2, 2, 1, 3, 4, 5],
  'Hip-Hop': [5, 4, 2, 1, -1, -1, 1, 2, 3, 3],
  Rock: [4, 3, 1, -1, -2, 1, 3, 4, 4, 3],
  Pop: [-1, 1, 3, 4, 4, 2, 0, 1, 2, 3],
  'Vocal Clarity': [-2, -2, 0, 2, 4, 5, 4, 2, 0, -1],
  Acoustic: [3, 2, 1, 1, 2, 2, 3, 3, 2, 2],
  Jazz: [3, 2, 1, 2, -1, -1, 0, 1, 2, 3],
  Classical: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4],
  'Lofi Chill': [2, 3, 1, 0, 0, 0, 1, 2, -2, -4],
  Cinematic: [5, 4, 2, 0, 0, 2, 3, 4, 5, 6],
  'Air & Brilliance': [0, 0, 0, 0, 1, 2, 3, 5, 6, 7],
  'Slowed + Reverb': [4, 3, 1, -1, -3, -2, 0, 1, -1, -2],
};

export const EQ_PRESET_CATEGORIES = {
  All: ['Flat', 'Bass Boost', 'Bass Reducer', 'Electronic', 'Hip-Hop', 'Rock', 'Pop', 'Vocal Clarity', 'Acoustic', 'Jazz', 'Classical', 'Lofi Chill', 'Cinematic', 'Air & Brilliance', 'Slowed + Reverb'],
  Popular: ['Flat', 'Bass Boost', 'Electronic', 'Hip-Hop', 'Rock', 'Vocal Clarity'],
  Genres: ['Electronic', 'Hip-Hop', 'Rock', 'Pop', 'Acoustic', 'Jazz', 'Classical'],
  Enhancers: ['Bass Boost', 'Bass Reducer', 'Vocal Clarity', 'Air & Brilliance', 'Cinematic', 'Slowed + Reverb'],
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.sourceNode = null;
    this.analyser = null;
    this.preampGainNode = null;
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
    this.eqBypassed = false;
    this.fftData = new Uint8Array(128);
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
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;
      this.fftData = new Uint8Array(this.analyser.frequencyBinCount);

      // Preamp Gain Node (-12dB to +12dB)
      this.preampGainNode = this.ctx.createGain();
      this.preampGainNode.gain.value = 1.0;

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
        filter.Q.value = 1.4;
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
        // Source -> Preamp
        this.sourceNode.connect(this.preampGainNode);

        // Preamp -> 10-Band EQ Filters chain
        let prevNode = this.preampGainNode;
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
      this.eqFilters[index].gain.setTargetAtTime(
        this.eqBypassed ? 0 : gainValue,
        this.ctx ? this.ctx.currentTime : 0,
        0.05
      );
    }
  }

  setEqualizerPreset(presetName) {
    const gains = EQ_PRESETS[presetName] || EQ_PRESETS.Flat;
    gains.forEach((g, i) => this.setEqualizerBand(i, g));
    return gains;
  }

  setPreampGain(db = 0) {
    if (!this.preampGainNode || !this.ctx) return;
    const linear = Math.pow(10, db / 20);
    this.preampGainNode.gain.setTargetAtTime(linear, this.ctx.currentTime, 0.05);
  }

  setEqualizerBypass(bypassed, currentBands = []) {
    this.eqBypassed = bypassed;
    if (bypassed) {
      this.eqFilters.forEach((f) => {
        if (this.ctx) f.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        else f.gain.value = 0;
      });
    } else {
      currentBands.forEach((g, i) => this.setEqualizerBand(i, g));
    }
  }

  getEqualizerResponseCurve(numPoints = 128) {
    if (!this.ctx || this.eqFilters.length === 0) return null;
    const freqs = new Float32Array(numPoints);
    const minLog = Math.log10(20);
    const maxLog = Math.log10(20000);
    for (let i = 0; i < numPoints; i++) {
      freqs[i] = Math.pow(10, minLog + (i / (numPoints - 1)) * (maxLog - minLog));
    }

    const totalMag = new Float32Array(numPoints).fill(1.0);
    const tempMag = new Float32Array(numPoints);
    const tempPhase = new Float32Array(numPoints);

    if (!this.eqBypassed) {
      for (const filter of this.eqFilters) {
        filter.getFrequencyResponse(freqs, tempMag, tempPhase);
        for (let i = 0; i < numPoints; i++) {
          totalMag[i] *= tempMag[i];
        }
      }
    }

    const dBs = new Float32Array(numPoints);
    for (let i = 0; i < numPoints; i++) {
      dBs[i] = 20 * Math.log10(Math.max(0.0001, totalMag[i]));
    }

    return { freqs, dBs };
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
