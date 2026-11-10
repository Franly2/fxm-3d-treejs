/**
 * Profil Menara Eiffel hasil pengukuran eiffel-tower24k.jpg (2160x3840).
 * Semua angka dalam piksel gambar; "y" = baris piksel (0 = atas), "x/u" = jarak dari sumbu menara.
 * Keyakinan: batang, lantai 2, kaki lantai 1->2, lantai 1 = terukur; kaki bawah, lengkung besar,
 * leher/puncak = perkiraan (tertutup pohon / menyatu dengan latar kota).
 */

export const EIFFEL_SCALE = 0.0009;   // satuan scene per piksel gambar
export const EIFFEL_GROUND_Y = 3450;  // baris piksel tanah
export const EIFFEL_AXIS_X = 1098;    // kolom piksel sumbu menara pada gambar

/** 17 sabuk horizontal batang menara. */
export const EIFFEL_SHAFT_BELTS = [
  770, 822, 882, 944, 1012, 1084, 1160, 1242, 1328, 1416, 1521, 1626, 1728, 1836, 1948, 2060, 2166,
];
export const EIFFEL_DECK2_TOP = 2234;
/** 6 sabuk kaki lantai 2 -> lantai 1. */
export const EIFFEL_LEG_BELTS = [2502, 2558, 2618, 2682, 2740, 2804];

/** Jumlah tingkat batang yang memakai satu tiang tengah (sisanya dua tiang). */
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

/** Lengkung besar: busur lingkaran berpusat di sumbu, ARCH_CY di bawah tanah. */
export const ARCH_R1 = 380;
export const ARCH_R2 = 410;
export const ARCH_CY = -65;
