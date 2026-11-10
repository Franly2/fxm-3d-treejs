import * as THREE from 'three';

/**
 * Procedural Realistic Paris Trees & Foliage Generator
 * Produces organic multi-cluster trees, flowering jacaranda/lilac trees (from eiffel-under.jpg),
 * and classical pleached/clipped French topiary plane trees for Champ de Mars.
 */

export interface TreeMaterials {
  bark: THREE.Material;
  foliagePrimary: THREE.Material;
  foliageSecondary: THREE.Material;
  foliageHighlight: THREE.Material;
  foliagePurplePrimary?: THREE.Material;
  foliagePurpleLight?: THREE.Material;
}

/**
 * Detailed organic shade tree with branching limbs and 7-9 layered foliage clusters.
 */
export function createDetailedOrganicTree(
  trunkH: number,
  crownR: number,
  mats: TreeMaterials,
  isFlowering = false
): THREE.Group {
  const tree = new THREE.Group();

  const rTrunkBot = crownR * 0.16;
  const rTrunkTop = crownR * 0.10;

  // 1. Root flare & main trunk
  const trunkGeo = new THREE.CylinderGeometry(rTrunkTop, rTrunkBot, trunkH, 7);
  const trunk = new THREE.Mesh(trunkGeo, mats.bark);
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  // 2. Structural branches splitting from the upper trunk
  const branchAngles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
  for (let i = 0; i < 3; i++) {
    const angle = branchAngles[i] + (i * 0.2);
    const branchLen = trunkH * 0.45;
    const branchGeo = new THREE.CylinderGeometry(rTrunkTop * 0.45, rTrunkTop * 0.8, branchLen, 5);
    const branch = new THREE.Mesh(branchGeo, mats.bark);
    branch.position.set(
      Math.cos(angle) * rTrunkTop * 0.8,
      trunkH * 0.82,
      Math.sin(angle) * rTrunkTop * 0.8
    );
    branch.rotation.z = Math.cos(angle) * 0.55;
    branch.rotation.x = -Math.sin(angle) * 0.55;
    branch.castShadow = true;
    tree.add(branch);
  }

  // 3. Multi-cluster volumetric canopy (7-9 intersecting organic foliage clusters)
  const primaryMat = isFlowering
    ? (mats.foliagePurplePrimary ?? mats.foliagePrimary)
    : mats.foliagePrimary;
  const secMat = isFlowering
    ? (mats.foliagePurpleLight ?? mats.foliageSecondary)
    : mats.foliageSecondary;
  const highMat = mats.foliageHighlight;

  const clusterOffsets = [
    { x: 0, y: trunkH + crownR * 0.55, z: 0, r: crownR * 0.85, mat: highMat }, // Top central dome
    { x: crownR * 0.38, y: trunkH + crownR * 0.42, z: crownR * 0.25, r: crownR * 0.68, mat: primaryMat },
    { x: -crownR * 0.42, y: trunkH + crownR * 0.38, z: crownR * 0.22, r: crownR * 0.65, mat: secMat },
    { x: -crownR * 0.15, y: trunkH + crownR * 0.45, z: -crownR * 0.40, r: crownR * 0.70, mat: primaryMat },
    { x: crownR * 0.35, y: trunkH + crownR * 0.32, z: -crownR * 0.32, r: crownR * 0.62, mat: secMat },
    { x: crownR * 0.12, y: trunkH + crownR * 0.15, z: crownR * 0.38, r: crownR * 0.52, mat: primaryMat },
    { x: -crownR * 0.32, y: trunkH + crownR * 0.18, z: -crownR * 0.22, r: crownR * 0.54, mat: secMat },
  ];

  for (const c of clusterOffsets) {
    const clusterGeo = new THREE.DodecahedronGeometry(c.r, 1);
    const cluster = new THREE.Mesh(clusterGeo, c.mat);
    cluster.position.set(c.x, c.y, c.z);
    cluster.scale.set(1.0, 0.88, 1.05);
    cluster.castShadow = true;
    cluster.receiveShadow = true;
    tree.add(cluster);
  }

  return tree;
}

/**
 * Classical Parisian pleached/cubic clipped plane tree (Allée d'arbres taillés en rideau)
 * Used along the grand pedestrian allées of Champ de Mars.
 */
export function createPleachedAvenueTree(
  trunkH: number,
  canopyW: number,
  canopyH: number,
  canopyD: number,
  mats: TreeMaterials,
  shadeIndex = 0
): THREE.Group {
  const tree = new THREE.Group();

  // Slender vertical dark trunk
  const trunkGeo = new THREE.CylinderGeometry(0.010, 0.015, trunkH, 6);
  const trunk = new THREE.Mesh(trunkGeo, mats.bark);
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  tree.add(trunk);

  // Forked branch supports
  for (const sx of [-1, 1]) {
    const forkGeo = new THREE.CylinderGeometry(0.006, 0.009, trunkH * 0.32, 5);
    const fork = new THREE.Mesh(forkGeo, mats.bark);
    fork.position.set(sx * 0.018, trunkH * 0.88, 0);
    fork.rotation.z = -sx * 0.35;
    tree.add(fork);
  }

  // Layered manicured cubic canopy - segmented vertically to prevent any Z-fighting/coplanar artifacts
  const primaryMat = shadeIndex % 2 === 0 ? mats.foliagePrimary : mats.foliageSecondary;
  const mainBodyH = canopyH * 0.78;
  const topCapH = canopyH * 0.22;

  // 1. Lower main clipped cubic foliage block
  const crownGeo = new THREE.BoxGeometry(canopyW, mainBodyH, canopyD);
  const crown = new THREE.Mesh(crownGeo, primaryMat);
  crown.position.y = trunkH + mainBodyH / 2;
  crown.castShadow = true;
  crown.receiveShadow = true;
  tree.add(crown);

  // 2. Upper sunlit beveled topiary tier (sits cleanly above main body, zero coplanar overlap)
  const topCapGeo = new THREE.BoxGeometry(canopyW * 0.86, topCapH, canopyD * 0.86);
  const topCap = new THREE.Mesh(topCapGeo, mats.foliageHighlight);
  topCap.position.y = trunkH + mainBodyH + topCapH / 2;
  topCap.castShadow = true;
  topCap.receiveShadow = true;
  tree.add(topCap);

  return tree;
}

