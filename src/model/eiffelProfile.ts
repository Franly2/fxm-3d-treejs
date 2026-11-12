/**
 * Eiffel Tower profile measurements from reference image (eiffel-tower24k.jpg, 2160x3840).
 * Coordinates in image pixels: "y" = pixel row (0 = top), "x/u" = distance from tower central axis.
 */

export const EIFFEL_SCALE = 0.0009;   // scene units per image pixel
export const EIFFEL_GROUND_Y = 3450;  // ground datum pixel row
export const EIFFEL_AXIS_X = 1098;    // tower axis column

/** 17 horizontal shaft belts. */
export const EIFFEL_SHAFT_BELTS = [
  770, 822, 882, 944, 1012, 1084, 1160, 1242, 1328, 1416, 1521, 1626, 1728, 1836, 1948, 2060, 2166,
];
export const EIFFEL_DECK2_TOP = 2234;
/** 6 belts for legs between Level 2 and Level 1. */
export const EIFFEL_LEG_BELTS = [2502, 2558, 2618, 2682, 2740, 2804];

/** Number of shaft tiers using a single central post (remaining use two posts). */
export const EIFFEL_SHAFT_SINGLE_POST_TIERS = 11;

function lerpTable(table: [number, number][], y: number): number {
  if (y <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    if (y <= table[i][0]) {
      const [y0, v0] = table[i - 1];
      const [y1, v1] = table[i];
      return v0 + ((v1 - v0) * (y - y0)) / (y1 - y0);
    }
  }
  return table[table.length - 1][1];
}

/** Setengah lebar batang menara pada baris y (770 -> 2234). */
export function shaftHalfWidth(y: number): number {
  const t = Math.min(1, Math.max(0, (y - 770) / (EIFFEL_DECK2_TOP - 770)));
  return 62 + 111 * Math.pow(t, 1.34);
}
export const neckHalfWidth = (y: number) => lerpTable([[680, 69], [770, 66]], y);
export const galleryHalfWidth = (y: number) => lerpTable([[596, 90], [652, 88]], y);
export const legOuter = (y: number) => lerpTable([[2457, 233], [2560, 262], [2656, 289], [2850, 345]], y);
export const legInner = (y: number) => lerpTable([[2457, 88], [2656, 99], [2850, 133]], y);
export const baseOuter = (y: number) =>
  lerpTable([[3046, 436], [3094, 474], [3160, 500], [3217, 530], [3256, 554], [3322, 596], [3450, 668]], y);

/** Monumental arch: circular arc centered on axis, ARCH_CY below ground datum. */
export const ARCH_R1 = 380;
export const ARCH_R2 = 410;
export const ARCH_CY = -65;
