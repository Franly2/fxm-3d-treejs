import * as THREE from 'three';

export interface CoinRuntime {
  root: THREE.Group;
  materials: Record<string, THREE.Material>;
  pivots: Record<string, THREE.Object3D>;
  tick: (delta: number, elapsed: number) => void;
}

/**
 * Procedural 3D Collectible Road Coin (Koin Game)
 */
export function createCoinModel(): CoinRuntime {
  const root = new THREE.Group();
  root.name = 'RoadCoin';

  // ==========================================
  // 1. MATERIALS
  // ==========================================
  const goldRimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#facc15'),
    emissive: new THREE.Color('#d97706'),
    emissiveIntensity: 0.28,
    roughness: 0.22,
    metalness: 0.48,
  });

  const goldInnerMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#eab308'),
    emissive: new THREE.Color('#b45309'),
    emissiveIntensity: 0.22,
    roughness: 0.3,
    metalness: 0.42,
  });

  const starEmblemMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fef08a'),
    emissive: new THREE.Color('#f59e0b'),
    emissiveIntensity: 0.35,
    roughness: 0.16,
    metalness: 0.5,
  });

  const glowRingMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#fbbf24'),
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
  });

  const materials = {
    goldRim: goldRimMat,
    goldInner: goldInnerMat,
    starEmblem: starEmblemMat,
    glowRing: glowRingMat,
  };

  // ==========================================
  // 2. SPINNING COIN BODY
  // ==========================================
  const coinBody = new THREE.Group();
  coinBody.name = 'CoinSpinner';
  const baseCenterY = 0.28;
  coinBody.position.set(0, baseCenterY, 0);
  root.add(coinBody);

  const outerRadius = 0.18;
  const innerRadius = 0.138;
  const rimDepth = 0.042;

  // Outer raised rim ring with hole
  const rimShape = new THREE.Shape();
  rimShape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);

  const rimHole = new THREE.Path();
  rimHole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  rimShape.holes.push(rimHole);

  const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
    depth: rimDepth,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.008,
    bevelThickness: 0.008,
    curveSegments: 36,
  });
  rimGeo.translate(0, 0, -rimDepth / 2);

  const rimMesh = new THREE.Mesh(rimGeo, goldRimMat);
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  coinBody.add(rimMesh);

  // Recessed inner core cylinder
  const coreThickness = 0.028;
  const coreGeo = new THREE.CylinderGeometry(innerRadius + 0.003, innerRadius + 0.003, coreThickness, 36);
  coreGeo.rotateX(Math.PI / 2);
  const coreMesh = new THREE.Mesh(coreGeo, goldInnerMat);
  coreMesh.castShadow = true;
  coreMesh.receiveShadow = true;
  coinBody.add(coreMesh);

  // Milled ridge notches around outer edge
  const ridgeCount = 24;
  for (let i = 0; i < ridgeCount; i++) {
    const angle = (i * Math.PI * 2) / ridgeCount;
    const ridgeGeo = new THREE.BoxGeometry(0.012, 0.008, rimDepth + 0.004);
    const ridgeMesh = new THREE.Mesh(ridgeGeo, goldInnerMat);
    ridgeMesh.position.set(
      Math.cos(angle) * (outerRadius + 0.005),
      Math.sin(angle) * (outerRadius + 0.005),
      0
    );
    ridgeMesh.rotation.z = angle + Math.PI / 2;
    coinBody.add(ridgeMesh);
  }

  // ==========================================
  // 3. EMBOSSED 5-POINTED STAR EMBLEM (BOTH SIDES)
  // ==========================================
  const starShape = new THREE.Shape();
  const points = 5;
  const rOuter = 0.095;
  const rInner = 0.042;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (i * Math.PI) / points + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) starShape.moveTo(x, y);
    else starShape.lineTo(x, y);
  }
  starShape.closePath();

  const starDepth = 0.038;
  const starGeo = new THREE.ExtrudeGeometry(starShape, {
    depth: starDepth,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.005,
    bevelThickness: 0.005,
  });
  starGeo.translate(0, 0, -starDepth / 2);

  const starMesh = new THREE.Mesh(starGeo, starEmblemMat);
  starMesh.castShadow = true;
  coinBody.add(starMesh);

  // ==========================================
  // 4. ROAD PICKUP AURA RING ON FLOOR
  // ==========================================
  const auraGeo = new THREE.RingGeometry(0.14, 0.21, 32);
  auraGeo.rotateX(-Math.PI / 2);
  const auraMesh = new THREE.Mesh(auraGeo, glowRingMat);
  auraMesh.position.y = 0.004;
  root.add(auraMesh);

  // ==========================================
  // 5. ANIMATION TICK (SPIN + HOVER BOBBING)
  // ==========================================
  const tick = (delta: number, elapsed: number) => {
    coinBody.rotation.y += delta * 2.4;
    coinBody.position.y = baseCenterY + Math.sin(elapsed * 3.2) * 0.032;

    const ringScale = 0.92 + Math.sin(elapsed * 3.2) * 0.12;
    auraMesh.scale.set(ringScale, ringScale, 1);
    glowRingMat.opacity = 0.35 + Math.sin(elapsed * 3.2) * 0.15;
  };

  return {
    root,
    materials,
    pivots: {
      spinner: coinBody,
      aura: auraMesh,
    },
    tick,
  };
}
