import * as THREE from 'three';

export interface JetRuntime {
  root: THREE.Group;
  materials: Record<string, THREE.Material>;
  pivots: Record<string, THREE.Object3D>;
  controls: {
    setWingSweep: (sweepFactor: number) => void; // 0 = extended (16°), 1 = fully swept (72°)
    setAirbrakes: (deployFactor: number) => void; // 0 = closed, 1 = open 45°
    setVentralFin: (deployFactor: number) => void; // 0 = folded (gear down), 1 = deployed vertical (flight)
  };
  tick: (delta: number, elapsed: number) => void;
}

/**
 * Helper: Extrudes a 2D side-profile Shape where:
 *  - shape X coordinate = 3D Z coordinate (+Z is Nose/Forward, -Z is Tail/Aft)
 *  - shape Y coordinate = 3D Y coordinate (+Y is Up)
 *  - thickness is centered along 3D X axis (-width/2 .. +width/2)
 */
function extrudeSideProfile(
  shape: THREE.Shape,
  width: number,
  bevelSize = 0.002,
  bevelSegments = 2
): THREE.BufferGeometry {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: width,
    bevelEnabled: bevelSize > 0,
    bevelSegments,
    steps: 1,
    bevelSize,
    bevelThickness: bevelSize,
  });
  geo.translate(0, 0, -width / 2);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const z3d = pos.getX(i);
    const y3d = pos.getY(i);
    const x3d = pos.getZ(i);
    pos.setXYZ(i, x3d, y3d, z3d);
  }
  if (geo.index) {
    const arr = geo.index.array;
    for (let i = 0; i < arr.length; i += 3) {
      const tmp = arr[i];
      arr[i] = arr[i + 1];
      arr[i + 1] = tmp;
    }
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Helper: Extrudes a 2D top-planform Shape where:
 *  - shape X coordinate = 3D X coordinate (+X is Right wing, mirrored if mirrorX = true)
 *  - shape Y coordinate = 3D Z coordinate (+Z is Nose/Forward, -Z is Tail/Aft)
 *  - thickness is centered along 3D Y axis (-thickness/2 .. +thickness/2)
 */
function extrudePlanform(
  shape: THREE.Shape,
  thickness: number,
  bevelSize = 0.002,
  mirrorX = false
): THREE.BufferGeometry {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: bevelSize > 0,
    bevelSegments: 2,
    steps: 1,
    bevelSize,
    bevelThickness: bevelSize,
  });
  geo.translate(0, 0, -thickness / 2);

  const pos = geo.attributes.position;
  const signX = mirrorX ? -1 : 1;
  for (let i = 0; i < pos.count; i++) {
    const x3d = signX * pos.getX(i);
    const z3d = pos.getY(i);
    const y3d = pos.getZ(i);
    pos.setXYZ(i, x3d, y3d, z3d);
  }
  if (!mirrorX && geo.index) {
    const arr = geo.index.array;
    for (let i = 0; i < arr.length; i += 3) {
      const tmp = arr[i];
      arr[i] = arr[i + 1];
      arr[i + 1] = tmp;
    }
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Helper: Creates a 5-pointed tactical red star shape
 */
function createFivePointStar(rOuter: number, rInner: number): THREE.Shape {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

/**
 * Procedural 3D Fighter Jet Model — Mikoyan-Gurevich MiG-23 ("Flogger")
 * Fully reconstructed from technical drawing blueprint gambar-teknik.png
 * Scale: 1 unit = ~10 meters (Model length = 1.72m from pitot tip to nozzle)
 */
export function createJetModel(): JetRuntime {
  const root = new THREE.Group();
  root.name = 'MiG23_FighterJet_SuperDetail';

  // ==========================================
  // 1. MATERIALS PALETTE (Tactical VVS Camouflage & PBR Metals)
  // ==========================================
  const airframeLightMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#cbd5e1'), // Tactical airframe grey
    roughness: 0.38,
    metalness: 0.25,
  });

  const airframeCamoMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#94a3b8'), // Darker slate panel accent
    roughness: 0.44,
    metalness: 0.22,
  });

  const radomeDarkMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1e293b'), // Dielectric dark grey for radome & fin caps
    roughness: 0.35,
    metalness: 0.15,
  });

  const canopyGlassMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#38bdf8'), // Aviation tinted glass
    transparent: true,
    opacity: 0.55,
    roughness: 0.06,
    metalness: 0.15,
    transmission: 0.6,
    ior: 1.52,
    reflectivity: 0.85,
  });

  const cockpitInteriorMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#0284c7'), // Iconic Soviet turquoise cockpit interior (RP-23 / KM-1M)
    roughness: 0.65,
    metalness: 0.1,
  });

  const seatCushionMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#166534'), // Olive green flight suit / parachute harness cushion
    roughness: 0.8,
    metalness: 0.05,
  });

  const ejectionHandleMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ea580c'), // Ejection seat pull ring orange/yellow
    roughness: 0.3,
    metalness: 0.1,
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#0f172a'), // Burnished gunmetal & engine titanium
    roughness: 0.32,
    metalness: 0.82,
  });

  const titaniumNozzleMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#334155'), // Heat-stained titanium exhaust petals
    roughness: 0.36,
    metalness: 0.88,
  });

  const steelStrutMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e2e8f0'), // Hydraulic oleo steel struts
    roughness: 0.18,
    metalness: 0.9,
  });

  const tireRubberMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#18181b'), // KT-150D rubber tires
    roughness: 0.88,
    metalness: 0.05,
  });

  const missileWhiteMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f8fafc'), // R-23 / R-60 missile airframe white
    roughness: 0.28,
    metalness: 0.12,
  });

  const redStarMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#dc2626'), // Soviet tactical red star
    roughness: 0.38,
    metalness: 0.1,
  });

  const navLightGreenMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#22c55e'),
    emissive: new THREE.Color('#16a34a'),
    emissiveIntensity: 1.2,
    roughness: 0.1,
  });

  const navLightRedMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ef4444'),
    emissive: new THREE.Color('#dc2626'),
    emissiveIntensity: 1.2,
    roughness: 0.1,
  });

  const afterburnerGlowMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fb923c'),
    emissive: new THREE.Color('#f97316'),
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });

  const panelLineMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#334155'), // Subtle structural panel seam line tone (Slate-700)
    roughness: 0.55,
    metalness: 0.35,
  });

  const materials = {
    airframeLight: airframeLightMat,
    airframeCamo: airframeCamoMat,
    radomeDark: radomeDarkMat,
    canopyGlass: canopyGlassMat,
    cockpitInterior: cockpitInteriorMat,
    darkMetal: darkMetalMat,
    panelLine: panelLineMat,
    titaniumNozzle: titaniumNozzleMat,
    steelStrut: steelStrutMat,
    tireRubber: tireRubberMat,
    missileWhite: missileWhiteMat,
    redStar: redStarMat,
    afterburner: afterburnerGlowMat,
  };

  // Fuselage ground clearance height (landing gear height)
  const fuseY = 0.245;
  const airframeGroup = new THREE.Group();
  airframeGroup.name = 'Airframe';
  airframeGroup.position.set(0, fuseY, 0);
  root.add(airframeGroup);

  // ==========================================
  // 2. MULTI-SECTION LOFTED FUSELAGE (SECTIONS A-A, B-B, V-V, G-G, D-D)
  // ==========================================
  interface FuseStation {
    z: number;
    rx: number;      // lateral half-width
    ryTop: number;   // upper half-height
    ryBot: number;   // lower half-height
    yOffset: number; // vertical center offset
    boxiness: number; // 0 = circular, 1 = rounded box
  }

  // Cross-sections mathematically mapped from blueprint stations
  const stations: FuseStation[] = [
    { z: -0.78, rx: 0.060, ryTop: 0.060, ryBot: 0.060, yOffset: 0.000, boxiness: 0.05 }, // Station 17: Nozzle base
    { z: -0.66, rx: 0.072, ryTop: 0.070, ryBot: 0.066, yOffset: 0.002, boxiness: 0.15 }, // Station E-E: Airbrakes
    { z: -0.42, rx: 0.086, ryTop: 0.076, ryBot: 0.072, yOffset: 0.004, boxiness: 0.45 }, // Station D-D: Turbine bay
    { z: -0.16, rx: 0.102, ryTop: 0.080, ryBot: 0.076, yOffset: 0.005, boxiness: 0.72 }, // Station G-G: Main gear bay
    { z:  0.08, rx: 0.102, ryTop: 0.080, ryBot: 0.074, yOffset: 0.005, boxiness: 0.75 }, // Station V-V: Wing sweep box
    { z:  0.22, rx: 0.078, ryTop: 0.074, ryBot: 0.068, yOffset: 0.003, boxiness: 0.35 }, // Cockpit rear bulkhead
    { z:  0.40, rx: 0.064, ryTop: 0.066, ryBot: 0.062, yOffset: -0.002, boxiness: 0.15 }, // Station B-B: Cockpit
    { z:  0.54, rx: 0.053, ryTop: 0.053, ryBot: 0.051, yOffset: -0.008, boxiness: 0.05 }, // Station A-A: Radome ring
  ];

  const radialSegs = 32;
  const fusePos: number[] = [];
  const fuseIdx: number[] = [];

  for (let si = 0; si < stations.length; si++) {
    const st = stations[si];
    const power = 1.0 - st.boxiness * 0.55;
    for (let ri = 0; ri < radialSegs; ri++) {
      const theta = (ri / radialSegs) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const x = Math.sign(cosT) * Math.pow(Math.abs(cosT), power) * st.rx;
      const ry = sinT >= 0 ? st.ryTop : st.ryBot;
      const y = st.yOffset + Math.sign(sinT) * Math.pow(Math.abs(sinT), power) * ry;
      fusePos.push(x, y, st.z);
    }
  }

  for (let si = 0; si < stations.length - 1; si++) {
    const rowA = si * radialSegs;
    const rowB = (si + 1) * radialSegs;
    for (let ri = 0; ri < radialSegs; ri++) {
      const next = (ri + 1) % radialSegs;
      fuseIdx.push(rowA + ri, rowB + next, rowB + ri);
      fuseIdx.push(rowA + ri, rowA + next, rowB + next);
    }
  }

  const fuseGeo = new THREE.BufferGeometry();
  fuseGeo.setAttribute('position', new THREE.Float32BufferAttribute(fusePos, 3));
  fuseGeo.setIndex(fuseIdx);
  fuseGeo.computeVertexNormals();

  const fuseMesh = new THREE.Mesh(fuseGeo, airframeLightMat);
  fuseMesh.castShadow = true;
  fuseMesh.receiveShadow = true;
  airframeGroup.add(fuseMesh);

  // ==========================================
  // 3. RADOME NOSE CONE (4), PVD-7 PITOT BOOM (3), & TP-23 IRST (44, 45)
  // ==========================================
  const noseGroup = new THREE.Group();
  noseGroup.name = 'NoseRadomeAndSensors';

  // Ogival Radome (4) from z = 0.54 to z = 0.85
  const radomeLen = 0.31;
  const radomeGeo = new THREE.CylinderGeometry(0.003, 0.053, radomeLen, 28);
  radomeGeo.rotateX(Math.PI / 2);
  const radomeMesh = new THREE.Mesh(radomeGeo, radomeDarkMat);
  radomeMesh.position.set(0, -0.013, 0.54 + radomeLen / 2);
  radomeMesh.rotation.x = 0.03; // Downward nose droop
  radomeMesh.castShadow = true;
  noseGroup.add(radomeMesh);

  // Metallic Radome Base Interface Ring (between grey fuselage and dark radome)
  const radomeRingGeo = new THREE.CylinderGeometry(0.0535, 0.054, 0.006, 28);
  radomeRingGeo.rotateX(Math.PI / 2);
  const radomeRing = new THREE.Mesh(radomeRingGeo, darkMetalMat);
  radomeRing.position.set(0, -0.008, 0.54);
  noseGroup.add(radomeRing);

  // PVD-7 Main Pitot Boom (3) extending forward to z = 1.05
  const pitotLen = 0.20;
  const pitotGeo = new THREE.CylinderGeometry(0.0012, 0.003, pitotLen, 14);
  pitotGeo.rotateX(Math.PI / 2);
  const pitotMesh = new THREE.Mesh(pitotGeo, steelStrutMat);
  pitotMesh.position.set(0, -0.018, 0.85 + pitotLen / 2);
  noseGroup.add(pitotMesh);

  // DUAS Angle-of-Attack (AoA) Pitch & Yaw vanes on pitot boom
  for (const rotZ of [0, Math.PI / 2]) {
    const vaneGeo = new THREE.BoxGeometry(0.024, 0.0016, 0.014);
    vaneGeo.rotateZ(rotZ);
    const vaneMesh = new THREE.Mesh(vaneGeo, steelStrutMat);
    vaneMesh.position.set(0, -0.018, 0.96);
    noseGroup.add(vaneMesh);
  }

  // TP-23 IRST (Infra-Red Search & Track) Sensor under nose (44, 45)
  const irstBodyGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.055, 14);
  irstBodyGeo.rotateX(Math.PI / 2);
  const irstBody = new THREE.Mesh(irstBodyGeo, radomeDarkMat);
  irstBody.position.set(0, -0.062, 0.49);
  noseGroup.add(irstBody);

  const irstDomeGeo = new THREE.SphereGeometry(0.013, 14, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  irstDomeGeo.rotateX(-Math.PI / 2);
  const irstDome = new THREE.Mesh(irstDomeGeo, canopyGlassMat);
  irstDome.position.set(0, -0.062, 0.518);
  noseGroup.add(irstDome);

  // Upper Nose Sensor Blister (26)
  const sensorBlister = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.012, 0.040),
    radomeDarkMat
  );
  sensorBlister.position.set(0, 0.052, 0.50);
  noseGroup.add(sensorBlister);

  airframeGroup.add(noseGroup);

  // ==========================================
  // 4. COCKPIT INTERIOR, CANOPY (6, 27, 28) & TS-27AMSh PERISCOPE (28)
  // ==========================================
  const cockpitGroup = new THREE.Group();
  cockpitGroup.name = 'CockpitCanopyAndPeriscope';

  // Cockpit Tub & Instrument Panel Glare Shield (21, 22)
  const tubGeo = new THREE.BoxGeometry(0.050, 0.045, 0.18);
  const tubMesh = new THREE.Mesh(tubGeo, cockpitInteriorMat);
  tubMesh.position.set(0, 0.055, 0.31);
  cockpitGroup.add(tubMesh);

  // ASP-23 Optical Reflector Gunsight / HUD Glass
  const hudGlassGeo = new THREE.BoxGeometry(0.018, 0.014, 0.003);
  hudGlassGeo.rotateX(-0.4);
  const hudGlass = new THREE.Mesh(hudGlassGeo, canopyGlassMat);
  hudGlass.position.set(0, 0.088, 0.39);
  cockpitGroup.add(hudGlass);

  // KM-1M Ejection Seat Headrest & Dual Ejection Pull Handles
  const seatHeadGeo = new THREE.BoxGeometry(0.026, 0.038, 0.024);
  const seatHead = new THREE.Mesh(seatHeadGeo, seatCushionMat);
  seatHead.position.set(0, 0.092, 0.25);
  cockpitGroup.add(seatHead);

  // Twin Ejection Pull Rings (orange/yellow) on headrest
  for (const sx of [-0.008, 0.008]) {
    const ringGeo = new THREE.TorusGeometry(0.005, 0.0016, 8, 12);
    const ringMesh = new THREE.Mesh(ringGeo, ejectionHandleMat);
    ringMesh.position.set(sx, 0.114, 0.25);
    cockpitGroup.add(ringMesh);
  }

  // Transparent Cockpit Windscreen & Clamshell Canopy (6)
  const canopyShape = new THREE.Shape();
  canopyShape.moveTo(0.18, 0.066);
  canopyShape.lineTo(0.47, 0.048); // Windscreen base near nose
  canopyShape.lineTo(0.39, 0.110); // Windscreen arch peak
  canopyShape.quadraticCurveTo(0.30, 0.122, 0.19, 0.104); // Canopy rear arch
  canopyShape.closePath();

  const canopyGeo = extrudeSideProfile(canopyShape, 0.058, 0.008, 3);
  const canopyMesh = new THREE.Mesh(canopyGeo, canopyGlassMat);
  canopyMesh.castShadow = true;
  cockpitGroup.add(canopyMesh);

  // Metal Canopy Sill Base Frame (anchoring canopy to fuselage contours)
  const sillGeo = new THREE.BoxGeometry(0.062, 0.012, 0.29);
  const sillMesh = new THREE.Mesh(sillGeo, airframeCamoMat);
  sillMesh.position.set(0, 0.064, 0.325);
  cockpitGroup.add(sillMesh);

  // Metal Windscreen Arch Frame (separating front fixed glass and opening canopy)
  const archShape = new THREE.Shape();
  archShape.moveTo(0.368, 0.062);
  archShape.lineTo(0.384, 0.062);
  archShape.lineTo(0.390, 0.112);
  archShape.lineTo(0.372, 0.112);
  archShape.closePath();
  const archGeo = extrudeSideProfile(archShape, 0.061, 0.003, 2);
  cockpitGroup.add(new THREE.Mesh(archGeo, airframeCamoMat));

  // Front Windscreen Post Struts
  const frontPostGeo = new THREE.BoxGeometry(0.060, 0.038, 0.008);
  frontPostGeo.rotateX(-0.4);
  const frontPost = new THREE.Mesh(frontPostGeo, airframeCamoMat);
  frontPost.position.set(0, 0.075, 0.44);
  cockpitGroup.add(frontPost);

  // TS-27AMSh Rearview Periscope on Canopy Top (Detail 28 in blueprint!)
  const periscopeShape = new THREE.Shape();
  periscopeShape.moveTo(0.24, 0.118);
  periscopeShape.lineTo(0.29, 0.120);
  periscopeShape.lineTo(0.28, 0.138); // Periscope prism optic
  periscopeShape.lineTo(0.25, 0.138);
  periscopeShape.closePath();
  const periscopeGeo = extrudeSideProfile(periscopeShape, 0.016, 0.002, 1);
  const periscopeMesh = new THREE.Mesh(periscopeGeo, radomeDarkMat);
  cockpitGroup.add(periscopeMesh);

  // Long Dorsal Spine (7) from rear canopy (z = 0.20) to vertical fin root (z = -0.68)
  const spineShape = new THREE.Shape();
  spineShape.moveTo(-0.68, 0.062);
  spineShape.lineTo(0.20, 0.068);
  spineShape.lineTo(0.19, 0.108);
  spineShape.lineTo(-0.34, 0.104);
  spineShape.lineTo(-0.68, 0.084);
  spineShape.closePath();

  const spineGeo = extrudeSideProfile(spineShape, 0.052, 0.008, 3);
  const spineMesh = new THREE.Mesh(spineGeo, airframeCamoMat);
  spineMesh.castShadow = true;
  cockpitGroup.add(spineMesh);

  // Dorsal VHF Blade Antenna (29)
  const antShape = new THREE.Shape();
  antShape.moveTo(-0.04, 0.105);
  antShape.lineTo(0.01, 0.105);
  antShape.lineTo(-0.01, 0.150);
  antShape.lineTo(-0.035, 0.150);
  antShape.closePath();
  const antGeo = extrudeSideProfile(antShape, 0.005, 0.0, 1);
  cockpitGroup.add(new THREE.Mesh(antGeo, radomeDarkMat));

  airframeGroup.add(cockpitGroup);

  // ==========================================
  // 5. TWIN BOX AIR INTAKES (40), SPLITTER PLATES (67) & BLOW-IN DOORS (8, 53)
  // ==========================================
  const intakesGroup = new THREE.Group();
  intakesGroup.name = 'AirIntakesAndSplitters';

  for (const sign of [-1, 1]) {
    const intakeSub = new THREE.Group();

    // Main Rectangular Intake Duct (40)
    const ductLen = 0.38;
    const ductGeo = new THREE.BoxGeometry(0.052, 0.116, ductLen);
    const ductMesh = new THREE.Mesh(ductGeo, airframeLightMat);
    ductMesh.position.set(sign * 0.098, 0.002, 0.11);
    ductMesh.castShadow = true;
    ductMesh.receiveShadow = true;
    intakeSub.add(ductMesh);

    // Dark Intake Throat Cavity at front (z = +0.29)
    const throatGeo = new THREE.BoxGeometry(0.044, 0.104, 0.016);
    const throatMesh = new THREE.Mesh(throatGeo, darkMetalMat);
    throatMesh.position.set(sign * 0.100, 0.002, 0.285);
    intakeSub.add(throatMesh);

    // Boundary-Layer Splitter Plate (67) with stand-off gap from fuselage
    const splitterShape = new THREE.Shape();
    splitterShape.moveTo(0.23, -0.060);
    splitterShape.lineTo(0.34, -0.058); // Leading edge of splitter plate
    splitterShape.lineTo(0.34, 0.062);
    splitterShape.lineTo(0.23, 0.060);
    splitterShape.closePath();
    const splitterGeo = extrudeSideProfile(splitterShape, 0.004, 0.001, 1);
    const splitterMesh = new THREE.Mesh(splitterGeo, airframeCamoMat);
    splitterMesh.position.set(sign * 0.075, 0.002, 0);
    intakeSub.add(splitterMesh);

    // Standoff support struts between fuselage and splitter plate
    for (const zStrut of [0.26, 0.31]) {
      const pinGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.018, 8);
      pinGeo.rotateZ(Math.PI / 2);
      const pinMesh = new THREE.Mesh(pinGeo, darkMetalMat);
      pinMesh.position.set(sign * 0.084, 0.002, zStrut);
      intakeSub.add(pinMesh);
    }

    // Auxiliary Blow-In Intake Louvers / Doors (8 & 53 in blueprint!)
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const louverGeo = new THREE.BoxGeometry(0.002, 0.014, 0.024);
        const louverMesh = new THREE.Mesh(louverGeo, darkMetalMat);
        louverMesh.position.set(
          sign * 0.125,
          -0.02 + r * 0.035,
          0.13 + c * 0.036
        );
        intakeSub.add(louverMesh);
      }
    }

    intakesGroup.add(intakeSub);
  }

  airframeGroup.add(intakesGroup);

  // ==========================================
  // 6. DETAILED MULTI-PART MOVABLE WING ASSEMBLY (Matching gambar-teknik.png)
  // ==========================================
  const wingsGroup = new THREE.Group();
  wingsGroup.name = 'VariableSweepWingAssembly';

  // Fixed Wing Glove (9) with leading-edge Dogtooth / Snag (10, 20)
  const gloveShape = new THREE.Shape();
  gloveShape.moveTo(0.08, 0.22);    // Front root near air intake
  gloveShape.lineTo(0.235, 0.075);  // Glove leading edge sweep
  gloveShape.lineTo(0.252, 0.098);  // Sharp Dogtooth snag forward projection (10)
  gloveShape.lineTo(0.250, 0.065);  // Dogtooth inner notch
  gloveShape.lineTo(0.245, -0.16);  // Outer glove sweep seal edge
  gloveShape.lineTo(0.08, -0.21);   // Rear glove root into nacelle
  gloveShape.closePath();

  for (const isLeft of [false, true]) {
    const sign = isLeft ? -1 : 1;
    const gloveGeo = extrudePlanform(gloveShape, 0.024, 0.002, isLeft);
    const gloveMesh = new THREE.Mesh(gloveGeo, airframeCamoMat);
    gloveMesh.position.set(0, 0.052, 0);
    gloveMesh.castShadow = true;
    gloveMesh.receiveShadow = true;
    wingsGroup.add(gloveMesh);

    // Glove Leading-Edge Vortex Fence (20 in blueprint)
    const fenceShape = new THREE.Shape();
    fenceShape.moveTo(0.236, 0.070);
    fenceShape.lineTo(0.252, 0.098);
    fenceShape.lineTo(0.252, 0.118);
    fenceShape.lineTo(0.236, 0.090);
    fenceShape.closePath();
    const fenceGeo = extrudePlanform(fenceShape, 0.003, 0.0005, isLeft);
    const fenceMesh = new THREE.Mesh(fenceGeo, darkMetalMat);
    fenceMesh.position.set(0, 0.056, 0);
    wingsGroup.add(fenceMesh);

    // Rubber Sweep-Seal Inflatable Bag (18 in blueprint: curved rubber seal at root cutout)
    const sealGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.022, 16, 1, false, -Math.PI * 0.6, Math.PI * 0.8);
    sealGeo.rotateZ(Math.PI / 2);
    const sealMesh = new THREE.Mesh(sealGeo, tireRubberMat);
    sealMesh.position.set(sign * 0.20, 0.050, -0.02);
    wingsGroup.add(sealMesh);
  }

  // Movable Outer Wing Panels (11-14) with multi-part components & mechanical pivot (19)
  const createOuterWingPanel = (isLeft: boolean): THREE.Group => {
    const sign = isLeft ? -1 : 1;
    const pivotGroup = new THREE.Group();
    pivotGroup.name = isLeft ? 'LeftWing_MultiPart' : 'RightWing_MultiPart';
    pivotGroup.position.set(sign * 0.20, 0.046, 0.01);
    // Anhedral downward droop (front view Ж in blueprint)
    pivotGroup.rotation.z = -sign * 0.055;

    const wingSub = new THREE.Group();
    wingSub.name = 'WingComponents';

    // Helper: exact 4-corner trapezoid panel in local planform (X = spanwise, Z = chordwise)
    const makeWingPanel = (
      x1: number,
      x2: number,
      zFront1: number,
      zFront2: number,
      zRear1: number,
      zRear2: number,
      thick: number,
      mat: THREE.Material,
      bevelSize = 0.0004
    ): THREE.Mesh => {
      const s = new THREE.Shape();
      s.moveTo(x1, zFront1);
      s.lineTo(x2, zFront2);
      s.lineTo(x2, zRear2);
      s.lineTo(x1, zRear1);
      s.closePath();
      const geo = extrudePlanform(s, thick, bevelSize, isLeft);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    // Leading and trailing edge linear equations (authentic MiG-23 planform)
    const zLE = (x: number) => 0.070 - 0.350 * x;
    const zTE = (x: number) => -0.150 - 0.072 * x;
    const chord = (x: number) => zLE(x) - zTE(x);
    // Boundary seams for slats and flaps
    const zSlatSeam = (x: number) => zLE(x) - 0.18 * chord(x);
    const zFlapSeam = (x: number) => zTE(x) + 0.25 * chord(x);

    // ========================================================
    // A. MAIN TORSION BOX SKIN PANELS (4 BAYS MATCHING RIBS)
    // ========================================================
    const wingThickness = 0.0125;
    const bays = [
      { x1: 0.000, x2: 0.147, name: 'Bay1_Inboard' },
      { x1: 0.149, x2: 0.257, name: 'Bay2_MidInner' },
      { x1: 0.259, x2: 0.367, name: 'Bay3_MidOuter' },
      { x1: 0.369, x2: 0.485, name: 'Bay4_Outboard' },
    ];

    for (const bay of bays) {
      const bayMesh = makeWingPanel(
        bay.x1, bay.x2,
        zSlatSeam(bay.x1), zSlatSeam(bay.x2),
        zFlapSeam(bay.x1), zFlapSeam(bay.x2),
        wingThickness, airframeLightMat, 0.0003
      );
      bayMesh.name = bay.name;
      wingSub.add(bayMesh);
    }

    // Chordwise structural rib seam lines (fine subtle panel grooves between bays)
    for (const rx of [0.148, 0.258, 0.368]) {
      const seamShape = new THREE.Shape();
      seamShape.moveTo(rx - 0.0006, zSlatSeam(rx));
      seamShape.lineTo(rx + 0.0006, zSlatSeam(rx));
      seamShape.lineTo(rx + 0.0006, zFlapSeam(rx));
      seamShape.lineTo(rx - 0.0006, zFlapSeam(rx));
      seamShape.closePath();
      const seamGeo = extrudePlanform(seamShape, wingThickness + 0.0002, 0.0, isLeft);
      wingSub.add(new THREE.Mesh(seamGeo, panelLineMat));
    }

    // Longitudinal Slat & Flap Seam Lines (subtle recessed boundary lines)
    const slatSeamLine = new THREE.Shape();
    slatSeamLine.moveTo(0.038, zSlatSeam(0.038) + 0.0004);
    slatSeamLine.lineTo(0.485, zSlatSeam(0.485) + 0.0004);
    slatSeamLine.lineTo(0.485, zSlatSeam(0.485) - 0.0004);
    slatSeamLine.lineTo(0.038, zSlatSeam(0.038) - 0.0004);
    slatSeamLine.closePath();
    const slatSeamGeo = extrudePlanform(slatSeamLine, wingThickness + 0.0002, 0.0, isLeft);
    wingSub.add(new THREE.Mesh(slatSeamGeo, panelLineMat));

    const flapSeamLine = new THREE.Shape();
    flapSeamLine.moveTo(0.038, zFlapSeam(0.038) + 0.0004);
    flapSeamLine.lineTo(0.472, zFlapSeam(0.472) + 0.0004);
    flapSeamLine.lineTo(0.472, zFlapSeam(0.472) - 0.0004);
    flapSeamLine.lineTo(0.038, zFlapSeam(0.038) - 0.0004);
    flapSeamLine.closePath();
    const flapSeamGeo = extrudePlanform(flapSeamLine, wingThickness + 0.0002, 0.0, isLeft);
    wingSub.add(new THREE.Mesh(flapSeamGeo, panelLineMat));

    // Circular Access Hatch (inspection circle "O" in blueprint crop)
    const hatchX = 0.215;
    const hatchZ = (zSlatSeam(hatchX) + zFlapSeam(hatchX)) * 0.52;
    // Outer torus ring
    const hatchRingGeo = new THREE.TorusGeometry(0.0085, 0.0009, 8, 24);
    hatchRingGeo.rotateX(Math.PI / 2);
    const hatchRing = new THREE.Mesh(hatchRingGeo, darkMetalMat);
    hatchRing.position.set(sign * hatchX, wingThickness / 2 + 0.0005, hatchZ);
    wingSub.add(hatchRing);
    // Inner hatch disc
    const hatchDiscGeo = new THREE.CylinderGeometry(0.0076, 0.0076, 0.001, 18);
    const hatchDisc = new THREE.Mesh(hatchDiscGeo, airframeLightMat);
    hatchDisc.position.set(sign * hatchX, wingThickness / 2 + 0.0004, hatchZ);
    wingSub.add(hatchDisc);
    // Center lock fastener
    const hatchCenterGeo = new THREE.CylinderGeometry(0.0015, 0.0015, 0.0018, 8);
    const hatchCenter = new THREE.Mesh(hatchCenterGeo, steelStrutMat);
    hatchCenter.position.set(sign * hatchX, wingThickness / 2 + 0.0008, hatchZ);
    wingSub.add(hatchCenter);

    // Pivot Pin Cover Disc (19 in blueprint)
    const pinCoverGeo = new THREE.CylinderGeometry(0.022, 0.022, wingThickness + 0.003, 20);
    const pinCover = new THREE.Mesh(pinCoverGeo, airframeCamoMat);
    pinCover.position.set(0, 0.001, 0);
    wingSub.add(pinCover);

    const pinCoreGeo = new THREE.CylinderGeometry(0.008, 0.008, wingThickness + 0.005, 12);
    const pinCore = new THREE.Mesh(pinCoreGeo, titaniumNozzleMat);
    pinCore.position.set(0, 0.002, 0);
    wingSub.add(pinCore);

    // Tactical Soviet Red Star on Upper Wing Bay 3
    const starGeo = extrudePlanform(createFivePointStar(0.030, 0.012), 0.002, 0.0, isLeft);
    const starMesh = new THREE.Mesh(starGeo, redStarMat);
    starMesh.position.set(sign * 0.275, wingThickness / 2 + 0.0018, -0.075);
    wingSub.add(starMesh);

    // ========================================================
    // B. 4 DISTINCT LEADING EDGE SLAT SEGMENTS (11 IN BLUEPRINT)
    // ========================================================
    const slatSegments = [
      { x1: 0.038, x2: 0.146, name: 'Slat_Segment_1_Inboard' },
      { x1: 0.150, x2: 0.256, name: 'Slat_Segment_2_MidInner' },
      { x1: 0.260, x2: 0.366, name: 'Slat_Segment_3_MidOuter' },
      { x1: 0.370, x2: 0.485, name: 'Slat_Segment_4_Outboard' },
    ];

    for (const slat of slatSegments) {
      const sMesh = makeWingPanel(
        slat.x1, slat.x2,
        zLE(slat.x1), zLE(slat.x2),
        zSlatSeam(slat.x1), zSlatSeam(slat.x2),
        wingThickness, airframeCamoMat, 0.0006
      );
      sMesh.name = slat.name;
      wingSub.add(sMesh);

      // Under-wing slat track actuator guide bracket (Callout 11)
      const midX = (slat.x1 + slat.x2) / 2;
      const trackGeo = new THREE.BoxGeometry(0.004, 0.005, 0.022);
      const trackMesh = new THREE.Mesh(trackGeo, steelStrutMat);
      trackMesh.position.set(sign * midX, -wingThickness / 2 - 0.002, zSlatSeam(midX) + 0.006);
      trackMesh.rotation.y = sign * 0.35;
      wingSub.add(trackMesh);
    }

    // Slat divider joint lines (dark guide slots between slat segments)
    for (const rx of [0.148, 0.258, 0.368]) {
      const sJoint = new THREE.Shape();
      sJoint.moveTo(rx - 0.0008, zLE(rx));
      sJoint.lineTo(rx + 0.0008, zLE(rx));
      sJoint.lineTo(rx + 0.0008, zSlatSeam(rx));
      sJoint.lineTo(rx - 0.0008, zSlatSeam(rx));
      sJoint.closePath();
      const sJointGeo = extrudePlanform(sJoint, wingThickness + 0.0003, 0.0, isLeft);
      wingSub.add(new THREE.Mesh(sJointGeo, panelLineMat));
    }

    // ========================================================
    // C. TRAILING EDGE FLAPS, FLAPERONS & SPOILERS (14 IN BLUEPRINT)
    // ========================================================
    // 1. Inboard Fowler Flap (x = 0.038 to 0.256)
    const flap1 = makeWingPanel(
      0.038, 0.256,
      zFlapSeam(0.038), zFlapSeam(0.256),
      zTE(0.038), zTE(0.256),
      wingThickness - 0.0015, airframeCamoMat, 0.0005
    );
    flap1.name = 'InboardFlap_14';
    wingSub.add(flap1);

    // 2. Outboard Flap / Aileron (x = 0.260 to 0.472)
    const flap2 = makeWingPanel(
      0.260, 0.472,
      zFlapSeam(0.260), zFlapSeam(0.472),
      zTE(0.260), zTE(0.472),
      wingThickness - 0.0025, airframeCamoMat, 0.0005
    );
    flap2.name = 'OutboardFlaperon_14';
    wingSub.add(flap2);

    // 3. Two Prominent Aerodynamic Flap Track Fairings / Canoe Hinges Underneath (Callout 14 in blueprint!)
    // Fairing 1: Inboard flap track (x = 0.148)
    // Fairing 2: Mid flap/aileron transition track (x = 0.258)
    const canoeTracks = [0.148, 0.258];
    for (const cx of canoeTracks) {
      const canoeGroup = new THREE.Group();
      const zCenter = zTE(cx) + 0.006;
      canoeGroup.position.set(sign * cx, -wingThickness / 2 - 0.0035, zCenter);

      // Streamlined cylindrical body
      const cBodyGeo = new THREE.CylinderGeometry(0.0034, 0.0032, 0.032, 12);
      cBodyGeo.rotateX(Math.PI / 2);
      const cBody = new THREE.Mesh(cBodyGeo, airframeCamoMat);
      cBody.castShadow = true;
      canoeGroup.add(cBody);

      // Rounded aerodynamic nose
      const cNoseGeo = new THREE.SphereGeometry(0.0034, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      cNoseGeo.rotateX(-Math.PI / 2);
      const cNose = new THREE.Mesh(cNoseGeo, airframeCamoMat);
      cNose.position.z = 0.016;
      canoeGroup.add(cNose);

      // Tapered aft tail cone (projects 14mm behind trailing edge)
      const cTailGeo = new THREE.ConeGeometry(0.0032, 0.018, 12);
      cTailGeo.rotateX(-Math.PI / 2);
      const cTail = new THREE.Mesh(cTailGeo, airframeCamoMat);
      cTail.position.z = -0.025;
      cTail.castShadow = true;
      canoeGroup.add(cTail);

      // Steel internal hinge link inside canoe
      const linkGeo = new THREE.CylinderGeometry(0.0012, 0.0012, 0.007, 8);
      linkGeo.rotateZ(Math.PI / 2);
      const linkMesh = new THREE.Mesh(linkGeo, steelStrutMat);
      linkMesh.position.set(0, 0.002, zFlapSeam(cx) - zCenter);
      canoeGroup.add(linkMesh);

      wingSub.add(canoeGroup);
    }

    // 4. Upper Surface Spoilers / Decelerons (Callout 14: flush camouflaged panels)
    const spoilers = [
      { x1: 0.058, x2: 0.245, depth: 0.018, name: 'Spoiler_Inboard' },
      { x1: 0.272, x2: 0.430, depth: 0.015, name: 'Spoiler_Outboard' },
    ];

    for (const sp of spoilers) {
      const spShape = new THREE.Shape();
      spShape.moveTo(sp.x1, zFlapSeam(sp.x1));
      spShape.lineTo(sp.x2, zFlapSeam(sp.x2));
      spShape.lineTo(sp.x2, zFlapSeam(sp.x2) + sp.depth);
      spShape.lineTo(sp.x1, zFlapSeam(sp.x1) + sp.depth);
      spShape.closePath();
      // Spoiler panel flush on top skin
      const spGeo = extrudePlanform(spShape, 0.0006, 0.0002, isLeft);
      const spMesh = new THREE.Mesh(spGeo, airframeCamoMat);
      spMesh.name = sp.name;
      spMesh.position.y = wingThickness / 2 + 0.0004;
      wingSub.add(spMesh);

      // Fine perimeter outline seam for spoiler plate
      const seamPoints = [
        new THREE.Vector3(sign * sp.x1, wingThickness / 2 + 0.0007, zFlapSeam(sp.x1)),
        new THREE.Vector3(sign * sp.x2, wingThickness / 2 + 0.0007, zFlapSeam(sp.x2)),
        new THREE.Vector3(sign * sp.x2, wingThickness / 2 + 0.0007, zFlapSeam(sp.x2) + sp.depth),
        new THREE.Vector3(sign * sp.x1, wingThickness / 2 + 0.0007, zFlapSeam(sp.x1) + sp.depth),
        new THREE.Vector3(sign * sp.x1, wingThickness / 2 + 0.0007, zFlapSeam(sp.x1)),
      ];
      const seamGeo = new THREE.BufferGeometry().setFromPoints(seamPoints);
      const seamLine = new THREE.Line(seamGeo, new THREE.LineBasicMaterial({ color: 0x334155 }));
      wingSub.add(seamLine);

      // Small hinge tabs along spoiler forward edge
      const numTabs = 3;
      for (let ti = 0; ti < numTabs; ti++) {
        const tx = sp.x1 + ((sp.x2 - sp.x1) / (numTabs + 1)) * (ti + 1);
        const tabGeo = new THREE.BoxGeometry(0.0025, 0.0012, 0.004);
        const tabMesh = new THREE.Mesh(tabGeo, steelStrutMat);
        tabMesh.position.set(sign * tx, wingThickness / 2 + 0.0007, zFlapSeam(tx) + sp.depth);
        wingSub.add(tabMesh);
      }
    }

    // ========================================================
    // D. WINGTIP ASSEMBLY & NAVIGATION LIGHT (12, 13 IN BLUEPRINT)
    // ========================================================
    // Beveled Wingtip End Cap (13)
    const tipShape = new THREE.Shape();
    tipShape.moveTo(0.485, zLE(0.485));
    tipShape.lineTo(0.512, zLE(0.485) - 0.006);
    tipShape.lineTo(0.505, zTE(0.485) - 0.004);
    tipShape.lineTo(0.485, zTE(0.485));
    tipShape.closePath();
    const tipGeo = extrudePlanform(tipShape, wingThickness - 0.003, 0.0015, isLeft);
    const tipMesh = new THREE.Mesh(tipGeo, airframeCamoMat);
    tipMesh.castShadow = true;
    wingSub.add(tipMesh);

    // Embedded Teardrop Navigation Light Housing (12)
    const navLightMat = isLeft ? navLightRedMat : navLightGreenMat;
    // Aerodynamic dark metal mounting bezel
    const bezelGeo = new THREE.BoxGeometry(0.006, 0.007, 0.016);
    const bezelMesh = new THREE.Mesh(bezelGeo, darkMetalMat);
    bezelMesh.position.set(sign * 0.505, 0.0, zLE(0.485) - 0.006);
    wingSub.add(bezelMesh);
    // Glowing lens
    const navLightGeo = new THREE.SphereGeometry(0.0045, 10, 8);
    navLightGeo.scale(1.0, 0.65, 1.6);
    const navLight = new THREE.Mesh(navLightGeo, navLightMat);
    navLight.position.set(sign * 0.506, 0.001, zLE(0.485) - 0.005);
    wingSub.add(navLight);

    // Static Discharge Wick at trailing tip
    const wickGeo = new THREE.CylinderGeometry(0.0008, 0.0008, 0.024, 6);
    wickGeo.rotateX(Math.PI / 2);
    const wickMesh = new THREE.Mesh(wickGeo, steelStrutMat);
    wickMesh.position.set(sign * 0.495, 0.0, zTE(0.485) - 0.014);
    wingSub.add(wickMesh);

    pivotGroup.add(wingSub);
    return pivotGroup;
  };

  const leftWingPivot = createOuterWingPanel(true);
  const rightWingPivot = createOuterWingPanel(false);

  // Default combat mid-sweep angle (~45°)
  const baseSweepRad = 0.22;
  leftWingPivot.rotation.y = baseSweepRad;
  rightWingPivot.rotation.y = -baseSweepRad;

  wingsGroup.add(leftWingPivot, rightWingPivot);
  airframeGroup.add(wingsGroup);

  // ==========================================
  // 7. EMPENNAGE (60-65), DRAG CHUTE (16), FOLDING VENTRAL FIN (30, 70), & TAILPLANES (15)
  // ==========================================
  const tailGroup = new THREE.Group();
  tailGroup.name = 'EmpennageAssembly';

  // Swept Vertical Stabilizer (60-65) with Dorsal Fillet (66)
  const vFinShape = new THREE.Shape();
  vFinShape.moveTo(-0.74, 0.065);  // Base trailing edge above nozzle
  vFinShape.lineTo(-0.18, 0.092);  // Dorsal fillet tip (66)
  vFinShape.lineTo(-0.42, 0.142);  // Dorsal fillet inflection
  vFinShape.lineTo(-0.69, 0.365);  // Leading edge top corner (64)
  vFinShape.lineTo(-0.82, 0.375);  // Top rear tip (63)
  vFinShape.lineTo(-0.77, 0.132);  // Rudder trailing edge
  vFinShape.closePath();

  const vFinGeo = extrudeSideProfile(vFinShape, 0.014, 0.003, 2);
  const vFinMesh = new THREE.Mesh(vFinGeo, airframeLightMat);
  vFinMesh.castShadow = true;
  vFinMesh.receiveShadow = true;
  tailGroup.add(vFinMesh);

  // Dorsal Cooling Ram-Air Scoop (66) at vertical fin base
  const scoopShape = new THREE.Shape();
  scoopShape.moveTo(-0.24, 0.092);
  scoopShape.lineTo(-0.18, 0.092);
  scoopShape.lineTo(-0.21, 0.116);
  scoopShape.lineTo(-0.26, 0.116);
  scoopShape.closePath();
  const scoopGeo = extrudeSideProfile(scoopShape, 0.018, 0.002, 1);
  tailGroup.add(new THREE.Mesh(scoopGeo, airframeCamoMat));

  // Dielectric Antenna Tip Cap (64) & Aft ECM Fairing (63)
  const finCapShape = new THREE.Shape();
  finCapShape.moveTo(-0.73, 0.315);
  finCapShape.lineTo(-0.64, 0.315);
  finCapShape.lineTo(-0.69, 0.366);
  finCapShape.lineTo(-0.81, 0.375);
  finCapShape.lineTo(-0.80, 0.335);
  finCapShape.closePath();
  const finCapGeo = extrudeSideProfile(finCapShape, 0.017, 0.002, 1);
  tailGroup.add(new THREE.Mesh(finCapGeo, radomeDarkMat));

  // Tactical Red Star on both sides of vertical fin
  const tailStarGeo = extrudeSideProfile(createFivePointStar(0.028, 0.011), 0.021, 0.0, 1);
  const tailStar = new THREE.Mesh(tailStarGeo, redStarMat);
  tailStar.position.set(0, 0.23, -0.64);
  tailGroup.add(tailStar);

  // Bullet-shaped Drag-Chute Fairing (16)
  const chuteGeo = new THREE.CylinderGeometry(0.014, 0.020, 0.14, 16);
  chuteGeo.rotateX(Math.PI / 2);
  const chuteMesh = new THREE.Mesh(chuteGeo, airframeCamoMat);
  chuteMesh.position.set(0, 0.086, -0.74);
  tailGroup.add(chuteMesh);

  const chuteConeGeo = new THREE.ConeGeometry(0.014, 0.04, 16);
  chuteConeGeo.rotateX(-Math.PI / 2);
  const chuteCone = new THREE.Mesh(chuteConeGeo, radomeDarkMat);
  chuteCone.position.set(0, 0.086, -0.83);
  tailGroup.add(chuteCone);

  // Folding Ventral Fin (30, 70) with mechanical hinge (folded 90° for ground clearance)
  const ventralPivot = new THREE.Group();
  ventralPivot.name = 'VentralFinPivot_30_70';
  ventralPivot.position.set(0, -0.055, 0);
  ventralPivot.rotation.z = Math.PI / 2; // Folded 90° to starboard when gear is down

  const ventralShape = new THREE.Shape();
  ventralShape.moveTo(-0.72, 0.003);
  ventralShape.lineTo(-0.38, -0.007);
  ventralShape.lineTo(-0.48, -0.097);
  ventralShape.lineTo(-0.71, -0.093);
  ventralShape.closePath();

  const ventralGeo = extrudeSideProfile(ventralShape, 0.010, 0.002, 2);
  const ventralMesh = new THREE.Mesh(ventralGeo, airframeCamoMat);
  ventralMesh.castShadow = true;
  ventralPivot.add(ventralMesh);
  tailGroup.add(ventralPivot);

  // All-Moving Horizontal Tailplanes (15) with leading-edge balance dogtooth
  const hTailShape = new THREE.Shape();
  hTailShape.moveTo(0.06, -0.44);   // Inner root
  hTailShape.lineTo(0.32, -0.68);   // Outer tip (15)
  hTailShape.lineTo(0.34, -0.74);   // Clipped corner
  hTailShape.lineTo(0.28, -0.81);   // Outer trailing corner
  hTailShape.lineTo(0.06, -0.71);   // Inner trailing corner
  hTailShape.closePath();

  for (const isLeft of [false, true]) {
    const hTailGeo = extrudePlanform(hTailShape, 0.010, 0.002, isLeft);
    const hTailMesh = new THREE.Mesh(hTailGeo, airframeLightMat);
    hTailMesh.position.set(0, 0.010, 0);
    hTailMesh.castShadow = true;
    hTailMesh.receiveShadow = true;
    tailGroup.add(hTailMesh);
  }

  // 4-Petal Speedbrakes / Airbrakes (55, 57, Cross-Section E-E!)
  const airbrakeDoors: THREE.Group[] = [];
  const airbrakeAngles = [
    Math.PI / 4,       // Top Right (55)
    (3 * Math.PI) / 4, // Top Left (55)
    (5 * Math.PI) / 4, // Bottom Left (57)
    (7 * Math.PI) / 4, // Bottom Right (57)
  ];

  for (let i = 0; i < 4; i++) {
    const abDoor = new THREE.Group();
    abDoor.name = `AirbrakeDoor_${i + 1}`;
    const ang = airbrakeAngles[i];
    const rMount = 0.068;
    abDoor.position.set(
      Math.sin(ang) * rMount,
      Math.cos(ang) * rMount,
      -0.65
    );
    abDoor.rotation.z = -ang;

    // Petal door plate
    const doorGeo = new THREE.BoxGeometry(0.038, 0.005, 0.075);
    doorGeo.translate(0, 0, -0.0375);
    const doorMesh = new THREE.Mesh(doorGeo, airframeCamoMat);
    abDoor.add(doorMesh);

    // Inner actuator cylinder
    const actGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.035, 8);
    const actMesh = new THREE.Mesh(actGeo, steelStrutMat);
    actMesh.position.set(0, -0.01, -0.035);
    abDoor.add(actMesh);

    airbrakeDoors.push(abDoor);
    tailGroup.add(abDoor);
  }

  airframeGroup.add(tailGroup);

  // ==========================================
  // 8. R-29 / R-35 AFTERBURNING TURBOJET NOZZLE (17)
  // ==========================================
  const nozzleGroup = new THREE.Group();
  nozzleGroup.name = 'EngineNozzleAssembly_17';

  // Outer Shroud at z = -0.815
  const nozzleGeo = new THREE.CylinderGeometry(0.060, 0.052, 0.075, 24);
  nozzleGeo.rotateX(Math.PI / 2);
  const nozzleMesh = new THREE.Mesh(nozzleGeo, darkMetalMat);
  nozzleMesh.position.set(0, 0.0, -0.815);
  nozzleGroup.add(nozzleMesh);

  // 24 Individual Overlapping Titanium Petals (17)
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const petalGeo = new THREE.BoxGeometry(0.008, 0.005, 0.072);
    const petalMesh = new THREE.Mesh(petalGeo, titaniumNozzleMat);
    petalMesh.position.set(
      Math.cos(angle) * 0.056,
      Math.sin(angle) * 0.056,
      -0.815
    );
    petalMesh.rotation.z = angle + Math.PI / 2;
    nozzleGroup.add(petalMesh);
  }

  // Inner Afterburner Flame-Holder Turbine Ring
  const flameRingGeo = new THREE.TorusGeometry(0.034, 0.004, 8, 20);
  const flameRing = new THREE.Mesh(flameRingGeo, darkMetalMat);
  flameRing.position.set(0, 0, -0.83);
  nozzleGroup.add(flameRing);

  // Glowing Afterburner Flame Core at rear exit
  const abCoreGeo = new THREE.CylinderGeometry(0.044, 0.044, 0.012, 20);
  abCoreGeo.rotateX(Math.PI / 2);
  const abCoreMesh = new THREE.Mesh(abCoreGeo, afterburnerGlowMat);
  abCoreMesh.position.set(0, 0.0, -0.85);
  nozzleGroup.add(abCoreMesh);

  airframeGroup.add(nozzleGroup);

  // ==========================================
  // 9. VENTRAL GSH-23L TWIN-BARREL 23MM CANNON POD (47, 54)
  // ==========================================
  const cannonGroup = new THREE.Group();
  cannonGroup.name = 'GSh23L_CannonPod_47_54';

  // Conformal Ventral Gun Pod Belly
  const podGeo = new THREE.BoxGeometry(0.048, 0.034, 0.22);
  const podMesh = new THREE.Mesh(podGeo, airframeCamoMat);
  podMesh.position.set(0, -0.078, 0.06);
  cannonGroup.add(podMesh);

  // Twin Rifled Barrels extending forward
  for (const sx of [-0.010, 0.010]) {
    const barrelGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.12, 10);
    barrelGeo.rotateX(Math.PI / 2);
    const barrelMesh = new THREE.Mesh(barrelGeo, darkMetalMat);
    barrelMesh.position.set(sx, -0.078, 0.21);
    cannonGroup.add(barrelMesh);

    // Muzzle Flash Suppressor
    const muzzleGeo = new THREE.CylinderGeometry(0.0048, 0.0035, 0.02, 10);
    muzzleGeo.rotateX(Math.PI / 2);
    const muzzleMesh = new THREE.Mesh(muzzleGeo, darkMetalMat);
    muzzleMesh.position.set(sx, -0.078, 0.275);
    cannonGroup.add(muzzleMesh);
  }

  // Spent Shell Ejection Port
  const chutePortGeo = new THREE.BoxGeometry(0.022, 0.006, 0.045);
  const chutePort = new THREE.Mesh(chutePortGeo, darkMetalMat);
  chutePort.position.set(0, -0.096, 0.04);
  cannonGroup.add(chutePort);

  airframeGroup.add(cannonGroup);

  // ==========================================
  // 10. TRICYCLE LANDING GEAR (35-38, 41-43, E-E, Ж-Ж)
  // ==========================================
  const gearGroup = new THREE.Group();
  gearGroup.name = 'LandingGearSystem';

  // --- A. Twin-Wheel Nose Gear (42, 43) at z = +0.37 ---
  const noseStrutGeo = new THREE.CylinderGeometry(0.007, 0.006, 0.17, 12);
  const noseStrut = new THREE.Mesh(noseStrutGeo, steelStrutMat);
  noseStrut.position.set(0, -0.135, 0.37);
  noseStrut.rotation.x = -0.08;
  gearGroup.add(noseStrut);

  // Torque Scissors Link
  const scissorsGeo = new THREE.BoxGeometry(0.006, 0.045, 0.012);
  const scissorsMesh = new THREE.Mesh(scissorsGeo, steelStrutMat);
  scissorsMesh.position.set(0, -0.165, 0.385);
  scissorsMesh.rotation.x = 0.5;
  gearGroup.add(scissorsMesh);

  // Landing & Taxi Spotlight
  const taxiLightGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.008, 12);
  taxiLightGeo.rotateX(Math.PI / 2);
  const taxiLight = new THREE.Mesh(taxiLightGeo, steelStrutMat);
  taxiLight.position.set(0, -0.115, 0.385);
  gearGroup.add(taxiLight);

  // Twin KT-152 Nose Wheels (42) touching ground at y = -fuseY
  const noseWheelRadius = 0.025;
  for (const sign of [-1, 1]) {
    const nwGeo = new THREE.CylinderGeometry(noseWheelRadius, noseWheelRadius, 0.012, 20);
    nwGeo.rotateZ(Math.PI / 2);
    const nwMesh = new THREE.Mesh(nwGeo, tireRubberMat);
    nwMesh.position.set(sign * 0.014, -fuseY + noseWheelRadius, 0.362);
    nwMesh.castShadow = true;
    gearGroup.add(nwMesh);

    const hubGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.014, 14);
    hubGeo.rotateZ(Math.PI / 2);
    const hubMesh = new THREE.Mesh(hubGeo, steelStrutMat);
    hubMesh.position.copy(nwMesh.position);
    gearGroup.add(hubMesh);
  }

  // Wrap-around Mudguard / Spray Deflector Shield (42)
  const mudguardGeo = new THREE.BoxGeometry(0.038, 0.028, 0.016);
  const mudguard = new THREE.Mesh(mudguardGeo, airframeCamoMat);
  mudguard.position.set(0, -fuseY + 0.030, 0.342);
  gearGroup.add(mudguard);

  // Nose Gear Bay Doors (41)
  for (const sign of [-1, 1]) {
    const ndoorGeo = new THREE.BoxGeometry(0.004, 0.055, 0.12);
    const ndoorMesh = new THREE.Mesh(ndoorGeo, airframeLightMat);
    ndoorMesh.position.set(sign * 0.026, -0.082, 0.38);
    ndoorMesh.rotation.z = sign * 0.35;
    gearGroup.add(ndoorMesh);
  }

  // --- B. Articulated Levered Main Landing Gear (35-38, E-E, Ж-Ж) at z = -0.15 ---
  const mainWheelRadius = 0.042;
  for (const sign of [-1, 1]) {
    // Heavy Diagonal Main Trunnion Strut (35)
    const mainStrutGeo = new THREE.CylinderGeometry(0.011, 0.009, 0.20, 14);
    const mainStrut = new THREE.Mesh(mainStrutGeo, steelStrutMat);
    mainStrut.position.set(sign * 0.102, -0.13, -0.15);
    mainStrut.rotation.z = sign * 0.38;
    gearGroup.add(mainStrut);

    // Trailing-Link Shock Absorber Arm (37)
    const linkGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.12, 12);
    const linkMesh = new THREE.Mesh(linkGeo, steelStrutMat);
    linkMesh.position.set(sign * 0.082, -0.115, -0.11);
    linkMesh.rotation.x = 0.55;
    linkMesh.rotation.z = sign * 0.25;
    gearGroup.add(linkMesh);

    // Massive KT-150D Brake Wheel (35)
    const mwGeo = new THREE.CylinderGeometry(mainWheelRadius, mainWheelRadius, 0.028, 24);
    mwGeo.rotateZ(Math.PI / 2);
    const mwMesh = new THREE.Mesh(mwGeo, tireRubberMat);
    mwMesh.position.set(sign * 0.145, -fuseY + mainWheelRadius, -0.155);
    mwMesh.castShadow = true;
    gearGroup.add(mwMesh);

    // Wheel Alloy Rim & Brake Drum
    const mHubGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.030, 16);
    mHubGeo.rotateZ(Math.PI / 2);
    const mHubMesh = new THREE.Mesh(mHubGeo, steelStrutMat);
    mHubMesh.position.copy(mwMesh.position);
    gearGroup.add(mHubMesh);

    // Multi-panel Main Gear Doors (57, E-E)
    const doorGeo = new THREE.BoxGeometry(0.006, 0.085, 0.14);
    const doorMesh = new THREE.Mesh(doorGeo, airframeLightMat);
    doorMesh.position.set(sign * 0.115, -0.10, -0.15);
    doorMesh.rotation.z = sign * 0.28;
    gearGroup.add(doorMesh);
  }

  airframeGroup.add(gearGroup);

  // ==========================================
  // 11. EXTERNAL STORES: PTB-800 TANK (1, 46), R-23 (24, 25) & R-60 MISSILES (2)
  // ==========================================
  const ordnanceGroup = new THREE.Group();
  ordnanceGroup.name = 'OrdnanceAndWeapons';

  // Centerline PTB-800 Fuel Drop Tank (1, 46) with fins and pylon
  const tankGroup = new THREE.Group();

  const tankPylonGeo = new THREE.BoxGeometry(0.012, 0.028, 0.22);
  const tankPylon = new THREE.Mesh(tankPylonGeo, darkMetalMat);
  tankPylon.position.set(0, 0.024, 0);
  tankGroup.add(tankPylon);

  const tankBodyGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.26, 18);
  tankBodyGeo.rotateX(Math.PI / 2);
  const tankBody = new THREE.Mesh(tankBodyGeo, airframeLightMat);
  tankGroup.add(tankBody);

  const tankNoseGeo = new THREE.ConeGeometry(0.024, 0.10, 18);
  tankNoseGeo.rotateX(Math.PI / 2);
  const tankNose = new THREE.Mesh(tankNoseGeo, airframeLightMat);
  tankNose.position.z = 0.18;
  tankGroup.add(tankNose);

  const tankTailGeo = new THREE.ConeGeometry(0.024, 0.10, 18);
  tankTailGeo.rotateX(-Math.PI / 2);
  const tankTail = new THREE.Mesh(tankTailGeo, airframeLightMat);
  tankTail.position.z = -0.18;
  tankGroup.add(tankTail);

  // Stabilizing Tail Fins (1, 46)
  for (const rotZ of [0, Math.PI / 2]) {
    const tFinGeo = new THREE.BoxGeometry(0.075, 0.002, 0.055);
    tFinGeo.rotateZ(rotZ);
    const tFinMesh = new THREE.Mesh(tFinGeo, airframeCamoMat);
    tFinMesh.position.z = -0.21;
    tankGroup.add(tFinMesh);
  }

  tankGroup.position.set(0, -0.115, 0.04);
  ordnanceGroup.add(tankGroup);

  // Pair of R-23 Missiles (R-23R Radar 24 on starboard, R-23T IR 25 on port) on BD-UMK pylons
  for (const sign of [-1, 1]) {
    const isRadar = sign === 1;
    const mGroup = new THREE.Group();
    mGroup.name = isRadar ? 'R23R_RadarMissile_24' : 'R23T_IRMissile_25';

    // Pylon (23)
    const pylonGeo = new THREE.BoxGeometry(0.010, 0.036, 0.15);
    const pylonMesh = new THREE.Mesh(pylonGeo, airframeCamoMat);
    pylonMesh.position.set(0, 0.022, 0);
    mGroup.add(pylonMesh);

    // Missile Body
    const mBodyGeo = new THREE.CylinderGeometry(0.010, 0.010, 0.32, 14);
    mBodyGeo.rotateX(Math.PI / 2);
    const mBody = new THREE.Mesh(mBodyGeo, missileWhiteMat);
    mGroup.add(mBody);

    // Radome Head: Pointed cone for R-23R (24), rounded infrared dome for R-23T (25)
    if (isRadar) {
      const mTipGeo = new THREE.ConeGeometry(0.010, 0.045, 14);
      mTipGeo.rotateX(Math.PI / 2);
      const mTip = new THREE.Mesh(mTipGeo, radomeDarkMat);
      mTip.position.z = 0.182;
      mGroup.add(mTip);
    } else {
      const mDomeGeo = new THREE.SphereGeometry(0.010, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
      mDomeGeo.rotateX(-Math.PI / 2);
      const mDome = new THREE.Mesh(mDomeGeo, canopyGlassMat);
      mDome.position.z = 0.160;
      mGroup.add(mDome);
    }

    // Delta Wings & Aft Steering Fins
    for (const rotZ of [0, Math.PI / 2]) {
      const finGeo = new THREE.BoxGeometry(0.064, 0.003, 0.060);
      finGeo.rotateZ(rotZ);
      const finMesh = new THREE.Mesh(finGeo, missileWhiteMat);
      finMesh.position.z = -0.02;
      mGroup.add(finMesh);

      const tailFinGeo = new THREE.BoxGeometry(0.044, 0.003, 0.030);
      tailFinGeo.rotateZ(rotZ + Math.PI / 4);
      const tailFin = new THREE.Mesh(tailFinGeo, darkMetalMat);
      tailFin.position.z = -0.14;
      mGroup.add(tailFin);
    }

    mGroup.position.set(sign * 0.21, 0.005, 0.04);
    ordnanceGroup.add(mGroup);
  }

  // Dual APU-60-2 Rails with R-60 Dogfight Missiles (2) under forward fuselage
  for (const sign of [-1, 1]) {
    const r60Group = new THREE.Group();
    r60Group.name = 'R60_DogfightMissile_2';

    const r60Body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.20, 10),
      missileWhiteMat
    );
    r60Body.geometry.rotateX(Math.PI / 2);
    r60Group.add(r60Body);

    const r60Tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.006, 0.025, 10),
      radomeDarkMat
    );
    r60Tip.geometry.rotateX(Math.PI / 2);
    r60Tip.position.z = 0.112;
    r60Group.add(r60Tip);

    // Forward Canard Vanes & Aft Rollerons
    for (const rotZ of [0, Math.PI / 2]) {
      const canardGeo = new THREE.BoxGeometry(0.022, 0.0016, 0.016);
      canardGeo.rotateZ(rotZ);
      const canard = new THREE.Mesh(canardGeo, darkMetalMat);
      canard.position.z = 0.08;
      r60Group.add(canard);

      const aFinGeo = new THREE.BoxGeometry(0.032, 0.0016, 0.028);
      aFinGeo.rotateZ(rotZ + Math.PI / 4);
      const aFin = new THREE.Mesh(aFinGeo, missileWhiteMat);
      aFin.position.z = -0.08;
      r60Group.add(aFin);
    }

    r60Group.position.set(sign * 0.096, -0.065, 0.22);
    ordnanceGroup.add(r60Group);
  }

  airframeGroup.add(ordnanceGroup);

  // ==========================================
  // 12. INTERACTIVE CONTROLS & ANIMATION TICK
  // ==========================================
  const setWingSweep = (sweepFactor: number) => {
    // 0 = 16° extended, 1 = 72° fully swept
    const clamped = Math.max(0, Math.min(1, sweepFactor));
    const sweepAngle = 0.04 + clamped * 0.44;
    leftWingPivot.rotation.y = sweepAngle;
    rightWingPivot.rotation.y = -sweepAngle;
  };

  const setAirbrakes = (deployFactor: number) => {
    // 0 = closed, 1 = deployed 45°
    const clamped = Math.max(0, Math.min(1, deployFactor));
    const angle = clamped * 0.78;
    for (const ab of airbrakeDoors) {
      ab.children[0].rotation.x = angle;
    }
  };

  const setVentralFin = (deployFactor: number) => {
    // 0 = folded 90° to starboard (gear down on runway), 1 = vertical (flight)
    const clamped = Math.max(0, Math.min(1, deployFactor));
    ventralPivot.rotation.z = (1 - clamped) * (Math.PI / 2);
  };

  const tick = (_delta: number, elapsed: number) => {
    // Subtle variable-sweep wing breathing animation
    const sweepWave = (Math.sin(elapsed * 0.8) + 1) * 0.5;
    setWingSweep(sweepWave);

    // Subtle afterburner flame intensity pulse
    afterburnerGlowMat.emissiveIntensity = 1.6 + Math.sin(elapsed * 24) * 0.6;
  };

  return {
    root,
    materials,
    pivots: {
      airframe: airframeGroup,
      leftWing: leftWingPivot,
      rightWing: rightWingPivot,
      tail: tailGroup,
      ventralFin: ventralPivot,
      landingGear: gearGroup,
      nose: noseGroup,
      cockpit: cockpitGroup,
    },
    controls: {
      setWingSweep,
      setAirbrakes,
      setVentralFin,
    },
    tick,
  };
}
