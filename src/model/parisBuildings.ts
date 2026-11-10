import * as THREE from 'three';

/**
 * Procedural Multi-Story Parisian Haussmann Buildings & Background Skyline
 * Reconstructs authentic 6-story Parisian limestone apartment blocks with:
 * - Rusticated ground floor & entresol with shopfronts & porte-cochère doors
 * - 2nd floor (Étage Noble) with continuous wrought-iron balcony & pediments
 * - 3rd & 4th floors with framed French windows & stone stringcourses
 * - 5th floor with continuous wrought-iron balcony & dentil cornice
 * - 6th floor sloping zinc mansard roof with dormer windows (lucarnes)
 * - Terracotta chimney stacks & pots along party walls
 */

export interface HaussmannMaterials {
  facade: THREE.Material;
  facadeLight: THREE.Material;
  stoneDark: THREE.Material;
  roof: THREE.Material;
  balcony: THREE.Material;
  window: THREE.Material;
  windowLit?: THREE.Material;
  chimney: THREE.Material;
  woodDoor?: THREE.Material;
}

export function createDetailedHaussmannBlock(
  w: number,
  d: number,
  h: number,
  mats: HaussmannMaterials,
  options?: {
    facadeLight?: boolean;
    hasShopfronts?: boolean;
  }
): THREE.Group {
  const block = new THREE.Group();

  const facadeMat = options?.facadeLight ? mats.facadeLight : mats.facade;
  const stoneMat = mats.facade;
  const stoneDarkMat = mats.stoneDark;
  const roofMat = mats.roof;
  const balconyMat = mats.balcony;
  const windowMat = mats.window;
  const doorMat = mats.woodDoor ?? stoneDarkMat;

  // ----------------------------------------------------
  // Floor Heights Partition (Total Height = h)
  // ----------------------------------------------------
  const hGround = h * 0.22;   // Rez-de-chaussée (taller commercial ground floor)
  const hEntresol = h * 0.14; // Entresol (mezzanine)
  const hFloor2 = h * 0.18;   // Étage Noble (tall French windows)
  const hFloor3 = h * 0.15;   // 3ème étage
  const hFloor4 = h * 0.15;   // 4ème étage
  const hFloor5 = h * 0.16;   // 5ème étage

  const yFloor1 = hGround;
  const yFloor2 = yFloor1 + hEntresol;
  const yFloor3 = yFloor2 + hFloor2;
  const yFloor4 = yFloor3 + hFloor3;
  const yFloor5 = yFloor4 + hFloor4;
  const yRoof = h;

  // 1. Main Structural Facade Core
  const coreGeo = new THREE.BoxGeometry(w, h, d);
  const coreMesh = new THREE.Mesh(coreGeo, facadeMat);
  coreMesh.position.y = h / 2;
  coreMesh.castShadow = true;
  coreMesh.receiveShadow = true;
  block.add(coreMesh);

  // 2. Rusticated Ground Floor Base (Bossage continu)
  const rustBase = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.008, hGround, d + 0.008),
    stoneDarkMat
  );
  rustBase.position.y = hGround / 2;
  rustBase.castShadow = true;
  block.add(rustBase);

  // 3. Horizontal Cornices / Stringcourses (Moulures & Corniches)
  // Entresol stringcourse
  const corniceEntresol = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.018, 0.010, d + 0.018),
    stoneDarkMat
  );
  corniceEntresol.position.y = yFloor2;
  block.add(corniceEntresol);

  // Floor 3 stringcourse
  const corniceF3 = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.012, 0.008, d + 0.012),
    stoneDarkMat
  );
  corniceF3.position.y = yFloor3;
  block.add(corniceF3);

  // Floor 4 stringcourse
  const corniceF4 = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.010, 0.006, d + 0.010),
    stoneDarkMat
  );
  corniceF4.position.y = yFloor4;
  block.add(corniceF4);

  // Roof Dentil Cornice (grand projecting cornice below roof)
  const corniceRoof = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.024, 0.016, d + 0.024),
    stoneMat
  );
  corniceRoof.position.y = yRoof;
  corniceRoof.castShadow = true;
  block.add(corniceRoof);

  // 4. Continuous Wrought-Iron Balconies (Balcons filants en fer forgé)
  // 2nd Floor (Étage Noble) Continuous Balcony
  const balc2Floor = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.026, 0.016, d + 0.026),
    balconyMat
  );
  balc2Floor.position.y = yFloor2 + 0.008;
  block.add(balc2Floor);

  // 5th Floor Continuous Balcony
  const balc5Floor = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.024, 0.015, d + 0.024),
    balconyMat
  );
  balc5Floor.position.y = yFloor5 + 0.008;
  block.add(balc5Floor);

  // ----------------------------------------------------
  // 5. Window Bays Along the Front and Back Facades (along X axis)
  // ----------------------------------------------------
  const bayCountX = Math.max(3, Math.floor(w / 0.11));
  const bayPitchX = w / bayCountX;

  for (let bi = 0; bi < bayCountX; bi++) {
    const bayX = -w / 2 + (bi + 0.5) * bayPitchX;

    for (const sideSign of [-1, 1]) {
      const zPos = sideSign * (d / 2 + 0.004);

      // Floor 0: Porte-cochère (center) or shopfront windows
      if (bi === Math.floor(bayCountX / 2)) {
        // Carriage Porte-Cochère Entrance
        const door = new THREE.Mesh(
          new THREE.BoxGeometry(bayPitchX * 0.65, hGround * 0.85, 0.014),
          doorMat
        );
        door.position.set(bayX, (hGround * 0.85) / 2, zPos);
        block.add(door);
      } else {
        // Ground floor display window
        const shopWin = new THREE.Mesh(
          new THREE.BoxGeometry(bayPitchX * 0.58, hGround * 0.68, 0.010),
          windowMat
        );
        shopWin.position.set(bayX, hGround * 0.45, zPos);
        block.add(shopWin);
      }

      // Floor 1 (Entresol window)
      const win1 = new THREE.Mesh(
        new THREE.BoxGeometry(bayPitchX * 0.45, hEntresol * 0.65, 0.008),
        windowMat
      );
      win1.position.set(bayX, yFloor1 + hEntresol * 0.50, zPos);
      block.add(win1);

      // Floor 2 (Étage Noble French Window)
      const win2 = new THREE.Mesh(
        new THREE.BoxGeometry(bayPitchX * 0.48, hFloor2 * 0.78, 0.008),
        windowMat
      );
      win2.position.set(bayX, yFloor2 + hFloor2 * 0.52, zPos);
      block.add(win2);

      // Classical stone pediment above 2nd floor window
      const ped = new THREE.Mesh(
        new THREE.BoxGeometry(bayPitchX * 0.52, 0.008, 0.012),
        stoneDarkMat
      );
      ped.position.set(bayX, yFloor2 + hFloor2 * 0.94, zPos);
      block.add(ped);

      // Floor 3 Window + Individual balcony guardrail
      const win3 = new THREE.Mesh(
        new THREE.BoxGeometry(bayPitchX * 0.46, hFloor3 * 0.72, 0.008),
        windowMat
      );
      win3.position.set(bayX, yFloor3 + hFloor3 * 0.50, zPos);
      block.add(win3);

      const balc3 = new THREE.Mesh(
        new THREE.BoxGeometry(bayPitchX * 0.50, 0.012, 0.012),
        balconyMat
      );
      balc3.position.set(bayX, yFloor3 + 0.008, zPos);
      block.add(balc3);

      // Floor 4 Window + Individual balcony guardrail
      const win4 = new THREE.Mesh(
        new THREE.BoxGeometry(bayPitchX * 0.46, hFloor4 * 0.72, 0.008),
        windowMat
      );
      win4.position.set(bayX, yFloor4 + hFloor4 * 0.50, zPos);
      block.add(win4);

      const balc4 = new THREE.Mesh(
        new THREE.BoxGeometry(bayPitchX * 0.50, 0.012, 0.012),
        balconyMat
      );
      balc4.position.set(bayX, yFloor4 + 0.008, zPos);
      block.add(balc4);

      // Floor 5 Window
      const win5 = new THREE.Mesh(
        new THREE.BoxGeometry(bayPitchX * 0.46, hFloor5 * 0.72, 0.008),
        windowMat
      );
      win5.position.set(bayX, yFloor5 + hFloor5 * 0.50, zPos);
      block.add(win5);
    }
  }

  // ----------------------------------------------------
  // 6. Sloping Zinc Mansard Roof (Toit Mansardé en Zinc)
  // ----------------------------------------------------
  const hMansard = h * 0.28;
  const roofGeo = new THREE.BoxGeometry(w - 0.02, hMansard, d - 0.02);
  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.position.y = yRoof + hMansard / 2;
  roofMesh.castShadow = true;
  block.add(roofMesh);

  // Roof Ridge Cresting (zinc / wrought iron ridge)
  const ridgeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(w - 0.04, 0.012, 0.014),
    balconyMat
  );
  ridgeMesh.position.y = yRoof + hMansard + 0.006;
  block.add(ridgeMesh);

  // Dormer Windows (Lucarnes de toit) aligned with window bays
  for (let bi = 0; bi < bayCountX; bi++) {
    const bayX = -w / 2 + (bi + 0.5) * bayPitchX;

    for (const sideSign of [-1, 1]) {
      const dormerGroup = new THREE.Group();
      dormerGroup.position.set(bayX, yRoof + hMansard * 0.45, sideSign * (d / 2 - 0.01));

      const dBody = new THREE.Mesh(
        new THREE.BoxGeometry(bayPitchX * 0.40, hMansard * 0.65, 0.022),
        stoneMat
      );
      dormerGroup.add(dBody);

      const dWin = new THREE.Mesh(
        new THREE.BoxGeometry(bayPitchX * 0.30, hMansard * 0.45, 0.010),
        windowMat
      );
      dWin.position.set(0, -0.002, sideSign * 0.012);
      dormerGroup.add(dWin);

      const dRoof = new THREE.Mesh(
        new THREE.ConeGeometry(bayPitchX * 0.26, 0.024, 4),
        roofMat
      );
      dRoof.position.y = hMansard * 0.38;
      dRoof.rotation.y = Math.PI / 4;
      dormerGroup.add(dRoof);

      block.add(dormerGroup);
    }
  }

  // ----------------------------------------------------
  // 7. Terracotta Chimney Pots & Stacks (Cheminées en terre cuite)
  // ----------------------------------------------------
  const chimCountZ = Math.max(3, Math.floor(d / 0.18));
  for (let ci = 0; ci < chimCountZ; ci++) {
    const chimZ = -d / 2 + 0.09 + ci * 0.18;
    for (const cxSign of [-1, 1]) {
      const chimStack = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.038, 0.040),
        stoneDarkMat
      );
      chimStack.position.set(cxSign * (w / 2 - 0.035), yRoof + hMansard + 0.015, chimZ);
      block.add(chimStack);

      // Terracotta cylindrical pots on the stack
      for (const cpZ of [-0.010, 0.010]) {
        const pot = new THREE.Mesh(
          new THREE.CylinderGeometry(0.005, 0.006, 0.022, 6),
          mats.chimney
        );
        pot.position.set(cxSign * (w / 2 - 0.035), yRoof + hMansard + 0.042, chimZ + cpZ);
        block.add(pot);
      }
    }
  }

  return block;
}

/**
 * Creates the dense golden-lit background Parisian cityscape behind Champ de Mars (as seen in eiffel-under.jpg)
 */
export function createParisBackgroundCityscape(
  mats: HaussmannMaterials
): THREE.Group {
  const city = new THREE.Group();

  // Rows of Parisian multi-story apartment buildings bathed in warm evening sunlight
  const bgZ = -4.25;
  const buildingDefs = [
    { x: -2.2, w: 0.95, d: 0.45, h: 0.34 },
    { x: -1.2, w: 0.90, d: 0.42, h: 0.38 },
    { x: -0.3, w: 0.85, d: 0.40, h: 0.32 },
    { x:  0.6, w: 0.88, d: 0.42, h: 0.36 },
    { x:  1.5, w: 0.92, d: 0.45, h: 0.40 },
    { x:  2.4, w: 0.95, d: 0.45, h: 0.35 },
  ];

  for (const bDef of buildingDefs) {
    const b = createDetailedHaussmannBlock(bDef.w, bDef.d, bDef.h, mats, { facadeLight: true });
    b.position.set(bDef.x, 0, bgZ);
    city.add(b);
  }

  // Second distant layer for immense atmospheric depth
  const farZ = -4.75;
  const farDefs = [
    { x: -2.6, w: 1.1, d: 0.4, h: 0.42 },
    { x: -1.4, w: 1.2, d: 0.4, h: 0.44 },
    { x:  0.0, w: 1.4, d: 0.4, h: 0.40 },
    { x:  1.5, w: 1.2, d: 0.4, h: 0.45 },
    { x:  2.7, w: 1.1, d: 0.4, h: 0.42 },
  ];

  for (const fDef of farDefs) {
    const fb = createDetailedHaussmannBlock(fDef.w, fDef.d, fDef.h, mats, { facadeLight: false });
    fb.position.set(fDef.x, 0, farZ);
    city.add(fb);
  }

  return city;
}

