import * as THREE from 'three';

/**
 * Procedural Model Factory for Red Molded Armchair
 * Reconstructed from referensi.png following the img2threejs pipeline.
 */

export interface ChairRuntime {
  root: THREE.Group;
  materials: Record<string, THREE.Material>;
  pivots: Record<string, THREE.Object3D>;
  tick: (delta: number, elapsed: number) => void;
}

export function createChairModel(): ChairRuntime {
  const root = new THREE.Group();
  root.name = 'RedMoldedArmchair';

  // ==========================================
  // 1. MATERIALS (Molded Satin Polypropylene)
  // ==========================================
  const redPlasticMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d81e1e'),
    roughness: 0.38,
    metalness: 0.02,
    flatShading: false,
  });

  const footGlideMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#94949a'),
    roughness: 0.65,
    metalness: 0.05,
  });

  const materials = {
    redPlastic: redPlasticMaterial,
    footGlide: footGlideMaterial,
  };

  // Proportions (meters)
  const seatWidth = 0.41;
  const seatDepth = 0.39;
  const seatHeight = 0.425;
  const armHeight = 0.200;
  const armTopY = seatHeight + armHeight;
  const hw = seatWidth / 2; // 0.205
  const hd = seatDepth / 2; // 0.195

  // ==========================================
  // 2. BACKREST (Continuous Concave Lumbar Saddle + 5 Airy Slots)
  // ==========================================
  const backGroup = new THREE.Group();
  backGroup.name = 'Backrest';
  const centerBowlDepth = -0.025; // Deepest concave point right in the center of the seat
  const rearEdgeDip = -0.005;     // Rear edge is only gently dished (-5mm), not deeply scooped at the back
  backGroup.position.set(0, seatHeight, -hd + 0.012);
  backGroup.rotation.x = -0.14;

  const backShape = new THREE.Shape();
  const wBottom = 0.196;   // Outer half-width flaring out into the rear seat corners & rear legs
  const wWaist = 0.168;    // Contoured waist half-width at armrest junction
  const wShoulder = 0.208; // Flared shoulder half-width
  const wTop = 0.200;
  const totalH = 0.388;    // Total backrest height above seat datum (uniform top bar thickness!)
  const lwTop = 0.122;     // Inner half-width at top of lumbar opening (reduced so bottom hole is smaller)
  const lwBot = 0.140;     // Inner half-width at bottom of lumbar opening (reduced so bottom hole is smaller)
  const archTopY = 0.072;  // Top of the lower lumbar opening (lowered so bottom hole is not too big)

  // Outer silhouette: flares outward below waist (wWaist -> wBottom) into rear legs
  backShape.moveTo(-wBottom, 0.006);
  backShape.bezierCurveTo(-wBottom + 0.004, 0.040, -wWaist, 0.075, -wWaist, 0.115);
  backShape.bezierCurveTo(-wWaist, 0.185, -wShoulder, 0.255, -wShoulder, 0.335);
  backShape.quadraticCurveTo(-wShoulder, totalH, -wTop, totalH);
  // Gentle crown arch across top
  backShape.quadraticCurveTo(0, totalH + 0.009, wTop, totalH);
  backShape.quadraticCurveTo(wShoulder, totalH, wShoulder, 0.335);
  backShape.bezierCurveTo(wShoulder, 0.255, wWaist, 0.185, wWaist, 0.115);
  backShape.bezierCurveTo(wWaist, 0.075, wBottom - 0.004, 0.040, wBottom, 0.006);
  // Bottom outer edge stays inside the solid interior of the rear seat apron
  backShape.quadraticCurveTo(0, rearEdgeDip - 0.018, -wBottom, 0.006);

  // Lower lumbar opening (proportioned smaller so it does not overpower the upper 5 slots)
  const holeBottomY = rearEdgeDip - 0.004;
  const lumbarHole = new THREE.Path();
  lumbarHole.moveTo(0, holeBottomY);
  lumbarHole.bezierCurveTo(0.065, holeBottomY, lwBot, 0.005, lwBot, 0.028);
  lumbarHole.bezierCurveTo(lwBot, 0.052, lwTop, archTopY, lwTop - 0.020, archTopY);
  // Top edge of lumbar opening (gentle smile arch matching the slats)
  lumbarHole.quadraticCurveTo(0, archTopY - 0.004, -lwTop + 0.020, archTopY);
  lumbarHole.bezierCurveTo(-lwTop, archTopY, -lwBot, 0.052, -lwBot, 0.028);
  lumbarHole.bezierCurveTo(-lwBot, 0.005, -0.065, holeBottomY, 0, holeBottomY);
  backShape.holes.push(lumbarHole);

  // Helper for capsule slot with gentle smile arch
  const createSlatHole = (yCenter: number, width: number, slotHeight: number, smile: number): THREE.Path => {
    const hole = new THREE.Path();
    const halfW = width / 2;
    const r = slotHeight / 2;
    hole.moveTo(-halfW + r, yCenter - r + smile * 0.5);
    hole.quadraticCurveTo(0, yCenter - r - smile, halfW - r, yCenter - r + smile * 0.5);
    hole.absarc(halfW - r, yCenter + smile * 0.5, r, -Math.PI / 2, Math.PI / 2, false);
    hole.quadraticCurveTo(0, yCenter + r - smile, -halfW + r, yCenter + r + smile * 0.5);
    hole.absarc(-halfW + r, yCenter + smile * 0.5, r, Math.PI / 2, (3 * Math.PI) / 2, false);
    return hole;
  };

  // The 5 Horizontal Slat Cutouts above the lumbar opening (larger, taller, and wider)
  const slotH = 0.039;
  backShape.holes.push(createSlatHole(0.112, 0.292, slotH, 0.005)); // Slot 5
  backShape.holes.push(createSlatHole(0.171, 0.312, slotH, 0.006)); // Slot 4
  backShape.holes.push(createSlatHole(0.230, 0.334, slotH, 0.007)); // Slot 3
  backShape.holes.push(createSlatHole(0.289, 0.352, slotH, 0.008)); // Slot 2
  backShape.holes.push(createSlatHole(0.349, 0.366, slotH, 0.009)); // Slot 1

  const backExtrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: 0.016,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.0035,
    bevelThickness: 0.0035,
    curveSegments: 32,
  };

  const backGeo = new THREE.ExtrudeGeometry(backShape, backExtrudeSettings);
  backGeo.translate(0, 0, -0.008);

  const backMesh = new THREE.Mesh(backGeo, redPlasticMaterial);
  backMesh.castShadow = true;
  backMesh.receiveShadow = true;
  backGroup.add(backMesh);
  root.add(backGroup);

  // ==========================================
  // 3. SEAT PAN — CENTRAL CONCAVE BOWL (FLUSH INTEGRATION, ZERO LIP)
  //    - Zero raised rim around the edge
  //    - Concave depression is centered right in the middle of the seat (x = 0, z = 0)
  //    - Side edges are clean and level
  // ==========================================
  const seatGroup = new THREE.Group();
  seatGroup.name = 'Seat';
  seatGroup.position.set(0, seatHeight, 0);

  const halfFront = hw;                 // 0.2025 m at front
  const halfRear = wBottom + 0.006;     // 0.180 m at rear (aligns corner with wBottom)
  const seatN = 8.0;                    // clean rounded trapezoid outline
  const edgeBulge = 0.005;              // smooth rounded bullnose edge (strictly downward, zero lip)
  const apronHeight = 0.025;            // vertical apron thickness

  const seatPoint2D = (t: number, r: number): THREE.Vector2 => {
    const c = Math.cos(t);
    const s = Math.sin(t);
    const zn = Math.sign(s) * Math.pow(Math.abs(s), 2 / seatN); // -1 (rear) .. +1 (front)
    const xn = Math.sign(c) * Math.pow(Math.abs(c), 2 / seatN); // -1 (left) .. +1 (right)
    const z = zn * hd * r;
    const halfW = THREE.MathUtils.lerp(halfRear, halfFront, (zn * r + 1) / 2);
    const x = xn * halfW * r;
    return new THREE.Vector2(x, z);
  };

  // Top surface height y(x, z):
  // Deepest concave bowl right in the CENTER of the seat (x = 0, z = 0)!
  const seatTopY = (x: number, z: number): number => {
    const zn = THREE.MathUtils.clamp(z / hd, -1, 1); // -1 rear .. +1 front
    const halfW = THREE.MathUtils.lerp(halfRear, halfFront, (zn + 1) / 2);
    const xn = THREE.MathUtils.clamp(x / halfW, -1, 1); // -1 left .. +1 right

    // Transverse concave profile: 1 at center (xn = 0), 0 at side edges (|xn| = 1)
    const xConcave = 1 - xn * xn;

    // Longitudinal profile peaking in the center of the seat (zn = +0.08):
    // - At zn = +0.08 (center of seat): zWeight = 1.00 -> y = -2.5 cm (deepest right in the middle)
    // - At zn = +1.00 (front edge):     zWeight = 0.42 -> y = -1.05 cm (gentle front-center dip)
    // - At zn = -1.00 (rear edge):      zWeight = 0.20 -> y = -0.5 cm (gently dished at the back)
    const zShift = zn - 0.08;
    const zWeight = THREE.MathUtils.clamp(1.0 - 0.68 * zShift * zShift, 0.20, 1.0);

    // Central concave dish
    const centralBowl = centerBowlDepth * xConcave * zWeight;

    // Smooth 14mm corner fillet where the backrest pillars meet the rear seat corners
    const latPillar = THREE.MathUtils.clamp(Math.abs(x) / 0.155, 0, 1);
    const rearFillet = 0.014 * Math.pow(latPillar, 2.2) * Math.pow(THREE.MathUtils.clamp((-0.25 - zn) / 0.75, 0, 1), 1.8);

    return centralBowl + rearFillet;
  };

  const innerRings = 18;
  const edgeRings = 8;
  const segs = 88;

  const sPos: number[] = [0, seatTopY(0, 0), 0];

  // Top surface rings
  for (let ri = 1; ri <= innerRings; ri++) {
    const r = ri / innerRings;
    for (let si = 0; si < segs; si++) {
      const t = (si / segs) * Math.PI * 2;
      const p = seatPoint2D(t, r);
      sPos.push(p.x, seatTopY(p.x, p.y), p.y);
    }
  }

  // Bullnose edge rolling strictly downward into apron (ZERO raised lip)
  for (let ei = 1; ei <= edgeRings; ei++) {
    const phi = (ei / edgeRings) * Math.PI;
    const radialOut = edgeBulge * Math.sin(phi);
    const yDrop = -(apronHeight * 0.5) * (1 - Math.cos(phi));
    for (let si = 0; si < segs; si++) {
      const t = (si / segs) * Math.PI * 2;
      const pEdge = seatPoint2D(t, 1.0);
      const len = Math.hypot(pEdge.x, pEdge.y) || 1;
      const nx = pEdge.x / len;
      const nz = pEdge.y / len;
      const yBase = seatTopY(pEdge.x, pEdge.y);
      sPos.push(pEdge.x + nx * radialOut, yBase + yDrop, pEdge.y + nz * radialOut);
    }
  }

  // Underside inner ring
  for (let si = 0; si < segs; si++) {
    const t = (si / segs) * Math.PI * 2;
    const p = seatPoint2D(t, 0.7);
    sPos.push(p.x, seatTopY(p.x, p.y) - apronHeight, p.y);
  }

  const bottomCenterIdx = sPos.length / 3;
  sPos.push(0, seatTopY(0, 0) - apronHeight, 0);

  const totalRings = innerRings + edgeRings + 1;
  const sIdx: number[] = [];

  for (let si = 0; si < segs; si++) {
    const a = 1 + si;
    const b = 1 + ((si + 1) % segs);
    sIdx.push(0, b, a);
  }

  for (let ri = 1; ri < totalRings; ri++) {
    const base0 = 1 + (ri - 1) * segs;
    const base1 = 1 + ri * segs;
    for (let si = 0; si < segs; si++) {
      const a = base0 + si;
      const b = base0 + ((si + 1) % segs);
      const c = base1 + si;
      const d = base1 + ((si + 1) % segs);
      sIdx.push(a, b, c, b, d, c);
    }
  }

  const lastRingBase = 1 + (totalRings - 1) * segs;
  for (let si = 0; si < segs; si++) {
    const a = lastRingBase + si;
    const b = lastRingBase + ((si + 1) % segs);
    sIdx.push(bottomCenterIdx, a, b);
  }

  const seatGeo = new THREE.BufferGeometry();
  seatGeo.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3));
  seatGeo.setIndex(sIdx);
  seatGeo.computeVertexNormals();

  const seatMesh = new THREE.Mesh(seatGeo, redPlasticMaterial);
  seatMesh.name = 'SeatPan';
  seatMesh.castShadow = true;
  seatMesh.receiveShadow = true;
  seatGroup.add(seatMesh);

  root.add(seatGroup);

  // ==========================================
  // 4. CONTINUOUS MOLDED FLAT ARMRESTS (J-HOOK INTO SEAT SIDE)
  // ==========================================
  const armGroup = new THREE.Group();
  armGroup.name = 'Armrests';

  const zBackPillar = -hd - 0.012;
  const zFrontArm = hd - 0.045;
  const xOuterArm = hw + 0.025;

  const buildFlatArmrest = (isLeft: boolean) => {
    const sign = isLeft ? -1 : 1;
    const xOuter = sign * xOuterArm;
    const xAnchor = sign * (wWaist + 0.006);
    const xSeatSide = sign * (hw - 0.032);

    const points: THREE.Vector3[] = [
      new THREE.Vector3(xAnchor, armTopY, zBackPillar),
      new THREE.Vector3(xOuter, armTopY, zBackPillar + 0.035),
      new THREE.Vector3(xOuter, armTopY, -0.04),
      new THREE.Vector3(xOuter, armTopY, 0.05),
      new THREE.Vector3(xOuter, armTopY, zFrontArm - 0.015),
      new THREE.Vector3(xOuter, armTopY - 0.025, zFrontArm + 0.005),
      new THREE.Vector3(xOuter, seatHeight + 0.025, zFrontArm + 0.008),
      new THREE.Vector3(xOuter - sign * 0.01, seatHeight - 0.01, zFrontArm + 0.01),
      new THREE.Vector3(xSeatSide, seatHeight - 0.012, zFrontArm + 0.01),
    ];

    const armCurve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.0);
    const armGeo = new THREE.TubeGeometry(armCurve, 48, 0.0145, 14, false);

    const armMesh = new THREE.Mesh(armGeo, redPlasticMaterial);
    armMesh.name = isLeft ? 'Armrest_Left' : 'Armrest_Right';
    armMesh.castShadow = true;
    return armMesh;
  };

  armGroup.add(buildFlatArmrest(true));
  armGroup.add(buildFlatArmrest(false));
  root.add(armGroup);

  // ==========================================
  // 5. FOUR TAPERED LEGS (UNDER SEAT CORNERS)
  // ==========================================
  const legsGroup = new THREE.Group();
  legsGroup.name = 'Legs';

  const legRadiusTop = 0.0175;
  const legRadiusBottom = 0.0105;

  const createLeg = (
    topPos: THREE.Vector3,
    bottomPos: THREE.Vector3,
    name: string
  ): THREE.Group => {
    const legContainer = new THREE.Group();
    legContainer.name = name;

    // Vector from bottomPos to topPos so +Y (legRadiusTop) is at topPos and -Y (legRadiusBottom) is at bottomPos
    const dir = new THREE.Vector3().subVectors(topPos, bottomPos);
    const length = dir.length();
    const midPoint = new THREE.Vector3().addVectors(topPos, bottomPos).multiplyScalar(0.5);

    const legGeo = new THREE.CylinderGeometry(legRadiusTop, legRadiusBottom, length, 16);
    const legMesh = new THREE.Mesh(legGeo, redPlasticMaterial);
    legMesh.castShadow = true;

    const defaultAxis = new THREE.Vector3(0, 1, 0);
    const normalizedDir = dir.clone().normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(defaultAxis, normalizedDir);
    legMesh.quaternion.copy(quaternion);
    legMesh.position.copy(midPoint);
    legContainer.add(legMesh);

    const footGeo = new THREE.CylinderGeometry(legRadiusBottom * 0.95, legRadiusBottom * 0.88, 0.006, 12);
    const footMesh = new THREE.Mesh(footGeo, footGlideMaterial);
    footMesh.position.copy(bottomPos.clone().add(new THREE.Vector3(0, 0.003, 0)));
    legContainer.add(footMesh);

    return legContainer;
  };

  const xFrontLeg = hw - 0.018;
  const zFrontLeg = hd - 0.018;

  legsGroup.add(
    createLeg(
      new THREE.Vector3(-xFrontLeg, seatHeight - 0.005, zFrontLeg),
      new THREE.Vector3(-xFrontLeg - 0.008, 0, zFrontLeg + 0.01),
      'Leg_FrontLeft'
    )
  );

  legsGroup.add(
    createLeg(
      new THREE.Vector3(xFrontLeg, seatHeight - 0.005, zFrontLeg),
      new THREE.Vector3(xFrontLeg + 0.008, 0, zFrontLeg + 0.01),
      'Leg_FrontRight'
    )
  );

  const xRearLegTop = wBottom - 0.010;
  const xRearLegBottom = xRearLegTop + 0.008;
  const zRearLegTop = -hd + 0.016;
  const zRearLegBottom = -hd - 0.026;

  legsGroup.add(
    createLeg(
      new THREE.Vector3(-xRearLegTop, seatHeight + 0.008, zRearLegTop),
      new THREE.Vector3(-xRearLegBottom, 0, zRearLegBottom),
      'Leg_RearLeft'
    )
  );

  legsGroup.add(
    createLeg(
      new THREE.Vector3(xRearLegTop, seatHeight + 0.008, zRearLegTop),
      new THREE.Vector3(xRearLegBottom, 0, zRearLegBottom),
      'Leg_RearRight'
    )
  );

  root.add(legsGroup);

  const tick = (_delta: number, _elapsed: number) => {
    // Runtime tick hook
  };

  return {
    root,
    materials,
    pivots: {
      seat: seatGroup,
      backrest: backGroup,
    },
    tick,
  };
}
