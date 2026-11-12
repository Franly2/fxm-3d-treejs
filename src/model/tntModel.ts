import * as THREE from 'three';

export interface TntRuntime {
  root: THREE.Group;
  materials: Record<string, THREE.Material>;
  pivots: Record<string, THREE.Object3D>;
  tick: (delta: number, elapsed: number) => void;
  triggerExplosion: () => void;
  isExploding: () => boolean;
  reset: () => void;
}

// ==========================================
// CINEMATIC PROCEDURAL WEB AUDIO ENGINE (100% OFFLINE)
// ==========================================
let sharedAudioCtx: AudioContext | null = null;
let cachedFuseBuffer: AudioBuffer | null = null;
let cachedExplosionBuffer: AudioBuffer | null = null;
let currentFuseNode: AudioBufferSourceNode | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch (e) {
    return null;
  }
}

// 1. Burning Fuse Sizzle (dynamic crackling sparks & rising powder sizzle)
function createFuseBuffer(ctx: AudioContext): AudioBuffer {
  const duration = 0.52;
  const sampleRate = ctx.sampleRate;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = t / duration;

    // Rising powder sizzle (bandpass simulation from 2400Hz up to 4800Hz)
    const raw = Math.random() * 2 - 1;
    const freq = 2400 + progress * 2200;
    const sizzle = raw * Math.sin(2 * Math.PI * freq * t);

    // Random sharp spark crackles (spitting fire sparks)
    let spark = 0;
    if (Math.random() < 0.045 + progress * 0.09) {
      spark = (Math.random() > 0.5 ? 1 : -1) * (0.45 + Math.random() * 0.55);
    }

    const env = 0.18 + 0.82 * Math.pow(progress, 1.35);
    data[i] = (sizzle * 0.32 + spark * 0.6) * env;
  }
  return buffer;
}

// 2. Heavy Hollywood Cinematic TNT Blast (2.3s multi-layered explosion)
function createExplosionBuffer(ctx: AudioContext): AudioBuffer {
  const duration = 2.3;
  const sampleRate = ctx.sampleRate;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  // Layer 1: Detonation Primer Snap / Shockwave Crack (0 - 0.16s)
  for (let i = 0; i < Math.floor(sampleRate * 0.18); i++) {
    const t = i / sampleRate;
    const crackEnv = Math.exp(-t * 38);
    const freq = 55 + 460 * Math.exp(-t * 62);
    const punch = Math.sin(2 * Math.PI * freq * t);
    const snapNoise = (Math.random() * 2 - 1) * Math.exp(-t * 26);
    data[i] += (punch * 0.88 + snapNoise * 0.68) * crackEnv;
  }

  // Layer 2: Deep Sub-Bass Chest Boom (0 - 1.4s)
  let bassPhase = 0;
  for (let i = 0; i < Math.floor(sampleRate * 1.4); i++) {
    const t = i / sampleRate;
    // Exponential pitch dive 190Hz -> 26Hz
    const freq = 26 + 164 * Math.exp(-t * 4.4);
    bassPhase += (2 * Math.PI * freq) / sampleRate;
    const boomWave = Math.sin(bassPhase) + 0.42 * Math.sin(bassPhase * 0.5);
    // Soft overdrive saturation
    const saturated = Math.tanh(boomWave * 2.8) * 0.95;
    const env = Math.exp(-t * 2.7);
    data[i] += saturated * env;
  }

  // Layer 3: Turbulent Fiery Blast & Low Rolling Rumble (0 - 2.3s)
  let lp = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const raw = Math.random() * 2 - 1;
    // Dynamic filter sweep: 2400Hz down to 55Hz
    const cutoff = 55 + 2345 * Math.exp(-t * 3.4);
    const rc = 1.0 / (2 * Math.PI * cutoff);
    const dt = 1.0 / sampleRate;
    const alpha = dt / (rc + dt);
    lp += alpha * (raw - lp);

    // Gritty explosive crunch
    const crunched = Math.tanh(lp * 3.6);
    const rumbleEnv = Math.exp(-t * 1.85) * (0.86 + 0.14 * Math.sin(t * 26));
    data[i] += crunched * rumbleEnv * 0.88;
  }

  // Layer 4: Wooden Crate Fractures / Splinter Pops (cracking wood in blast)
  for (let p = 0; p < 16; p++) {
    const start = Math.floor((0.012 + Math.random() * 0.45) * sampleRate);
    const len = Math.floor((0.006 + Math.random() * 0.016) * sampleRate);
    const freq = 320 + Math.random() * 980;
    const amp = 0.38 * Math.random();
    for (let j = 0; j < len && start + j < numSamples; j++) {
      const pt = j / sampleRate;
      data[start + j] += Math.sin(2 * Math.PI * freq * pt) * Math.exp(-pt * 260) * amp;
    }
  }

  // Master Soft Limiter / Peak Normalization
  let peak = 0;
  for (let i = 0; i < numSamples; i++) {
    if (Math.abs(data[i]) > peak) peak = Math.abs(data[i]);
  }
  if (peak > 0) {
    const norm = 0.96 / peak;
    for (let i = 0; i < numSamples; i++) {
      data[i] = Math.tanh(data[i] * norm * 1.15) * 0.94;
    }
  }

  return buffer;
}

function playFuseSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (!cachedFuseBuffer) cachedFuseBuffer = createFuseBuffer(ctx);
    const source = ctx.createBufferSource();
    source.buffer = cachedFuseBuffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.75, ctx.currentTime);

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    currentFuseNode = source;
  } catch (e) {}
}

function playExplosionSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    // Cut off fuse sizzle immediately
    if (currentFuseNode) {
      try {
        currentFuseNode.stop();
      } catch (e) {}
      currentFuseNode = null;
    }

    if (!cachedExplosionBuffer) cachedExplosionBuffer = createExplosionBuffer(ctx);
    const source = ctx.createBufferSource();
    source.buffer = cachedExplosionBuffer;
    // Subtle organic pitch variation per blast
    source.playbackRate.value = 0.96 + Math.random() * 0.08;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1.0, ctx.currentTime);

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch (e) {}
}

/**
 * Procedural 3D TNT Obstacle Trap with Interactive Physics Explosion
 */
export function createTntModel(): TntRuntime {
  const root = new THREE.Group();
  root.name = 'TntTrap';

  // ==========================================
  // 1. MATERIALS
  // ==========================================
  const crateRedMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#dc2626'),
    roughness: 0.55,
    metalness: 0.08,
  });

  const crateFrameMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#991b1b'),
    roughness: 0.62,
    metalness: 0.1,
  });

  const ironBandMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#27272a'),
    roughness: 0.4,
    metalness: 0.75,
  });

  const labelPlateMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fef3c7'),
    roughness: 0.45,
    metalness: 0.05,
  });

  const tntTextMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#18181b'),
    roughness: 0.35,
    metalness: 0.15,
  });

  const fuseCordMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d6d3d1'),
    roughness: 0.85,
    metalness: 0.02,
  });

  const sparkCoreMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fef08a'),
    emissive: new THREE.Color('#f97316'),
    emissiveIntensity: 2.5,
    roughness: 0.1,
  });

  const dangerRingMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#ef4444'),
    transparent: true,
    opacity: 0.48,
    side: THREE.DoubleSide,
  });

  // Explosion Materials
  const flashSphereMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#ffffff'),
    transparent: true,
    opacity: 0,
  });

  const shockwaveMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#fb923c'),
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
  });

  const smokeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#57534e'),
    roughness: 0.9,
    transparent: true,
    opacity: 0,
  });

  const fireDebrisMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ea580c'),
    emissive: new THREE.Color('#f97316'),
    emissiveIntensity: 1.2,
    roughness: 0.4,
  });

  const sparkParticleMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#fef08a'),
  });

  const materials = {
    crateRed: crateRedMat,
    crateFrame: crateFrameMat,
    ironBand: ironBandMat,
    labelPlate: labelPlateMat,
    tntText: tntTextMat,
    fuseCord: fuseCordMat,
    sparkCore: sparkCoreMat,
    dangerRing: dangerRingMat,
    flashSphere: flashSphereMat,
    shockwave: shockwaveMat,
    smoke: smokeMat,
    fireDebris: fireDebrisMat,
    sparkParticle: sparkParticleMat,
  };

  const bodyGroup = new THREE.Group();
  bodyGroup.name = 'TntBody';
  root.add(bodyGroup);

  // ==========================================
  // 2. MAIN RED TNT CRATE WITH REINFORCED FRAME
  // ==========================================
  const crateSize = 0.32;
  const halfS = crateSize / 2; // 0.16
  const centerY = halfS;

  // Inner core box
  const coreGeo = new THREE.BoxGeometry(crateSize - 0.02, crateSize - 0.02, crateSize - 0.02);
  const coreMesh = new THREE.Mesh(coreGeo, crateRedMat);
  coreMesh.position.y = centerY;
  coreMesh.castShadow = true;
  coreMesh.receiveShadow = true;
  bodyGroup.add(coreMesh);

  // Horizontal wood slats on all 4 sides for crate plank texture
  for (let row = 0; row < 3; row++) {
    const yPos = 0.055 + row * 0.105;
    const slatGeo = new THREE.BoxGeometry(crateSize, 0.088, crateSize);
    const slatMesh = new THREE.Mesh(slatGeo, crateRedMat);
    slatMesh.position.y = yPos;
    slatMesh.castShadow = true;
    slatMesh.receiveShadow = true;
    bodyGroup.add(slatMesh);
  }

  // 4 Vertical corner posts & top/bottom rails
  const postThick = 0.036;
  const postOffset = halfS - postThick / 2 + 0.006;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const postGeo = new THREE.BoxGeometry(postThick, crateSize + 0.012, postThick);
      const postMesh = new THREE.Mesh(postGeo, crateFrameMat);
      postMesh.position.set(sx * postOffset, centerY, sz * postOffset);
      postMesh.castShadow = true;
      bodyGroup.add(postMesh);

      // Iron corner brackets at top & bottom
      for (const sy of [-1, 1]) {
        const bracketGeo = new THREE.BoxGeometry(postThick + 0.01, 0.032, postThick + 0.01);
        const bracketMesh = new THREE.Mesh(bracketGeo, ironBandMat);
        bracketMesh.position.set(sx * postOffset, centerY + sy * (halfS - 0.01), sz * postOffset);
        bodyGroup.add(bracketMesh);
      }
    }
  }

  // ==========================================
  // 3. BOLD 3D "TNT" BLOCK LETTERS ON ALL 4 SIDES
  // ==========================================
  const buildTntLetterGroup = (): THREE.Group => {
    const g = new THREE.Group();
    const depth = 0.024;

    // White/Yellow warning placard plate
    const plateGeo = new THREE.BoxGeometry(0.24, 0.105, 0.012);
    const plateMesh = new THREE.Mesh(plateGeo, labelPlateMat);
    g.add(plateMesh);

    const makeLetterT = (xOffset: number): THREE.Group => {
      const tGroup = new THREE.Group();
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.015, depth), tntTextMat);
      topBar.position.y = 0.028;
      const stem = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.068, depth), tntTextMat);
      stem.position.y = 0.0;
      tGroup.add(topBar, stem);
      tGroup.position.x = xOffset;
      return tGroup;
    };

    const makeLetterN = (xOffset: number): THREE.Group => {
      const nGroup = new THREE.Group();
      const leftStem = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.068, depth), tntTextMat);
      leftStem.position.x = -0.018;
      const rightStem = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.068, depth), tntTextMat);
      rightStem.position.x = 0.018;
      const diag = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.072, depth), tntTextMat);
      diag.rotation.z = 0.48;
      nGroup.add(leftStem, rightStem, diag);
      nGroup.position.x = xOffset;
      return nGroup;
    };

    g.add(makeLetterT(-0.072));
    g.add(makeLetterN(0));
    g.add(makeLetterT(0.072));
    return g;
  };

  for (let side = 0; side < 4; side++) {
    const signGroup = buildTntLetterGroup();
    const angle = (side * Math.PI) / 2;
    signGroup.position.set(
      Math.sin(angle) * (halfS + 0.016),
      centerY,
      Math.cos(angle) * (halfS + 0.016)
    );
    signGroup.rotation.y = angle;
    bodyGroup.add(signGroup);
  }

  // ==========================================
  // 4. DYNAMITE CYLINDERS & BURNING FUSE ON TOP
  // ==========================================
  const stickPositions = [
    new THREE.Vector3(0, crateSize + 0.032, -0.038),
    new THREE.Vector3(0, crateSize + 0.032, 0.038),
    new THREE.Vector3(0, crateSize + 0.076, 0),
  ];

  for (const pos of stickPositions) {
    const stickGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.24, 18);
    stickGeo.rotateZ(Math.PI / 2);
    const stickMesh = new THREE.Mesh(stickGeo, crateRedMat);
    stickMesh.position.copy(pos);
    stickMesh.castShadow = true;
    bodyGroup.add(stickMesh);
  }

  // Black iron straps holding the dynamite bundle
  for (const xStrap of [-0.065, 0.065]) {
    const strapGeo = new THREE.BoxGeometry(0.018, 0.095, 0.155);
    const strapMesh = new THREE.Mesh(strapGeo, ironBandMat);
    strapMesh.position.set(xStrap, crateSize + 0.048, 0);
    bodyGroup.add(strapMesh);
  }

  // Curved burning fuse cord emerging from top dynamite stick
  const fuseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, crateSize + 0.095, 0),
    new THREE.Vector3(0.02, crateSize + 0.145, 0.015),
    new THREE.Vector3(0.055, crateSize + 0.175, -0.01),
    new THREE.Vector3(0.085, crateSize + 0.155, -0.025),
  ]);
  const fuseGeo = new THREE.TubeGeometry(fuseCurve, 20, 0.007, 8, false);
  const fuseMesh = new THREE.Mesh(fuseGeo, fuseCordMat);
  fuseMesh.castShadow = true;
  bodyGroup.add(fuseMesh);

  // Sparking fuse tip (animated star-burst at the end of fuse)
  const sparkGroup = new THREE.Group();
  sparkGroup.name = 'FuseSpark';
  sparkGroup.position.set(0.085, crateSize + 0.155, -0.025);
  bodyGroup.add(sparkGroup);

  const sparkSphere = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), sparkCoreMat);
  sparkGroup.add(sparkSphere);

  for (let i = 0; i < 6; i++) {
    const rayGeo = new THREE.ConeGeometry(0.008, 0.065, 6);
    const rayMesh = new THREE.Mesh(rayGeo, sparkCoreMat);
    rayMesh.rotation.set(i * 1.1, i * 0.9, i * 0.7);
    sparkGroup.add(rayMesh);
  }

  // ==========================================
  // 5. PULSING HAZARD RING ON ROAD FLOOR
  // ==========================================
  const dangerRingGeo = new THREE.RingGeometry(0.24, 0.30, 32);
  dangerRingGeo.rotateX(-Math.PI / 2);
  const dangerRing = new THREE.Mesh(dangerRingGeo, dangerRingMat);
  dangerRing.position.y = 0.004;
  root.add(dangerRing);

  // ==========================================
  // 6. EXPLOSION FX: FLASH, SHOCKWAVE & DEBRIS
  // ==========================================
  const explosionGroup = new THREE.Group();
  explosionGroup.name = 'ExplosionFX';
  explosionGroup.visible = false;
  root.add(explosionGroup);

  // 6.1 Point light flash (bright orange/white illumination)
  const flashLight = new THREE.PointLight(0xffa500, 0, 5.0, 2);
  flashLight.position.set(0, centerY, 0);
  explosionGroup.add(flashLight);

  // 6.2 Glowing fireball / flash sphere
  const flashSphere = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), flashSphereMat);
  flashSphere.position.set(0, centerY, 0);
  explosionGroup.add(flashSphere);

  // 6.3 Ground shockwave ring
  const shockwaveGeo = new THREE.RingGeometry(0.12, 0.24, 32);
  shockwaveGeo.rotateX(-Math.PI / 2);
  const shockwaveRing = new THREE.Mesh(shockwaveGeo, shockwaveMat);
  shockwaveRing.position.y = 0.008;
  explosionGroup.add(shockwaveRing);

  // 6.4 Wooden crate debris pieces (32 physical flying fragments)
  interface DebrisItem {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    rotSpeed: THREE.Vector3;
    baseScale: THREE.Vector3;
  }
  const debrisList: DebrisItem[] = [];

  const debrisMaterials = [crateRedMat, crateFrameMat, ironBandMat, fireDebrisMat];
  for (let i = 0; i < 32; i++) {
    const w = 0.035 + Math.random() * 0.055;
    const h = 0.025 + Math.random() * 0.045;
    const d = 0.035 + Math.random() * 0.055;
    const dGeo = new THREE.BoxGeometry(w, h, d);
    const dMat = debrisMaterials[i % debrisMaterials.length];
    const dMesh = new THREE.Mesh(dGeo, dMat);
    dMesh.castShadow = true;
    explosionGroup.add(dMesh);

    debrisList.push({
      mesh: dMesh,
      velocity: new THREE.Vector3(),
      rotSpeed: new THREE.Vector3(),
      baseScale: new THREE.Vector3(1, 1, 1),
    });
  }

  // 6.5 Smoke puffs (24 soft expanding smoke puffs)
  interface SmokeItem {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    baseScale: number;
  }
  const smokeList: SmokeItem[] = [];
  for (let i = 0; i < 24; i++) {
    const sRadius = 0.045 + Math.random() * 0.045;
    const sGeo = new THREE.SphereGeometry(sRadius, 8, 8);
    const sMesh = new THREE.Mesh(sGeo, smokeMat);
    explosionGroup.add(sMesh);

    smokeList.push({
      mesh: sMesh,
      velocity: new THREE.Vector3(),
      baseScale: 1.0,
    });
  }

  // 6.6 Fiery sparks (20 flying spark particles)
  interface SparkItem {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
  }
  const sparkList: SparkItem[] = [];
  for (let i = 0; i < 20; i++) {
    const spGeo = new THREE.SphereGeometry(0.012, 6, 6);
    const spMesh = new THREE.Mesh(spGeo, sparkParticleMat);
    explosionGroup.add(spMesh);

    sparkList.push({
      mesh: spMesh,
      velocity: new THREE.Vector3(),
    });
  }

  // ==========================================
  // 7. INTERACTIVE EXPLOSION STATE MACHINE
  // ==========================================
  type ExplosionState = 'idle' | 'shaking' | 'exploding' | 'waiting_respawn' | 'respawning';
  let state: ExplosionState = 'idle';
  let stateTimer = 0;

  const triggerExplosion = () => {
    if (state !== 'idle') return;
    state = 'shaking';
    stateTimer = 0;
    playFuseSound();
  };

  const isExploding = () => state !== 'idle';

  const reset = () => {
    state = 'idle';
    stateTimer = 0;
    bodyGroup.visible = true;
    dangerRing.visible = true;
    bodyGroup.position.set(0, 0, 0);
    bodyGroup.rotation.set(0, 0, 0);
    bodyGroup.scale.set(1, 1, 1);
    explosionGroup.visible = false;
    flashLight.intensity = 0;
    flashSphereMat.opacity = 0;
    shockwaveMat.opacity = 0;
    smokeMat.opacity = 0;
    sparkCoreMat.emissiveIntensity = 2.5;
  };

  // ==========================================
  // 8. ANIMATION TICK (FUSE + INTERACTION)
  // ==========================================
  const tick = (rawDelta: number, elapsed: number) => {
    // Clamp delta to protect against tab suspension or debugger slowdowns
    const delta = Math.min(rawDelta, 0.05);

    // Standard idle animations
    if (state === 'idle') {
      sparkGroup.rotation.x += delta * 9.0;
      sparkGroup.rotation.y += delta * 12.0;
      const sparkScale = 0.8 + Math.abs(Math.sin(elapsed * 22)) * 0.55;
      sparkGroup.scale.setScalar(sparkScale);

      const swell = 1.0 + Math.sin(elapsed * 7.0) * 0.018;
      bodyGroup.scale.set(swell, 1.0 / Math.sqrt(swell), swell);

      const ringScale = 0.95 + Math.sin(elapsed * 7.0) * 0.08;
      dangerRing.scale.set(ringScale, ringScale, 1);
      dangerRingMat.opacity = 0.35 + Math.sin(elapsed * 7.0) * 0.2;
      return;
    }

    stateTimer += delta;

    // 1. Shaking state (fuse shake: fast jitter + frantic flashing)
    if (state === 'shaking') {
      const shakeDuration = 0.48;
      const shakeProgress = Math.min(1.0, stateTimer / shakeDuration);
      const shakeAmp = 0.008 + shakeProgress * 0.022;

      bodyGroup.position.x = (Math.random() - 0.5) * shakeAmp;
      bodyGroup.position.y = (Math.random() - 0.5) * (shakeAmp * 0.6);
      bodyGroup.position.z = (Math.random() - 0.5) * shakeAmp;
      bodyGroup.rotation.y = (Math.random() - 0.5) * (shakeAmp * 4.0);

      // Frantic spark flickering
      sparkCoreMat.emissiveIntensity = 4.0 + Math.random() * 8.0;
      sparkGroup.scale.setScalar(1.4 + Math.random() * 0.9);

      // Hazard ring flashes aggressively
      dangerRingMat.opacity = 0.85 + Math.random() * 0.15;
      dangerRing.scale.setScalar(1.0 + Math.sin(stateTimer * 45) * 0.12);

      if (stateTimer >= shakeDuration) {
        // DETONATE!
        state = 'exploding';
        stateTimer = 0;
        playExplosionSound();

        bodyGroup.visible = false;
        dangerRing.visible = false;
        explosionGroup.visible = true;

        // Flash Light & Sphere
        flashLight.intensity = 18.0;
        flashSphereMat.opacity = 0.95;
        flashSphere.scale.setScalar(0.25);

        // Ground Shockwave
        shockwaveMat.opacity = 0.95;
        shockwaveRing.scale.set(0.8, 0.8, 0.8);

        // Disperse Debris (tuned velocity scale for closeup 3D scene)
        debrisList.forEach((d) => {
          d.mesh.position.set(
            (Math.random() - 0.5) * 0.12,
            centerY + (Math.random() - 0.5) * 0.08,
            (Math.random() - 0.5) * 0.12
          );
          d.mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
          d.mesh.scale.set(1, 1, 1);
          d.mesh.visible = true;

          const angle = Math.random() * Math.PI * 2;
          const speed = 0.42 + Math.random() * 0.52;
          d.velocity.set(
            Math.cos(angle) * speed,
            0.65 + Math.random() * 0.75,
            Math.sin(angle) * speed
          );
          d.rotSpeed.set(
            (Math.random() - 0.5) * 14,
            (Math.random() - 0.5) * 14,
            (Math.random() - 0.5) * 14
          );
        });

        // Disperse Smoke Puffs
        smokeMat.opacity = 0.85;
        smokeList.forEach((s) => {
          s.mesh.position.set(
            (Math.random() - 0.5) * 0.08,
            centerY + 0.04,
            (Math.random() - 0.5) * 0.08
          );
          s.mesh.scale.setScalar(0.35);
          s.mesh.visible = true;

          const angle = Math.random() * Math.PI * 2;
          const speed = 0.16 + Math.random() * 0.22;
          s.velocity.set(
            Math.cos(angle) * speed,
            0.24 + Math.random() * 0.28,
            Math.sin(angle) * speed
          );
        });

        // Disperse Sparks
        sparkList.forEach((sp) => {
          sp.mesh.position.set(0, centerY + 0.06, 0);
          sp.mesh.visible = true;
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.65 + Math.random() * 0.75;
          sp.velocity.set(
            Math.cos(angle) * speed,
            0.8 + Math.random() * 0.9,
            Math.sin(angle) * speed
          );
        });
      }
      return;
    }

    // 2. Exploding & debris scattering state
    if (state === 'exploding') {
      // Fade flash light and sphere quickly
      flashLight.intensity = Math.max(0, flashLight.intensity - delta * 32);
      flashSphereMat.opacity = Math.max(0, flashSphereMat.opacity - delta * 3.8);
      flashSphere.scale.addScalar(delta * 2.8);

      // Expand shockwave ring
      shockwaveMat.opacity = Math.max(0, shockwaveMat.opacity - delta * 1.8);
      shockwaveRing.scale.addScalar(delta * 3.8);

      // Physics for debris pieces (gravity + floor bounce)
      const debrisFade = Math.max(0, 1.0 - (stateTimer - 0.9) / 0.9);
      debrisList.forEach((d) => {
        d.mesh.position.addScaledVector(d.velocity, delta);
        d.velocity.y -= 4.2 * delta; // Tuned low-poly gravity

        // Bounce on ground plane
        if (d.mesh.position.y < 0.012) {
          d.mesh.position.y = 0.012;
          d.velocity.y = -d.velocity.y * 0.38;
          d.velocity.x *= 0.65;
          d.velocity.z *= 0.65;
        }

        d.mesh.rotation.x += d.rotSpeed.x * delta;
        d.mesh.rotation.y += d.rotSpeed.y * delta;
        d.mesh.rotation.z += d.rotSpeed.z * delta;

        if (stateTimer > 0.9) {
          d.mesh.scale.setScalar(debrisFade);
        }
      });

      // Physics for smoke puffs (expand and float upwards)
      smokeMat.opacity = Math.max(0, 0.85 - stateTimer / 1.6);
      smokeList.forEach((s) => {
        s.mesh.position.addScaledVector(s.velocity, delta);
        s.velocity.y += delta * 0.12; // Buoyancy
        s.velocity.x *= 0.96;
        s.velocity.z *= 0.96;
        s.mesh.scale.addScalar(delta * 1.1);
      });

      // Physics for sparks
      sparkList.forEach((sp) => {
        sp.mesh.position.addScaledVector(sp.velocity, delta);
        sp.velocity.y -= 3.2 * delta;
      });

      // Wait until debris settles (total ~1.9s after blast)
      if (stateTimer >= 1.9) {
        state = 'waiting_respawn';
        stateTimer = 0;
        explosionGroup.visible = false;
      }
      return;
    }

    // 3. Waiting short delay before respawning (~0.4s) -> total ~2.3s after blast
    if (state === 'waiting_respawn') {
      if (stateTimer >= 0.4) {
        state = 'respawning';
        stateTimer = 0;

        bodyGroup.visible = true;
        dangerRing.visible = true;
        bodyGroup.position.set(0, 0, 0);
        bodyGroup.rotation.set(0, 0, 0);
        bodyGroup.scale.set(0.01, 0.01, 0.01);
      }
      return;
    }

    // 4. Respawn animation: cute springy bounce-in
    if (state === 'respawning') {
      const respawnDuration = 0.45;
      const progress = Math.min(1.0, stateTimer / respawnDuration);

      // Elastic bounce curve: springs up with overshoot and settles at 1.0
      const elastic =
        progress === 1.0
          ? 1.0
          : 1.0 - Math.pow(2, -10 * progress) * Math.cos((progress * Math.PI * 5) / 2);

      bodyGroup.scale.set(elastic, elastic * 1.15 - (elastic - 1.0) * 0.5, elastic);

      if (stateTimer >= respawnDuration) {
        bodyGroup.scale.set(1, 1, 1);
        state = 'idle';
        stateTimer = 0;
      }
    }
  };

  return {
    root,
    materials,
    pivots: {
      body: bodyGroup,
      spark: sparkGroup,
      dangerRing,
      explosion: explosionGroup,
    },
    tick,
    triggerExplosion,
    isExploding,
    reset,
  };
}
