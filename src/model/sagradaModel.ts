import * as THREE from 'three';

/**
 * Super-Detailed Procedural 3D Reconstruction of Antoni Gaudí's Basílica de la Sagrada Família
 * Built 100% from 0 to faithfully replicate the architectural pen-and-ink line drawing in sagrada.png.
 *
 * Strict Fidelity to sagrada.png:
 *  1. Authentic warm sandstone & architectural sepia shadow line-art palette (No plastic/garish colors).
 *  2. Monumental entrance narthex portico with 6 massive leaning parabolic tree-buttress pillars.
 *  3. Five parabolic arch openings with deep 3-tier layered archivolts framing the portal.
 *  4. Recessed triple portals (Faith, Hope, Charity) with double doors, central stone parteluz,
 *     and sculpted gothic tympanum filigree tracery.
 *  5. Stepped cascade of 18 vertical stone louvers/pinnacles along the sloping narthex pediment.
 *  6. The Great Rose Window (Rosassa) with 12-spoke floral wheel tracery and pointed surround.
 *  7. Upper pediment gable with colonnade of 6 lancet windows and towering peak pinnacle.
 *  8. Four tightly clustered parabolic bell towers (Campanars) with 8 vertical fluted ribs,
 *     18 tiers of deep acoustic sound louvers, high gallery bridges, and multi-lobed floral stone finials.
 *  9. Ascending pyramid of central spires: intermediate triangular gables, 4 Evangelist towers,
 *     Tower of the Virgin Mary with 12-pointed morning star, and the colossal Tower of Jesus Christ.
 * 10. Monumental Budded / Trefoil Latin Cross (Cross Bottony / Creu de quatre braços) crowning the summit
 *     with three rounded lobes on each arm and central halo ring.
 * 11. Left side aisle with 4 bays of dual lancet windows, triangular gables with rosettes,
 *     and 5 soaring stone buttress pinnacles.
 * 12. Projecting East Transept portal with gothic arch, double doors, and secondary rose window.
 * 13. Organic network of curved flying buttresses (arcbotants) with pierced circular tracery.
 * 14. Barcelona Eixample chamfered city block with paved entrance avenue, curved retaining wall,
 *     and dense stippled street trees and garden shrubs.
 */

export interface SagradaModelControls {
  setSunAngle: (angleRad: number) => void;
  setShadowIntensity: (val: number) => void;
}

export interface SagradaModelInstance {
  root: THREE.Group;
  materials: Record<string, THREE.Material>;
  pivots: Record<string, THREE.Object3D>;
  controls: SagradaModelControls;
  tick: (delta: number, elapsed: number) => void;
}

export function createSagradaModel(): SagradaModelInstance {
  const root = new THREE.Group();
  root.name = 'SagradaFamilia_FaithfulDrawing';

  // ========================================================
  // 1. AUTHENTIC ARCHITECTURAL STONE MATERIAL PALETTE
  // Matching the pen-and-ink drawing on warm limestone paper
  // ========================================================
  const stoneBaseMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d4caa8'),
    roughness: 0.85,
    metalness: 0.04,
  });

  const stoneLightMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ebe4d3'),
    roughness: 0.72,
    metalness: 0.03,
  });

  const stoneDarkMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#7a6e56'),
    roughness: 0.88,
    metalness: 0.05,
  });

  const stoneVoidMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#231d17'),
    roughness: 0.98,
    metalness: 0.02,
  });

  const crossStoneMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fdfbf7'),
    roughness: 0.45,
    metalness: 0.06,
  });

  const foliageMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#4a5e44'),
    roughness: 0.92,
    metalness: 0.02,
  });

  const trunkMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#46382a'),
    roughness: 0.90,
    metalness: 0.02,
  });

  const pavementMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#c2b9a1'),
    roughness: 0.86,
    metalness: 0.04,
  });

  const curbStoneMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#8e836d'),
    roughness: 0.88,
    metalness: 0.06,
  });

  const streetAsphaltMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#38342c'),
    roughness: 0.92,
    metalness: 0.03,
  });

  const gothicGlassMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e0d5be'),
    roughness: 0.40,
    metalness: 0.15,
    side: THREE.DoubleSide,
  });

  const woodDoorMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#3b2b1d'),
    roughness: 0.80,
    metalness: 0.10,
  });

  const cathedral = new THREE.Group();
  cathedral.name = 'BasilicaStructure';
  root.add(cathedral);

  // ========================================================
  // 2. URBAN BASE: BARCELONA EIXAMPLE CHAMFERED CITY BLOCK
  // ========================================================
  const groundGroup = new THREE.Group();
  groundGroup.name = 'EixampleCityBlock';

  // Octagonal chamfered plinth shape
  const blockShape = new THREE.Shape();
  const bSize = 1.60;
  const bChamfer = 0.42;
  blockShape.moveTo(-bSize + bChamfer, -bSize);
  blockShape.lineTo( bSize - bChamfer, -bSize);
  blockShape.lineTo( bSize, -bSize + bChamfer);
  blockShape.lineTo( bSize,  bSize - bChamfer);
  blockShape.lineTo( bSize - bChamfer,  bSize);
  blockShape.lineTo(-bSize + bChamfer,  bSize);
  blockShape.lineTo(-bSize,  bSize - bChamfer);
  blockShape.lineTo(-bSize, -bSize + bChamfer);
  blockShape.closePath();

  // Street roadway perimeter
  const streetGeo = new THREE.ExtrudeGeometry(blockShape, { depth: 0.025, bevelEnabled: false });
  streetGeo.rotateX(Math.PI / 2);
  const streetMesh = new THREE.Mesh(streetGeo, streetAsphaltMat);
  streetMesh.position.y = -0.012;
  streetMesh.receiveShadow = true;
  groundGroup.add(streetMesh);

  // Elevated sidewalk plinth
  const curbShape = new THREE.Shape();
  const cSize = 1.45;
  const cChamfer = 0.38;
  curbShape.moveTo(-cSize + cChamfer, -cSize);
  curbShape.lineTo( cSize - cChamfer, -cSize);
  curbShape.lineTo( cSize, -cSize + cChamfer);
  curbShape.lineTo( cSize,  cSize - cChamfer);
  curbShape.lineTo( cSize - cChamfer,  cSize);
  curbShape.lineTo(-cSize + cChamfer,  cSize);
  curbShape.lineTo(-cSize,  cSize - cChamfer);
  curbShape.lineTo(-cSize, -cSize + cChamfer);
  curbShape.closePath();

  const curbGeo = new THREE.ExtrudeGeometry(curbShape, {
    depth: 0.028,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.006,
    bevelThickness: 0.006,
  });
  curbGeo.rotateX(Math.PI / 2);
  const curbMesh = new THREE.Mesh(curbGeo, curbStoneMat);
  curbMesh.position.y = 0.016;
  curbMesh.receiveShadow = true;
  groundGroup.add(curbMesh);

  // Church precinct terrace (paved stone)
  const terraceGeo = new THREE.CylinderGeometry(1.05, 1.10, 0.022, 24);
  const terraceMesh = new THREE.Mesh(terraceGeo, pavementMat);
  terraceMesh.position.y = 0.028;
  terraceMesh.receiveShadow = true;
  groundGroup.add(terraceMesh);

  // Low stone retaining wall surrounding the church grounds
  const wallRadius = 0.88;
  const wallGroup = new THREE.Group();
  for (let ai = 0; ai < 32; ai++) {
    const angle = (ai / 32) * Math.PI * 2;
    // Leave front opening for entrance plaza (angle between 0.35*PI and 0.65*PI)
    if (angle > Math.PI * 0.36 && angle < Math.PI * 0.64) continue;
    const wx = Math.cos(angle) * wallRadius;
    const wz = Math.sin(angle) * wallRadius;
    const wSegment = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.038, 0.022),
      stoneDarkMat
    );
    wSegment.position.set(wx, 0.048, wz);
    wSegment.rotation.y = -angle + Math.PI / 2;
    wSegment.castShadow = true;
    wallGroup.add(wSegment);

    // Stone coping cap
    const coping = new THREE.Mesh(
      new THREE.BoxGeometry(0.19, 0.008, 0.028),
      stoneLightMat
    );
    coping.position.set(wx, 0.071, wz);
    coping.rotation.y = -angle + Math.PI / 2;
    wallGroup.add(coping);
  }
  groundGroup.add(wallGroup);

  // Grand Entrance Steps in front of the narthex
  for (let si = 0; si < 6; si++) {
    const stepW = 0.44 + si * 0.04;
    const stepL = 0.045;
    const stepMesh = new THREE.Mesh(
      new THREE.BoxGeometry(stepW, 0.007, stepL),
      stoneLightMat
    );
    stepMesh.position.set(0, 0.028 + si * 0.007, 0.68 - si * 0.040);
    stepMesh.receiveShadow = true;
    groundGroup.add(stepMesh);
  }

  // Dense stippled street trees and garden shrubs lining the sidewalk and gardens
  const treePositions = [
    // Outer street sidewalk perimeter
    { x: -1.25, z:  0.85, r: 0.070, h: 0.16 },
    { x: -0.95, z:  1.15, r: 0.075, h: 0.18 },
    { x: -0.55, z:  1.32, r: 0.072, h: 0.17 },
    { x:  0.55, z:  1.32, r: 0.072, h: 0.17 },
    { x:  0.95, z:  1.15, r: 0.075, h: 0.18 },
    { x:  1.25, z:  0.85, r: 0.070, h: 0.16 },
    { x: -1.35, z:  0.30, r: 0.068, h: 0.16 },
    { x: -1.35, z: -0.30, r: 0.070, h: 0.16 },
    { x: -1.35, z: -0.85, r: 0.072, h: 0.17 },
    { x:  1.35, z:  0.30, r: 0.068, h: 0.16 },
    { x:  1.35, z: -0.30, r: 0.070, h: 0.16 },
    { x:  1.35, z: -0.85, r: 0.072, h: 0.17 },
    { x: -0.95, z: -1.25, r: 0.072, h: 0.17 },
    { x:  0.00, z: -1.38, r: 0.075, h: 0.18 },
    { x:  0.95, z: -1.25, r: 0.072, h: 0.17 },

    // Church Garden Terrace shrubs
    { x: -0.42, z: 0.65, r: 0.055, h: 0.12 },
    { x: -0.58, z: 0.58, r: 0.060, h: 0.13 },
    { x: -0.68, z: 0.44, r: 0.058, h: 0.12 },
    { x: -0.74, z: 0.26, r: 0.062, h: 0.13 },
    { x:  0.42, z: 0.65, r: 0.055, h: 0.12 },
    { x:  0.58, z: 0.58, r: 0.060, h: 0.13 },
    { x:  0.68, z: 0.44, r: 0.058, h: 0.12 },
    { x:  0.74, z: 0.26, r: 0.062, h: 0.13 },
    { x: -0.55, z:  0.05, r: 0.055, h: 0.12 },
    { x: -0.52, z: -0.22, r: 0.058, h: 0.13 },
    { x: -0.48, z: -0.48, r: 0.056, h: 0.12 },
    { x:  0.55, z:  0.05, r: 0.055, h: 0.12 },
    { x:  0.52, z: -0.22, r: 0.058, h: 0.13 },
    { x:  0.48, z: -0.48, r: 0.056, h: 0.12 },
  ];

  for (const tp of treePositions) {
    const tg = new THREE.Group();
    tg.position.set(tp.x, 0.032, tp.z);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.012, tp.h * 0.48, 6),
      trunkMat
    );
    trunk.position.y = tp.h * 0.24;
    trunk.castShadow = true;
    tg.add(trunk);

    const crown = new THREE.Mesh(
      new THREE.IcosahedronGeometry(tp.r, 1),
      foliageMat
    );
    crown.position.y = tp.h * 0.68;
    crown.scale.set(1.15, 0.95, 1.10);
    crown.castShadow = true;
    tg.add(crown);

    const subCrown = new THREE.Mesh(
      new THREE.IcosahedronGeometry(tp.r * 0.72, 1),
      foliageMat
    );
    subCrown.position.set(tp.r * 0.28, tp.h * 0.82, -tp.r * 0.20);
    subCrown.scale.set(0.9, 1.1, 0.9);
    tg.add(subCrown);

    groundGroup.add(tg);
  }

  cathedral.add(groundGroup);

  // ========================================================
  // 3. THE GRAND ENTRANCE PORTICO & NARTHEX (FACING +Z)
  // ========================================================
  const narthexGroup = new THREE.Group();
  narthexGroup.name = 'GrandEntranceNarthex';
  narthexGroup.position.set(0, 0.038, 0.36);

  // ----------------------------------------------------
  // A. SIX MASSIVE INCLINED TREE-BUTTRESS PILLARS (\ / \ / \ /)
  // ----------------------------------------------------
  const pillarConfigs = [
    [-0.14, 0.00, 0.10, -0.022, 0.36, 0.02, 0.020, 0.013],
    [ 0.14, 0.00, 0.10,  0.022, 0.36, 0.02, 0.020, 0.013],
    [-0.24, 0.00, 0.07, -0.115, 0.32, 0.00, 0.018, 0.012],
    [ 0.24, 0.00, 0.07,  0.115, 0.32, 0.00, 0.018, 0.012],
    [-0.32, 0.00, 0.03, -0.210, 0.26, -0.02, 0.016, 0.011],
    [ 0.32, 0.00, 0.03,  0.210, 0.26, -0.02, 0.016, 0.011],
  ];

  for (const pc of pillarConfigs) {
    const pStart = new THREE.Vector3(pc[0], pc[1], pc[2]);
    const pEnd = new THREE.Vector3(pc[3], pc[4], pc[5]);
    const dir = new THREE.Vector3().subVectors(pEnd, pStart);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);

    const pGeo = new THREE.CylinderGeometry(pc[7], pc[6], len, 7);
    const pMesh = new THREE.Mesh(pGeo, stoneBaseMat);
    pMesh.position.copy(mid);
    pMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    pMesh.castShadow = true;
    narthexGroup.add(pMesh);

    for (const knotT of [0.35, 0.70]) {
      const knotPos = new THREE.Vector3().lerpVectors(pStart, pEnd, knotT);
      const knot = new THREE.Mesh(
        new THREE.CylinderGeometry(pc[7] * 1.35, pc[6] * 1.25, 0.018, 7),
        stoneLightMat
      );
      knot.position.copy(knotPos);
      knot.quaternion.copy(pMesh.quaternion);
      narthexGroup.add(knot);
    }
  }

  // ----------------------------------------------------
  // B. THE FIVE PARABOLIC FRONT ARCHES (3-TIER LAYERED ARCHIVOLTS)
  // ----------------------------------------------------
  // Tier 1 (Outer Grand Archivolt)
  const mainArchShape = new THREE.Shape();
  mainArchShape.moveTo(-0.145, 0);
  mainArchShape.lineTo(-0.145, 0.16);
  mainArchShape.quadraticCurveTo(-0.085, 0.38, 0, 0.445);
  mainArchShape.quadraticCurveTo(0.085, 0.38, 0.145, 0.16);
  mainArchShape.lineTo(0.145, 0);

  const mainArchHole = new THREE.Path();
  mainArchHole.moveTo(-0.115, 0);
  mainArchHole.lineTo(-0.115, 0.15);
  mainArchHole.quadraticCurveTo(-0.065, 0.34, 0, 0.395);
  mainArchHole.quadraticCurveTo(0.065, 0.34, 0.115, 0.15);
  mainArchHole.lineTo(0.115, 0);
  mainArchShape.holes.push(mainArchHole);

  const mainArchGeo = new THREE.ExtrudeGeometry(mainArchShape, {
    depth: 0.046,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.006,
    bevelThickness: 0.006,
  });
  mainArchGeo.translate(0, 0, -0.046);
  const mainArchMesh = new THREE.Mesh(mainArchGeo, stoneLightMat);
  mainArchMesh.position.set(0, 0, 0.085);
  mainArchMesh.castShadow = true;
  narthexGroup.add(mainArchMesh);

  // Tier 2 (Inner Moulded Archivolt)
  const innerArchShape = new THREE.Shape();
  innerArchShape.moveTo(-0.115, 0);
  innerArchShape.lineTo(-0.115, 0.15);
  innerArchShape.quadraticCurveTo(-0.065, 0.34, 0, 0.395);
  innerArchShape.quadraticCurveTo(0.065, 0.34, 0.115, 0.15);
  innerArchShape.lineTo(0.115, 0);

  const innerArchHole = new THREE.Path();
  innerArchHole.moveTo(-0.092, 0);
  innerArchHole.lineTo(-0.092, 0.13);
  innerArchHole.quadraticCurveTo(-0.05, 0.30, 0, 0.35);
  innerArchHole.quadraticCurveTo(0.05, 0.30, 0.092, 0.13);
  innerArchHole.lineTo(0.092, 0);
  innerArchShape.holes.push(innerArchHole);

  const innerArchGeo = new THREE.ExtrudeGeometry(innerArchShape, {
    depth: 0.028,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.004,
    bevelThickness: 0.004,
  });
  innerArchGeo.translate(0, 0, -0.028);
  const innerArchMesh = new THREE.Mesh(innerArchGeo, stoneDarkMat);
  innerArchMesh.position.set(0, 0, 0.055);
  narthexGroup.add(innerArchMesh);

  // Left & Right Flanking Parabolic Arches
  for (const sSign of [-1, 1]) {
    const sArchShape = new THREE.Shape();
    sArchShape.moveTo(-0.07, 0);
    sArchShape.lineTo(-0.07, 0.12);
    sArchShape.quadraticCurveTo(-0.04, 0.26, 0, 0.31);
    sArchShape.quadraticCurveTo(0.04, 0.26, 0.07, 0.12);
    sArchShape.lineTo(0.07, 0);

    const sHole = new THREE.Path();
    sHole.moveTo(-0.05, 0);
    sHole.lineTo(-0.05, 0.11);
    sHole.quadraticCurveTo(-0.03, 0.23, 0, 0.27);
    sHole.quadraticCurveTo(0.03, 0.23, 0.05, 0.11);
    sHole.lineTo(0.05, 0);
    sArchShape.holes.push(sHole);

    const sGeo = new THREE.ExtrudeGeometry(sArchShape, {
      depth: 0.032,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.004,
      bevelThickness: 0.004,
    });
    sGeo.translate(0, 0, -0.032);
    const sMesh = new THREE.Mesh(sGeo, stoneBaseMat);
    sMesh.position.set(sSign * 0.185, 0, 0.05);
    sMesh.castShadow = true;
    narthexGroup.add(sMesh);
  }

  // ----------------------------------------------------
  // C. RECESSED PORTAL WALL (THE 3 THEOLOGICAL PORTALS)
  // ----------------------------------------------------
  const recessedPortalWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.34, 0.024),
    stoneDarkMat
  );
  recessedPortalWall.position.set(0, 0.17, 0.01);
  narthexGroup.add(recessedPortalWall);

  // Grand Central Double Doors
  const leftDoor = new THREE.Mesh(
    new THREE.BoxGeometry(0.042, 0.14, 0.012),
    woodDoorMat
  );
  leftDoor.position.set(-0.026, 0.07, 0.022);
  narthexGroup.add(leftDoor);

  const rightDoor = new THREE.Mesh(
    new THREE.BoxGeometry(0.042, 0.14, 0.012),
    woodDoorMat
  );
  rightDoor.position.set(0.026, 0.07, 0.022);
  narthexGroup.add(rightDoor);

  // Central Stone Parteluz (Trumeau Pier)
  const parteluz = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.16, 0.024),
    stoneLightMat
  );
  parteluz.position.set(0, 0.08, 0.026);
  narthexGroup.add(parteluz);

  // Sculpted Gothic Tympanum Filigree above the doors
  const tympanumMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.075, 0.14, 6),
    stoneLightMat
  );
  tympanumMesh.position.set(0, 0.22, 0.022);
  tympanumMesh.scale.set(1.2, 1, 0.35);
  narthexGroup.add(tympanumMesh);

  // 4 Flanking Lancet Niche Openings inside the Tympanum
  for (let ni = 0; ni < 4; ni++) {
    const nx = (ni - 1.5) * 0.028;
    const nH = 0.065 - Math.abs(ni - 1.5) * 0.018;
    const niche = new THREE.Mesh(
      new THREE.BoxGeometry(0.009, nH, 0.010),
      stoneVoidMat
    );
    niche.position.set(nx, 0.18 + nH / 2, 0.026);
    narthexGroup.add(niche);
  }

  // Left & Right Flanking Portals
  for (const sSign of [-1, 1]) {
    const sDoor = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.12, 0.012),
      woodDoorMat
    );
    sDoor.position.set(sSign * 0.185, 0.06, 0.022);
    narthexGroup.add(sDoor);

    const sTymp = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.042, 0.09, 5),
      stoneLightMat
    );
    sTymp.position.set(sSign * 0.185, 0.15, 0.022);
    sTymp.scale.set(1.2, 1, 0.35);
    narthexGroup.add(sTymp);
  }

  // ----------------------------------------------------
  // D. SLOPING CANOPY ROOF & CASCADE OF 18 VERTICAL LOUVERS
  // ----------------------------------------------------
  for (const sSign of [-1, 1]) {
    const rStart = new THREE.Vector3(0, 0.44, 0.05);
    const rEnd = new THREE.Vector3(sSign * 0.32, 0.22, 0.02);
    const rDir = new THREE.Vector3().subVectors(rEnd, rStart);
    const rLen = rDir.length();
    const rMid = new THREE.Vector3().addVectors(rStart, rEnd).multiplyScalar(0.5);

    const rBeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.028, rLen),
      stoneBaseMat
    );
    rBeam.position.copy(rMid);
    rBeam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), rDir.clone().normalize());
    rBeam.castShadow = true;
    narthexGroup.add(rBeam);

    const horn = new THREE.Mesh(
      new THREE.ConeGeometry(0.012, 0.045, 5),
      stoneLightMat
    );
    horn.position.set(sSign * 0.33, 0.23, 0.02);
    horn.rotation.z = -sSign * (Math.PI / 3);
    narthexGroup.add(horn);
  }

  // Cascade of 18 Vertical Stone Louvers / Pinnacles
  for (let li = 0; li < 18; li++) {
    const t = (li - 8.5) / 8.5;
    const lx = t * 0.29;
    const lBaseY = 0.23 + (1 - Math.abs(t)) * 0.20;
    const lH = 0.040 + (1 - Math.abs(t)) * 0.14;

    const louver = new THREE.Mesh(
      new THREE.BoxGeometry(0.007, lH, 0.018),
      stoneLightMat
    );
    louver.position.set(lx, lBaseY + lH / 2, 0.035);
    louver.castShadow = true;
    narthexGroup.add(louver);

    const lGroove = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, lH * 0.88, 0.008),
      stoneVoidMat
    );
    lGroove.position.set(lx, lBaseY + lH / 2, 0.044);
    narthexGroup.add(lGroove);
  }

  // ----------------------------------------------------
  // E. THE GREAT ROSE WINDOW (ROSASSA) & UPPER PEDIMENT
  // ----------------------------------------------------
  const roseGroup = new THREE.Group();
  roseGroup.position.set(0, 0.52, 0.01);

  const roseHood = new THREE.Mesh(
    new THREE.TorusGeometry(0.065, 0.010, 8, 24, Math.PI),
    stoneBaseMat
  );
  roseHood.position.y = 0.010;
  roseGroup.add(roseHood);

  const roseRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.054, 0.008, 10, 32),
    stoneLightMat
  );
  roseGroup.add(roseRing);

  const roseGlass = new THREE.Mesh(
    new THREE.CircleGeometry(0.050, 24),
    gothicGlassMat
  );
  roseGlass.position.z = -0.002;
  roseGroup.add(roseGlass);

  for (let ri = 0; ri < 12; ri++) {
    const angle = (ri / 12) * Math.PI * 2;
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(0.0035, 0.050, 0.007),
      stoneLightMat
    );
    spoke.position.set(Math.cos(angle) * 0.025, Math.sin(angle) * 0.025, 0.002);
    spoke.rotation.z = angle + Math.PI / 2;
    roseGroup.add(spoke);

    const petal = new THREE.Mesh(
      new THREE.TorusGeometry(0.012, 0.0025, 6, 12),
      stoneLightMat
    );
    petal.position.set(Math.cos(angle) * 0.035, Math.sin(angle) * 0.035, 0.002);
    roseGroup.add(petal);
  }

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.008, 12),
    stoneDarkMat
  );
  hub.rotation.x = Math.PI / 2;
  roseGroup.add(hub);

  narthexGroup.add(roseGroup);

  // Upper Gable & 6 Lancet Windows
  const upperGableShape = new THREE.Shape();
  upperGableShape.moveTo(-0.16, 0.58);
  upperGableShape.lineTo(0.00, 0.72);
  upperGableShape.lineTo(0.16, 0.58);
  upperGableShape.closePath();

  const upperGableGeo = new THREE.ExtrudeGeometry(upperGableShape, { depth: 0.028, bevelEnabled: false });
  upperGableGeo.translate(0, 0, -0.014);
  const upperGableMesh = new THREE.Mesh(upperGableGeo, stoneBaseMat);
  upperGableMesh.position.set(0, 0, 0.00);
  narthexGroup.add(upperGableMesh);

  for (let wi = 0; wi < 6; wi++) {
    const wx = (wi - 2.5) * 0.034;
    const wH = 0.080 - Math.abs(wi - 2.5) * 0.018;
    const winSlot = new THREE.Mesh(
      new THREE.BoxGeometry(0.010, wH, 0.015),
      stoneVoidMat
    );
    winSlot.position.set(wx, 0.60 + wH / 2, 0.014);
    narthexGroup.add(winSlot);

    const winArch = new THREE.Mesh(
      new THREE.ConeGeometry(0.007, 0.016, 4),
      stoneLightMat
    );
    winArch.position.set(wx, 0.60 + wH + 0.006, 0.014);
    narthexGroup.add(winArch);
  }

  const peakPinnacle = new THREE.Mesh(
    new THREE.ConeGeometry(0.014, 0.085, 6),
    stoneLightMat
  );
  peakPinnacle.position.set(0, 0.76, 0.01);
  narthexGroup.add(peakPinnacle);

  for (const sSign of [-1, 1]) {
    const shPin = new THREE.Mesh(
      new THREE.ConeGeometry(0.012, 0.070, 6),
      stoneLightMat
    );
    shPin.position.set(sSign * 0.17, 0.64, 0.01);
    narthexGroup.add(shPin);
  }

  cathedral.add(narthexGroup);

  // ========================================================
  // 4. THE FOUR GREAT FAÇADE BELL TOWERS (CAMPANARS)
  // ========================================================
  const towersGroup = new THREE.Group();
  towersGroup.name = 'FacadeBellTowers';

  interface BellTowerSpec {
    x: number;
    z: number;
    totalH: number;
    baseR: number;
    topR: number;
    name: string;
  }

  const towerSpecs: BellTowerSpec[] = [
    { x: -0.115, z: 0.22, totalH: 1.40, baseR: 0.048, topR: 0.019, name: 'Campanar_InnerLeft' },
    { x:  0.115, z: 0.22, totalH: 1.40, baseR: 0.048, topR: 0.019, name: 'Campanar_InnerRight' },
    { x: -0.235, z: 0.18, totalH: 1.24, baseR: 0.044, topR: 0.017, name: 'Campanar_OuterLeft' },
    { x:  0.235, z: 0.18, totalH: 1.24, baseR: 0.044, topR: 0.017, name: 'Campanar_OuterRight' },
  ];

  for (const ts of towerSpecs) {
    const tg = new THREE.Group();
    tg.name = ts.name;
    tg.position.set(ts.x, 0.038, ts.z);

    // Stage 1: Lower Tower Base (y = 0 to 0.42)
    const baseH = 0.42;
    const baseMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(ts.baseR * 0.96, ts.baseR * 1.08, baseH, 8),
      stoneBaseMat
    );
    baseMesh.position.y = baseH / 2;
    baseMesh.castShadow = true;
    tg.add(baseMesh);

    for (let ai = 0; ai < 4; ai++) {
      const theta = (ai / 4) * Math.PI * 2 + Math.PI / 4;
      const bSlit = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 0.22, 0.014),
        stoneVoidMat
      );
      bSlit.position.set(Math.cos(theta) * (ts.baseR * 0.98), 0.24, Math.sin(theta) * (ts.baseR * 0.98));
      bSlit.rotation.y = theta;
      tg.add(bSlit);
    }

    // Stage 2: Parabolic Acoustic Louver Spindle (y = 0.42 to 0.96)
    const midH = 0.54;
    const numTiers = 18;
    const numRibs = 8;

    for (let ti = 0; ti < numTiers; ti++) {
      const tProg = ti / numTiers;
      const ty = baseH + tProg * midH;
      const curR = THREE.MathUtils.lerp(ts.baseR * 0.96, ts.topR * 1.30, tProg);

      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(curR * 1.05, curR * 1.05, 0.005, 8),
        stoneLightMat
      );
      ring.position.y = ty;
      ring.castShadow = true;
      tg.add(ring);

      const tierH = (midH / numTiers) * 0.80;
      for (let ri = 0; ri < numRibs; ri++) {
        const theta = (ri / numRibs) * Math.PI * 2 + Math.PI / numRibs;
        const slit = new THREE.Mesh(
          new THREE.BoxGeometry(curR * 0.42, tierH * 0.76, 0.006),
          stoneVoidMat
        );
        slit.position.set(Math.cos(theta) * (curR * 0.88), ty + tierH / 2, Math.sin(theta) * (curR * 0.88));
        slit.rotation.y = -theta + Math.PI / 2;
        tg.add(slit);
      }
    }

    for (let ri = 0; ri < numRibs; ri++) {
      const theta = (ri / numRibs) * Math.PI * 2;
      const ribGeo = new THREE.CylinderGeometry(0.004, 0.006, midH, 4);
      const rib = new THREE.Mesh(ribGeo, stoneLightMat);
      const avgR = (ts.baseR * 0.96 + ts.topR * 1.30) * 0.5;
      rib.position.set(Math.cos(theta) * avgR, baseH + midH / 2, Math.sin(theta) * avgR);
      rib.castShadow = true;
      tg.add(rib);
    }

    // Stage 3: Intermediate Projecting Balcony Gallery (y = 0.96)
    const balconyR = ts.topR * 1.45;
    const balconyMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(balconyR, balconyR * 0.90, 0.016, 8),
      stoneDarkMat
    );
    balconyMesh.position.y = baseH + midH + 0.008;
    balconyMesh.castShadow = true;
    tg.add(balconyMesh);

    const balRail = new THREE.Mesh(
      new THREE.CylinderGeometry(balconyR * 1.05, balconyR * 1.05, 0.008, 8),
      stoneLightMat
    );
    balRail.position.y = baseH + midH + 0.020;
    tg.add(balRail);

    // Stage 4: Upper Openwork Lantern Spire (Light sandstone with lancet slots)
    const lanternH = ts.totalH - (baseH + midH + 0.02) - 0.17;
    const lanternGeo = new THREE.CylinderGeometry(ts.topR * 0.75, ts.topR * 1.15, lanternH, 8);
    const lanternMesh = new THREE.Mesh(lanternGeo, stoneLightMat);
    lanternMesh.position.y = baseH + midH + 0.02 + lanternH / 2;
    lanternMesh.castShadow = true;
    tg.add(lanternMesh);

    for (let li = 0; li < 8; li++) {
      const lTheta = (li / 8) * Math.PI * 2;
      const lSlot = new THREE.Mesh(
        new THREE.BoxGeometry(0.003, lanternH * 0.82, 0.007),
        stoneVoidMat
      );
      lSlot.position.set(
        Math.cos(lTheta) * (ts.topR * 0.92),
        baseH + midH + 0.02 + lanternH / 2,
        Math.sin(lTheta) * (ts.topR * 0.92)
      );
      lSlot.rotation.y = -lTheta;
      tg.add(lSlot);
    }

    // Stage 5: Multi-Lobed Floral Stone Finial (Terminal del Campaner)
    const finialBaseY = baseH + midH + 0.02 + lanternH;
    const finialGroup = new THREE.Group();
    finialGroup.position.set(0, finialBaseY, 0);

    const fNeck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.015, 0.045, 8),
      stoneLightMat
    );
    fNeck.position.y = 0.022;
    finialGroup.add(fNeck);

    const fCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.012, 0.018, 8),
      stoneDarkMat
    );
    fCap.position.y = 0.050;
    finialGroup.add(fCap);

    // Floral crest
    const crestCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.020, 12, 10),
      crossStoneMat
    );
    crestCore.position.y = 0.085;
    finialGroup.add(crestCore);

    for (let pi = 0; pi < 5; pi++) {
      const pTheta = (pi / 5) * Math.PI * 2;
      const petalMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.013, 10, 8),
        crossStoneMat
      );
      petalMesh.position.set(
        Math.cos(pTheta) * 0.018,
        0.085,
        Math.sin(pTheta) * 0.018
      );
      finialGroup.add(petalMesh);
    }

    const topBud = new THREE.Mesh(
      new THREE.ConeGeometry(0.012, 0.034, 6),
      crossStoneMat
    );
    topBud.position.y = 0.115;
    finialGroup.add(topBud);

    tg.add(finialGroup);
    towersGroup.add(tg);
  }

  // Aerial Bridges between towers
  const bridge1 = new THREE.Group();
  bridge1.position.set(0, 0.038 + 0.88, 0.22);
  const bMesh1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.23, 0.028, 0.032),
    stoneBaseMat
  );
  bridge1.add(bMesh1);
  const bHole1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.036, 16, 1, false, 0, Math.PI),
    stoneVoidMat
  );
  bHole1.rotation.z = Math.PI;
  bHole1.rotation.y = Math.PI / 2;
  bHole1.position.y = -0.014;
  bridge1.add(bHole1);
  const bRail1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.23, 0.012, 0.005),
    stoneLightMat
  );
  bRail1.position.set(0, 0.018, 0.015);
  bridge1.add(bRail1);
  towersGroup.add(bridge1);

  for (const sSign of [-1, 1]) {
    const sBridge = new THREE.Group();
    sBridge.position.set(sSign * 0.175, 0.038 + 0.76, 0.20);
    const sbMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.024, 0.028),
      stoneBaseMat
    );
    sBridge.add(sbMesh);
    const sbHole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.032, 12, 1, false, 0, Math.PI),
      stoneVoidMat
    );
    sbHole.rotation.z = Math.PI;
    sbHole.rotation.y = Math.PI / 2;
    sbHole.position.y = -0.012;
    sBridge.add(sbHole);
    const sbRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.010, 0.004),
      stoneLightMat
    );
    sbRail.position.set(0, 0.016, 0.014);
    sBridge.add(sbRail);
    towersGroup.add(sBridge);
  }

  cathedral.add(towersGroup);

  // ========================================================
  // 5. ASCENDING PYRAMID OF CENTRAL SPIRES & TOWER OF JESUS CHRIST
  // ========================================================
  const centralGroup = new THREE.Group();
  centralGroup.name = 'CentralSpirePyramid';

  // Intermediate Triangular Gables & Spirelets rising behind facade
  for (let gi = 0; gi < 3; gi++) {
    const gy = 0.44 + gi * 0.18;
    const gZ = 0.12 - gi * 0.08;
    const gW = 0.34 - gi * 0.07;

    const gShape = new THREE.Shape();
    gShape.moveTo(-gW / 2, gy);
    gShape.lineTo(0, gy + 0.24);
    gShape.lineTo(gW / 2, gy);
    gShape.closePath();

    const gGeo = new THREE.ExtrudeGeometry(gShape, { depth: 0.040, bevelEnabled: false });
    gGeo.translate(0, 0, -0.02);
    const gMesh = new THREE.Mesh(gGeo, stoneBaseMat);
    gMesh.position.set(0, 0, gZ);
    gMesh.castShadow = true;
    centralGroup.add(gMesh);

    const gWin = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.14, 0.044),
      stoneVoidMat
    );
    gWin.position.set(0, gy + 0.09, gZ);
    centralGroup.add(gWin);
  }

  // The Four Evangelist Towers (Matthew, Mark, Luke, John)
  const evangelistSpecs = [
    { x: -0.135, z:  0.06, name: 'Evangelist_Matthew' },
    { x:  0.135, z:  0.06, name: 'Evangelist_John' },
    { x: -0.135, z: -0.16, name: 'Evangelist_Mark' },
    { x:  0.135, z: -0.16, name: 'Evangelist_Luke' },
  ];

  for (const es of evangelistSpecs) {
    const eg = new THREE.Group();
    eg.name = es.name;
    eg.position.set(es.x, 0.038, es.z);

    const eH = 1.30;
    // Lower body with vertical lancet recesses
    const eLower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.050, 0.42, 8),
      stoneBaseMat
    );
    eLower.position.y = 0.21;
    eLower.castShadow = true;
    eg.add(eLower);

    for (let ai = 0; ai < 4; ai++) {
      const theta = (ai / 4) * Math.PI * 2;
      const slot = new THREE.Mesh(
        new THREE.BoxGeometry(0.007, 0.24, 0.012),
        stoneVoidMat
      );
      slot.position.set(Math.cos(theta) * 0.044, 0.22, Math.sin(theta) * 0.044);
      slot.rotation.y = theta;
      eg.add(slot);
    }

    // Mid fluted shaft with acoustic louver tiers
    const midEH = eH - 0.42 - 0.18;
    const eSpire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.036, midEH, 8),
      stoneLightMat
    );
    eSpire.position.y = 0.42 + midEH / 2;
    eSpire.castShadow = true;
    eg.add(eSpire);

    // 8 Vertical stone ribs
    for (let ri = 0; ri < 8; ri++) {
      const rTheta = (ri / 8) * Math.PI * 2;
      const rMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.0035, midEH, 0.006),
        stoneDarkMat
      );
      rMesh.position.set(
        Math.cos(rTheta) * 0.029,
        0.42 + midEH / 2,
        Math.sin(rTheta) * 0.029
      );
      rMesh.rotation.y = -rTheta;
      eg.add(rMesh);
    }

    // Capital & Sculpted Tetramorph Finial
    const topY = 0.42 + midEH;
    const eCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.030, 0.020, 0.032, 8),
      stoneLightMat
    );
    eCap.position.y = topY + 0.016;
    eg.add(eCap);

    // Tetramorph symbol core (book & wings representation)
    const eSymbol = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.022, 0),
      crossStoneMat
    );
    eSymbol.position.y = topY + 0.048;
    eg.add(eSymbol);

    const ePoint = new THREE.Mesh(
      new THREE.ConeGeometry(0.012, 0.048, 6),
      crossStoneMat
    );
    ePoint.position.y = topY + 0.084;
    eg.add(ePoint);

    centralGroup.add(eg);
  }

  // Tower of the Virgin Mary over the apse (Z = -0.28)
  const maryGroup = new THREE.Group();
  maryGroup.name = 'TowerOfVirginMary';
  maryGroup.position.set(0, 0.038, -0.28);

  const maryH = 1.35;
  const marySpire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.054, maryH, 10),
    stoneBaseMat
  );
  marySpire.position.y = maryH / 2;
  marySpire.castShadow = true;
  maryGroup.add(marySpire);

  const starCore = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.025, 0),
    crossStoneMat
  );
  starCore.position.y = maryH + 0.038;
  maryGroup.add(starCore);

  for (let spi = 0; spi < 12; spi++) {
    const sTheta = (spi / 12) * Math.PI * 2;
    const sPoint = new THREE.Mesh(
      new THREE.ConeGeometry(0.007, 0.042, 4),
      crossStoneMat
    );
    sPoint.position.set(
      Math.cos(sTheta) * 0.025,
      maryH + 0.038,
      Math.sin(sTheta) * 0.025
    );
    sPoint.rotation.z = -Math.PI / 2;
    sPoint.rotation.y = sTheta;
    maryGroup.add(sPoint);
  }
  centralGroup.add(maryGroup);

  // ----------------------------------------------------
  // COLOSSAL CENTRAL TOWER OF JESUS CHRIST (TORRE DE JESUCRIST)
  // ----------------------------------------------------
  const jesusGroup = new THREE.Group();
  jesusGroup.name = 'TowerOfJesusChrist';
  jesusGroup.position.set(0, 0.038, -0.06);

  // Multi-tier gracefully tapering spire (y = 0.24 to 1.68)
  const jTiers = [
    // [yBase, height, rBottom, rTop, segments]
    [0.22, 0.38, 0.125, 0.105, 12],
    [0.60, 0.36, 0.105, 0.082, 12],
    [0.96, 0.36, 0.082, 0.058, 12],
    [1.32, 0.32, 0.058, 0.032, 12],
  ];

  for (let ti = 0; ti < jTiers.length; ti++) {
    const [yB, hT, rB, rT, segs] = jTiers[ti];
    const tierMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(rT, rB, hT, segs),
      ti % 2 === 0 ? stoneBaseMat : stoneLightMat
    );
    tierMesh.position.y = yB + hT / 2;
    tierMesh.castShadow = true;
    jesusGroup.add(tierMesh);

    // Stone belt course ring
    const belt = new THREE.Mesh(
      new THREE.CylinderGeometry(rB * 1.04, rB * 1.04, 0.010, segs),
      stoneDarkMat
    );
    belt.position.y = yB;
    belt.castShadow = true;
    jesusGroup.add(belt);

    // Lancet windows and dormers on lower tiers
    if (ti === 0) {
      for (let ji = 0; ji < 12; ji++) {
        const jTheta = (ji / 12) * Math.PI * 2;
        const jSlot = new THREE.Mesh(
          new THREE.BoxGeometry(0.012, 0.22, 0.016),
          stoneVoidMat
        );
        jSlot.position.set(Math.cos(jTheta) * (rB * 0.96), yB + hT * 0.52, Math.sin(jTheta) * (rB * 0.96));
        jSlot.rotation.y = -jTheta;
        jesusGroup.add(jSlot);

        const dormer = new THREE.Mesh(
          new THREE.ConeGeometry(0.015, 0.045, 4),
          stoneLightMat
        );
        dormer.position.set(Math.cos(jTheta) * (rB * 1.02), yB + hT * 0.88, Math.sin(jTheta) * (rB * 1.02));
        dormer.rotation.y = -jTheta;
        jesusGroup.add(dormer);
      }
    } else {
      // Fluted ribs adhering to tier surface
      for (let ji = 0; ji < 12; ji++) {
        const jTheta = (ji / 12) * Math.PI * 2;
        const ribBottom = new THREE.Vector3(Math.cos(jTheta) * rB, yB, Math.sin(jTheta) * rB);
        const ribTop = new THREE.Vector3(Math.cos(jTheta) * rT, yB + hT, Math.sin(jTheta) * rT);
        const ribDir = new THREE.Vector3().subVectors(ribTop, ribBottom);
        const ribLen = ribDir.length();
        const ribMid = new THREE.Vector3().addVectors(ribBottom, ribTop).multiplyScalar(0.5);

        const ribMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.003, 0.004, ribLen, 4),
          stoneDarkMat
        );
        ribMesh.position.copy(ribMid);
        ribMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), ribDir.clone().normalize());
        jesusGroup.add(ribMesh);
      }

      // Dormer spirelets stepping up the spire
      for (let dj = 0; dj < 6; dj++) {
        const dTheta = (dj / 6) * Math.PI * 2 + (ti % 2) * (Math.PI / 6);
        const midR = (rB + rT) * 0.5;
        const spirelet = new THREE.Mesh(
          new THREE.ConeGeometry(0.008, 0.030, 4),
          stoneLightMat
        );
        spirelet.position.set(Math.cos(dTheta) * (midR * 1.06), yB + hT * 0.5, Math.sin(dTheta) * (midR * 1.06));
        spirelet.rotation.y = -dTheta;
        jesusGroup.add(spirelet);
      }
    }
  }

  // Upper Lantern Platform (y = 1.64 to 1.70)
  const lanternY = 1.64;
  const jLantern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.030, 0.042, 8),
    stoneLightMat
  );
  jLantern.position.y = lanternY + 0.021;
  jesusGroup.add(jLantern);

  for (let li = 0; li < 8; li++) {
    const lTheta = (li / 8) * Math.PI * 2;
    const lSlot = new THREE.Mesh(
      new THREE.BoxGeometry(0.005, 0.026, 0.008),
      stoneVoidMat
    );
    lSlot.position.set(Math.cos(lTheta) * 0.031, lanternY + 0.021, Math.sin(lTheta) * 0.031);
    lSlot.rotation.y = -lTheta;
    jesusGroup.add(lSlot);
  }

  // Capital knop supporting the cross
  const jKnop = new THREE.Mesh(
    new THREE.SphereGeometry(0.026, 12, 10),
    crossStoneMat
  );
  jKnop.position.y = lanternY + 0.055;
  jesusGroup.add(jKnop);

  // ----------------------------------------------------
  // THE MONUMENTAL BUDDED / TREFOIL LATIN CROSS (CROSS BOTTONY)
  // ----------------------------------------------------
  const crossGroup = new THREE.Group();
  crossGroup.name = 'MonumentalBuddedCross';
  crossGroup.position.set(0, lanternY + 0.072, 0);

  const crossH = 0.22;
  const crossW = 0.14;
  const barThick = 0.016;

  const vShaft = new THREE.Mesh(
    new THREE.BoxGeometry(barThick, crossH, barThick),
    crossStoneMat
  );
  vShaft.position.y = crossH / 2;
  vShaft.castShadow = true;
  crossGroup.add(vShaft);

  const barY = crossH * 0.68;
  const hBar = new THREE.Mesh(
    new THREE.BoxGeometry(crossW, barThick, barThick),
    crossStoneMat
  );
  hBar.position.y = barY;
  hBar.castShadow = true;
  crossGroup.add(hBar);

  const haloRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.036, 0.0035, 8, 24),
    crossStoneMat
  );
  haloRing.position.set(0, barY, 0);
  crossGroup.add(haloRing);

  function addTrefoilTerminal(posX: number, posY: number, rotZ: number) {
    const tGroup = new THREE.Group();
    tGroup.position.set(posX, posY, 0);
    tGroup.rotation.z = rotZ;

    const centerBud = new THREE.Mesh(
      new THREE.SphereGeometry(0.010, 10, 8),
      crossStoneMat
    );
    centerBud.position.y = 0.012;
    tGroup.add(centerBud);

    const leftBud = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 8, 8),
      crossStoneMat
    );
    leftBud.position.set(-0.010, 0.007, 0);
    tGroup.add(leftBud);

    const rightBud = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 8, 8),
      crossStoneMat
    );
    rightBud.position.set(0.010, 0.007, 0);
    tGroup.add(rightBud);

    crossGroup.add(tGroup);
  }

  addTrefoilTerminal(0, crossH, 0);
  addTrefoilTerminal(-crossW / 2, barY, Math.PI / 2);
  addTrefoilTerminal(crossW / 2, barY, -Math.PI / 2);

  jesusGroup.add(crossGroup);
  centralGroup.add(jesusGroup);

  // Flying Buttresses (Arcbotants)
  const flyingButtressGroup = new THREE.Group();
  for (const sSign of [-1, 1]) {
    for (let bi = 0; bi < 3; bi++) {
      const bZ = 0.08 - bi * 0.12;
      const bStart = new THREE.Vector3(sSign * 0.09, 0.88 - bi * 0.06, bZ);
      const bEnd = new THREE.Vector3(sSign * 0.22, 0.60 - bi * 0.06, bZ);
      const bMid = new THREE.Vector3().addVectors(bStart, bEnd).multiplyScalar(0.5);
      bMid.y += 0.05;

      const curve = new THREE.QuadraticBezierCurve3(bStart, bMid, bEnd);
      const bTubeGeo = new THREE.TubeGeometry(curve, 10, 0.006, 6, false);
      const bTubeMesh = new THREE.Mesh(bTubeGeo, stoneLightMat);
      bTubeMesh.castShadow = true;
      flyingButtressGroup.add(bTubeMesh);

      const underStart = new THREE.Vector3(sSign * 0.085, 0.78 - bi * 0.06, bZ);
      const underCurve = new THREE.QuadraticBezierCurve3(underStart, bMid.clone().add(new THREE.Vector3(0, -0.035, 0)), bEnd);
      const underTube = new THREE.Mesh(
        new THREE.TubeGeometry(underCurve, 8, 0.004, 5, false),
        stoneBaseMat
      );
      flyingButtressGroup.add(underTube);
    }
  }
  centralGroup.add(flyingButtressGroup);

  cathedral.add(centralGroup);

  // ========================================================
  // 6. LEFT SIDE AISLE & PINNACLES (MATCHING crop_side_aisle.png!)
  // ========================================================
  const leftAisleGroup = new THREE.Group();
  leftAisleGroup.name = 'LeftAisleFlank';
  const aisleX = -0.21;

  const aisleWallMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.36, 0.48),
    stoneBaseMat
  );
  aisleWallMesh.position.set(aisleX, 0.038 + 0.18, -0.12);
  aisleWallMesh.castShadow = true;
  leftAisleGroup.add(aisleWallMesh);

  const clerestoryMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.040, 0.30, 0.48),
    stoneBaseMat
  );
  clerestoryMesh.position.set(aisleX + 0.075, 0.038 + 0.42, -0.12);
  clerestoryMesh.castShadow = true;
  leftAisleGroup.add(clerestoryMesh);

  const numBays = 4;
  const bayLen = 0.115;
  for (let bi = 0; bi < numBays; bi++) {
    const bZ = 0.06 - bi * bayLen;

    for (const wSign of [-1, 1]) {
      const winSlot = new THREE.Mesh(
        new THREE.BoxGeometry(0.010, 0.095, 0.024),
        stoneVoidMat
      );
      winSlot.position.set(aisleX - 0.022, 0.038 + 0.09, bZ + wSign * 0.024);
      leftAisleGroup.add(winSlot);

      const winArch = new THREE.Mesh(
        new THREE.ConeGeometry(0.014, 0.026, 4),
        stoneLightMat
      );
      winArch.position.set(aisleX - 0.022, 0.038 + 0.145, bZ + wSign * 0.024);
      leftAisleGroup.add(winArch);
    }

    for (let mi = 0; mi < 3; mi++) {
      const mSlot = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 0.075, 0.016),
        stoneVoidMat
      );
      mSlot.position.set(aisleX - 0.022, 0.038 + 0.25, bZ + (mi - 1) * 0.026);
      leftAisleGroup.add(mSlot);
    }

    const gableShape = new THREE.Shape();
    gableShape.moveTo(-bayLen / 2, 0);
    gableShape.lineTo(0, 0.12);
    gableShape.lineTo(bayLen / 2, 0);
    gableShape.closePath();

    const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: 0.024, bevelEnabled: false });
    gableGeo.translate(0, 0, -0.012);
    gableGeo.rotateY(Math.PI / 2);
    const gableMesh = new THREE.Mesh(gableGeo, stoneLightMat);
    gableMesh.position.set(aisleX - 0.015, 0.038 + 0.36, bZ);
    gableMesh.castShadow = true;
    leftAisleGroup.add(gableMesh);

    const rosette = new THREE.Mesh(
      new THREE.TorusGeometry(0.014, 0.003, 6, 16),
      stoneDarkMat
    );
    rosette.position.set(aisleX - 0.028, 0.038 + 0.41, bZ);
    rosette.rotation.y = Math.PI / 2;
    leftAisleGroup.add(rosette);
  }

  for (let pi = 0; pi <= numBays; pi++) {
    const pZ = 0.118 - pi * bayLen;
    const pinGroup = new THREE.Group();
    pinGroup.position.set(aisleX - 0.024, 0.038, pZ);

    const pier = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.42, 0.030),
      stoneBaseMat
    );
    pier.position.y = 0.21;
    pier.castShadow = true;
    pinGroup.add(pier);

    const pinSpire = new THREE.Mesh(
      new THREE.ConeGeometry(0.014, 0.22, 6),
      stoneLightMat
    );
    pinSpire.position.y = 0.42 + 0.11;
    pinSpire.castShadow = true;
    pinGroup.add(pinSpire);

    const pinBud = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 8, 6),
      crossStoneMat
    );
    pinBud.position.y = 0.42 + 0.22;
    pinGroup.add(pinBud);

    leftAisleGroup.add(pinGroup);
  }

  cathedral.add(leftAisleGroup);

  // ========================================================
  // 7. RIGHT SIDE TRANSEPT PORTAL & AISLE (FACING +X)
  // ========================================================
  const rightTranseptGroup = new THREE.Group();
  rightTranseptGroup.name = 'RightTranseptFlank';
  const transeptX = 0.21;

  const rAisleWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.36, 0.48),
    stoneBaseMat
  );
  rAisleWall.position.set(transeptX, 0.038 + 0.18, -0.12);
  rAisleWall.castShadow = true;
  rightTranseptGroup.add(rAisleWall);

  const tProjMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.48, 0.22),
    stoneBaseMat
  );
  tProjMesh.position.set(transeptX + 0.032, 0.038 + 0.24, -0.08);
  tProjMesh.castShadow = true;
  rightTranseptGroup.add(tProjMesh);

  const tArchShape = new THREE.Shape();
  tArchShape.moveTo(-0.065, 0);
  tArchShape.lineTo(-0.065, 0.10);
  tArchShape.quadraticCurveTo(-0.04, 0.18, 0, 0.22);
  tArchShape.quadraticCurveTo(0.04, 0.18, 0.065, 0.10);
  tArchShape.lineTo(0.065, 0);
  tArchShape.closePath();

  const tArchGeo = new THREE.ExtrudeGeometry(tArchShape, { depth: 0.032, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.004, bevelThickness: 0.004 });
  tArchGeo.translate(0, 0, -0.016);
  tArchGeo.rotateY(-Math.PI / 2);
  const tArchMesh = new THREE.Mesh(tArchGeo, stoneLightMat);
  tArchMesh.position.set(transeptX + 0.064, 0.038, -0.08);
  tArchMesh.castShadow = true;
  rightTranseptGroup.add(tArchMesh);

  const tDoorVoid = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.15, 0.08),
    woodDoorMat
  );
  tDoorVoid.position.set(transeptX + 0.062, 0.038 + 0.075, -0.08);
  rightTranseptGroup.add(tDoorVoid);

  const tRose = new THREE.Mesh(
    new THREE.TorusGeometry(0.036, 0.006, 8, 20),
    stoneLightMat
  );
  tRose.position.set(transeptX + 0.066, 0.038 + 0.32, -0.08);
  tRose.rotation.y = Math.PI / 2;
  rightTranseptGroup.add(tRose);

  const tRoseGlass = new THREE.Mesh(
    new THREE.CircleGeometry(0.033, 16),
    gothicGlassMat
  );
  tRoseGlass.position.set(transeptX + 0.065, 0.038 + 0.32, -0.08);
  tRoseGlass.rotation.y = Math.PI / 2;
  rightTranseptGroup.add(tRoseGlass);

  const tGable = new THREE.Mesh(
    new THREE.ConeGeometry(0.020, 0.16, 4),
    stoneLightMat
  );
  tGable.position.set(transeptX + 0.040, 0.038 + 0.54, -0.08);
  rightTranseptGroup.add(tGable);

  for (const tSign of [-1, 1]) {
    const tPin = new THREE.Mesh(
      new THREE.ConeGeometry(0.012, 0.18, 6),
      stoneLightMat
    );
    tPin.position.set(transeptX + 0.040, 0.038 + 0.44, -0.08 + tSign * 0.11);
    rightTranseptGroup.add(tPin);
  }

  cathedral.add(rightTranseptGroup);

  // ========================================================
  // 8. APSE & REAR CHAPELS (Z = -0.32 to -0.48)
  // ========================================================
  const apseGroup = new THREE.Group();
  apseGroup.name = 'ChevetApseChapels';
  apseGroup.position.set(0, 0.038, -0.32);

  const apseWall = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.20, 0.38, 12, 1, false, 0, Math.PI),
    stoneBaseMat
  );
  apseWall.rotation.y = Math.PI / 2;
  apseWall.position.y = 0.19;
  apseWall.castShadow = true;
  apseGroup.add(apseWall);

  for (let ai = 0; ai < 7; ai++) {
    const aAngle = (ai / 6) * Math.PI - Math.PI / 2;
    const ax = Math.cos(aAngle) * 0.19;
    const az = -Math.sin(aAngle) * 0.10 - 0.06;

    const aWin = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.14, 0.016),
      stoneVoidMat
    );
    aWin.position.set(ax, 0.20, az);
    aWin.rotation.y = aAngle;
    apseGroup.add(aWin);

    const aPin = new THREE.Mesh(
      new THREE.ConeGeometry(0.010, 0.16, 6),
      stoneLightMat
    );
    aPin.position.set(ax * 1.08, 0.42, az * 1.08);
    apseGroup.add(aPin);
  }

  cathedral.add(apseGroup);

  const materials: Record<string, THREE.Material> = {
    stoneBaseMat,
    stoneLightMat,
    stoneDarkMat,
    stoneVoidMat,
    crossStoneMat,
    foliageMat,
    trunkMat,
    pavementMat,
    curbStoneMat,
    streetAsphaltMat,
    gothicGlassMat,
    woodDoorMat,
  };

  const controls: SagradaModelControls = {
    setSunAngle: (_angleRad: number) => {},
    setShadowIntensity: (_val: number) => {},
  };

  return {
    root,
    materials,
    pivots: {},
    controls,
    tick: (_delta: number, _elapsed: number) => {},
  };
}
