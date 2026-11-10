import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createRoadModel } from './src/model/roadModel';
import fs from 'fs';
import path from 'path';

const road = createRoadModel(3.2, 1.65);
const root = road.root;
root.updateWorldMatrix(true, true);

const matMap = new Map<THREE.Material, THREE.BufferGeometry[]>();

root.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    const mesh = child as THREE.Mesh;
    const mat = mesh.material as THREE.Material;
    const geom = mesh.geometry.clone();
    geom.applyMatrix4(mesh.matrixWorld);
    if (!geom.attributes.normal) {
      geom.computeVertexNormals();
    }
    if (!matMap.has(mat)) {
      matMap.set(mat, []);
    }
    matMap.get(mat)!.push(geom);
  }
});

// Construct 3 json format
const meshesOut: any[] = [];
let meshIdx = 0;

for (const [mat, geoms] of matMap.entries()) {
  const merged = geoms.length === 1 ? geoms[0] : mergeGeometries(geoms, false);
  if (!merged) continue;

  const posAttr = merged.attributes.position;
  const normAttr = merged.attributes.normal;
  const uvAttr = merged.attributes.uv;
  const indexAttr = merged.index;

  const vertDict: Record<string, number> = {};
  for (let i = 0; i < posAttr.count; i++) {
    vertDict[`${i * 3}`] = Math.round(posAttr.getX(i) * 1000000) / 1000000;
    vertDict[`${i * 3 + 1}`] = Math.round(posAttr.getY(i) * 1000000) / 1000000;
    vertDict[`${i * 3 + 2}`] = Math.round(posAttr.getZ(i) * 1000000) / 1000000;
  }

  const normDict: Record<string, number> = {};
  if (normAttr) {
    for (let i = 0; i < normAttr.count; i++) {
      normDict[`${i * 3}`] = Math.round(normAttr.getX(i) * 1000000) / 1000000;
      normDict[`${i * 3 + 1}`] = Math.round(normAttr.getY(i) * 1000000) / 1000000;
      normDict[`${i * 3 + 2}`] = Math.round(normAttr.getZ(i) * 1000000) / 1000000;
    }
  }

  const uvDict: Record<string, number> = {};
  if (uvAttr) {
    for (let i = 0; i < uvAttr.count; i++) {
      uvDict[`${i * 2}`] = Math.round(uvAttr.getX(i) * 1000000) / 1000000;
      uvDict[`${i * 2 + 1}`] = Math.round(uvAttr.getY(i) * 1000000) / 1000000;
    }
  }

  const idxDict: Record<string, number> = {};
  if (indexAttr) {
    for (let i = 0; i < indexAttr.count; i++) {
      idxDict[`${i}`] = indexAttr.getX(i);
    }
  } else {
    for (let i = 0; i < posAttr.count; i++) {
      idxDict[`${i}`] = i;
    }
  }

  const stdMat = mat as THREE.MeshStandardMaterial;
  const col = stdMat.color ? [stdMat.color.r, stdMat.color.g, stdMat.color.b, 1] : [1, 1, 1, 1];

  meshesOut.push([
    `mesh_${meshIdx}`,
    {
      id: `mesh_road_${meshIdx}`,
      parentId: 'AuxScene',
      name: `mesh_${meshIdx}`,
      position: [0, 0, 0],
      quaternion: [0, 0, 0, 1],
      scale: [1, 1, 1],
      vertex: vertDict,
      normal: normDict,
      uv: uvDict,
      index: idxDict,
      skinned: false,
      vertexType: 8,
      uvType: 8,
      indexType: 4,
      skinIndexType: -1,
      skinWeightType: -1,
      colorType: -1,
      normalType: 8,
      texture: {
        originalSource: '',
        exportFormat: 'lossless',
        exportQuality: 0.8,
        name: '',
        wrapX: 'repeat',
        wrapY: 'repeat',
        repeat: null,
        offset: null,
        rotation: 0,
        center: null,
        flipY: false,
        colorSpace: '',
        hasContent: false,
        contentType: 'color',
        type: 'diffuse',
        typeProperties: {
          color: col,
          opacity: 1,
          intensity: 1,
          alphaThreshold: 0,
          transparent: false,
          side: 0
        },
        sid: 802002002002000 + meshIdx
      },
      otherTextures: {},
      renderType: 'opaque'
    }
  ]);
  meshIdx++;
}

const c3Json = {
  animations: [],
  meshes: meshesOut,
  objects: [
    [
      'AuxScene',
      {
        id: 'AuxScene',
        parentId: null,
        name: 'AuxScene',
        position: [0, 0, 0],
        quaternion: [0, 0, 0, 1],
        scale: [1, 1, 1]
      }
    ]
  ],
  bones: [],
  name: 'jalan',
  offset: { '0': 0, '1': 0, '2': 0 },
  rotation: { '0': -90, '1': 0, '2': 0 },
  scale: { '0': 1, '1': 1, '2': 1 },
  sid: 802002002002002
};

const targetPath = 'D:/FXM/construct 3 MCP/project/3d (v2)/3dmodels/jalan.json';
fs.writeFileSync(targetPath, JSON.stringify(c3Json));
console.log(`Updated ${targetPath} with ${meshesOut.length} perfectly merged meshes!`);

const aliasPath = 'D:/FXM/construct 3 MCP/project/3d (v2)/3dmodels/roadSegment.json';
fs.writeFileSync(aliasPath, JSON.stringify(c3Json));
console.log(`Updated ${aliasPath} successfully!`);
