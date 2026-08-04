import * as THREE from 'three';
import { AIR, getBlockRender, isOpaque, isSolid, getBlock } from './blocks.js';

const _matrix = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);

/**
 * A fixed-size block grid plus its rendering. One zone per place you can be:
 * the village outdoors, and one per building interior.
 *
 * Not a voxel engine — no chunks, no streaming. The whole grid is remeshed
 * whenever it changes, which for a 24x12x24 room is well under a millisecond.
 */
export class Zone {
  constructor({
    id,
    label,
    size,
    editable = false,
    indoor = false,
    solidBorder = true,
    spawn = [0, 1, 0],
    spawnYaw = 0,
    ambient,
  }) {
    this.id = id;
    this.label = label || id;
    this.sizeX = size[0];
    this.sizeY = size[1];
    this.sizeZ = size[2];
    this.editable = editable;
    this.indoor = indoor;
    this.solidBorder = solidBorder;
    this.spawn = spawn;
    this.spawnYaw = spawnYaw;
    this.ambient = ambient || null;

    this.data = new Uint8Array(this.sizeX * this.sizeY * this.sizeZ);
    this.group = new THREE.Group();
    this.group.name = `zone:${id}`;
    this.meshes = new Map(); // block id -> InstancedMesh
    this.glowPoints = [];
    this.dirty = true;
    this.doors = [];
    this.npcs = [];
    this.baseline = null; // snapshot of the authored layout, for edit diffing
  }

  inBounds(x, y, z) {
    return x >= 0 && y >= 0 && z >= 0 && x < this.sizeX && y < this.sizeY && z < this.sizeZ;
  }

  index(x, y, z) {
    return (y * this.sizeZ + z) * this.sizeX + x;
  }

  get(x, y, z) {
    if (!this.inBounds(x, y, z)) return AIR;
    return this.data[this.index(x, y, z)];
  }

  set(x, y, z, id) {
    if (!this.inBounds(x, y, z)) return false;
    const i = this.index(x, y, z);
    if (this.data[i] === id) return false;
    this.data[i] = id;
    this.dirty = true;
    return true;
  }

  fill(x0, y0, z0, x1, y1, z1, id) {
    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        for (let x = x0; x <= x1; x++) this.set(x, y, z, id);
      }
    }
  }

  /**
   * Collision query. Outside the grid counts as solid on the sides and floor so
   * the player can never walk out of a room or fall through the world.
   */
  isSolidAt(x, y, z) {
    if (y < 0) return true;
    if (y >= this.sizeY) return false;
    if (x < 0 || z < 0 || x >= this.sizeX || z >= this.sizeZ) return this.solidBorder;
    return isSolid(this.data[this.index(x, y, z)]);
  }

  /** Remember the authored state so player edits can be stored as a diff. */
  snapshotBaseline() {
    this.baseline = this.data.slice();
  }

  /** { cellIndex: blockId } for everything the player changed. */
  collectEdits() {
    if (!this.baseline) return {};
    const edits = {};
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i] !== this.baseline[i]) edits[i] = this.data[i];
    }
    return edits;
  }

  applyEdits(edits) {
    if (!edits) return;
    for (const key of Object.keys(edits)) {
      const i = Number(key);
      if (i >= 0 && i < this.data.length) this.data[i] = edits[key];
    }
    this.dirty = true;
  }

  /** True when the block should be drawn — i.e. at least one face is exposed. */
  isVisible(x, y, z, id) {
    const def = getBlock(id);
    if (!def) return false;
    if (def.geometry !== 'box') return true;   // plants and fences are never buried
    if (!isOpaque(this.get(x + 1, y, z))) return true;
    if (!isOpaque(this.get(x - 1, y, z))) return true;
    if (!isOpaque(this.get(x, y + 1, z))) return true;
    if (!isOpaque(this.get(x, y - 1, z))) return true;
    if (!isOpaque(this.get(x, y, z + 1))) return true;
    if (!isOpaque(this.get(x, y, z - 1))) return true;
    // Fully buried: skip it. (The grid edge counts as open so outer walls draw.)
    return (
      x === 0 || y === 0 || z === 0 ||
      x === this.sizeX - 1 || y === this.sizeY - 1 || z === this.sizeZ - 1
    );
  }

  /** Rebuild every instanced mesh from the current grid. */
  rebuild(castShadows = true) {
    const counts = new Map();
    const { sizeX, sizeY, sizeZ } = this;

    for (let y = 0; y < sizeY; y++) {
      for (let z = 0; z < sizeZ; z++) {
        for (let x = 0; x < sizeX; x++) {
          const id = this.data[this.index(x, y, z)];
          if (id === AIR) continue;
          if (!this.isVisible(x, y, z, id)) continue;
          counts.set(id, (counts.get(id) || 0) + 1);
        }
      }
    }

    // Drop meshes for block types that vanished entirely.
    for (const [id, mesh] of this.meshes) {
      if (!counts.has(id)) {
        this.group.remove(mesh);
        mesh.dispose();
        this.meshes.delete(id);
      }
    }

    // Allocate (or reallocate) a mesh per block type.
    for (const [id, count] of counts) {
      const existing = this.meshes.get(id);
      if (existing && existing.instanceMatrix.count >= count) continue;
      if (existing) {
        this.group.remove(existing);
        existing.dispose();
      }
      const render = getBlockRender(id);
      if (!render) continue;
      // Round capacity up so small edits don't reallocate on every placement.
      const capacity = Math.ceil(count * 1.25) + 16;
      const mesh = new THREE.InstancedMesh(render.geometry, render.material, capacity);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.castShadow = castShadows && render.def.geometry !== 'cross';
      mesh.receiveShadow = castShadows;
      mesh.frustumCulled = false;
      mesh.name = `blocks:${render.def.key}`;
      this.meshes.set(id, mesh);
      this.group.add(mesh);
    }

    const cursors = new Map();
    this.glowPoints.length = 0;

    for (let y = 0; y < sizeY; y++) {
      for (let z = 0; z < sizeZ; z++) {
        for (let x = 0; x < sizeX; x++) {
          const id = this.data[this.index(x, y, z)];
          if (id === AIR) continue;
          if (!this.isVisible(x, y, z, id)) continue;
          const mesh = this.meshes.get(id);
          if (!mesh) continue;
          const i = cursors.get(id) || 0;
          cursors.set(id, i + 1);
          _pos.set(x + 0.5, y + 0.5, z + 0.5);
          _matrix.compose(_pos, _quat, _scale);
          mesh.setMatrixAt(i, _matrix);
          const def = getBlock(id);
          if (def.glow) this.glowPoints.push({ x: x + 0.5, y: y + 0.5, z: z + 0.5, glow: def.glow });
        }
      }
    }

    for (const [id, mesh] of this.meshes) {
      mesh.count = cursors.get(id) || 0;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }

    this.dirty = false;
  }

  /**
   * Voxel DDA (Amanatides & Woo). Returns the first solid-ish cell hit, the
   * empty cell just before it (where a new block goes), and the face normal.
   */
  raycast(origin, direction, maxDistance = 6) {
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const dx = direction.x;
    const dy = direction.y;
    const dz = direction.z;
    if (dx === 0 && dy === 0 && dz === 0) return null;

    const stepX = Math.sign(dx);
    const stepY = Math.sign(dy);
    const stepZ = Math.sign(dz);

    const tDeltaX = stepX === 0 ? Infinity : Math.abs(1 / dx);
    const tDeltaY = stepY === 0 ? Infinity : Math.abs(1 / dy);
    const tDeltaZ = stepZ === 0 ? Infinity : Math.abs(1 / dz);

    const boundary = (o, i, step) => (step > 0 ? i + 1 - o : o - i);
    let tMaxX = stepX === 0 ? Infinity : boundary(origin.x, x, stepX) * tDeltaX;
    let tMaxY = stepY === 0 ? Infinity : boundary(origin.y, y, stepY) * tDeltaY;
    let tMaxZ = stepZ === 0 ? Infinity : boundary(origin.z, z, stepZ) * tDeltaZ;

    let normal = [0, 0, 0];
    let travelled = 0;

    while (travelled <= maxDistance) {
      if (this.inBounds(x, y, z)) {
        const id = this.data[this.index(x, y, z)];
        if (id !== AIR) {
          return {
            block: { x, y, z },
            place: { x: x + normal[0], y: y + normal[1], z: z + normal[2] },
            normal,
            id,
          };
        }
      }
      if (tMaxX < tMaxY && tMaxX < tMaxZ) {
        x += stepX;
        travelled = tMaxX;
        tMaxX += tDeltaX;
        normal = [-stepX, 0, 0];
      } else if (tMaxY < tMaxZ) {
        y += stepY;
        travelled = tMaxY;
        tMaxY += tDeltaY;
        normal = [0, -stepY, 0];
      } else {
        z += stepZ;
        travelled = tMaxZ;
        tMaxZ += tDeltaZ;
        normal = [0, 0, -stepZ];
      }
    }
    return null;
  }

  dispose() {
    for (const mesh of this.meshes.values()) {
      this.group.remove(mesh);
      mesh.dispose();
    }
    this.meshes.clear();
  }
}
