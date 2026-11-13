import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Collapses static meshes under `root` into one mesh per material to cut draw calls.
 * Anything inside a subtree listed in `keep` (animated parts) is left untouched.
 * Instanced meshes, skinned meshes and multi-material meshes are also skipped.
 */
export function mergeStaticMeshes(root: THREE.Object3D, keep: THREE.Object3D[] = []): void {
  root.updateWorldMatrix(true, true);
  const rootInverse = new THREE.Matrix4().copy(root.matrixWorld).invert();

  const isProtected = (obj: THREE.Object3D): boolean => {
    for (let o: THREE.Object3D | null = obj; o; o = o.parent) {
      if (keep.includes(o)) return true;
    }
    return false;
  };

  type Bucket = { material: THREE.Material; cast: boolean; receive: boolean; geometries: THREE.BufferGeometry[] };
  const buckets = new Map<string, Bucket>();
  const materialIds = new Map<THREE.Material, number>();
  const merged: THREE.Mesh[] = [];

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || (mesh as THREE.InstancedMesh).isInstancedMesh || (mesh as THREE.SkinnedMesh).isSkinnedMesh) return;
    if (Array.isArray(mesh.material) || !mesh.visible || isProtected(mesh)) return;

    const material = mesh.material as THREE.Material;
    if (!materialIds.has(material)) materialIds.set(material, materialIds.size);
    const key = `${materialIds.get(material)}|${mesh.castShadow ? 1 : 0}|${mesh.receiveShadow ? 1 : 0}`;

    const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(rootInverse, mesh.matrixWorld));

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { material, cast: mesh.castShadow, receive: mesh.receiveShadow, geometries: [] };
      buckets.set(key, bucket);
    }
    bucket.geometries.push(geometry);
    merged.push(mesh);
  });

  merged.forEach((mesh) => {
    mesh.parent?.remove(mesh);
    mesh.geometry.dispose();
  });

  buckets.forEach((bucket) => {
    const common = Object.keys(bucket.geometries[0].attributes).filter((name) =>
      bucket.geometries.every((g) => g.attributes[name])
    );
    bucket.geometries.forEach((g) => {
      for (const name of Object.keys(g.attributes)) {
        if (!common.includes(name)) g.deleteAttribute(name);
      }
    });
    const geometry = bucket.geometries.length === 1 ? bucket.geometries[0] : mergeGeometries(bucket.geometries, false);
    if (!geometry) return;
    const mesh = new THREE.Mesh(geometry, bucket.material);
    mesh.castShadow = bucket.cast;
    mesh.receiveShadow = bucket.receive;
    mesh.name = 'MergedStatic';
    root.add(mesh);
  });
}
