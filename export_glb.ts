import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createRaceCarModel } from './src/model/raceCarModel';
import { createCoinModel } from './src/model/coinModel';
import { createTntModel } from './src/model/tntModel';
import { createRoadModel } from './src/model/roadModel';
import { createJetModel } from './src/model/jetModel';
import { createSagradaModel } from './src/model/sagradaModel';
import { createParisModel } from './src/model/parisModel';
import fs from 'fs';
import path from 'path';

// Polyfill FileReader for Node.js environment
class NodeFileReader {
  onload: any = null;
  onloadend: any = null;
  onerror: any = null;
  result: any = null;
  async readAsArrayBuffer(blob: any) {
    try {
      this.result = await blob.arrayBuffer();
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    } catch (err) {
      if (this.onerror) this.onerror(err);
    }
  }
}
(globalThis as any).FileReader = NodeFileReader;

const exporter = new GLTFExporter();

const baseDir = import.meta.dirname || path.resolve('.');

const EXPORT_DIRS = [
  path.resolve(baseDir, '..', 'exports'),
  path.resolve(baseDir, 'public', 'models'),
  path.resolve(baseDir),
];

for (const dir of EXPORT_DIRS) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Optimizes a model by merging geometries sharing the same material.
 * Reduces mesh count by 90% (eliminates WebGL lag in Construct 3).
 */
function optimizeModel(root: THREE.Object3D): THREE.Group {
  const matMap = new Map<THREE.Material, THREE.BufferGeometry[]>();
  root.updateWorldMatrix(true, true);

  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.Material;
      const geom = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      geom.applyMatrix4(mesh.matrixWorld);

      if (!geom.attributes.normal) {
        geom.computeVertexNormals();
      }
      // Keep only position and normal so all geometries with the same material merge cleanly
      for (const attrName of Object.keys(geom.attributes)) {
        if (attrName !== 'position' && attrName !== 'normal') {
          geom.deleteAttribute(attrName);
        }
      }

      if (!matMap.has(mat)) {
        matMap.set(mat, []);
      }
      matMap.get(mat)!.push(geom);
    }
  });

  const optimizedGroup = new THREE.Group();
  optimizedGroup.name = root.name;

  for (const [mat, geoms] of matMap.entries()) {
    if (geoms.length === 1) {
      const m = new THREE.Mesh(geoms[0], mat);
      optimizedGroup.add(m);
    } else {
      const merged = mergeGeometries(geoms, false);
      if (merged) {
        const m = new THREE.Mesh(merged, mat);
        optimizedGroup.add(m);
      }
    }
  }

  return optimizedGroup;
}

async function exportModel(names: string[], root: THREE.Object3D) {
  const opt = optimizeModel(root);
  const gltf = await exporter.parseAsync(opt, { binary: true });
  const buf = Buffer.from(gltf as ArrayBuffer);

  for (const name of names) {
    for (const dir of EXPORT_DIRS) {
      const filePath = path.join(dir, `${name}.glb`);
      fs.writeFileSync(filePath, buf);
    }
    console.log(`SUCCESS: ${name}.glb exported! Size: ${buf.length} bytes (Meshes: ${opt.children.length})`);
  }
}

async function main() {
  console.log('--- EXPORTING OPTIMIZED MODELS FOR CONSTRUCT 3 (.GLB) ---');

  // 1. Mobil Balap (Race Car)
  const car = createRaceCarModel();
  await exportModel(['mobil', 'raceCar', 'car'], car.root);

  // 2. Koin Jalanan (Coin Pickup)
  const coin = createCoinModel();
  await exportModel(['koin', 'coin'], coin.root);

  // 3. Jebakan TNT (TNT Trap)
  const tnt = createTntModel();
  await exportModel(['tnt', 'tntTrap'], tnt.root);

  // 4. Segmen Jalanan (Road Track Segment)
  const road = createRoadModel(3.2, 1.65);
  await exportModel(['jalan', 'roadSegment', 'road'], road.root);

  // 5. Jet Tempur MiG-23 (Fighter Jet)
  const jet = createJetModel();
  await exportModel(['jet', 'mig23'], jet.root);

  // 6. Basílica de la Sagrada Família (Antoni Gaudí)
  const sagrada = createSagradaModel();
  await exportModel(['sagrada', 'sagradaFamilia'], sagrada.root);

  // 7. Paris (Menara Eiffel, Sungai Seine, Jembatan & Bateau-Mouche)
  const paris = createParisModel();
  await exportModel(['paris', 'eiffelParis'], paris.root);

  console.log('--------------------------------------------------');
  console.log('SEMUA MODEL OPTIMAL BERHASIL DI-EXPORT KE .GLB!');
}

main().catch(console.error);
