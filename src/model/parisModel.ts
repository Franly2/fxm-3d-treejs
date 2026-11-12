import * as THREE from 'three';
import { buildEiffelTower } from './eiffelTowerModel';
import { createDetailedOrganicTree, createPleachedAvenueTree, TreeMaterials } from './parisTrees';
import { createDetailedHaussmannBlock, createParisBackgroundCityscape, HaussmannMaterials } from './parisBuildings';
import { createPontDIenaRoadway, createStreetTraffic, createPedestrians, createEiffelCarousel, createUnderTowerPlaza, StreetMaterials } from './parisStreet';
import { createEiffelTextures } from './eiffelTexture';

/**
 * Super-Detailed Procedural 3D Reconstruction of Paris (paris.png)
 *
 * Strict Fidelity to paris.png:
 *  1. The Seine River: Realistic rippling turquoise-blue river water,
 *     surface reflections, and frothy boat wake.
 *  2. Eiffel Tower: Authentic warm bronze/copper wrought puddled iron
 *     bathed in late-afternoon golden-hour sunlight.
 *     - 4 massive leaning parabolic box-lattice pylon legs with foundation pedestals.
 *     - Monumental semicircular decorative arch with openwork radial lattice trusses.
 *     - First Platform (Level 1) with viewing galleries, frieze band (72 names), and pavilion rooms.
 *     - Intermediate converging lattice tower with dense X-braced ironwork trusses.
 *     - Second Platform (Level 2) with observation decks and safety balustrades.
 *     - TRUE OPENWORK LATTICE SPIRE (Level 3): 4 converging corner girders with 8 belt courses
 *       and X-lattice bracing (fully transparent, you can see the sky through it!).
 *     - Observation dome, lantern room, and radio antenna mast with beacon light.
 *  3. Bateaux-Mouches River Cruise Boat:
 *     - Foreground cruise boat with sleek white catamaran hull, dark waterline, and panoramic curved glass canopy.
 *     - Arched structural canopy ribs, passenger silhouettes, and French Tricolor Flag (Bleu-Blanc-Rouge) at stern.
 *     - Secondary double-decker river cruiser / barge moored along the quayside.
 *  4. Pont d'Iéna (Stone Arch Bridge):
 *     - Classical segmental stone arches spanning across the river Seine.
 *     - Pier cutwaters, carved eagle relief medallions, classical stone balustrade, and lampposts.
 *     - Monumental equestrian warrior statues on grand rectangular stone pedestals at the bridge entrance.
 *  5. Quayside Promenade & Tents:
 *     - Quai Branly / Port de la Bourdonnais with warm limestone retaining walls and stone stairs to the water.
 *     - Rows of white festival / market pavilion tents along the upper promenade.
 *     - Manicured green hedges and stone parapets.
 *  6. Trees (Ground and Framing):
 *     - Ground plane trees lining the quayside boulevard and Champ de Mars park.
 *     - Lush overhanging plane tree branches with detailed leaves framing the top-left and top-right of the photo.
 */

export interface ParisModelControls {
  setSunTime: (timeVal: number) => void;
  setWaterSpeed: (speedVal: number) => void;
}

export interface ParisModelInstance {
  root: THREE.Group;
  materials: Record<string, THREE.Material>;
  pivots: Record<string, THREE.Object3D>;
  controls: ParisModelControls;
  tick: (delta: number, elapsed: number) => void;
}

export function createParisModel(): ParisModelInstance {
  const root = new THREE.Group();
  root.name = 'Paris_EiffelTowerScene';

  // ========================================================
  // 1. AUTHENTIC MATERIAL PALETTE (PARIS GOLDEN HOUR)
  // ========================================================
  // Eiffel Tower wrought puddled iron in exact rgb(153, 142, 131)
  const eiffelIronMat = new THREE.MeshStandardMaterial({
    name: 'iron',
    color: new THREE.Color('rgb(153, 142, 131)'),
    roughness: 0.52,
    metalness: 0.28,
  });

  const eiffelIronDarkMat = new THREE.MeshStandardMaterial({
    name: 'ironDark',
    color: new THREE.Color('rgb(112, 103, 94)'),
    roughness: 0.60,
    metalness: 0.25,
  });

  const eiffelIronHighlightMat = new THREE.MeshStandardMaterial({
    name: 'ironLight',
    color: new THREE.Color('rgb(178, 166, 154)'),
    roughness: 0.45,
    metalness: 0.35,
  });

  // Apply authentic puddled wrought iron textures (riveted plates, rolling-mill grain, specular roughness)
  const eiffelTex = createEiffelTextures();
  if (eiffelTex.colorMap) {
    eiffelIronMat.map = eiffelTex.colorMap;
    eiffelIronDarkMat.map = eiffelTex.colorMap;
    eiffelIronHighlightMat.map = eiffelTex.colorMap;
  }
  if (eiffelTex.roughnessMap) {
    eiffelIronMat.roughnessMap = eiffelTex.roughnessMap;
  }
  if (eiffelTex.bumpMap) {
    eiffelIronMat.bumpMap = eiffelTex.bumpMap;
    eiffelIronMat.bumpScale = 0.035;
  }

  const eiffelGoldMat = new THREE.MeshStandardMaterial({
    name: 'glass',
    color: new THREE.Color('rgb(153, 142, 131)'),
    roughness: 0.38,
    metalness: 0.45,
  });

  const eiffelRivetMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#3e2817'),
    roughness: 0.65,
    metalness: 0.42,
  });

  const eiffelCableMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#726c62'),
    roughness: 0.36,
    metalness: 0.74,
  });

  // River Seine Water (rich turquoise-green with specular shine)
  const riverWaterMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#28626f'),
    roughness: 0.18,
    metalness: 0.40,
    transparent: true,
    opacity: 0.94,
  });

  const riverFoamMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e0f0f4'),
    roughness: 0.35,
    metalness: 0.10,
    transparent: true,
    opacity: 0.80,
  });

  // French limestone for bridge, quay walls, and pedestals (Pierre de Paris)
  const parisStoneMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#dad0b8'),
    roughness: 0.80,
    metalness: 0.04,
  });

  const parisStoneDarkMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#9c8f76'),
    roughness: 0.86,
    metalness: 0.05,
  });

  // Classical bronze / weathered stone for equestrian statues
  const statueMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#7a7260'),
    roughness: 0.65,
    metalness: 0.30,
  });

  // Cruise Boat Materials
  const boatHullWhiteMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f4f3f6'),
    roughness: 0.30,
    metalness: 0.18,
  });

  const boatHullDarkMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#19222b'),
    roughness: 0.45,
    metalness: 0.22,
  });

  const boatGlassMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#a5d8ea'),
    roughness: 0.12,
    metalness: 0.65,
    transparent: true,
    opacity: 0.60,
    side: THREE.DoubleSide,
  });

  const boatSteelRailMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e5e7eb'),
    roughness: 0.25,
    metalness: 0.80,
  });

  const boatRedAccentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ba3428'),
    roughness: 0.50,
    metalness: 0.10,
  });

  // French Flag Materials (Tricolor)
  const flagBlueMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#002395'), roughness: 0.55 });
  const flagWhiteMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#ffffff'), roughness: 0.55 });
  const flagRedMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#ed2939'), roughness: 0.55 });

  // Foliage & Nature Materials
  const foliagePlaneTreeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#3d6334'),
    roughness: 0.86,
    metalness: 0.02,
  });

  const foliageDarkMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#284722'),
    roughness: 0.90,
    metalness: 0.02,
  });

  const treeBarkMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#4a3b2c'),
    roughness: 0.85,
    metalness: 0.02,
  });

  const tentCanvasMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#faf5ea'),
    roughness: 0.70,
    metalness: 0.02,
  });

  // --------------------------------------------------------
  // Trocadéro Esplanade & Garden Materials (back-eiffel.png)
  // --------------------------------------------------------
  const trocaderoTileLightMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#eee7da'),
    roughness: 0.70,
    metalness: 0.08,
  });

  const trocaderoTileDarkMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#323338'),
    roughness: 0.78,
    metalness: 0.15,
  });

  // --------------------------------------------------------
  // Champ de Mars Park & Sports Ground Materials (left-right-eiffel.png)
  // --------------------------------------------------------
  const champDeMarsGrassMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#467b36'),
    roughness: 0.85,
    metalness: 0.04,
  });

  const gravelPathMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#dfd7c2'),
    roughness: 0.90,
    metalness: 0.04,
  });

  const sportsTrackRedMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#b84632'),
    roughness: 0.85,
    metalness: 0.05,
  });

  const sportsFieldGreenMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#387b30'),
    roughness: 0.82,
    metalness: 0.04,
  });

  // --------------------------------------------------------
  // Parisian Haussmann City Blocks (left-right-eiffel.png)
  // --------------------------------------------------------
  const haussmannFacadeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ded5c2'),
    roughness: 0.75,
    metalness: 0.08,
  });

  const haussmannFacadeLightMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ece3d2'),
    roughness: 0.70,
    metalness: 0.08,
  });

  const haussmannRoofMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#586774'),
    roughness: 0.55,
    metalness: 0.35,
  });

  const haussmannBalconyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#222428'),
    roughness: 0.50,
    metalness: 0.70,
  });

  const haussmannWindowMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#384654'),
    roughness: 0.25,
    metalness: 0.60,
  });

  const haussmannChimneyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#a4553c'),
    roughness: 0.85,
    metalness: 0.05,
  });

  const haussmannDoorMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#38281e'),
    roughness: 0.70,
    metalness: 0.05,
  });

  // --------------------------------------------------------
  // Pont d'Iéna Roadway, Vehicles & Carousel (eiffel-under.jpg)
  // --------------------------------------------------------
  const asphaltMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#282b2f'),
    roughness: 0.82,
    metalness: 0.05,
  });

  const roadLineWhiteMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f0f2f5'),
    roughness: 0.55,
    metalness: 0.02,
  });

  const carWhiteMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#f5f5f7'), roughness: 0.25, metalness: 0.20 });
  const carDarkMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#1a1c20'), roughness: 0.30, metalness: 0.35 });
  const carRedMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#ba2824'), roughness: 0.35, metalness: 0.15 });
  const carSilverMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#b8bcc2'), roughness: 0.28, metalness: 0.60 });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fffbe8'),
    emissive: new THREE.Color('#fff4cc'),
    emissiveIntensity: 0.9,
    roughness: 0.15,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e61c14'),
    emissive: new THREE.Color('#cc140d'),
    emissiveIntensity: 0.8,
    roughness: 0.20,
  });

  const carouselStripeRedMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#ab2626'), roughness: 0.60 });
  const carouselStripeCreamMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#fff7ea'), roughness: 0.60 });
  const carouselGoldMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#d4af37'), roughness: 0.25, metalness: 0.85 });
  const carouselLightMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fff6d1'),
    emissive: new THREE.Color('#ffd666'),
    emissiveIntensity: 0.7,
  });

  // Flowering Jacaranda / Lilac Trees (eiffel-under.jpg)
  const foliagePurpleMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#8f5c93'),
    roughness: 0.86,
    metalness: 0.02,
  });

  const foliagePurpleLightMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#a672ab'),
    roughness: 0.82,
    metalness: 0.02,
  });

  // --------------------------------------------------------
  // Tour Montparnasse (left-right-eiffel.png skyline)
  // --------------------------------------------------------
  const montparnasseMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#202328'),
    roughness: 0.32,
    metalness: 0.65,
  });

  const montparnasseRoofMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#353941'),
    roughness: 0.55,
    metalness: 0.40,
  });

  // Scene Root Nodes
  const riverGroup = new THREE.Group();
  riverGroup.name = 'RiverSeine';
  root.add(riverGroup);

  const quayGroup = new THREE.Group();
  quayGroup.name = 'QuayPromenade';
  root.add(quayGroup);

  const bridgeGroup = new THREE.Group();
  bridgeGroup.name = 'PontDIenaBridge';
  root.add(bridgeGroup);

  const eiffelGroup = new THREE.Group();
  eiffelGroup.name = 'EiffelTower';
  root.add(eiffelGroup);

  const boatsGroup = new THREE.Group();
  boatsGroup.name = 'SeineCruiseBoats';
  root.add(boatsGroup);

  const treesGroup = new THREE.Group();
  treesGroup.name = 'ParisTreesAndFoliage';
  root.add(treesGroup);

  const trocaderoGroup = new THREE.Group();
  trocaderoGroup.name = 'TrocaderoEsplanadeAndGardens';
  root.add(trocaderoGroup);

  const champDeMarsGroup = new THREE.Group();
  champDeMarsGroup.name = 'ChampDeMarsAndPark';
  root.add(champDeMarsGroup);

  const cityBlocksGroup = new THREE.Group();
  cityBlocksGroup.name = 'ParisCityBlocksAndSkyline';
  root.add(cityBlocksGroup);

  // ========================================================
  // 2. THE SEINE RIVER — EXPANDED 360° FLOW
  // ========================================================
  const riverWidth = 7.6;
  const riverLength = 1.45;

  const waterGeo = new THREE.PlaneGeometry(riverWidth, riverLength, 72, 48);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMesh = new THREE.Mesh(waterGeo, riverWaterMat);
  waterMesh.position.set(0, 0.0, 0.70);
  waterMesh.receiveShadow = true;
  riverGroup.add(waterMesh);

  const siltMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(riverWidth, riverLength),
    new THREE.MeshStandardMaterial({ color: '#11252a', roughness: 0.95 })
  );
  siltMesh.rotation.x = -Math.PI / 2;
  siltMesh.position.set(0, -0.14, 0.70);
  riverGroup.add(siltMesh);

  const posAttr = waterGeo.attributes.position;
  const originalY = new Float32Array(posAttr.count);
  for (let i = 0; i < posAttr.count; i++) {
    originalY[i] = posAttr.getY(i);
  }

  // ========================================================
  // 3. QUAYSIDE PROMENADES & EMBANKMENTS (DUAL BANKS)
  // Left Bank (Eiffel / Quai Jacques Chirac) & Right Bank (Trocadéro / Port Debilly)
  // ========================================================
  const quayZ = 0.05;
  const trocaderoQuayZ = 1.35;
  const quayH = 0.26;
  const quayW = 7.6;

  // A. Left Bank (Eiffel side) Embankment
  const quayWallLeft = new THREE.Mesh(
    new THREE.BoxGeometry(quayW, quayH, 0.16),
    parisStoneMat
  );
  quayWallLeft.position.set(0, quayH / 2, quayZ);
  quayWallLeft.castShadow = true;
  quayWallLeft.receiveShadow = true;
  quayGroup.add(quayWallLeft);

  const lowerPathLeft = new THREE.Mesh(
    new THREE.BoxGeometry(quayW, 0.04, 0.24),
    parisStoneDarkMat
  );
  lowerPathLeft.position.set(0, 0.02, quayZ + 0.18);
  lowerPathLeft.receiveShadow = true;
  quayGroup.add(lowerPathLeft);

  const upperPromenadeLeft = new THREE.Mesh(
    new THREE.BoxGeometry(quayW, 0.05, 0.85),
    parisStoneMat
  );
  upperPromenadeLeft.position.set(0, quayH + 0.025, quayZ - 0.38);
  upperPromenadeLeft.receiveShadow = true;
  quayGroup.add(upperPromenadeLeft);

  const parapetLeft = new THREE.Mesh(
    new THREE.BoxGeometry(quayW - 0.4, 0.045, 0.035),
    parisStoneDarkMat
  );
  parapetLeft.position.set(0, quayH + 0.07, quayZ + 0.05);
  parapetLeft.castShadow = true;
  quayGroup.add(parapetLeft);

  // Stone Staircases descending to the water on Left Bank
  for (const stX of [-1.15, 0.95]) {
    for (let st = 0; st < 8; st++) {
      const sStep = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.028, 0.045),
        parisStoneMat
      );
      sStep.position.set(stX, 0.02 + st * 0.028, quayZ + 0.22 - st * 0.038);
      sStep.castShadow = true;
      sStep.receiveShadow = true;
      quayGroup.add(sStep);
    }
  }

  // B. Right Bank (Trocadéro side) Embankment
  const quayWallRight = new THREE.Mesh(
    new THREE.BoxGeometry(quayW, quayH, 0.16),
    parisStoneMat
  );
  quayWallRight.position.set(0, quayH / 2, trocaderoQuayZ);
  quayWallRight.castShadow = true;
  quayWallRight.receiveShadow = true;
  quayGroup.add(quayWallRight);

  const lowerPathRight = new THREE.Mesh(
    new THREE.BoxGeometry(quayW, 0.04, 0.24),
    parisStoneDarkMat
  );
  lowerPathRight.position.set(0, 0.02, trocaderoQuayZ - 0.18);
  lowerPathRight.receiveShadow = true;
  quayGroup.add(lowerPathRight);

  const upperAvenueRight = new THREE.Mesh(
    new THREE.BoxGeometry(quayW, 0.05, 0.45),
    parisStoneMat
  );
  upperAvenueRight.position.set(0, quayH + 0.025, trocaderoQuayZ + 0.25);
  upperAvenueRight.receiveShadow = true;
  quayGroup.add(upperAvenueRight);

  const parapetRight = new THREE.Mesh(
    new THREE.BoxGeometry(quayW - 0.4, 0.045, 0.035),
    parisStoneDarkMat
  );
  parapetRight.position.set(0, quayH + 0.07, trocaderoQuayZ - 0.05);
  parapetRight.castShadow = true;
  quayGroup.add(parapetRight);

  // Rows of conical white festival / market pavilion tents along the left promenade
  const tentZ = quayZ - 0.28;
  for (let ti = 0; ti < 9; ti++) {
    const tx = -1.85 + ti * 0.38;
    if (Math.abs(tx - 0.05) < 0.35) continue; // Clear bridge approach
    const tentGroup = new THREE.Group();
    tentGroup.position.set(tx, quayH + 0.05, tentZ);

    const tentBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.085, 0.20),
      tentCanvasMat
    );
    tentBase.position.y = 0.042;
    tentBase.castShadow = true;
    tentGroup.add(tentBase);

    const tentRoof = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.12, 4),
      tentCanvasMat
    );
    tentRoof.position.y = 0.085 + 0.06;
    tentRoof.rotation.y = Math.PI / 4;
    tentRoof.castShadow = true;
    tentGroup.add(tentRoof);

    const valance = new THREE.Mesh(
      new THREE.BoxGeometry(0.245, 0.012, 0.205),
      ti % 2 === 0 ? boatRedAccentMat : boatHullDarkMat
    );
    valance.position.y = 0.085;
    tentGroup.add(valance);

    quayGroup.add(tentGroup);
  }

  // Manicured quayside hedges along Left Bank
  for (let hi = 0; hi < 8; hi++) {
    const hx = -1.65 + hi * 0.42;
    if (Math.abs(hx - 0.05) < 0.32) continue;
    const hedge = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.065, 0.06),
      foliageDarkMat
    );
    hedge.position.set(hx, quayH + 0.08, quayZ - 0.14);
    hedge.castShadow = true;
    quayGroup.add(hedge);
  }

  // ========================================================
  // 4. PONT D'IÉNA (STONE ARCH BRIDGE) — GRAND CENTRAL AXIS
  // Spans the Seine centrally connecting Trocadéro to Eiffel Tower
  // ========================================================
  const bridgeX = 0.05; // Exactly aligned with Eiffel Tower center & Trocadéro!
  const bridgeLengthZ = trocaderoQuayZ - quayZ; // 1.30
  const bridgeCenterZ = (quayZ + trocaderoQuayZ) / 2; // 0.70
  const bridgeW = 0.38;

  // Stone Bridge Roadway Deck
  const bridgeDeck = new THREE.Mesh(
    new THREE.BoxGeometry(bridgeW, 0.065, bridgeLengthZ + 0.06),
    parisStoneMat
  );
  bridgeDeck.position.set(bridgeX, quayH + 0.035, bridgeCenterZ);
  bridgeDeck.castShadow = true;
  bridgeDeck.receiveShadow = true;
  bridgeGroup.add(bridgeDeck);

  const streetMats: StreetMaterials = {
    asphalt: asphaltMat,
    roadLineWhite: roadLineWhiteMat,
    stone: parisStoneMat,
    stoneDark: parisStoneDarkMat,
    ironDark: eiffelIronDarkMat,
    glass: boatGlassMat,
    headlight: headlightMat,
    taillight: taillightMat,
    carWhite: carWhiteMat,
    carDark: carDarkMat,
    carRed: carRedMat,
    carSilver: carSilverMat,
    carouselStripeRed: carouselStripeRedMat,
    carouselStripeCream: carouselStripeCreamMat,
    carouselGold: carouselGoldMat,
    carouselLight: carouselLightMat,
  };

  // ========================================================
  // MASTER GROUND FOUNDATION SLABS (BASE PLATFORM FOR ALL ASSETS)
  // Provides solid ground foundation for all buildings, trees, streets, and tower
  // Ensures no floating geometry from any camera angle
  // ========================================================
  const masterGroundLeftBank = new THREE.Mesh(
    new THREE.BoxGeometry(9.80, 0.31, 5.90),
    parisStoneMat
  );
  masterGroundLeftBank.position.set(0.05, 0.155, -2.60);
  masterGroundLeftBank.receiveShadow = true;
  root.add(masterGroundLeftBank);

  const masterGroundRightBank = new THREE.Mesh(
    new THREE.BoxGeometry(8.40, 0.42, 2.80),
    parisStoneMat
  );
  masterGroundRightBank.position.set(0.05, 0.21, 2.50);
  masterGroundRightBank.receiveShadow = true;
  root.add(masterGroundRightBank);

  // Grand Continuous Avenue across Pont d'Iéna, under Eiffel Tower, and through Champ de Mars to École Militaire (z: +1.35 -> -3.85)
  const bridgeRoadway = createPontDIenaRoadway(bridgeX, bridgeW, trocaderoQuayZ, -3.85, quayH + 0.065, streetMats);
  bridgeGroup.add(bridgeRoadway);

  // Bustling street traffic extending across bridge, through the arch, and down Champ de Mars
  const bridgeTraffic = createStreetTraffic(bridgeX, quayZ, trocaderoQuayZ, quayH + 0.065, streetMats);
  bridgeGroup.add(bridgeTraffic);

  // Pedestrian crowds along Pont d'Iéna sidewalks and esplanade
  const pedestrianPalette = [
    flagBlueMat, flagRedMat, flagWhiteMat, haussmannBalconyMat, carDarkMat,
    new THREE.MeshStandardMaterial({ color: '#c48b48', roughness: 0.6 }),
    new THREE.MeshStandardMaterial({ color: '#527b42', roughness: 0.6 }),
  ];
  const pedestrians = createPedestrians(bridgeX, -3.85, trocaderoQuayZ, quayH + 0.088, pedestrianPalette);
  bridgeGroup.add(pedestrians);

  // Carrousel de la Tour Eiffel (the Belle Époque carousel on the right quayside near Pont d'Iéna!)
  const carousel = createEiffelCarousel(bridgeX + 0.42, quayH + 0.05, quayZ - 0.22, streetMats);
  quayGroup.add(carousel);

  // Stone Balustrades on bridge flanks
  for (const bSign of [-1, 1]) {
    const balustrade = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.042, bridgeLengthZ + 0.06),
      parisStoneDarkMat
    );
    balustrade.position.set(bridgeX + bSign * (bridgeW / 2 - 0.015), quayH + 0.085, bridgeCenterZ);
    balustrade.castShadow = true;
    bridgeGroup.add(balustrade);
  }

  // 5 Classical Segmental Stone Arches spanning across the river
  const archZList = [0.20, 0.45, 0.70, 0.95, 1.20];
  for (const az of archZList) {
    const archR = 0.125;
    const archShape = new THREE.Shape();
    archShape.moveTo(-archR, 0);
    archShape.absarc(0, 0, archR, Math.PI, 0, false);
    archShape.lineTo(archR, -0.05);
    archShape.lineTo(-archR, -0.05);
    archShape.closePath();

    const archGeo = new THREE.ExtrudeGeometry(archShape, { depth: bridgeW - 0.02, bevelEnabled: false });
    archGeo.translate(0, 0, -(bridgeW - 0.02) / 2);
    archGeo.rotateY(Math.PI / 2);
    const archMesh = new THREE.Mesh(archGeo, parisStoneDarkMat);
    archMesh.position.set(bridgeX, quayH + 0.01, az);
    bridgeGroup.add(archMesh);

    // Carved Golden Imperial Eagle Medallions on bridge spandrels
    for (const sideSign of [-1, 1]) {
      const eagleMedallion = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.006, 16),
        eiffelGoldMat
      );
      eagleMedallion.rotation.z = Math.PI / 2;
      eagleMedallion.position.set(bridgeX + sideSign * (bridgeW / 2 + 0.003), quayH + 0.01, az);
      bridgeGroup.add(eagleMedallion);
    }
  }

  // 4 Bridge Piers with Tapered Triangular Cutwaters
  const pierZList = [0.325, 0.575, 0.825, 1.075];
  for (const pz of pierZList) {
    const pierMesh = new THREE.Mesh(
      new THREE.BoxGeometry(bridgeW + 0.06, quayH + 0.02, 0.10),
      parisStoneMat
    );
    pierMesh.position.set(bridgeX, (quayH + 0.02) / 2, pz);
    pierMesh.castShadow = true;
    bridgeGroup.add(pierMesh);

    // Cutwaters on both upstream (+X) and downstream (-X) sides
    for (const cSign of [-1, 1]) {
      const cutwater = new THREE.Mesh(
        new THREE.ConeGeometry(0.045, 0.08, 3),
        parisStoneDarkMat
      );
      cutwater.position.set(bridgeX + cSign * (bridgeW / 2 + 0.035), (quayH + 0.02) / 2, pz);
      cutwater.rotation.z = -cSign * (Math.PI / 2);
      bridgeGroup.add(cutwater);
    }
  }

  // 4 Monumental Equestrian Warrior Statues at the 4 Bridge Entrances:
  // (Gallic & Roman warriors on Left Bank, Greek & Arab warriors on Right Bank)
  const statuePositions = [
    { x: bridgeX - bridgeW / 2 - 0.035, z: quayZ + 0.015, rotY: Math.PI / 4 },
    { x: bridgeX + bridgeW / 2 + 0.035, z: quayZ + 0.015, rotY: -Math.PI / 4 },
    { x: bridgeX - bridgeW / 2 - 0.035, z: trocaderoQuayZ - 0.015, rotY: (3 * Math.PI) / 4 },
    { x: bridgeX + bridgeW / 2 + 0.035, z: trocaderoQuayZ - 0.015, rotY: -(3 * Math.PI) / 4 },
  ];

  for (const sp of statuePositions) {
    const statGroup = new THREE.Group();
    statGroup.position.set(sp.x, quayH + 0.05, sp.z);
    statGroup.rotation.y = sp.rotY;

    const ped = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.11, 0.12),
      parisStoneMat
    );
    ped.position.y = 0.055;
    ped.castShadow = true;
    statGroup.add(ped);

    const pedCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.105, 0.014, 0.135),
      parisStoneDarkMat
    );
    pedCap.position.y = 0.117;
    statGroup.add(pedCap);

    const horseBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.022, 0.065, 8),
      statueMat
    );
    horseBody.rotation.z = Math.PI / 3.2;
    horseBody.position.set(0, 0.16, 0);
    horseBody.castShadow = true;
    statGroup.add(horseBody);

    const horseHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.012, 0.045, 6),
      statueMat
    );
    horseHead.position.set(0.020, 0.19, 0);
    horseHead.rotation.z = -Math.PI / 6;
    statGroup.add(horseHead);

    const rider = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.011, 0.045, 6),
      statueMat
    );
    rider.position.set(-0.008, 0.185, 0);
    statGroup.add(rider);

    bridgeGroup.add(statGroup);
  }

  // Victorian Streetlamps along Pont d'Iéna
  for (let li = 0; li < 6; li++) {
    const lZ = quayZ + 0.12 + li * 0.22;
    for (const sideSign of [-1, 1]) {
      const lamp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.005, 0.08, 6),
        eiffelIronDarkMat
      );
      lamp.position.set(bridgeX + sideSign * (bridgeW / 2 - 0.012), quayH + 0.11, lZ);
      bridgeGroup.add(lamp);

      const lHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.006, 8, 6),
        new THREE.MeshStandardMaterial({ color: '#fff6d6', emissive: '#ffd073', emissiveIntensity: 0.4 })
      );
      lHead.position.set(bridgeX + sideSign * (bridgeW / 2 - 0.012), quayH + 0.15, lZ);
      bridgeGroup.add(lHead);
    }
  }

  // --------------------------------------------------------
  // SECONDARY UPSTREAM BRIDGE (Passerelle Debilly) at X = 1.45
  // Low segmental footbridge arch flush with the quayside
  // --------------------------------------------------------
  const bridge2X = 1.45;
  const bridge2Deck = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.035, bridgeLengthZ),
    parisStoneMat
  );
  bridge2Deck.position.set(bridge2X, quayH + 0.03, bridgeCenterZ);
  bridge2Deck.castShadow = true;
  bridgeGroup.add(bridge2Deck);

  const bridge2Arch = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.014, 6, 24, Math.PI * 0.45),
    eiffelIronDarkMat
  );
  bridge2Arch.rotation.y = Math.PI / 2;
  bridge2Arch.rotation.z = Math.PI * 0.275;
  bridge2Arch.position.set(bridge2X, quayH - 0.34, bridgeCenterZ);
  bridgeGroup.add(bridge2Arch);

  // ========================================================
  // 5. PERAHU WISATA SEINE (BATEAUX-MOUCHES CRUISE BOATS)
  // ========================================================
  // A. Primary Foreground Bateau-Mouche
  const foregroundBoat = new THREE.Group();
  foregroundBoat.name = 'ForegroundBateauMouche';
  foregroundBoat.position.set(-0.18, 0.025, 0.95);

  const boatLength = 0.92;
  const boatBeam = 0.24;
  const hullHeight = 0.068;

  const hullShape = new THREE.Shape();
  hullShape.moveTo(boatLength * 0.45, 0);
  hullShape.quadraticCurveTo(boatLength * 0.25, boatBeam / 2, 0, boatBeam / 2);
  hullShape.lineTo(-boatLength * 0.38, boatBeam / 2);
  hullShape.quadraticCurveTo(-boatLength * 0.46, boatBeam / 2, -boatLength * 0.46, 0);
  hullShape.quadraticCurveTo(-boatLength * 0.46, -boatBeam / 2, -boatLength * 0.38, -boatBeam / 2);
  hullShape.lineTo(0, -boatBeam / 2);
  hullShape.quadraticCurveTo(boatLength * 0.25, -boatBeam / 2, boatLength * 0.45, 0);
  hullShape.closePath();

  const hullUpperGeo = new THREE.ExtrudeGeometry(hullShape, {
    depth: hullHeight * 0.55,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.008,
    bevelThickness: 0.008,
  });
  hullUpperGeo.rotateX(Math.PI / 2);
  hullUpperGeo.translate(0, hullHeight * 0.55, 0);
  const hullUpperMesh = new THREE.Mesh(hullUpperGeo, boatHullWhiteMat);
  hullUpperMesh.castShadow = true;
  foregroundBoat.add(hullUpperMesh);

  const hullLowerGeo = new THREE.ExtrudeGeometry(hullShape, { depth: hullHeight * 0.45, bevelEnabled: false });
  hullLowerGeo.rotateX(Math.PI / 2);
  const hullLowerMesh = new THREE.Mesh(hullLowerGeo, boatHullDarkMat);
  foregroundBoat.add(hullLowerMesh);

  const rubRail = new THREE.Mesh(
    new THREE.BoxGeometry(boatLength * 0.94, 0.006, boatBeam * 1.04),
    boatSteelRailMat
  );
  rubRail.position.y = hullHeight * 0.60;
  foregroundBoat.add(rubRail);

  // Panoramic Curved Glass Canopy / Greenhouse Cabin
  const cabinLen = boatLength * 0.64;
  const cabinW = boatBeam * 0.82;
  const cabinH = 0.080;

  const glassCabin = new THREE.Mesh(
    new THREE.CylinderGeometry(cabinW / 2, cabinW / 2, cabinLen, 16, 1, false, 0, Math.PI),
    boatGlassMat
  );
  glassCabin.rotation.z = Math.PI / 2;
  glassCabin.rotation.y = Math.PI / 2;
  glassCabin.position.set(boatLength * 0.02, hullHeight + 0.005, 0);
  glassCabin.scale.set(1.0, cabinH / (cabinW / 2), 1.0);
  foregroundBoat.add(glassCabin);

  for (let ri = 0; ri < 7; ri++) {
    const rx = -cabinLen / 2 + (ri / 6) * cabinLen + boatLength * 0.02;
    const archRib = new THREE.Mesh(
      new THREE.TorusGeometry(cabinW / 2, 0.0035, 6, 16, Math.PI),
      boatHullWhiteMat
    );
    archRib.position.set(rx, hullHeight + 0.005, 0);
    archRib.rotation.y = Math.PI / 2;
    archRib.scale.set(1.0, cabinH / (cabinW / 2), 1.0);
    foregroundBoat.add(archRib);
  }

  // Forward Wheelhouse
  const bridgeCabin = new THREE.Mesh(
    new THREE.BoxGeometry(boatLength * 0.12, 0.055, boatBeam * 0.65),
    boatHullWhiteMat
  );
  bridgeCabin.position.set(boatLength * 0.35, hullHeight + 0.03, 0);
  bridgeCabin.castShadow = true;
  foregroundBoat.add(bridgeCabin);

  const bridgeGlass = new THREE.Mesh(
    new THREE.BoxGeometry(boatLength * 0.04, 0.035, boatBeam * 0.58),
    boatGlassMat
  );
  bridgeGlass.position.set(boatLength * 0.38, hullHeight + 0.045, 0);
  foregroundBoat.add(bridgeGlass);

  // Aft Observation Deck with Passengers
  const aftRail = new THREE.Mesh(
    new THREE.BoxGeometry(boatLength * 0.16, 0.032, boatBeam * 0.85),
    boatSteelRailMat
  );
  aftRail.position.set(-boatLength * 0.36, hullHeight + 0.016, 0);
  foregroundBoat.add(aftRail);

  for (let pi = 0; pi < 7; pi++) {
    const px = -boatLength * 0.30 - (pi % 3) * 0.035;
    const pz = (Math.floor(pi / 3) - 0.5) * (boatBeam * 0.45);
    const pass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.010, 0.045, 6),
      new THREE.MeshStandardMaterial({ color: pi % 2 === 0 ? '#b84232' : '#2b4468', roughness: 0.8 })
    );
    pass.position.set(px, hullHeight + 0.025, pz);
    pass.castShadow = true;
    foregroundBoat.add(pass);
  }

  // FRENCH TRICOLOR FLAG (BLEU-BLANC-ROUGE)
  const flagGroup = new THREE.Group();
  flagGroup.name = 'FrenchFlagGroup';
  flagGroup.position.set(-boatLength * 0.44, hullHeight + 0.015, 0);

  const staff = new THREE.Mesh(
    new THREE.CylinderGeometry(0.002, 0.003, 0.15, 6),
    boatSteelRailMat
  );
  staff.rotation.z = Math.PI / 4;
  staff.position.set(-0.04, 0.05, 0);
  flagGroup.add(staff);

  const flagW = 0.024;
  const flagH = 0.052;
  const flagBlue = new THREE.Mesh(new THREE.BoxGeometry(flagW, flagH, 0.002), flagBlueMat);
  flagBlue.position.set(-0.075, 0.085, 0);
  flagGroup.add(flagBlue);

  const flagWhite = new THREE.Mesh(new THREE.BoxGeometry(flagW, flagH, 0.002), flagWhiteMat);
  flagWhite.position.set(-0.075 - flagW, 0.085, 0);
  flagGroup.add(flagWhite);

  const flagRed = new THREE.Mesh(new THREE.BoxGeometry(flagW, flagH, 0.002), flagRedMat);
  flagRed.position.set(-0.075 - flagW * 2, 0.085, 0);
  flagGroup.add(flagRed);

  foregroundBoat.add(flagGroup);

  // Foamy Water Wake
  const wakeGroup = new THREE.Group();
  wakeGroup.position.set(-boatLength * 0.46, -0.015, 0);

  const wakeStern = new THREE.Mesh(
    new THREE.RingGeometry(0.02, 0.14, 16, 1, 0, Math.PI),
    riverFoamMat
  );
  wakeStern.rotation.x = -Math.PI / 2;
  wakeStern.rotation.z = Math.PI / 2;
  wakeGroup.add(wakeStern);

  for (const wSign of [-1, 1]) {
    const bowWave = new THREE.Mesh(
      new THREE.PlaneGeometry(boatLength * 0.85, 0.06),
      riverFoamMat
    );
    bowWave.rotation.x = -Math.PI / 2;
    bowWave.rotation.z = wSign * 0.18;
    bowWave.position.set(boatLength * 0.15, 0, wSign * (boatBeam * 0.65));
    wakeGroup.add(bowWave);
  }
  foregroundBoat.add(wakeGroup);

  boatsGroup.add(foregroundBoat);

  // B. Secondary Double-Decker Cruise Barge Moored at the Quayside
  const mooredBoat = new THREE.Group();
  mooredBoat.name = 'MooredQuaysideCruiser';
  mooredBoat.position.set(-0.35, 0.02, quayZ + 0.32);

  const mLen = 1.35;
  const mW = 0.24;
  const mH = 0.10;

  const mHull = new THREE.Mesh(
    new THREE.BoxGeometry(mLen, mH * 0.65, mW),
    boatHullWhiteMat
  );
  mHull.position.y = (mH * 0.65) / 2;
  mHull.castShadow = true;
  mooredBoat.add(mHull);

  for (let lbi = 0; lbi < 5; lbi++) {
    const lx = -mLen * 0.38 + lbi * 0.19;
    const buoy = new THREE.Mesh(
      new THREE.TorusGeometry(0.014, 0.004, 6, 12),
      boatRedAccentMat
    );
    buoy.position.set(lx, mH * 0.45, mW / 2 + 0.003);
    mooredBoat.add(buoy);
  }

  const mRail = new THREE.Mesh(
    new THREE.BoxGeometry(mLen * 0.95, 0.035, mW * 0.95),
    boatRedAccentMat
  );
  mRail.position.y = mH * 0.65 + 0.018;
  mooredBoat.add(mRail);

  for (let mi = 0; mi < 14; mi++) {
    const mx = -mLen * 0.42 + mi * 0.065;
    const mz = (Math.sin(mi * 2.5) * 0.5) * (mW * 0.65);
    const mPass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.009, 0.040, 5),
      new THREE.MeshStandardMaterial({
        color: mi % 3 === 0 ? '#c24b38' : mi % 3 === 1 ? '#e8d8b5' : '#2b4468',
        roughness: 0.85,
      })
    );
    mPass.position.set(mx, mH * 0.65 + 0.025, mz);
    mPass.castShadow = true;
    mooredBoat.add(mPass);
  }

  boatsGroup.add(mooredBoat);

  // ========================================================
  // 6. MENARA EIFFEL - direkonstruksi dari eiffel-tower24k.jpg
  // (lihat eiffelProfile.ts / eiffelTowerModel.ts; semua batang digabung per material)
  // ========================================================
  const towerBaseZ = quayZ - 0.78;
  const towerBaseX = 0.05;

  const eiffelTower = buildEiffelTower({
    iron: eiffelIronMat,
    ironDark: eiffelIronDarkMat,
    ironLight: eiffelIronHighlightMat,
    glass: eiffelGoldMat,
    stone: parisStoneDarkMat,
  });
  const tower = eiffelTower.group;
  tower.position.set(towerBaseX, quayH + 0.05, towerBaseZ);
  const beaconGroup = eiffelTower.beaconGroup;
  eiffelGroup.add(tower);

  // Pedestrian Esplanade, Quai Branly cross-street & security glass under the Eiffel Tower
  const underPlaza = createUnderTowerPlaza(towerBaseX, towerBaseZ, quayZ, quayH + 0.05, streetMats);
  eiffelGroup.add(underPlaza);

  // ========================================================
  // 7. POHON-POHON REALISTIS & LANSEKAP (TREES - GROUND & FRAMING)
  // ========================================================
  const treeMats: TreeMaterials = {
    bark: treeBarkMat,
    foliagePrimary: foliagePlaneTreeMat,
    foliageSecondary: foliageDarkMat,
    foliageHighlight: new THREE.MeshStandardMaterial({ color: '#528242', roughness: 0.82 }),
    foliagePurplePrimary: foliagePurpleMat,
    foliagePurpleLight: foliagePurpleLightMat,
  };

  // Ground Trees lining the quayside and riverbanks with purple flowering jacarandas (eiffel-under.jpg)
  const groundTreePositions = [
    { x: -1.45, z: quayZ - 0.22, r: 0.090, h: 0.22, flowering: true },
    { x: -1.05, z: quayZ - 0.22, r: 0.088, h: 0.21, flowering: true },
    { x: -0.65, z: quayZ - 0.22, r: 0.092, h: 0.23, flowering: false },
    { x: -0.25, z: quayZ - 0.22, r: 0.088, h: 0.22, flowering: false },
    { x:  0.25, z: quayZ - 0.22, r: 0.085, h: 0.21, flowering: false },
    { x:  0.85, z: quayZ - 0.22, r: 0.092, h: 0.23, flowering: true },
    { x:  1.25, z: quayZ - 0.22, r: 0.095, h: 0.24, flowering: true },
    { x: -0.65, z: towerBaseZ - 0.28, r: 0.115, h: 0.26, flowering: false },
    { x: -0.88, z: towerBaseZ + 0.15, r: 0.110, h: 0.25, flowering: false },
    { x: -0.98, z: towerBaseZ + 0.45, r: 0.120, h: 0.28, flowering: false },
    { x:  0.75, z: towerBaseZ - 0.28, r: 0.115, h: 0.26, flowering: false },
    { x:  0.98, z: towerBaseZ + 0.15, r: 0.110, h: 0.25, flowering: false },
    { x:  1.08, z: towerBaseZ + 0.45, r: 0.120, h: 0.28, flowering: false },
  ];

  for (const gp of groundTreePositions) {
    const gTree = createDetailedOrganicTree(gp.h, gp.r, treeMats, gp.flowering);
    gTree.position.set(gp.x, quayH + 0.05, gp.z);
    treesGroup.add(gTree);
  }

  // ========================================================
  // 8. TROCADÉRO ESPLANADE & JARDINS (back-eiffel.png)
  // Super-Detailed reconstruction of the elevated Trocadéro terrace,
  // the exact geometric nested square tile paving, balustrade,
  // and the Fontaine de Varsovie mirror pool with water cannons!
  // ========================================================
  const trocBaseY = quayH + 0.16; // 0.42 - Elevated plaza level

  // A. Grand Base Slab of the Esplanade du Trocadéro
  const trocBaseSlab = new THREE.Mesh(
    new THREE.BoxGeometry(4.40, 0.22, 2.70),
    parisStoneMat
  );
  trocBaseSlab.position.set(0.05, trocBaseY - 0.11, 3.15);
  trocBaseSlab.receiveShadow = true;
  trocaderoGroup.add(trocBaseSlab);

  // B. The Iconic Geometric Checkered Tile Floor (from back-eiffel.png)
  // Reconstructing the exact nested square paving tiles seen under the model's feet:
  // Light cream/beige limestone slab + dark slate/granite concentric border frame + inner square!
  const tileCols = 13; // along X symmetrically centered on 0.05
  const tileRows = 8;  // along Z from 2.05 to 4.15
  const tileSize = 0.26;
  const tileStep = 0.29;
  const startX = 0.05 - ((tileCols - 1) * tileStep) / 2;
  const startZ = 2.05;

  for (let ci = 0; ci < tileCols; ci++) {
    const tx = startX + ci * tileStep;
    for (let ri = 0; ri < tileRows; ri++) {
      const tz = startZ + ri * tileStep;

      // 1. Base light cream stone tile
      const baseTile = new THREE.Mesh(
        new THREE.BoxGeometry(tileSize, 0.006, tileSize),
        trocaderoTileLightMat
      );
      baseTile.position.set(tx, trocBaseY + 0.003, tz);
      baseTile.receiveShadow = true;
      trocaderoGroup.add(baseTile);

      // 2. Concentric nested dark border frame (dark slate inlay)
      const darkFrame = new THREE.Mesh(
        new THREE.BoxGeometry(tileSize * 0.86, 0.007, tileSize * 0.86),
        trocaderoTileDarkMat
      );
      darkFrame.position.set(tx, trocBaseY + 0.0035, tz);
      darkFrame.receiveShadow = true;
      trocaderoGroup.add(darkFrame);

      // 3. Inner light center tile
      const innerTile = new THREE.Mesh(
        new THREE.BoxGeometry(tileSize * 0.66, 0.008, tileSize * 0.66),
        trocaderoTileLightMat
      );
      innerTile.position.set(tx, trocBaseY + 0.004, tz);
      innerTile.receiveShadow = true;
      trocaderoGroup.add(innerTile);

      // 4. Center dark accent square
      const centerDot = new THREE.Mesh(
        new THREE.BoxGeometry(tileSize * 0.18, 0.009, tileSize * 0.18),
        trocaderoTileDarkMat
      );
      centerDot.position.set(tx, trocBaseY + 0.0045, tz);
      centerDot.receiveShadow = true;
      trocaderoGroup.add(centerDot);
    }
  }

  // C. Front Viewing Terrace Parapet & Low Ledge (Z = 1.95)
  // Low parapet overlooking the fountains below, framing the Eiffel Tower
  const balustradeZ = 1.95;
  const parapetW = 3.80;

  const topRail = new THREE.Mesh(
    new THREE.BoxGeometry(parapetW, 0.024, 0.045),
    parisStoneDarkMat
  );
  topRail.position.set(0.05, trocBaseY + 0.038, balustradeZ);
  topRail.castShadow = true;
  trocaderoGroup.add(topRail);

  const bottomCurb = new THREE.Mesh(
    new THREE.BoxGeometry(parapetW, 0.018, 0.055),
    parisStoneMat
  );
  bottomCurb.position.set(0.05, trocBaseY + 0.008, balustradeZ);
  bottomCurb.receiveShadow = true;
  trocaderoGroup.add(bottomCurb);

  // Stone Balusters along the parapet
  for (let bi = 0; bi < 46; bi++) {
    const bx = -1.80 + bi * 0.08;
    const baluster = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.030, 6),
      parisStoneMat
    );
    baluster.position.set(bx, trocBaseY + 0.023, balustradeZ);
    baluster.castShadow = true;
    trocaderoGroup.add(baluster);
  }

  // Intermediate Pier Pedestals with Carved Stone Finials
  for (let pi = 0; pi < 9; pi++) {
    const px = -1.80 + pi * 0.45;
    const pier = new THREE.Mesh(
      new THREE.BoxGeometry(0.060, 0.046, 0.060),
      parisStoneDarkMat
    );
    pier.position.set(px, trocBaseY + 0.023, balustradeZ);
    pier.castShadow = true;
    trocaderoGroup.add(pier);
  }

  // Trimmed Hedges on Terrace Edge (as seen in back-eiffel.png)
  for (const hSign of [-1, 1]) {
    const edgeHedge = new THREE.Mesh(
      new THREE.BoxGeometry(1.20, 0.035, 0.08),
      foliagePlaneTreeMat
    );
    edgeHedge.position.set(0.05 + hSign * 1.15, trocBaseY + 0.055, balustradeZ - 0.03);
    trocaderoGroup.add(edgeHedge);
  }

  // D. Curved Wings of Palais de Chaillot (East & West Wings flanking the Plaza)
  for (const wingSign of [-1, 1]) {
    const wingCurve = new THREE.Group();
    wingCurve.position.set(0.05 + wingSign * 1.65, trocBaseY, 2.75);

    // Curved colonnade pavilion building
    const wingBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.38, 1.15),
      haussmannFacadeMat
    );
    wingBlock.position.set(wingSign * 0.22, 0.19, 0);
    wingBlock.castShadow = true;
    wingBlock.receiveShadow = true;
    wingCurve.add(wingBlock);

    // Roof cornice & balustrade
    const wingRoof = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.035, 1.18),
      haussmannRoofMat
    );
    wingRoof.position.set(wingSign * 0.22, 0.395, 0);
    wingCurve.add(wingRoof);

    // Neo-classical Doric Columns lining the curved terrace
    for (let ci = 0; ci < 6; ci++) {
      const colZ = -0.45 + ci * 0.18;
      const colMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.014, 0.32, 8),
        parisStoneMat
      );
      colMesh.position.set(-wingSign * 0.02, 0.16, colZ);
      colMesh.castShadow = true;
      wingCurve.add(colMesh);
    }

    trocaderoGroup.add(wingCurve);
  }

  // E. Jardins du Trocadéro (Sloping park down to the Seine)
  // Sloping green lawns flanking the central axis
  const trocGardenSlope = new THREE.Mesh(
    new THREE.BoxGeometry(3.30, 0.06, 0.70),
    champDeMarsGrassMat
  );
  trocGardenSlope.position.set(0.05, (trocBaseY + quayH) / 2 - 0.02, 1.75);
  trocGardenSlope.rotation.x = 0.15; // Slopes gently towards the river
  trocGardenSlope.receiveShadow = true;
  trocaderoGroup.add(trocGardenSlope);

  // F. Fontaine de Varsovie (Central Mirror Pool & Water Cannon Jets)
  // The iconic central rectangular basin between Trocadéro and Pont d'Iéna
  const basinLength = 0.65;
  const basinWidth = 0.46;
  const basinY = quayH + 0.04;

  const basinPool = new THREE.Mesh(
    new THREE.BoxGeometry(basinWidth, 0.035, basinLength),
    riverWaterMat
  );
  basinPool.position.set(0.05, basinY, 1.75);
  basinPool.receiveShadow = true;
  trocaderoGroup.add(basinPool);

  const basinCurb = new THREE.Mesh(
    new THREE.BoxGeometry(basinWidth + 0.06, 0.045, basinLength + 0.06),
    parisStoneDarkMat
  );
  basinCurb.position.set(0.05, basinY - 0.01, 1.75);
  basinCurb.receiveShadow = true;
  trocaderoGroup.add(basinCurb);

  // Stepped Cascades at upper end of Fontaine de Varsovie
  for (let csi = 0; csi < 3; csi++) {
    const cascadeLedge = new THREE.Mesh(
      new THREE.BoxGeometry(basinWidth * 0.85, 0.025, 0.06),
      parisStoneMat
    );
    cascadeLedge.position.set(0.05, basinY + 0.025 + csi * 0.022, 2.05 - csi * 0.055);
    cascadeLedge.receiveShadow = true;
    trocaderoGroup.add(cascadeLedge);

    const cascadeFoam = new THREE.Mesh(
      new THREE.BoxGeometry(basinWidth * 0.82, 0.008, 0.04),
      riverFoamMat
    );
    cascadeFoam.position.set(0.05, basinY + 0.038 + csi * 0.022, 2.05 - csi * 0.055);
    trocaderoGroup.add(cascadeFoam);
  }

  // 8 Angled Brass Water Cannon Nozzles shooting water arches toward the center
  for (let fi = 0; fi < 4; fi++) {
    const fz = 1.55 + fi * 0.12;
    for (const fSign of [-1, 1]) {
      const nozzle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.005, 0.025, 6),
        eiffelGoldMat
      );
      nozzle.position.set(0.05 + fSign * (basinWidth / 2 - 0.015), basinY + 0.02, fz);
      nozzle.rotation.z = -fSign * (Math.PI / 4);
      trocaderoGroup.add(nozzle);

      // Water jet arc curve
      const jetArc = new THREE.Mesh(
        new THREE.TorusGeometry(0.055, 0.0025, 4, 12, Math.PI / 1.6),
        riverFoamMat
      );
      jetArc.position.set(0.05 + fSign * (basinWidth / 2 - 0.05), basinY + 0.035, fz);
      jetArc.rotation.z = fSign > 0 ? Math.PI / 4 : (3 * Math.PI) / 4;
      jetArc.rotation.y = fSign > 0 ? 0 : Math.PI;
      trocaderoGroup.add(jetArc);
    }
  }

  // Pruned Parisian Trees flanking the Trocadéro Gardens
  for (let ti = 0; ti < 4; ti++) {
    const tz = 1.50 + ti * 0.16;
    for (const sideSign of [-1, 1]) {
      const tTree = createDetailedOrganicTree(0.12, 0.075, treeMats, ti % 2 === 1);
      tTree.position.set(0.05 + sideSign * 0.42, quayH + 0.08, tz);
      trocaderoGroup.add(tTree);
    }
  }

  // ========================================================
  // 9. VAST CHAMP DE MARS & PARK AXIS (left-right-eiffel.png)
  // Super-Detailed reconstruction of the immense park extending behind
  // the Eiffel Tower, the 4 grand lawn panels, quadruple tree avenues,
  // gravel crosswalks, sports oval, and École Militaire boundary!
  // ========================================================
  const champBaseY = quayH + 0.05; // 0.31

  // A. Main Gravel Ground Plate of Champ de Mars
  const champGround = new THREE.Mesh(
    new THREE.BoxGeometry(1.60, 0.04, 2.80),
    gravelPathMat
  );
  champGround.position.set(0.05, champBaseY - 0.02, -2.50);
  champGround.receiveShadow = true;
  champDeMarsGroup.add(champGround);

  // B. 4 Grand Lawn Panels (Pelouse du Champ de Mars)
  // Deep lush green rectangular lawns separated by transversal walkways
  const lawnPanels = [
    { z: -1.48, len: 0.52 },
    { z: -2.12, len: 0.52 },
    { z: -2.76, len: 0.52 },
    { z: -3.40, len: 0.52 },
  ];

  const lawnWidth = 0.52;
  for (const lp of lawnPanels) {
    const lawn = new THREE.Mesh(
      new THREE.BoxGeometry(lawnWidth, 0.008, lp.len),
      champDeMarsGrassMat
    );
    lawn.position.set(0.05, champBaseY + 0.004, lp.z);
    lawn.receiveShadow = true;
    champDeMarsGroup.add(lawn);

    // Stone curbing frame around lawn
    const curb = new THREE.Mesh(
      new THREE.BoxGeometry(lawnWidth + 0.03, 0.012, lp.len + 0.03),
      parisStoneDarkMat
    );
    curb.position.set(0.05, champBaseY + 0.003, lp.z);
    champDeMarsGroup.add(curb);

    // Low wrought-iron park fencing posts around lawn corners
    for (const fx of [-lawnWidth / 2, lawnWidth / 2]) {
      for (const fz of [-lp.len / 2, lp.len / 2]) {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.002, 0.002, 0.035, 4),
          eiffelIronDarkMat
        );
        post.position.set(0.05 + fx, champBaseY + 0.018, lp.z + fz);
        champDeMarsGroup.add(post);
      }
    }
  }

  // C. Quadruple Manicured Tree Avenues (Allées d'Arbres from left-right-eiffel.png)
  // 4 parallel lines of trees on each side (total 36 trees in French classical alignment!)
  const treeRowZStart = -1.25;
  const treeCount = 9;
  const treeStepZ = 0.28;

  const treeAvenueXList = [
    0.05 - 0.35, // Left Inner Avenue (Allée Adrienne Lecouvreur)
    0.05 - 0.52, // Left Outer Avenue (Allée des Refuges)
    0.05 + 0.35, // Right Inner Avenue (Allée Paul Deschanel)
    0.05 + 0.52, // Right Outer Avenue (Allée Thomy Thierry)
  ];

  for (const ax of treeAvenueXList) {
    for (let ti = 0; ti < treeCount; ti++) {
      const az = treeRowZStart - ti * treeStepZ;
      const cTree = createPleachedAvenueTree(0.14, 0.16, 0.13, 0.16, treeMats, ti);
      cTree.position.set(ax, champBaseY, az);
      champDeMarsGroup.add(cTree);
    }
  }

  // D. Centre Sportif Émile Anthoine (Sports Ground from left-right-eiffel.png)
  // The iconic terracotta-red running track oval with green infield on the right flank!
  const sportsGroup = new THREE.Group();
  sportsGroup.position.set(1.30, champBaseY, -0.75);

  // Red clay / polyurethane athletic running track oval
  const trackRadiusX = 0.22;
  const trackRadiusZ = 0.26;
  const trackWidth = 0.06;

  const trackShape = new THREE.Shape();
  trackShape.absellipse(0, 0, trackRadiusX, trackRadiusZ, 0, Math.PI * 2, false, 0);
  const trackHole = new THREE.Path();
  trackHole.absellipse(0, 0, trackRadiusX - trackWidth, trackRadiusZ - trackWidth, 0, Math.PI * 2, true, 0);
  trackShape.holes.push(trackHole);

  const trackGeo = new THREE.ShapeGeometry(trackShape);
  trackGeo.rotateX(-Math.PI / 2);
  const trackMesh = new THREE.Mesh(trackGeo, sportsTrackRedMat);
  trackMesh.position.y = 0.006;
  trackMesh.receiveShadow = true;
  sportsGroup.add(trackMesh);

  // Green football/sports pitch infield
  const infieldShape = new THREE.Shape();
  infieldShape.absellipse(0, 0, trackRadiusX - trackWidth, trackRadiusZ - trackWidth, 0, Math.PI * 2, false, 0);
  const infieldGeo = new THREE.ShapeGeometry(infieldShape);
  infieldGeo.rotateX(-Math.PI / 2);
  const infieldMesh = new THREE.Mesh(infieldGeo, sportsFieldGreenMat);
  infieldMesh.position.y = 0.005;
  infieldMesh.receiveShadow = true;
  sportsGroup.add(infieldMesh);

  // Sports grandstand building
  const grandstand = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.06, 0.32),
    haussmannFacadeMat
  );
  grandstand.position.set(trackRadiusX + 0.06, 0.03, 0);
  grandstand.castShadow = true;
  sportsGroup.add(grandstand);

  champDeMarsGroup.add(sportsGroup);

  // E. École Militaire Boundary Colonnade at far end of Champ de Mars (Z = -3.85)
  const ecoleGroup = new THREE.Group();
  ecoleGroup.position.set(0.05, champBaseY, -3.85);

  const ecoleBase = new THREE.Mesh(
    new THREE.BoxGeometry(1.60, 0.18, 0.22),
    haussmannFacadeMat
  );
  ecoleBase.position.y = 0.09;
  ecoleBase.castShadow = true;
  ecoleGroup.add(ecoleBase);

  const ecoleRoof = new THREE.Mesh(
    new THREE.BoxGeometry(1.62, 0.065, 0.24),
    haussmannRoofMat
  );
  ecoleRoof.position.y = 0.21;
  ecoleGroup.add(ecoleRoof);

  // Central Classical Pediment & Dome
  const ecoleDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    haussmannRoofMat
  );
  ecoleDome.position.y = 0.24;
  ecoleGroup.add(ecoleDome);

  champDeMarsGroup.add(ecoleGroup);

  // ========================================================
  // 10. PARISIAN HAUSSMANN CITY BLOCKS & SKYLINE (left-right-eiffel.png)
  // Reconstructing the dense Parisian 7th & 16th arrondissement architecture,
  // 6-story limestone facades, dark wrought-iron continuous balconies,
  // blue-grey zinc mansard roofs, terracotta chimneys, and Tour Montparnasse!
  // ========================================================
  const haussmannMats: HaussmannMaterials = {
    facade: haussmannFacadeMat,
    facadeLight: haussmannFacadeLightMat,
    stoneDark: parisStoneDarkMat,
    roof: haussmannRoofMat,
    balcony: haussmannBalconyMat,
    window: haussmannWindowMat,
    chimney: haussmannChimneyMat,
    woodDoor: haussmannDoorMat,
  };

  // A. Left Flank City Blocks (Avenue de la Bourdonnais — 7th Arrondissement)
  // Detailed 6-story Haussmann apartment blocks with distinct floors, balconies, dormers
  const leftBlocksZ = [-0.95, -1.68, -2.42, -3.18];
  for (const lz of leftBlocksZ) {
    const block = createDetailedHaussmannBlock(0.85, 0.62, 0.36, haussmannMats, { hasShopfronts: true });
    block.position.set(-1.38, champBaseY, lz);
    cityBlocksGroup.add(block);
  }

  // B. Right Flank City Blocks (Avenue de Suffren — 15th Arrondissement)
  const rightBlocksZ = [-1.55, -2.35, -3.15];
  for (const rz of rightBlocksZ) {
    const block = createDetailedHaussmannBlock(0.85, 0.65, 0.36, haussmannMats, { hasShopfronts: true });
    block.position.set(1.48, champBaseY, rz);
    cityBlocksGroup.add(block);
  }

  // C. Golden-lit Background Parisian Cityscape & Skyline (as seen in eiffel-under.jpg)
  const bgCity = createParisBackgroundCityscape(haussmannMats);
  bgCity.position.y = champBaseY;
  cityBlocksGroup.add(bgCity);

  // C. Distant Horizon Skyline Accent (Subtle low skyline silhouette)
  const montparnasseGroup = new THREE.Group();
  montparnasseGroup.position.set(2.45, champBaseY, -4.65);

  const montTowerH = 0.24;
  const montTowerW = 0.16;
  const montTowerD = 0.12;

  const montShaft = new THREE.Mesh(
    new THREE.BoxGeometry(montTowerW, montTowerH, montTowerD),
    montparnasseMat
  );
  montShaft.position.y = montTowerH / 2;
  montShaft.castShadow = true;
  montparnasseGroup.add(montShaft);

  // Chamfered corner columns of Tour Montparnasse
  for (const cx of [-montTowerW / 2, montTowerW / 2]) {
    for (const cz of [-montTowerD / 2, montTowerD / 2]) {
      const cornerFin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, montTowerH, 6),
        montparnasseRoofMat
      );
      cornerFin.position.set(cx, montTowerH / 2, cz);
      montparnasseGroup.add(cornerFin);
    }
  }

  // Observation Roof Terrace
  const montRoof = new THREE.Mesh(
    new THREE.BoxGeometry(montTowerW + 0.015, 0.025, montTowerD + 0.015),
    montparnasseRoofMat
  );
  montRoof.position.y = montTowerH + 0.012;
  montparnasseGroup.add(montRoof);

  cityBlocksGroup.add(montparnasseGroup);

  // D. Sea of Distant Parisian Rooftops fading into the horizon
  const distantRoofGroup = new THREE.Mesh(
    new THREE.BoxGeometry(4.80, 0.16, 0.85),
    haussmannFacadeMat
  );
  distantRoofGroup.position.set(0.05, champBaseY + 0.08, -4.65);
  cityBlocksGroup.add(distantRoofGroup);

  const distantRoofZinc = new THREE.Mesh(
    new THREE.BoxGeometry(4.82, 0.045, 0.87),
    haussmannRoofMat
  );
  distantRoofZinc.position.set(0.05, champBaseY + 0.18, -4.65);
  cityBlocksGroup.add(distantRoofZinc);

  const materials: Record<string, THREE.Material> = {
    eiffelIronMat,
    eiffelIronDarkMat,
    eiffelIronHighlightMat,
    eiffelGoldMat,
    eiffelRivetMat,
    eiffelCableMat,
    riverWaterMat,
    riverFoamMat,
    parisStoneMat,
    parisStoneDarkMat,
    statueMat,
    boatHullWhiteMat,
    boatHullDarkMat,
    boatGlassMat,
    boatSteelRailMat,
    boatRedAccentMat,
    flagBlueMat,
    flagWhiteMat,
    flagRedMat,
    foliagePlaneTreeMat,
    foliageDarkMat,
    treeBarkMat,
    tentCanvasMat,
    trocaderoTileLightMat,
    trocaderoTileDarkMat,
    champDeMarsGrassMat,
    gravelPathMat,
    sportsTrackRedMat,
    sportsFieldGreenMat,
    haussmannFacadeMat,
    haussmannFacadeLightMat,
    haussmannRoofMat,
    haussmannBalconyMat,
    haussmannWindowMat,
    haussmannChimneyMat,
    montparnasseMat,
    montparnasseRoofMat,
  };

  const controls: ParisModelControls = {
    setSunTime: (_val: number) => {},
    setWaterSpeed: (_val: number) => {},
  };

  return {
    root,
    materials,
    pivots: {
      foregroundBoat,
      flagGroup,
      waterMesh,
      beaconGroup,
    },
    controls,
    tick: (_delta: number, elapsed: number) => {
      // 1. River water wave ripple displacement
      for (let i = 0; i < posAttr.count; i++) {
        const u = posAttr.getX(i);
        const v = posAttr.getZ(i);
        const wave =
          Math.sin(u * 5.0 + elapsed * 2.2) * 0.005 +
          Math.cos(v * 4.0 + elapsed * 1.8) * 0.004;
        posAttr.setY(i, originalY[i] + wave);
      }
      posAttr.needsUpdate = true;

      // 2. Gentle cruise boat floating & bobbing physics
      const boatPitch = Math.sin(elapsed * 1.8) * 0.015;
      const boatRoll = Math.cos(elapsed * 1.4) * 0.012;
      const boatHeave = Math.sin(elapsed * 2.0) * 0.004;
      foregroundBoat.position.y = 0.025 + boatHeave;
      foregroundBoat.rotation.x = boatPitch;
      foregroundBoat.rotation.z = boatRoll;

      // 3. French Flag waving animation in the river breeze
      flagGroup.rotation.y = Math.sin(elapsed * 4.5) * 0.12;
      flagGroup.rotation.z = Math.sin(elapsed * 3.8) * 0.08;

      // 4. Eiffel Tower Summit Rotating Light Beacon
      beaconGroup.rotation.y = elapsed * 1.5;
    },
  };
}
