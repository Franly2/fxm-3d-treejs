import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { EIFFEL_GROUND_Y } from './eiffelProfile';

export const GY = EIFFEL_GROUND_Y;

export interface EiffelMaterials {
  iron: THREE.Material;
  ironDark: THREE.Material;
  ironLight: THREE.Material;
  glass: THREE.Material;
  stone: THREE.Material;
}

/** Garis referensi untuk verifikasi: x dari sumbu, y baris piksel gambar. */
export interface EiffelBar {
  part: string;
  ax: number; ay: number;
  bx: number; by: number;
  t: number;
}

export type Pos = (s: number, y: number) => THREE.Vector3;
export type Skip = (s: number, y: number) => boolean;

export const FACES = [0, 1, 2, 3];

function rot(k: number, u: number, d: number): [number, number] {
  switch (k & 3) {
    case 0: return [u, d];
    case 1: return [d, -u];
    case 2: return [-u, -d];
    default: return [-d, u];
  }
}

/** Titik pada muka ke-k: u = geser sepanjang muka, d = jarak muka dari sumbu. */
export function facePt(k: number, u: number, y: number, d: number): THREE.Vector3 {
  const [x, z] = rot(k, u, d);
  return new THREE.Vector3(x, GY - y, z);
}

const UP = new THREE.Vector3(0, 1, 0);
const UNIT = new THREE.Vector3(1, 1, 1);

export class Builder {
  private buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
  readonly bars: EiffelBar[] = [];
  readonly counts: Record<string, number> = {};

  private push(mat: THREE.Material, g: THREE.BufferGeometry) {
    const list = this.buckets.get(mat);
    if (list) list.push(g); else this.buckets.set(mat, [g]);
  }

  private tally(part: string) {
    this.counts[part] = (this.counts[part] ?? 0) + 1;
  }

  /** Square cross-section bar (t x t) between two points (pixel world coords, y up). */
  bar(part: string, mat: THREE.Material, a: THREE.Vector3, b: THREE.Vector3, t: number) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    if (len < 1e-6) return;
    const g = new THREE.BoxGeometry(t, len, t);
    const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    g.applyMatrix4(new THREE.Matrix4().compose(mid, q, UNIT));
    this.push(mat, g);
    this.bars.push({ part, ax: a.x, ay: GY - a.y, bx: b.x, by: GY - b.y, t });
    this.tally(part);
  }

  /** Axis-aligned box; yTop < yBot (pixel rows). */
  box(part: string, mat: THREE.Material, x0: number, x1: number, yTop: number, yBot: number, z0: number, z1: number) {
    const g = new THREE.BoxGeometry(x1 - x0, yBot - yTop, z1 - z0);
    g.translate((x0 + x1) / 2, GY - (yTop + yBot) / 2, (z0 + z1) / 2);
    this.push(mat, g);
    this.bars.push({ part, ax: x0, ay: yTop, bx: x1, by: yTop, t: 0 });
    this.bars.push({ part, ax: x0, ay: yBot, bx: x1, by: yBot, t: 0 });
    this.tally(part);
  }

  /** Truncated cylinder / cone centered on the tower axis. */
  cyl(part: string, mat: THREE.Material, rTop: number, rBot: number, yTop: number, yBot: number, segs = 10) {
    const g = new THREE.CylinderGeometry(rTop, rBot, yBot - yTop, segs);
    g.translate(0, GY - (yTop + yBot) / 2, 0);
    this.push(mat, g);
    this.bars.push({ part, ax: -rTop, ay: yTop, bx: rTop, by: yTop, t: 0 });
    this.bars.push({ part, ax: -rBot, ay: yBot, bx: rBot, by: yBot, t: 0 });
    this.tally(part);
  }

  /** n-1 intermediate vertical posts + 2n cross diagonals (n X-panels) between two rows on a face. */
  lattice(part: string, mat: THREE.Material, pos: Pos, yTop: number, yBot: number, n: number,
    tPost: number, tDiag: number, skip?: Skip) {
    const ym = (yTop + yBot) / 2;
    for (let j = 1; j < n; j++) {
      if (skip && skip(j / n, ym)) continue;
      this.bar(part, mat, pos(j / n, yTop), pos(j / n, yBot), tPost);
    }
    for (let j = 0; j < n; j++) {
      const s0 = j / n;
      const s1 = (j + 1) / n;
      if (skip && skip((s0 + s1) / 2, ym)) continue;
      this.bar(part, mat, pos(s0, yTop), pos(s1, yBot), tDiag);
      this.bar(part, mat, pos(s1, yTop), pos(s0, yBot), tDiag);
    }
  }

  /** Horizontal belt girder along a face divided into n segments. */
  belt(part: string, mat: THREE.Material, pos: Pos, y: number, n: number, t: number, skip?: Skip) {
    for (let j = 0; j < n; j++) {
      const s0 = j / n;
      const s1 = (j + 1) / n;
      if (skip && skip((s0 + s1) / 2, y)) continue;
      this.bar(part, mat, pos(s0, y), pos(s1, y), t);
    }
  }

  /** n-1 vertical posts between two rows. */
  posts(part: string, mat: THREE.Material, pos: Pos, yTop: number, yBot: number, n: number, t: number) {
    for (let j = 1; j < n; j++) this.bar(part, mat, pos(j / n, yTop), pos(j / n, yBot), t);
  }

  /** Merge geometries per material into single consolidated meshes. */
  build(group: THREE.Group) {
    this.buckets.forEach((list, mat) => {
      const merged = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      if (!merged) return;
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = true;
      mesh.name = 'EiffelIron_' + mat.name;
      group.add(mesh);
    });
    this.buckets.clear();
  }
}
