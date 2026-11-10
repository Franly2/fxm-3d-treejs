import * as THREE from 'three';

/**
 * Procedural Pont d'Iéna Roadway, Street Traffic, Pedestrians, and Belle Époque Carousel
 * Strict fidelity to eiffel-under.jpg:
 * - Two-lane asphalt roadway across Pont d'Iéna with white dashed center line & solid curb lines
 * - Pedestrian sidewalks, stone curbs, Victorian cast-iron streetlamps, and zebra crossings
 * - Moving street traffic: white tour van, Parisian taxis, sedans with headlights & taillights
 * - Pedestrian visitor crowds along the bridge & esplanade
 * - Carrousel de la Tour Eiffel (the Belle Époque carousel with striped conical canopy & lights)
 * - Quai Branly cross-street and esplanade beneath the Eiffel Tower arch
 */

export interface StreetMaterials {
  asphalt: THREE.Material;
  roadLineWhite: THREE.Material;
  stone: THREE.Material;
  stoneDark: THREE.Material;
  ironDark: THREE.Material;
  glass: THREE.Material;
  headlight: THREE.Material;
  taillight: THREE.Material;
  carWhite: THREE.Material;
  carDark: THREE.Material;
  carRed: THREE.Material;
  carSilver: THREE.Material;
  carouselStripeRed: THREE.Material;
  carouselStripeCream: THREE.Material;
  carouselGold: THREE.Material;
  carouselLight: THREE.Material;
}

/**
 * Creates the Grand Continuous Avenue from Pont d'Iéna, through under the Eiffel Tower arch,
 * and extending all the way through Champ de Mars to the École Militaire at the very back (Z = -3.85).
 */
export function createPontDIenaRoadway(
  bridgeX: number,
  bridgeW: number,
  zStart: number,
  zEnd: number,
  roadY: number,
  mats: StreetMaterials
): THREE.Group {
  const roadGroup = new THREE.Group();
  const roadLen = zStart - zEnd; // e.g. 1.35 - (-3.85) = 5.20
  const zMid = (zStart + zEnd) / 2;
  const driveLaneW = 0.22;

  // 1. Dark Asphalt Roadway Surface extending continuously to the back
  const asphalt = new THREE.Mesh(
    new THREE.BoxGeometry(driveLaneW, 0.012, roadLen),
    mats.asphalt
  );
  asphalt.position.set(bridgeX, roadY + 0.006, zMid);
  asphalt.receiveShadow = true;
  roadGroup.add(asphalt);

  // 2. Continuous Dashed White Center Line (Lane Divider) all the way to the back
  const dashCount = Math.floor(roadLen / 0.12);
  const dashLen = 0.06;
  for (let i = 0; i < dashCount; i++) {
    const dashZ = zEnd + 0.06 + i * 0.12;
    const dash = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.002, dashLen),
      mats.roadLineWhite
    );
    dash.position.set(bridgeX, roadY + 0.013, dashZ);
    roadGroup.add(dash);
  }

  // 3. Solid White Edge Lines along Curbs
  for (const sideSign of [-1, 1]) {
    const edgeLine = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.002, roadLen),
      mats.roadLineWhite
    );
    edgeLine.position.set(bridgeX + sideSign * (driveLaneW / 2 - 0.008), roadY + 0.013, zMid);
    roadGroup.add(edgeLine);
  }

  // 4. Zebra Pedestrian Crossings at Key Crossings along the entire axis
  const crosswalkZs = [
    zStart - 0.05,       // Pont d'Iéna north entrance (1.30)
    0.08,                // Pont d'Iéna south entrance / quayside
    -0.12,               // Quai Branly cross-street
    -0.35,               // Eiffel Tower North Plinths entrance
    -1.12,               // Eiffel Tower South Plinths exit
    -1.95,               // Champ de Mars central lawn crosswalk
    -2.85,               // Champ de Mars south lawn crosswalk
    zEnd + 0.10,         // École Militaire entrance plaza (-3.75)
  ];

  for (const cwZ of crosswalkZs) {
    for (let s = -4; s <= 4; s++) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.002, 0.045),
        mats.roadLineWhite
      );
      stripe.position.set(bridgeX + s * 0.022, roadY + 0.013, cwZ);
      roadGroup.add(stripe);
    }
  }

  // 5. Paved Stone Sidewalks (Trottoirs) on Left & Right
  const sidewalkW = (bridgeW - driveLaneW) / 2;
  for (const sideSign of [-1, 1]) {
    const swX = bridgeX + sideSign * (driveLaneW / 2 + sidewalkW / 2);

    // Sidewalk slab
    const sidewalk = new THREE.Mesh(
      new THREE.BoxGeometry(sidewalkW, 0.024, roadLen),
      mats.stone
    );
    sidewalk.position.set(swX, roadY + 0.012, zMid);
    sidewalk.receiveShadow = true;
    roadGroup.add(sidewalk);

    // Beveled curb stone (bordure de trottoir)
    const curb = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.026, roadLen),
      mats.stoneDark
    );
    curb.position.set(bridgeX + sideSign * (driveLaneW / 2 + 0.006), roadY + 0.013, zMid);
    roadGroup.add(curb);
  }

  // 6. Victorian Streetlamps along the avenue to the very back
  const lampCount = 20;
  const lampStep = roadLen / lampCount;
  for (let li = 0; li < lampCount; li++) {
    const lampZ = zEnd + 0.15 + li * lampStep;
    for (const sideSign of [-1, 1]) {
      const lampX = bridgeX + sideSign * (bridgeW / 2 - 0.012);
      const lampPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.005, 0.08, 6),
        mats.ironDark
      );
      lampPost.position.set(lampX, roadY + 0.05, lampZ);
      roadGroup.add(lampPost);

      const lampHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.005, 6, 6),
        mats.carouselLight
      );
      lampHead.position.set(lampX, roadY + 0.09, lampZ);
      roadGroup.add(lampHead);
    }
  }

  return roadGroup;
}

/**
 * Creates a detailed vehicle (van or car) with body, cabin, wheels, headlights, and taillights
 */
function createCar(
  carType: 'van' | 'sedan' | 'compact',
  paintMat: THREE.Material,
  mats: StreetMaterials
): THREE.Group {
  const car = new THREE.Group();
  const isVan = carType === 'van';
  const isCompact = carType === 'compact';

  const len = isVan ? 0.12 : isCompact ? 0.075 : 0.095;
  const width = isVan ? 0.048 : 0.042;
  const height = isVan ? 0.052 : 0.032;

  // Lower chassis
  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(width, height * 0.55, len),
    paintMat
  );
  chassis.position.y = height * 0.32;
  chassis.castShadow = true;
  car.add(chassis);

  // Cabin / Greenhouse
  const cabinLen = isVan ? len * 0.85 : len * 0.55;
  const cabinH = height * 0.52;
  const cabinW = width * 0.90;
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(cabinW, cabinH, cabinLen),
    mats.glass
  );
  cabin.position.set(0, height * 0.72, isVan ? 0.005 : -len * 0.08);
  cabin.castShadow = true;
  car.add(cabin);

  // Cabin Roof
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(cabinW + 0.002, 0.005, cabinLen + 0.002),
    paintMat
  );
  roof.position.set(0, height * 0.98, isVan ? 0.005 : -len * 0.08);
  car.add(roof);

  // 4 Wheels
  const wheelR = 0.009;
  const wheelW = 0.006;
  const wheelGeo = new THREE.CylinderGeometry(wheelR, wheelR, wheelW, 8);
  wheelGeo.rotateZ(Math.PI / 2);

  const wheelZOffsets = [-len * 0.32, len * 0.32];
  for (const wz of wheelZOffsets) {
    for (const wx of [-width / 2, width / 2]) {
      const wheel = new THREE.Mesh(wheelGeo, mats.ironDark);
      wheel.position.set(wx, wheelR, wz);
      car.add(wheel);
    }
  }

  // Headlights (facing -Z by default, pointing forward)
  for (const hx of [-width * 0.35, width * 0.35]) {
    const hl = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.006, 0.004),
      mats.headlight
    );
    hl.position.set(hx, height * 0.35, -len / 2 - 0.002);
    car.add(hl);
  }

  // Taillights (facing +Z, rear)
  for (const tx of [-width * 0.35, width * 0.35]) {
    const tl = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.006, 0.004),
      mats.taillight
    );
    tl.position.set(tx, height * 0.38, len / 2 + 0.002);
    car.add(tl);
  }

  return car;
}

/**
 * Creates the bustling traffic across Pont d'Iéna and Quai Branly (as seen in eiffel-under.jpg)
 */
export function createStreetTraffic(
  bridgeX: number,
  quayZ: number,
  trocaderoQuayZ: number,
  roadY: number,
  mats: StreetMaterials
): THREE.Group {
  const trafficGroup = new THREE.Group();

  // Traffic across Pont d'Iéna
  // Northbound Lane (towards Tower / -Z direction): X = bridgeX - 0.055
  // Southbound Lane (towards Trocadéro / +Z direction): X = bridgeX + 0.055

  // 1. Prominent White Tour Van (prominent in eiffel-under.jpg!)
  const whiteVan = createCar('van', mats.carWhite, mats);
  whiteVan.position.set(bridgeX - 0.055, roadY + 0.012, 0.65);
  whiteVan.rotation.y = 0; // driving towards Tower
  trafficGroup.add(whiteVan);

  // 2. Black Parisian Taxi / Sedan
  const blackTaxi = createCar('sedan', mats.carDark, mats);
  blackTaxi.position.set(bridgeX - 0.055, roadY + 0.012, 0.98);
  trafficGroup.add(blackTaxi);

  // 3. Silver Sedan (southbound)
  const silverCar = createCar('sedan', mats.carSilver, mats);
  silverCar.position.set(bridgeX + 0.055, roadY + 0.012, 0.45);
  silverCar.rotation.y = Math.PI; // driving towards Trocadéro
  trafficGroup.add(silverCar);

  // 4. Red Compact Car (southbound)
  const redCar = createCar('compact', mats.carRed, mats);
  redCar.position.set(bridgeX + 0.055, roadY + 0.012, 0.85);
  redCar.rotation.y = Math.PI;
  trafficGroup.add(redCar);

  // 5. Traffic passing directly UNDER the Eiffel Tower arch
  const underCar1 = createCar('sedan', mats.carWhite, mats);
  underCar1.position.set(bridgeX - 0.055, roadY + 0.012, -0.55);
  underCar1.rotation.y = 0; // driving toward Champ de Mars
  trafficGroup.add(underCar1);

  const underCar2 = createCar('sedan', mats.carDark, mats);
  underCar2.position.set(bridgeX + 0.055, roadY + 0.012, -0.92);
  underCar2.rotation.y = Math.PI; // driving toward bridge
  trafficGroup.add(underCar2);

  // 6. Traffic along Champ de Mars Avenue all the way to École Militaire
  const champCar1 = createCar('compact', mats.carRed, mats);
  champCar1.position.set(bridgeX - 0.055, roadY + 0.012, -1.85);
  champCar1.rotation.y = 0;
  trafficGroup.add(champCar1);

  const champCar2 = createCar('sedan', mats.carSilver, mats);
  champCar2.position.set(bridgeX + 0.055, roadY + 0.012, -2.65);
  champCar2.rotation.y = Math.PI;
  trafficGroup.add(champCar2);

  const champVan = createCar('van', mats.carWhite, mats);
  champVan.position.set(bridgeX - 0.055, roadY + 0.012, -3.25);
  champVan.rotation.y = 0;
  trafficGroup.add(champVan);

  // Traffic on Quai Branly (perpendicular avenue)
  const quaiCar1 = createCar('sedan', mats.carWhite, mats);
  quaiCar1.position.set(-0.45, roadY + 0.012, quayZ - 0.18);
  quaiCar1.rotation.y = Math.PI / 2;
  trafficGroup.add(quaiCar1);

  const quaiCar2 = createCar('sedan', mats.carDark, mats);
  quaiCar2.position.set(0.55, roadY + 0.012, quayZ - 0.18);
  quaiCar2.rotation.y = -Math.PI / 2;
  trafficGroup.add(quaiCar2);

  return trafficGroup;
}

/**
 * Creates groups of pedestrian figures walking on sidewalks
 */
export function createPedestrians(
  bridgeX: number,
  zStart: number,
  zEnd: number,
  walkY: number,
  palette: THREE.Material[]
): THREE.Group {
  const pGroup = new THREE.Group();
  const roadLen = zEnd - zStart;
  const count = 38;

  for (let i = 0; i < count; i++) {
    const side = (i % 2 === 0) ? -1 : 1;
    const px = bridgeX + side * (0.13 + (Math.sin(i * 3.7) * 0.025));
    const pz = zStart + 0.08 + ((i * 1.618) % 1) * (roadLen - 0.16);

    const mat = palette[i % palette.length];
    const person = new THREE.Group();
    person.position.set(px, walkY, pz);

    // Body
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0035, 0.0045, 0.024, 5),
      mat
    );
    body.position.y = 0.012;
    person.add(body);

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.003, 5, 4),
      mat
    );
    head.position.y = 0.027;
    person.add(head);

    pGroup.add(person);
  }

  return pGroup;
}

/**
 * The Iconic Belle Époque Carousel (Carrousel de la Tour Eiffel)
 * Visible on the right quayside near Pont d'Iéna in eiffel-under.jpg!
 */
export function createEiffelCarousel(
  posX: number,
  posY: number,
  posZ: number,
  mats: StreetMaterials
): THREE.Group {
  const carousel = new THREE.Group();
  carousel.position.set(posX, posY, posZ);

  const r = 0.095;
  const deckH = 0.018;

  // 1. Octagonal / Circular elevated wooden base platform
  const baseGeo = new THREE.CylinderGeometry(r + 0.015, r + 0.022, deckH, 16);
  const baseMesh = new THREE.Mesh(baseGeo, mats.stoneDark);
  baseMesh.position.y = deckH / 2;
  carousel.add(baseMesh);

  // Deck floor
  const floorGeo = new THREE.CylinderGeometry(r, r, 0.006, 16);
  const floorMesh = new THREE.Mesh(floorGeo, mats.stone);
  floorMesh.position.y = deckH + 0.003;
  carousel.add(floorMesh);

  // 2. Central Mirrored Column
  const colGeo = new THREE.CylinderGeometry(r * 0.32, r * 0.32, 0.065, 8);
  const colMesh = new THREE.Mesh(colGeo, mats.carouselGold);
  colMesh.position.y = deckH + 0.035;
  carousel.add(colMesh);

  // 3. Carousel Horses on Brass Poles
  const horseCount = 8;
  for (let hi = 0; hi < horseCount; hi++) {
    const angle = (hi * Math.PI * 2) / horseCount;
    const hr = r * 0.65;
    const hx = Math.cos(angle) * hr;
    const hz = Math.sin(angle) * hr;

    // Brass vertical pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0015, 0.0015, 0.065, 5),
      mats.carouselGold
    );
    pole.position.set(hx, deckH + 0.035, hz);
    carousel.add(pole);

    // Stylized horse figure
    const horse = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.012, 0.022),
      mats.carWhite
    );
    horse.position.set(hx, deckH + 0.028 + Math.sin(hi * 1.5) * 0.008, hz);
    horse.rotation.y = angle + Math.PI / 2;
    carousel.add(horse);
  }

  // 4. Perimeter Ornate Structural Columns supporting the canopy
  const pillarCount = 8;
  for (let pi = 0; pi < pillarCount; pi++) {
    const angle = (pi * Math.PI * 2) / pillarCount;
    const px = Math.cos(angle) * (r - 0.008);
    const pz = Math.sin(angle) * (r - 0.008);

    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.002, 0.002, 0.065, 5),
      mats.carouselGold
    );
    pillar.position.set(px, deckH + 0.035, pz);
    carousel.add(pillar);
  }

  // 5. Scalloped Valance / Eaves Fascia (Crimson & Gold Trim)
  const valanceGeo = new THREE.CylinderGeometry(r + 0.004, r + 0.004, 0.014, 16, 1, true);
  const valance = new THREE.Mesh(valanceGeo, mats.carouselStripeRed);
  valance.position.y = deckH + 0.070;
  carousel.add(valance);

  // Warm perimeter fairy lights
  for (let li = 0; li < 16; li++) {
    const lAngle = (li * Math.PI * 2) / 16;
    const lx = Math.cos(lAngle) * (r + 0.006);
    const lz = Math.sin(lAngle) * (r + 0.006);
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(0.0025, 4, 4),
      mats.carouselLight
    );
    light.position.set(lx, deckH + 0.068, lz);
    carousel.add(light);
  }

  // 6. Conical Striped Canvas Roof (Crimson & Cream)
  const roofH = 0.055;
  const coneGeo = new THREE.ConeGeometry(r + 0.008, roofH, 16);
  const coneMesh = new THREE.Mesh(coneGeo, mats.carouselStripeCream);
  coneMesh.position.y = deckH + 0.070 + roofH / 2;
  carousel.add(coneMesh);

  // Red accent stripes over the cone
  const coneStripeGeo = new THREE.ConeGeometry(r + 0.009, roofH, 8);
  const coneStripe = new THREE.Mesh(coneStripeGeo, mats.carouselStripeRed);
  coneStripe.position.y = deckH + 0.070 + roofH / 2;
  carousel.add(coneStripe);

  // 7. Golden Finial / Spire
  const finial = new THREE.Mesh(
    new THREE.CylinderGeometry(0.002, 0.005, 0.024, 6),
    mats.carouselGold
  );
  finial.position.y = deckH + 0.070 + roofH + 0.012;
  carousel.add(finial);

  return carousel;
}

/**
 * Creates the pedestrian plaza and Quai Branly road directly under and in front of the Eiffel Tower
 */
export function createUnderTowerPlaza(
  towerX: number,
  towerZ: number,
  quayZ: number,
  groundY: number,
  mats: StreetMaterials
): THREE.Group {
  const plazaGroup = new THREE.Group();

  // 1. Quai Branly cross-street asphalt roadway (spanning east-west along X)
  const roadW = 0.16;
  const roadLenX = 6.8;
  const roadZ = quayZ - 0.16;

  const quaiRoad = new THREE.Mesh(
    new THREE.BoxGeometry(roadLenX, 0.012, roadW),
    mats.asphalt
  );
  quaiRoad.position.set(0, groundY + 0.006, roadZ);
  quaiRoad.receiveShadow = true;
  plazaGroup.add(quaiRoad);

  // White lane lines on Quai Branly
  const quaiLine = new THREE.Mesh(
    new THREE.BoxGeometry(roadLenX, 0.002, 0.006),
    mats.roadLineWhite
  );
  quaiLine.position.set(0, groundY + 0.013, roadZ);
  plazaGroup.add(quaiLine);

  // Wide Zebra Crossing directly linking Pont d'Iéna to Eiffel Tower Plaza
  for (let s = -6; s <= 6; s++) {
    const zStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.002, roadW * 0.85),
      mats.roadLineWhite
    );
    zStripe.position.set(towerX + s * 0.026, groundY + 0.013, roadZ);
    plazaGroup.add(zStripe);
  }

  // 2. Stone Plaza beneath the 4 legs of the Eiffel Tower
  const plazaSpan = 1.35;
  const plazaSlab = new THREE.Mesh(
    new THREE.BoxGeometry(plazaSpan, 0.014, plazaSpan),
    mats.stone
  );
  plazaSlab.position.set(towerX, groundY + 0.007, towerZ);
  plazaSlab.receiveShadow = true;
  plazaGroup.add(plazaSlab);

  // Decorative border curbs around the esplanade
  for (const signX of [-1, 1]) {
    const curbX = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.018, plazaSpan),
      mats.stoneDark
    );
    curbX.position.set(towerX + signX * (plazaSpan / 2), groundY + 0.010, towerZ);
    plazaGroup.add(curbX);
  }
  for (const signZ of [-1, 1]) {
    const curbZ = new THREE.Mesh(
      new THREE.BoxGeometry(plazaSpan, 0.018, 0.018),
      mats.stoneDark
    );
    curbZ.position.set(towerX, groundY + 0.010, towerZ + signZ * (plazaSpan / 2));
    plazaGroup.add(curbZ);
  }

  // 3. Security Glass Balustrades & Access Gates
  for (const gz of [towerZ + plazaSpan / 2 - 0.04, towerZ - plazaSpan / 2 + 0.04]) {
    const glassWall = new THREE.Mesh(
      new THREE.BoxGeometry(plazaSpan * 0.85, 0.028, 0.004),
      mats.glass
    );
    glassWall.position.set(towerX, groundY + 0.020, gz);
    plazaGroup.add(glassWall);
  }

  return plazaGroup;
}

