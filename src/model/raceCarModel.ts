import * as THREE from 'three';

export interface RaceCarRuntime {
  root: THREE.Group;
  materials: Record<string, THREE.Material>;
  pivots: Record<string, THREE.Object3D>;
  tick: (delta: number, elapsed: number) => void;
}

/**
 * Procedural 3D Race Car (Mobil Balap) for Arcade Racing Game
 */
export function createRaceCarModel(): RaceCarRuntime {
  const root = new THREE.Group();
  root.name = 'RaceCar';

  // ==========================================
  // 1. MATERIALS
  // ==========================================
  const bodyPaintMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e11d48'),
    roughness: 0.22,
    metalness: 0.35,
  });

  const stripeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f8fafc'),
    roughness: 0.25,
    metalness: 0.1,
  });

  const goldAccentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f59e0b'),
    roughness: 0.25,
    metalness: 0.8,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#18181b'),
    roughness: 0.45,
    metalness: 0.25,
  });

  const canopyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#0f172a'),
    roughness: 0.1,
    metalness: 0.85,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#171717'),
    roughness: 0.82,
    metalness: 0.05,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e2e8f0'),
    roughness: 0.2,
    metalness: 0.85,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e0f2fe'),
    emissive: new THREE.Color('#38bdf8'),
    emissiveIntensity: 1.4,
    roughness: 0.1,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fecaca'),
    emissive: new THREE.Color('#ef4444'),
    emissiveIntensity: 1.6,
    roughness: 0.15,
  });

  const exhaustFlameMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fb923c'),
    emissive: new THREE.Color('#f97316'),
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });

  const materials = {
    bodyPaint: bodyPaintMat,
    stripe: stripeMat,
    goldAccent: goldAccentMat,
    carbon: carbonMat,
    canopy: canopyMat,
    tire: tireMat,
    rim: rimMat,
    headlight: headlightMat,
    taillight: taillightMat,
  };

  // ==========================================
  // 2. CHASSIS GROUP (SUSPENSION PIVOT)
  // ==========================================
  const chassisGroup = new THREE.Group();
  chassisGroup.name = 'Chassis';
  root.add(chassisGroup);

  // Side profile silhouette extruded along X for sleek GT / Formula wedge body
  // Car faces +Z (front = +Z, rear = -Z)
  const sideShape = new THREE.Shape();
  sideShape.moveTo(-0.56, 0.08); // Rear bottom
  sideShape.lineTo(0.56, 0.07);  // Front bottom
  sideShape.quadraticCurveTo(0.61, 0.09, 0.59, 0.15); // Front nose tip
  sideShape.quadraticCurveTo(0.45, 0.21, 0.24, 0.24); // Hood slope
  sideShape.lineTo(-0.34, 0.26); // Deck line
  sideShape.quadraticCurveTo(-0.52, 0.27, -0.57, 0.22); // Rear tail
  sideShape.lineTo(-0.56, 0.08);

  const bodyExtrude: THREE.ExtrudeGeometryOptions = {
    depth: 0.44,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 1,
    bevelSize: 0.035,
    bevelThickness: 0.035,
    curveSegments: 24,
  };

  const mainBodyGeo = new THREE.ExtrudeGeometry(sideShape, bodyExtrude);
  mainBodyGeo.translate(0, 0, -0.22);
  // Rotate so extrusion axis (Z) becomes X (width), and X becomes Z (length)
  mainBodyGeo.rotateY(Math.PI / 2);

  const mainBodyMesh = new THREE.Mesh(mainBodyGeo, bodyPaintMat);
  mainBodyMesh.castShadow = true;
  mainBodyMesh.receiveShadow = true;
  chassisGroup.add(mainBodyMesh);

  // ==========================================
  // 3. AERODYNAMIC COCKPIT CANOPY & ROOF SCOOP
  // ==========================================
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(-0.26, 0.24);
  cabinShape.lineTo(0.18, 0.23);
  cabinShape.quadraticCurveTo(0.08, 0.36, -0.06, 0.37);
  cabinShape.quadraticCurveTo(-0.22, 0.36, -0.28, 0.25);
  cabinShape.closePath();

  const cabinGeo = new THREE.ExtrudeGeometry(cabinShape, {
    depth: 0.26,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    curveSegments: 20,
  });
  cabinGeo.translate(0, 0, -0.13);
  cabinGeo.rotateY(Math.PI / 2);

  const cabinMesh = new THREE.Mesh(cabinGeo, canopyMat);
  cabinMesh.castShadow = true;
  chassisGroup.add(cabinMesh);

  // Roof air intake scoop
  const scoopGeo = new THREE.BoxGeometry(0.09, 0.055, 0.22);
  const scoopMesh = new THREE.Mesh(scoopGeo, bodyPaintMat);
  scoopMesh.position.set(0, 0.385, -0.12);
  scoopMesh.castShadow = true;
  chassisGroup.add(scoopMesh);

  // Racing twin stripes along front hood
  const stripeLeftGeo = new THREE.BoxGeometry(0.042, 0.012, 0.36);
  const stripeLeft = new THREE.Mesh(stripeLeftGeo, stripeMat);
  stripeLeft.position.set(-0.036, 0.232, 0.36);
  stripeLeft.rotation.x = 0.26;
  chassisGroup.add(stripeLeft);

  const stripeRight = stripeLeft.clone();
  stripeRight.position.x = 0.036;
  chassisGroup.add(stripeRight);

  // ==========================================
  // 4. FRONT SPLITTER, SIDE SKIRTS & FENDER ARCHES
  // ==========================================
  // Front carbon splitter lip
  const splitterGeo = new THREE.BoxGeometry(0.56, 0.024, 0.16);
  const splitterMesh = new THREE.Mesh(splitterGeo, carbonMat);
  splitterMesh.position.set(0, 0.062, 0.56);
  splitterMesh.castShadow = true;
  chassisGroup.add(splitterMesh);

  // Front splitter side canards (fins)
  for (const sign of [-1, 1]) {
    const finGeo = new THREE.BoxGeometry(0.016, 0.065, 0.12);
    const finMesh = new THREE.Mesh(finGeo, carbonMat);
    finMesh.position.set(sign * 0.275, 0.095, 0.56);
    chassisGroup.add(finMesh);
  }

  // Side skirts & sidepod intakes
  for (const sign of [-1, 1]) {
    const skirtGeo = new THREE.BoxGeometry(0.05, 0.032, 0.68);
    const skirtMesh = new THREE.Mesh(skirtGeo, carbonMat);
    skirtMesh.position.set(sign * 0.255, 0.068, -0.01);
    skirtMesh.castShadow = true;
    chassisGroup.add(skirtMesh);

    // Sculpted sidepod air intake scoop
    const podGeo = new THREE.BoxGeometry(0.055, 0.11, 0.34);
    const podMesh = new THREE.Mesh(podGeo, bodyPaintMat);
    podMesh.position.set(sign * 0.252, 0.165, -0.04);
    podMesh.castShadow = true;
    chassisGroup.add(podMesh);

    // Side racing number plate accent
    const badgeGeo = new THREE.BoxGeometry(0.01, 0.07, 0.16);
    const badgeMesh = new THREE.Mesh(badgeGeo, stripeMat);
    badgeMesh.position.set(sign * 0.281, 0.17, -0.02);
    chassisGroup.add(badgeMesh);
  }

  // ==========================================
  // 5. REAR WING SPOILER, DIFFUSER & EXHAUSTS
  // ==========================================
  const wingGroup = new THREE.Group();
  wingGroup.name = 'RearWing';

  // Dual swan-neck wing struts
  for (const sign of [-1, 1]) {
    const strutGeo = new THREE.BoxGeometry(0.018, 0.13, 0.07);
    const strutMesh = new THREE.Mesh(strutGeo, carbonMat);
    strutMesh.position.set(sign * 0.13, 0.33, -0.50);
    strutMesh.rotation.x = -0.22;
    strutMesh.castShadow = true;
    wingGroup.add(strutMesh);
  }

  // Main rear wing airfoil blade
  const wingBladeGeo = new THREE.BoxGeometry(0.58, 0.022, 0.13);
  const wingBlade = new THREE.Mesh(wingBladeGeo, carbonMat);
  wingBlade.position.set(0, 0.395, -0.53);
  wingBlade.rotation.x = 0.14;
  wingBlade.castShadow = true;
  wingGroup.add(wingBlade);

  // Wing endplates (painted red)
  for (const sign of [-1, 1]) {
    const plateGeo = new THREE.BoxGeometry(0.016, 0.095, 0.17);
    const plateMesh = new THREE.Mesh(plateGeo, bodyPaintMat);
    plateMesh.position.set(sign * 0.29, 0.385, -0.53);
    plateMesh.castShadow = true;
    wingGroup.add(plateMesh);
  }

  chassisGroup.add(wingGroup);

  // Rear lower carbon diffuser + dual exhaust pipes
  const diffuserGeo = new THREE.BoxGeometry(0.46, 0.045, 0.08);
  const diffuserMesh = new THREE.Mesh(diffuserGeo, carbonMat);
  diffuserMesh.position.set(0, 0.075, -0.57);
  chassisGroup.add(diffuserMesh);

  const exhaustFlames: THREE.Mesh[] = [];
  for (const sign of [-1, 1]) {
    const pipeGeo = new THREE.CylinderGeometry(0.024, 0.028, 0.08, 14);
    pipeGeo.rotateX(Math.PI / 2);
    const pipeMesh = new THREE.Mesh(pipeGeo, rimMat);
    pipeMesh.position.set(sign * 0.11, 0.11, -0.59);
    chassisGroup.add(pipeMesh);

    const flameGeo = new THREE.ConeGeometry(0.018, 0.06, 10);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMesh = new THREE.Mesh(flameGeo, exhaustFlameMat);
    flameMesh.position.set(sign * 0.11, 0.11, -0.64);
    chassisGroup.add(flameMesh);
    exhaustFlames.push(flameMesh);
  }

  // ==========================================
  // 6. HEADLIGHTS & TAILLIGHTS
  // ==========================================
  for (const sign of [-1, 1]) {
    // Angular LED Headlights
    const hlGeo = new THREE.BoxGeometry(0.11, 0.026, 0.04);
    const hlMesh = new THREE.Mesh(hlGeo, headlightMat);
    hlMesh.position.set(sign * 0.165, 0.155, 0.595);
    hlMesh.rotation.y = -sign * 0.18;
    chassisGroup.add(hlMesh);

    // Glowing LED Taillight bar
    const tlGeo = new THREE.BoxGeometry(0.14, 0.028, 0.03);
    const tlMesh = new THREE.Mesh(tlGeo, taillightMat);
    tlMesh.position.set(sign * 0.145, 0.21, -0.585);
    chassisGroup.add(tlMesh);
  }

  // ==========================================
  // 7. FOUR RACING WHEELS (WITH ALLOY RIMS & CALIPERS)
  // ==========================================
  const wheels: THREE.Group[] = [];

  const createWheel = (name: string, isLeft: boolean, radius: number, width: number): THREE.Group => {
    const wheelGroup = new THREE.Group();
    wheelGroup.name = name;

    // Tire cylinder along X axis
    const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMesh = new THREE.Mesh(tireGeo, tireMat);
    tireMesh.castShadow = true;
    tireMesh.receiveShadow = true;
    wheelGroup.add(tireMesh);

    // Outer alloy rim ring
    const sign = isLeft ? -1 : 1;
    const rimGeo = new THREE.CylinderGeometry(radius * 0.68, radius * 0.68, width + 0.006, 18);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    wheelGroup.add(rimMesh);

    // 5 Racing spokes
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const spokeGeo = new THREE.BoxGeometry(0.012, radius * 1.22, 0.022);
      spokeGeo.rotateX(angle);
      const spokeMesh = new THREE.Mesh(spokeGeo, goldAccentMat);
      spokeMesh.position.x = sign * (width * 0.48);
      wheelGroup.add(spokeMesh);
    }

    // Center lock nut
    const nutGeo = new THREE.CylinderGeometry(0.024, 0.024, width + 0.016, 12);
    nutGeo.rotateZ(Math.PI / 2);
    const nutMesh = new THREE.Mesh(nutGeo, bodyPaintMat);
    wheelGroup.add(nutMesh);

    return wheelGroup;
  };

  const frontWheelRadius = 0.115;
  const rearWheelRadius = 0.125;
  const wheelWidth = 0.095;

  const wheelFL = createWheel('Wheel_FL', true, frontWheelRadius, wheelWidth);
  wheelFL.position.set(-0.265, frontWheelRadius, 0.36);

  const wheelFR = createWheel('Wheel_FR', false, frontWheelRadius, wheelWidth);
  wheelFR.position.set(0.265, frontWheelRadius, 0.36);

  const wheelRL = createWheel('Wheel_RL', true, rearWheelRadius, wheelWidth + 0.01);
  wheelRL.position.set(-0.27, rearWheelRadius, -0.35);

  const wheelRR = createWheel('Wheel_RR', false, rearWheelRadius, wheelWidth + 0.01);
  wheelRR.position.set(0.27, rearWheelRadius, -0.35);

  wheels.push(wheelFL, wheelFR, wheelRL, wheelRR);
  root.add(wheelFL, wheelFR, wheelRL, wheelRR);

  // ==========================================
  // 8. ANIMATION TICK (ROTATING WHEELS + ENGINE IDLE)
  // ==========================================
  const tick = (delta: number, elapsed: number) => {
    // Rotate wheels forward
    for (const w of wheels) {
      w.rotation.x += delta * 6.5;
    }
    // Subtle high-RPM engine idle vibration on chassis
    chassisGroup.position.y = Math.sin(elapsed * 28) * 0.0018;
    chassisGroup.rotation.z = Math.sin(elapsed * 14) * 0.004;

    // Exhaust afterburner flicker
    const scalePulse = 0.85 + Math.sin(elapsed * 45) * 0.25;
    for (const flame of exhaustFlames) {
      flame.scale.set(1, 1, scalePulse);
    }
  };

  return {
    root,
    materials,
    pivots: {
      chassis: chassisGroup,
      rearWing: wingGroup,
      wheelFL,
      wheelFR,
      wheelRL,
      wheelRR,
    },
    tick,
  };
}
