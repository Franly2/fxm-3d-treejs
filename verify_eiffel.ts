import * as THREE from 'three';
import { buildEiffelTower } from './src/model/eiffelTowerModel';
import {
  EIFFEL_DECK2_TOP, EIFFEL_GROUND_Y, EIFFEL_LEG_BELTS, EIFFEL_SHAFT_BELTS, legOuter, shaftHalfWidth,
} from './src/model/eiffelProfile';

const mk = (name: string) => new THREE.MeshStandardMaterial({ name });
const tower = buildEiffelTower({
  iron: mk('iron'), ironDark: mk('ironDark'), ironLight: mk('ironLight'), glass: mk('glass'), stone: mk('stone'),
});

// Silhouette: proyeksi depan (sumbu x) dari geometri hasil merge, dalam piksel gambar.
tower.group.scale.setScalar(1);
tower.group.updateMatrixWorld(true);
const GY = EIFFEL_GROUND_Y;
const left = new Map<number, number>();
const right = new Map<number, number>();
tower.group.traverse((o) => {
  const mesh = o as THREE.Mesh;
  if (!mesh.isMesh || !mesh.geometry.attributes.position) return;
  const pos = mesh.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = Math.round(GY - pos.getY(i));
    left.set(y, Math.min(left.get(y) ?? 1e9, x));
    right.set(y, Math.max(right.get(y) ?? -1e9, x));
  }
});
const edge = (y: number) => {
  for (let d = 0; d < 12; d++) {
    for (const yy of [y - d, y + d]) {
      if (left.has(yy)) return { l: left.get(yy)!, r: right.get(yy)! };
    }
  }
  return { l: 0, r: 0 };
};

let worst = 0;
let sum = 0;
let n = 0;
// Simpul geometri hanya ada di baris sabuk, jadi siluet diukur di baris-baris itu.
for (const y of [...EIFFEL_SHAFT_BELTS.slice(1), EIFFEL_DECK2_TOP - 1]) {
  const e = edge(y);
  const w = (e.r - e.l) / 2;
  const target = shaftHalfWidth(y);
  const err = Math.abs(w - target - 7.0); // + setengah tebal batang sudut (tebal 14 px)
  worst = Math.max(worst, err);
  sum += err;
  n++;
}
console.log(`shaft silhouette  mean err ${(sum / n).toFixed(2)} px, max ${worst.toFixed(2)} px (n=${n})`);

// Sabuk: cari batang horizontal pada y yang diharapkan.
const horiz = tower.bars.filter((b) => Math.abs(b.ay - b.by) < 0.01 && b.t > 0);
const beltOk = (ys: number[], part: string) => {
  let ok = 0;
  for (const y of ys) {
    if (horiz.some((b) => b.part === part && Math.abs(b.ay - y) <= 3)) ok++;
  }
  console.log(`${part}: ${ok}/${ys.length} sabuk pada posisi (+-3 px)`);
};
beltOk(EIFFEL_SHAFT_BELTS, 'shaft_belts');
beltOk(EIFFEL_LEG_BELTS, 'leg_l1_l2');

const topY = Math.min(...left.keys());
const botY = Math.max(...left.keys());
console.log(`tinggi menara: y ${topY} -> ${botY} px (target 236 -> 3450)`);
console.log(`leg outer @2850 = ${legOuter(2850)}, deck2 top = ${EIFFEL_DECK2_TOP}`);

let total = 0;
for (const [k, v] of Object.entries(tower.counts)) {
  console.log(`  ${k.padEnd(16)} ${v}`);
  total += v;
}
console.log(`TOTAL komponen: ${total}`);
let meshes = 0;
tower.group.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes++; });
console.log(`mesh setelah merge: ${meshes}`);
