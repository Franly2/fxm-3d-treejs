import * as THREE from 'three';
import { Builder, EiffelBar, EiffelMaterials, GY } from './eiffelBuilder';
import { buildBaseLegs, buildLegs, buildLevel1 } from './eiffelLower';
import { buildLevel2, buildShaft, buildSummit } from './eiffelUpper';
import { EIFFEL_SCALE } from './eiffelProfile';

export type { EiffelMaterials, EiffelBar };
export { EIFFEL_SCALE };

export interface EiffelTower {
  /** Tower group; origin = ground center datum, scaled by EIFFEL_SCALE. */
  group: THREE.Group;
  beaconGroup: THREE.Group;
  /** Reference bars (image pixels) for alignment verification. */
  bars: EiffelBar[];
  /** Component counts per structural part. */
  counts: Record<string, number>;
}

/**
 * Procedural Eiffel Tower model reconstructed from photographic blueprints.
 * Merged per material and symmetrically built across all 4 facades.
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

  // Rotating summit beacon light at the base of antenna mast
  const beaconGroup = new THREE.Group();
  beaconGroup.name = 'EiffelBeaconPivot';
  beaconGroup.position.set(0, GY - 505, 0);
  beaconGroup.add(new THREE.Mesh(new THREE.BoxGeometry(14, 10, 14), m.glass));
  beaconGroup.add(new THREE.Mesh(new THREE.BoxGeometry(40, 3, 3), m.glass));
  group.add(beaconGroup);

  group.scale.setScalar(EIFFEL_SCALE);
  return { group, beaconGroup, bars: b.bars, counts: b.counts };
}
