import * as THREE from 'three';
import { Builder, EiffelBar, EiffelMaterials, GY } from './eiffelBuilder';
import { buildBaseLegs, buildLegs, buildLevel1 } from './eiffelLower';
import { buildLevel2, buildShaft, buildSummit } from './eiffelUpper';
import { EIFFEL_SCALE } from './eiffelProfile';

export type { EiffelMaterials, EiffelBar };
export { EIFFEL_SCALE };

export interface EiffelTower {
  /** Grup menara; origin = tengah alas di tanah, sudah diskalakan EIFFEL_SCALE. */
  group: THREE.Group;
  beaconGroup: THREE.Group;
  /** Garis referensi (piksel gambar) untuk verify_eiffel. */
  bars: EiffelBar[];
  /** Jumlah komponen per bagian. */
  counts: Record<string, number>;
}

/**
 * Menara Eiffel hasil rekonstruksi eiffel-tower24k.jpg. Geometri dibangun dalam piksel gambar,
 * digabung per material, lalu diskalakan. Sisi tak terlihat dibuat simetris 4 arah.
 */
export function buildEiffelTower(m: EiffelMaterials): EiffelTower {
  const b = new Builder();
  const group = new THREE.Group();
  group.name = 'EiffelTower';

  buildBaseLegs(b, m);
  buildLevel1(b, m);
  buildLegs(b, m);
  buildLevel2(b, m);
  buildShaft(b, m);
  buildSummit(b, m);
  b.build(group);

  // Lampu suar berputar di dasar antena
  const beaconGroup = new THREE.Group();
  beaconGroup.name = 'EiffelBeaconPivot';
  beaconGroup.position.set(0, GY - 505, 0);
  beaconGroup.add(new THREE.Mesh(new THREE.BoxGeometry(14, 10, 14), m.glass));
  beaconGroup.add(new THREE.Mesh(new THREE.BoxGeometry(40, 3, 3), m.glass));
  group.add(beaconGroup);

  group.scale.setScalar(EIFFEL_SCALE);
  return { group, beaconGroup, bars: b.bars, counts: b.counts };
}
