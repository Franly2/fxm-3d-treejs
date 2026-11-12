import * as THREE from 'three';
import { Builder, EiffelMaterials, FACES, GY, Pos, facePt } from './eiffelBuilder';
import {
  EIFFEL_DECK2_TOP, EIFFEL_SHAFT_BELTS, EIFFEL_SHAFT_SINGLE_POST_TIERS,
  galleryHalfWidth, neckHalfWidth, shaftHalfWidth,
} from './eiffelProfile';

/** Lantai 2: dek, 11 panel kotak, 13 konsol, rangka 6 silang, anyaman 2 x 25. y 2234 -> 2457. */
export function buildLevel2(b: Builder, m: EiffelMaterials) {
  const hw = 213;
  b.box('l2_deck', m.iron, -196, 196, 2234, 2250, -196, 196);
  b.box('l2_cornice', m.iron, -229, 229, 2250, 2262, -229, 229);
  b.box('l2_floor', m.ironDark, -hw, hw, 2262, 2270, -hw, hw);
  b.box('l2_plate', m.iron, -229, 229, 2444, 2457, -229, 229);
  for (const k of FACES) {
    const pos: Pos = (s, y) => facePt(k, (2 * s - 1) * hw, y, hw);
    b.posts('l2_panels', m.iron, pos, 2262, 2342, 11, 6.5);
    b.belt('l2_panels', m.iron, pos, 2300, 1, 7.0);
    b.belt('l2_panels', m.iron, pos, 2342, 1, 7.5);
    // Tambah silang X ganda pada setiap 11 panel lantai 2
    for (let c = 0; c < 11; c++) {
      const s0 = c / 11;
      const s1 = (c + 1) / 11;
      b.bar('l2_panels', m.iron, pos(s0, 2262), pos(s1, 2300), 4.5);
      b.bar('l2_panels', m.iron, pos(s1, 2262), pos(s0, 2300), 4.5);
      b.bar('l2_panels', m.iron, pos(s0, 2300), pos(s1, 2342), 4.5);
      b.bar('l2_panels', m.iron, pos(s1, 2300), pos(s0, 2342), 4.5);
    }
    for (let j = 0; j <= 12; j++) b.bar('l2_brackets', m.iron, pos(j / 12, 2262), pos(j / 12, 2276), 7.5);
    b.lattice('l2_trusses', m.iron, pos, 2342, 2405, 6, 7.0, 5.5);
    b.belt('l2_trusses', m.iron, pos, 2405, 1, 7.5);
    for (const y of [2414, 2429, 2444]) b.belt('l2_weave', m.iron, pos, y, 1, 6.0);
    for (let row = 0; row < 2; row++) {
      const y0 = 2414 + row * 15;
      for (let c = 0; c < 25; c++) {
        const s0 = c / 25;
        const s1 = (c + 1) / 25;
        // Diagonal ganda X pada anyaman lantai 2
        b.bar('l2_weave', m.iron, pos(s0, y0), pos(s1, y0 + 15), 4.0);
        b.bar('l2_weave', m.iron, pos(s1, y0), pos(s0, y0 + 15), 4.0);
      }
    }
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      b.bar('l2_corner', m.iron, new THREE.Vector3(sx * hw, GY - 2262, sz * hw),
        new THREE.Vector3(sx * hw, GY - 2444, sz * hw), 14);
    }
  }
}

/** 
 * Tower shaft: 17 belts, 16 bays + 1 short bay, intermediate platform. y 770 -> 2234.
 * Lower shaft section (level 2 -> intermediate platform, y 1416 -> 2234):
 * Reinforced lattice density with dual parallel cords and increased bar thickness.
 */
export function buildShaft(b: Builder, m: EiffelMaterials) {
  const levels = [...EIFFEL_SHAFT_BELTS, EIFFEL_DECK2_TOP];
  const dsDiag = 0.024;
  const dsPost = 0.020;
  const dyBelt = 2.5;

  for (const k of FACES) {
    const pos: Pos = (s, y) => {
      const w = shaftHalfWidth(y);
      return facePt(k, (2 * s - 1) * w, y, w);
    };

    for (let i = 0; i < levels.length - 1; i++) {
      const yTop = levels[i];
      const yBot = levels[i + 1];
      const isLowerShaft = yTop >= 1416;

      if (isLowerShaft) {
        // Reinforced lower shaft section
        const n = 2; // 2 panels per bay with central post

        // Central post: reinforced dual parallel posts (thickness 9.2)
        for (let j = 1; j < n; j++) {
          const sc = j / n;
          b.bar('shaft', m.iron, pos(sc - dsPost, yTop), pos(sc - dsPost, yBot), 9.2);
          b.bar('shaft', m.iron, pos(sc + dsPost, yTop), pos(sc + dsPost, yBot), 9.2);
        }

        // Diagonal X-chords: reinforced dual parallel diagonals (thickness 7.2)
        for (let j = 0; j < n; j++) {
          const s0 = j / n;
          const s1 = (j + 1) / n;

          // Diagonal 1 (s0 -> s1): dual parallel bars
          b.bar('shaft', m.iron, pos(Math.max(0, s0 - dsDiag), yTop), pos(Math.max(0, s1 - dsDiag), yBot), 7.2);
          b.bar('shaft', m.iron, pos(Math.min(1, s0 + dsDiag), yTop), pos(Math.min(1, s1 + dsDiag), yBot), 7.2);

          // Diagonal 2 (s1 -> s0): dual parallel bars
          b.bar('shaft', m.iron, pos(Math.min(1, s1 + dsDiag), yTop), pos(Math.min(1, s0 + dsDiag), yBot), 7.2);
          b.bar('shaft', m.iron, pos(Math.max(0, s1 - dsDiag), yTop), pos(Math.max(0, s0 - dsDiag), yBot), 7.2);
        }
      } else {
        // Upper shaft section: standard lattice
        const n = i < EIFFEL_SHAFT_SINGLE_POST_TIERS ? 2 : 3;
        b.lattice('shaft', m.iron, pos, yTop, yBot, n, 7.0, 5.2);
      }
    }

    // Horizontal belts
    for (const y of EIFFEL_SHAFT_BELTS) {
      if (y >= 1416) {
        // Reinforced multi-tier horizontal belt
        b.bar('shaft_belts', m.iron, pos(0, y - dyBelt), pos(1, y - dyBelt), 9.8);
        b.bar('shaft_belts', m.iron, pos(0, y + dyBelt), pos(1, y + dyBelt), 9.8);
        b.bar('shaft_belts', m.iron, pos(0, y), pos(1, y), 9.8);
      } else {
        b.belt('shaft_belts', m.iron, pos, y, 1, 8.0);
      }
    }
  }

  // Corner pillars
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      for (let i = 0; i < levels.length - 1; i++) {
        const w0 = shaftHalfWidth(levels[i]);
        const w1 = shaftHalfWidth(levels[i + 1]);
        const isLowerShaft = levels[i] >= 1416;

        if (isLowerShaft) {
          // Reinforced main corner pillar (17.5 vs 14)
          b.bar('shaft_corner', m.iron, new THREE.Vector3(sx * w0, GY - levels[i], sz * w0),
            new THREE.Vector3(sx * w1, GY - levels[i + 1], sz * w1), 17.5);
          // Inner reinforcing column
          const iw0 = w0 - 5.0;
          const iw1 = w1 - 5.0;
          b.bar('shaft_corner', m.iron, new THREE.Vector3(sx * iw0, GY - levels[i], sz * iw0),
            new THREE.Vector3(sx * iw1, GY - levels[i + 1], sz * iw1), 13.0);
        } else {
          b.bar('shaft_corner', m.iron, new THREE.Vector3(sx * w0, GY - levels[i], sz * w0),
            new THREE.Vector3(sx * w1, GY - levels[i + 1], sz * w1), 14);
        }
      }
    }
  }

  const pw = shaftHalfWidth(1466) + 10;
  b.box('mid_platform', m.iron, -pw, pw, 1432, 1448, -pw, pw);
  b.box('mid_platform', m.ironDark, -pw + 2, pw - 2, 1448, 1470, -pw + 2, pw - 2);
}

/** Leher, galeri puncak, paviliun bertingkat, antena. y 236 -> 770. */
export function buildSummit(b: Builder, m: EiffelMaterials) {
  for (const k of FACES) {
    const neck: Pos = (s, y) => {
      const w = neckHalfWidth(y);
      return facePt(k, (2 * s - 1) * w, y, w);
    };
    b.posts('neck', m.iron, neck, 680, 770, 4, 6.0);
    for (const y of [770, 762, 742, 680]) b.belt('neck', m.iron, neck, y, 1, 7.0);
    // Dual X-cross bracing across lower neck posts
    for (let j = 0; j < 4; j++) {
      const s0 = j / 4;
      const s1 = (j + 1) / 4;
      b.bar('neck', m.iron, neck(s0, 680), neck(s1, 742), 4.5);
      b.bar('neck', m.iron, neck(s1, 680), neck(s0, 742), 4.5);
    }
    b.lattice('neck', m.iron, neck, 742, 762, 4, 5.5, 4.5);
    for (let j = 0; j <= 8; j++) {
      const s = j / 8;
      const wn = neckHalfWidth(680);
      const wg = galleryHalfWidth(652);
      b.bar('neck_corbels', m.iron, facePt(k, (2 * s - 1) * wn, 680, wn), facePt(k, (2 * s - 1) * wg, 652, wg), 6.0);
    }
    // Silang X ganda antara konsol leher
    for (let j = 0; j < 8; j++) {
      const s0 = j / 8;
      const s1 = (j + 1) / 8;
      const wn = neckHalfWidth(680);
      const wg = galleryHalfWidth(652);
      b.bar('neck_corbels', m.iron, facePt(k, (2 * s0 - 1) * wn, 680, wn), facePt(k, (2 * s1 - 1) * wg, 652, wg), 4.5);
      b.bar('neck_corbels', m.iron, facePt(k, (2 * s1 - 1) * wn, 680, wn), facePt(k, (2 * s0 - 1) * wg, 652, wg), 4.5);
    }
    const gal: Pos = (s, y) => {
      const w = galleryHalfWidth(y);
      return facePt(k, (2 * s - 1) * w, y, w);
    };
    b.posts('summit_gallery', m.iron, gal, 596, 640, 7, 5.5);
    for (const y of [596, 618, 640]) b.belt('summit_gallery', m.iron, gal, y, 1, 6.5);
    // Silang X ganda pada galeri puncak
    for (let j = 0; j < 7; j++) {
      const s0 = j / 7;
      const s1 = (j + 1) / 7;
      b.bar('summit_gallery', m.iron, gal(s0, 596), gal(s1, 640), 4.0);
      b.bar('summit_gallery', m.iron, gal(s1, 596), gal(s0, 640), 4.0);
    }
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const a = neckHalfWidth(770);
      const c = neckHalfWidth(680);
      b.bar('neck_corner', m.iron, new THREE.Vector3(sx * a, GY - 770, sz * a), new THREE.Vector3(sx * c, GY - 680, sz * c), 11);
      const g0 = galleryHalfWidth(652);
      const g1 = galleryHalfWidth(596);
      b.bar('summit_corner', m.iron, new THREE.Vector3(sx * g0, GY - 652, sz * g0), new THREE.Vector3(sx * g1, GY - 596, sz * g1), 11);
    }
  }
  b.box('summit_floor', m.iron, -92, 92, 646, 652, -92, 92);
  b.box('summit_windows', m.ironDark, -86, 86, 604, 640, -86, 86);
  const steps: [number, number, number][] = [[594, 575, 78], [575, 555, 70], [555, 538, 62], [538, 520, 54]];
  for (const [yt, yb, w] of steps) b.box('summit_pavilion', m.iron, -w, w, yt, yb, -w, w);

  b.cyl('antenna', m.ironLight, 22, 26, 500, 520);
  b.cyl('antenna', m.ironLight, 15, 15, 420, 500);
  for (const y of [495, 470, 445, 425]) b.cyl('antenna_rings', m.ironLight, 17.5, 17.5, y - 2.5, y + 2.5);
  b.cyl('antenna', m.ironLight, 7, 8, 280, 420);
  b.cyl('antenna', m.ironLight, 14, 18, 252, 280);
  b.cyl('antenna', m.ironLight, 1, 6, 236, 252);
}
