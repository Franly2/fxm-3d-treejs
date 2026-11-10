import * as THREE from 'three';

export interface RoadRuntime {
  root: THREE.Group;
  materials: Record<string, THREE.Material>;
  dimensions: {
    width: number;
    length: number;
    surfaceY: number;
    lanesX: number[];
  };
  tick: (delta: number, elapsed: number) => void;
}

/**
 * Procedural 3D Racing Road Track Segment (Jalanan Lintasan Balap)
 * Default size: width = 1.65m (2 lanes at x = -0.34 and x = +0.34), length = 3.2m, surfaceY = 0.016m
 */
export function createRoadModel(length = 3.2, width = 1.65): RoadRuntime {
  const root = new THREE.Group();
  root.name = 'RoadTrack';

  const asphaltMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#27272a'),
    roughness: 0.85,
    metalness: 0.05,
  });

  const laneLineMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f8fafc'),
    roughness: 0.4,
  });

  const curbRedMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#dc2626'),
    roughness: 0.5,
  });

  const materials = {
    asphalt: asphaltMat,
    laneLine: laneLineMat,
    curbRed: curbRedMat,
  };

  // Main asphalt slab
  const roadGeo = new THREE.BoxGeometry(width, 0.016, length);
  const roadMesh = new THREE.Mesh(roadGeo, asphaltMat);
  roadMesh.position.y = 0.008;
  roadMesh.receiveShadow = true;
  root.add(roadMesh);

  // Center dashed white lane dividers (thick, bold, elevated above asphalt to completely eliminate z-fighting)
  const dashCount = 8;
  const dashStep = length / dashCount; // exactly 0.40m
  const dashLength = 0.24; // 0.24m line + 0.16m gap
  const dashWidth = 0.08; // Bold 8cm width for sharp visibility in distance
  const dashThick = 0.012; // 12mm thickness elevated above road surface
  for (let i = 0; i < dashCount; i++) {
    const dashGeo = new THREE.BoxGeometry(dashWidth, dashThick, dashLength);
    const dashMesh = new THREE.Mesh(dashGeo, laneLineMat);
    // Base of dash is at 0.016 (surface of asphalt), top is at 0.028
    dashMesh.position.set(0, 0.016 + dashThick / 2, -length / 2 + dashStep * (i + 0.5));
    root.add(dashMesh);
  }

  // Red & white alternating racing curbs along both edges
  const curbSegments = Math.max(4, Math.round(length / 0.2));
  const segLen = length / curbSegments;
  const curbThick = 0.030;
  for (const sign of [-1, 1]) {
    for (let i = 0; i < curbSegments; i++) {
      const curbGeo = new THREE.BoxGeometry(0.12, curbThick, segLen);
      const mat = i % 2 === 0 ? curbRedMat : laneLineMat;
      const curbMesh = new THREE.Mesh(curbGeo, mat);
      curbMesh.position.set(
        sign * (width / 2 + 0.06),
        curbThick / 2,
        -length / 2 + segLen * (i + 0.5)
      );
      curbMesh.receiveShadow = true;
      root.add(curbMesh);
    }
  }

  const tick = (_delta: number, _elapsed: number) => {
    // Optional hook if scrolling road tiles
  };

  return {
    root,
    materials,
    dimensions: {
      width,
      length,
      surfaceY: 0.016,
      lanesX: [-width * 0.21, width * 0.21],
    },
    tick,
  };
}

