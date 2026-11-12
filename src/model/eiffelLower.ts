import * as THREE from 'three';
import { Builder, EiffelMaterials, FACES, GY, Pos, Skip, facePt } from './eiffelBuilder';
import {
  ARCH_CY, ARCH_R1, ARCH_R2, EIFFEL_LEG_BELTS, baseOuter, legInner, legOuter,
} from './eiffelProfile';

/** Base legs (ground -> level 1) + monumental arch. y 3046 -> 3450. */
export function buildBaseLegs(b: Builder, m: EiffelMaterials) {
  const levels = [3046, 3100, 3180, 3260, 3350, 3450];
  const nPer = [16, 12, 12, 12, 12];
  const inArch: Skip = (s, y) => {
    const u = (2 * s - 1) * baseOuter(y);
    const h = GY - y - ARCH_CY;
    return u * u + h * h < (ARCH_R2 + 6) * (ARCH_R2 + 6);
  };
  const phi1 = Math.acos(-ARCH_CY / ARCH_R1);
  const phi2 = Math.acos(-ARCH_CY / ARCH_R2);

  for (const k of FACES) {
    const pos: Pos = (s, y) => {
      const o = baseOuter(y);
      return facePt(k, (2 * s - 1) * o, y, o);
    };
    for (let i = 0; i < levels.length - 1; i++) {
      b.lattice('base_legs', m.iron, pos, levels[i], levels[i + 1], nPer[i], 7.5, 5.5, inArch);
    }
    for (let i = 0; i < levels.length; i++) {
      b.belt('base_legs', m.iron, pos, levels[i], i === 0 ? 16 : 12, 8.5, inArch);
    }
    const arcPt = (r: number, phi: number) => {
      const y = GY - (ARCH_CY + r * Math.cos(phi));
      return facePt(k, r * Math.sin(phi), y, baseOuter(y));
    };
    const segs = 36;
    for (let i = 0; i < segs; i++) {
      const t0 = -1 + (2 * i) / segs;
      const t1 = -1 + (2 * (i + 1)) / segs;
      b.bar('big_arch', m.iron, arcPt(ARCH_R1, t0 * phi1), arcPt(ARCH_R1, t1 * phi1), 9.0);
      b.bar('big_arch', m.iron, arcPt(ARCH_R2, t0 * phi2), arcPt(ARCH_R2, t1 * phi2), 9.0);
    }
    const cells = 26;
    for (let j = 0; j <= cells; j++) {
      const t = -1 + (2 * j) / cells;
      b.bar('big_arch', m.iron, arcPt(ARCH_R1, t * phi1), arcPt(ARCH_R2, t * phi2), 6.5);
      if (j < cells) {
        const t1 = -1 + (2 * (j + 1)) / cells;
        // Diagonal ganda membentuk silang X sempurna di setiap sel lengkung
        b.bar('big_arch', m.iron, arcPt(ARCH_R1, t * phi1), arcPt(ARCH_R2, t1 * phi2), 5.5);
        b.bar('big_arch', m.iron, arcPt(ARCH_R1, t1 * phi1), arcPt(ARCH_R2, t * phi2), 5.5);
      }
    }
  }

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      for (let i = 0; i < levels.length - 1; i++) {
        const o0 = baseOuter(levels[i]);
        const o1 = baseOuter(levels[i + 1]);
        b.bar('base_corner', m.iron, new THREE.Vector3(sx * o0, GY - levels[i], sz * o0),
          new THREE.Vector3(sx * o1, GY - levels[i + 1], sz * o1), 18);
      }
      b.box('plinth', m.stone, sx * 560 - 150, sx * 560 + 150, 3440, 3460, sz * 560 - 150, sz * 560 + 150);
    }
  }
}

/** Lantai 1: kornis, galeri berpaviliun kaca, 18 panel kotak, 18 lengkung kecil. y 2844 -> 3046. */
export function buildLevel1(b: Builder, m: EiffelMaterials) {
  const hw = 417;
  b.box('l1_deck', m.iron, -hw, hw, 2844, 2859, -hw, hw);
  b.box('l1_cornice', m.iron, -433, 433, 2859, 2874, -433, 433);
  const pitch = (2 * hw) / 18;
  for (const k of FACES) {
    const pos: Pos = (s, y) => facePt(k, (2 * s - 1) * hw, y, hw);
    const c = facePt(k, 0, 2918, hw - 6);
    const alongX = (k & 1) === 0;
    b.box('l1_glass', m.glass,
      alongX ? -100 : c.x - 4, alongX ? 100 : c.x + 4, 2880, 2956,
      alongX ? c.z - 4 : -100, alongX ? c.z + 4 : 100);
    // Posts and belts for Level 1 gallery
    b.posts('l1_gallery', m.iron, pos, 2874, 2960, 18, 6.5);
    for (const y of [2874, 2917, 2960]) b.belt('l1_gallery', m.iron, pos, y, 1, 7.5);
    // Dual X-cross bracing across Level 1 gallery panels
    for (let a = 0; a < 18; a++) {
      const s0 = a / 18;
      const s1 = (a + 1) / 18;
      b.bar('l1_gallery', m.iron, pos(s0, 2874), pos(s1, 2917), 4.5);
      b.bar('l1_gallery', m.iron, pos(s1, 2874), pos(s0, 2917), 4.5);
      b.bar('l1_gallery', m.iron, pos(s0, 2917), pos(s1, 2960), 4.5);
      b.bar('l1_gallery', m.iron, pos(s1, 2917), pos(s0, 2960), 4.5);
    }

    // Posts and belts for Level 1 frieze band
    b.posts('l1_panels', m.iron, pos, 2960, 3011, 18, 6.5);
    b.belt('l1_panels', m.iron, pos, 2985, 1, 6.5);
    b.belt('l1_panels', m.iron, pos, 3011, 1, 7.5);
    // Dual X-cross bracing across each of the 18 frieze panels
    for (let a = 0; a < 18; a++) {
      const s0 = a / 18;
      const s1 = (a + 1) / 18;
      b.bar('l1_panels', m.iron, pos(s0, 2960), pos(s1, 3011), 5.0);
      b.bar('l1_panels', m.iron, pos(s1, 2960), pos(s0, 3011), 5.0);
    }

    for (let a = 0; a < 18; a++) {
      const u0 = -hw + a * pitch;
      let prev = facePt(k, u0, 3046, hw);
      for (let sg = 1; sg <= 4; sg++) {
        const th = (Math.PI * sg) / 4;
        const p = facePt(k, u0 + (pitch / 2) * (1 - Math.cos(th)), 3046 - 32 * Math.sin(th), hw);
        b.bar('l1_arches', m.iron, prev, p, 5.5);
        prev = p;
      }
    }
    b.belt('l1_arches', m.iron, pos, 3014, 1, 6.5);
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      b.bar('l1_corner', m.iron, new THREE.Vector3(sx * hw, GY - 2874, sz * hw),
        new THREE.Vector3(sx * hw, GY - 3046, sz * hw), 15);
    }
  }
}

/** 
 * 4 separate leg pylons between level 1 and 2 (open central atrium). y 2457 -> 2850.
 * Reinforced double-parallel trusses and increased chord thickness for visual density.
 */
export function buildLegs(b: Builder, m: EiffelMaterials) {
  const levels = [2457, ...EIFFEL_LEG_BELTS, 2850];
  const dsDiag = 0.026; // lateral offset for dual diagonal bars
  const dsPost = 0.022; // lateral offset for dual vertical posts
  const dyBelt = 2.4;   // vertical offset for dual horizontal belts

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const span = (y: number) => legOuter(y) - legInner(y);
      const faceFns: Pos[] = [
        (s, y) => new THREE.Vector3(sx * legOuter(y), GY - y, sz * (legInner(y) + span(y) * s)),
        (s, y) => new THREE.Vector3(sx * legInner(y), GY - y, sz * (legInner(y) + span(y) * s)),
        (s, y) => new THREE.Vector3(sx * (legInner(y) + span(y) * s), GY - y, sz * legOuter(y)),
        (s, y) => new THREE.Vector3(sx * (legInner(y) + span(y) * s), GY - y, sz * legInner(y)),
      ];

      for (const pos of faceFns) {
        for (let i = 0; i < levels.length - 1; i++) {
          const yTop = levels[i];
          const yBot = levels[i + 1];
          const n = 2; // 2 cells per bay (7 belt tiers total)

          // 1. Central vertical post: reinforced dual parallel posts
          for (let j = 1; j < n; j++) {
            const sc = j / n;
            b.bar('leg_l1_l2', m.iron, pos(sc - dsPost, yTop), pos(sc - dsPost, yBot), 9.2);
            b.bar('leg_l1_l2', m.iron, pos(sc + dsPost, yTop), pos(sc + dsPost, yBot), 9.2);
          }

          // 2. Diagonal X-bracing: reinforced dual parallel X-chords
          for (let j = 0; j < n; j++) {
            const s0 = j / n;
            const s1 = (j + 1) / n;

            // Direction 1 (s0 -> s1): dual parallel bars
            b.bar('leg_l1_l2', m.iron, pos(Math.max(0, s0 - dsDiag), yTop), pos(Math.max(0, s1 - dsDiag), yBot), 7.2);
            b.bar('leg_l1_l2', m.iron, pos(Math.min(1, s0 + dsDiag), yTop), pos(Math.min(1, s1 + dsDiag), yBot), 7.2);

            // Direction 2 (s1 -> s0): dual parallel bars
            b.bar('leg_l1_l2', m.iron, pos(Math.min(1, s1 + dsDiag), yTop), pos(Math.min(1, s0 + dsDiag), yBot), 7.2);
            b.bar('leg_l1_l2', m.iron, pos(Math.max(0, s1 - dsDiag), yTop), pos(Math.max(0, s0 - dsDiag), yBot), 7.2);
          }
        }

        // 3. Horizontal belts: reinforced multi-tier box cords
        for (let i = 1; i < levels.length; i++) {
          const y = levels[i];
          b.bar('leg_l1_l2', m.iron, pos(0, y - dyBelt), pos(1, y - dyBelt), 9.5);
          b.bar('leg_l1_l2', m.iron, pos(0, y + dyBelt), pos(1, y + dyBelt), 9.5);
          b.bar('leg_l1_l2', m.iron, pos(0, y), pos(1, y), 9.5);
        }
      }

      // 4. Corner pillars: dual parallel inner reinforcing box columns
      for (const xa of [0, 1]) {
        for (const za of [0, 1]) {
          for (let i = 0; i < levels.length - 1; i++) {
            const pa1 = (y: number) => new THREE.Vector3(
              sx * (xa ? legOuter(y) : legInner(y)), GY - y, sz * (za ? legOuter(y) : legInner(y)));
            b.bar('leg_corner', m.iron, pa1(levels[i]), pa1(levels[i + 1]), 17.5);

            const pa2 = (y: number) => new THREE.Vector3(
              sx * (xa ? legOuter(y) - 5.5 : legInner(y) + 5.5), GY - y, sz * (za ? legOuter(y) - 5.5 : legInner(y) + 5.5));
            b.bar('leg_corner', m.iron, pa2(levels[i]), pa2(levels[i + 1]), 13.5);
          }
        }
      }
    }
  }
}
