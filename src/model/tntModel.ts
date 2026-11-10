import * as THREE from 'three';

export interface TntRuntime {
  root: THREE.Group;
  materials: Record<string, THREE.Material>;
  pivots: Record<string, THREE.Object3D>;
  tick: (delta: number, elapsed: number) => void;
}

/**
 * Procedural 3D TNT Obstacle Trap (Jebakan TNT - Kena Restart)
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

  const materials = {
    crateRed: crateRedMat,
    crateFrame: crateFrameMat,
    ironBand: ironBandMat,
    labelPlate: labelPlateMat,
    tntText: tntTextMat,
    fuseCord: fuseCordMat,
    sparkCore: sparkCoreMat,
    dangerRing: dangerRingMat,
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

    // White/Yellow warning placard plate (slightly thicker to eliminate z-fighting)
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
  // 3 bundled red dynamite sticks strapped on top of crate
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
  // 6. ANIMATION TICK (FUSE SPARK + DANGER PULSE)
  // ==========================================
  const tick = (delta: number, elapsed: number) => {
    // Flickering fuse spark rotation & scale
    sparkGroup.rotation.x += delta * 9.0;
    sparkGroup.rotation.y += delta * 12.0;
    const sparkScale = 0.8 + Math.abs(Math.sin(elapsed * 22)) * 0.55;
    sparkGroup.scale.setScalar(sparkScale);

    // Subtle warning throb on the TNT crate
    const swell = 1.0 + Math.sin(elapsed * 7.0) * 0.018;
    bodyGroup.scale.set(swell, 1.0 / Math.sqrt(swell), swell);

    // Hazard ring pulse on road
    const ringScale = 0.95 + Math.sin(elapsed * 7.0) * 0.08;
    dangerRing.scale.set(ringScale, ringScale, 1);
    dangerRingMat.opacity = 0.35 + Math.sin(elapsed * 7.0) * 0.2;
  };

  return {
    root,
    materials,
    pivots: {
      body: bodyGroup,
      spark: sparkGroup,
      dangerRing,
    },
    tick,
  };
}

