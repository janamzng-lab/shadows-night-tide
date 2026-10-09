/**
 * SHADOWS: NIGHT TIDE - Procedural Horror Audio Synthesizer Engine
 * Web Audio API based sound system: zero external network dependencies,
 * spatial 3D audio, horror drones, weapons, monsters, and stingers.
 */

class HorrorAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Ambient sound nodes
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private heartbeatInterval: number | null = null;
  private panicHeartbeatInterval: number | null = null;
  private fearTinnitusOsc: OscillatorNode | null = null;
  private fearTinnitusGain: GainNode | null = null;
  private chaseMusicActive: boolean = false;
  private chaseOsc: OscillatorNode | null = null;

  private isMuted: boolean = false;
  private volumes = {
    master: 0.8,
    sfx: 0.85,
    ambience: 0.65,
    music: 0.7,
  };

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.volumes.master;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.volumes.sfx;
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = this.volumes.ambience;
      this.ambientGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.volumes.music;
      this.musicGain.connect(this.masterGain);

      this.startFacilityDrone();
    } catch {
      // AudioContext unavailable
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(master: number, sfx: number, ambience: number, music: number, muted: boolean) {
    this.volumes = { master, sfx, ambience, music };
    this.isMuted = muted;
    if (!this.ctx || !this.masterGain || !this.sfxGain || !this.ambientGain || !this.musicGain) return;

    this.masterGain.gain.setTargetAtTime(muted ? 0 : master, this.ctx.currentTime, 0.05);
    this.sfxGain.gain.setTargetAtTime(sfx, this.ctx.currentTime, 0.05);
    this.ambientGain.gain.setTargetAtTime(ambience, this.ctx.currentTime, 0.05);
    this.musicGain.gain.setTargetAtTime(music, this.ctx.currentTime, 0.05);
  }

  // ================= AMBIENT & HORROR DRONE =================
  private startFacilityDrone() {
    if (!this.ctx || !this.ambientGain) return;

    // Sub-bass dark frequency drone (45Hz + 53Hz beating)
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc2 = this.ctx.createOscillator();
    this.droneFilter = this.ctx.createBiquadFilter();

    this.droneOsc1.type = 'sawtooth';
    this.droneOsc1.frequency.setValueAtTime(46, this.ctx.currentTime);

    this.droneOsc2.type = 'triangle';
    this.droneOsc2.frequency.setValueAtTime(53.5, this.ctx.currentTime);

    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.setValueAtTime(110, this.ctx.currentTime);
    this.droneFilter.Q.setValueAtTime(4, this.ctx.currentTime);

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    this.droneOsc1.connect(this.droneFilter);
    this.droneOsc2.connect(this.droneFilter);
    this.droneFilter.connect(droneGain);
    droneGain.connect(this.ambientGain);

    this.droneOsc1.start();
    this.droneOsc2.start();

    // Random metallic groans and pipe drips
    this.scheduleAtmosphericCreaks();
  }

  private scheduleAtmosphericCreaks() {
    if (!this.ctx) return;
    const nextInterval = 4000 + Math.random() * 8000;
    setTimeout(() => {
      this.playMetallicCreak();
      this.playWaterDrip();
      this.scheduleAtmosphericCreaks();
    }, nextInterval);
  }

  public playMetallicCreak() {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    const baseFreq = 200 + Math.random() * 150;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 1.2);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.Q.setValueAtTime(6, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    osc.start(now);
    osc.stop(now + 1.5);
  }

  public playWaterDrip() {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const pitch = 900 + Math.random() * 400;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, now + 0.08);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ambientGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // ================= WEAPON SOUNDS =================
  public playWeaponFire(weaponId: string) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    switch (weaponId) {
      case 'pistol': {
        // Sharp pop + metallic snap
        this.createGunNoise(now, 0.12, 1200, 0.45);
        this.createToneBurst(now, 'triangle', 280, 70, 0.15, 0.5);
        break;
      }
      case 'shotgun': {
        // Heavy concussive blast + low boom
        this.createGunNoise(now, 0.35, 600, 0.8);
        this.createToneBurst(now, 'sawtooth', 140, 35, 0.4, 0.75);
        // Pump slide sound after 400ms
        setTimeout(() => this.playMechanicalClick(0.08, 650), 400);
        break;
      }
      case 'rifle': {
        // Automatic sharp crack + body punch
        this.createGunNoise(now, 0.09, 1800, 0.5);
        this.createToneBurst(now, 'sine', 220, 60, 0.1, 0.4);
        break;
      }
      case 'heavy': {
        // Massive bass explosion thud
        this.createGunNoise(now, 0.6, 400, 0.95);
        this.createToneBurst(now, 'sawtooth', 90, 25, 0.7, 0.9);
        break;
      }
      case 'laser': {
        // High frequency synthesized pulse
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.18);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }
      case 'electric':
      case 'taser': {
        // Harsh electrical sizzle & zap
        this.createElectricArc(now, weaponId === 'taser' ? 0.3 : 0.2);
        break;
      }
      case 'shock': {
        // Large EMP surge
        this.createElectricArc(now, 0.4);
        this.createToneBurst(now, 'sine', 180, 40, 0.5, 0.7);
        break;
      }
      case 'energy': {
        // Void cannon warp explosion
        this.createToneBurst(now, 'triangle', 450, 45, 0.6, 0.85);
        this.createGunNoise(now, 0.5, 900, 0.75);
        break;
      }
      default:
        this.createGunNoise(now, 0.12, 1000, 0.4);
    }
  }

  public playReload() {
    if (!this.ctx || !this.sfxGain) return;
    this.playMechanicalClick(0.12, 550);
    setTimeout(() => this.playMechanicalClick(0.14, 850), 300);
    setTimeout(() => this.playMechanicalClick(0.1, 1100), 750);
  }

  public playEmptyClick() {
    this.playMechanicalClick(0.06, 1200);
  }

  public playMechanicalClick(duration: number, pitch: number) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.4, now + duration);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  private createGunNoise(time: number, duration: number, cutoff: number, volume: number) {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(time);
  }

  private createToneBurst(time: number, type: OscillatorType, startFreq: number, endFreq: number, duration: number, volume: number) {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  private createElectricArc(time: number, duration: number) {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, time);

    // Modulate pitch rapidly
    for (let i = 0; i < 8; i++) {
      osc.frequency.setValueAtTime(150 + Math.random() * 600, time + (duration * i) / 8);
    }

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  // ================= MONSTER SOUND DESIGN =================
  /**
   * Maryam's Sound Identity:
   * - Wet dragging viscera sounds
   * - Piercing banshee shrieks with multi-oscillator dissonance
   * - Distant guttural weeping / groans
   */
  public playMaryamGroan() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(115, now);
    osc1.frequency.linearRampToValueAtTime(95, now + 1.2);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(119, now); // slight beat
    osc2.frequency.linearRampToValueAtTime(92, now + 1.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.38, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.5);
    osc2.stop(now + 1.5);
  }

  public playMaryamScream() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(480, now);
    osc1.frequency.exponentialRampToValueAtTime(820, now + 0.3);
    osc1.frequency.exponentialRampToValueAtTime(340, now + 1.1);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(512, now);
    osc2.frequency.exponentialRampToValueAtTime(880, now + 0.3);
    osc2.frequency.exponentialRampToValueAtTime(355, now + 1.1);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, now);
    filter.Q.setValueAtTime(2.5, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.55, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.3);
    osc2.stop(now + 1.3);
  }

  /**
   * Sarah's Sound Identity:
   * - Rapid clicking, barnacle crackles
   * - Deep sunken gurgles and sudden shrill predatory shriek
   */
  public playSarahClicking() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const clickTime = now + i * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(750 + Math.random() * 300, clickTime);

      gain.gain.setValueAtTime(0.18, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(clickTime);
      osc.stop(clickTime + 0.05);
    }
  }

  public playSarahShriek() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(950, now + 0.15);
    osc.frequency.linearRampToValueAtTime(420, now + 0.8);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 1.0);
  }

  public playFollowerSnarl() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.35);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  public playMonsterHit() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.createToneBurst(now, 'sawtooth', 220, 80, 0.15, 0.4);
    this.createGunNoise(now, 0.12, 500, 0.35);
  }

  public playMonsterDeath() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.createToneBurst(now, 'sine', 160, 40, 0.8, 0.45);
  }

  // ================= JUMP SCARE STINGER =================
  public playJumpScare() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Harsh dissonant brass blast
    const freqs = [185, 196, 261, 370, 523];
    freqs.forEach((f) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.9, now + 0.7);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.85);
    });

    // Sudden loud white noise snap
    this.createGunNoise(now, 0.25, 3000, 0.6);
  }

  // ================= CHASE PULSE MUSIC =================
  public setChaseMusic(active: boolean) {
    if (this.chaseMusicActive === active) return;
    this.chaseMusicActive = active;

    if (!this.ctx || !this.musicGain) return;

    if (active) {
      this.chaseOsc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      this.chaseOsc.type = 'triangle';
      this.chaseOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 1.0);

      this.chaseOsc.connect(gain);
      gain.connect(this.musicGain);
      this.chaseOsc.start();
    } else {
      if (this.chaseOsc) {
        try {
          this.chaseOsc.stop(this.ctx.currentTime + 1.0);
        } catch {}
        this.chaseOsc = null;
      }
    }
  }

  // ================= PLAYER FEEDBACK SOUNDS =================
  public playFootstep(isSprinting: boolean, isCrouching: boolean) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const volume = isCrouching ? 0.05 : isSprinting ? 0.25 : 0.14;
    const pitch = 85 + Math.random() * 30;

    this.createToneBurst(now, 'sine', pitch, 45, 0.08, volume);
  }

  public playPlayerDamage() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Visceral punch impact
    this.createGunNoise(now, 0.2, 500, 0.6);
    this.createToneBurst(now, 'sawtooth', 120, 40, 0.3, 0.5);
  }

  public playCoinPickup() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987, now); // B5
    osc.frequency.setValueAtTime(1318, now + 0.08); // E6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playItemPickup() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.createToneBurst(now, 'triangle', 440, 880, 0.15, 0.25);
  }

  public playDoorOpen() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.createToneBurst(now, 'sawtooth', 110, 80, 0.6, 0.25);
    this.createGunNoise(now, 0.4, 600, 0.2);
  }

  public playFlashlightClick() {
    this.playMechanicalClick(0.04, 1500);
  }

  public updateHeartbeat(healthPercent: number) {
    if (!this.ctx) return;
    if (healthPercent < 0.35 && !this.heartbeatInterval) {
      this.heartbeatInterval = window.setInterval(() => {
        if (!this.ctx || !this.sfxGain) return;
        const now = this.ctx.currentTime;
        this.createToneBurst(now, 'sine', 70, 35, 0.15, 0.5);
        setTimeout(() => {
          if (!this.ctx || !this.sfxGain) return;
          this.createToneBurst(this.ctx.currentTime, 'sine', 65, 30, 0.12, 0.35);
        }, 180);
      }, 900);
    } else if (healthPercent >= 0.35 && this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public updateFear(fearRatio: number) {
    if (!this.ctx || !this.sfxGain) return;

    if (fearRatio >= 0.70) {
      // Start or adjust panic tinnitus
      if (!this.fearTinnitusOsc) {
        try {
          this.fearTinnitusOsc = this.ctx.createOscillator();
          this.fearTinnitusGain = this.ctx.createGain();

          this.fearTinnitusOsc.type = 'sine';
          this.fearTinnitusOsc.frequency.setValueAtTime(2600, this.ctx.currentTime);
          this.fearTinnitusGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

          this.fearTinnitusOsc.connect(this.fearTinnitusGain);
          this.fearTinnitusGain.connect(this.sfxGain);
          this.fearTinnitusOsc.start();
        } catch {}
      }

      if (this.fearTinnitusGain) {
        const factor = Math.min(1.0, Math.max(0.0, (fearRatio - 0.7) / 0.3));
        const targetVol = 0.02 + 0.07 * factor;
        this.fearTinnitusGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.1);
      }

      // Fast panic heartbeat if low-health heartbeat is not running
      if (!this.panicHeartbeatInterval && !this.heartbeatInterval) {
        this.panicHeartbeatInterval = window.setInterval(() => {
          if (!this.ctx || !this.sfxGain) return;
          const now = this.ctx.currentTime;
          this.createToneBurst(now, 'sine', 78, 40, 0.12, 0.45);
          setTimeout(() => {
            if (!this.ctx || !this.sfxGain) return;
            this.createToneBurst(this.ctx.currentTime, 'sine', 72, 35, 0.1, 0.3);
          }, 140);
        }, 550);
      }
    } else if (fearRatio < 0.65) {
      if (this.fearTinnitusGain && this.ctx) {
        this.fearTinnitusGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
        setTimeout(() => {
          if (this.fearTinnitusOsc) {
            try { this.fearTinnitusOsc.stop(); } catch {}
            this.fearTinnitusOsc = null;
            this.fearTinnitusGain = null;
          }
        }, 300);
      }
      if (this.panicHeartbeatInterval) {
        clearInterval(this.panicHeartbeatInterval);
        this.panicHeartbeatInterval = null;
      }
    }
  }

  public stopAll() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.panicHeartbeatInterval) {
      clearInterval(this.panicHeartbeatInterval);
      this.panicHeartbeatInterval = null;
    }
    if (this.fearTinnitusOsc) {
      try { this.fearTinnitusOsc.stop(); } catch {}
      this.fearTinnitusOsc = null;
      this.fearTinnitusGain = null;
    }
    this.setChaseMusic(false);
  }
}

export const horrorAudio = new HorrorAudioEngine();
