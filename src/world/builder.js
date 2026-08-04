import { blockId, AIR } from './blocks.js';

/**
 * A tiny authoring layer over a Zone. Every building in the village is written
 * with these calls — it keeps the world files readable instead of drowning in
 * triple-nested loops.
 *
 * Block names are strings here ('plaster', 'roof'); ids stay an internal detail.
 */
export class Build {
  constructor(zone) {
    this.zone = zone;
    this.ox = 0;
    this.oy = 0;
    this.oz = 0;
  }

  /** Shift the origin so a building can be authored from (0,0,0) and placed anywhere. */
  at(ox, oy, oz) {
    const clone = new Build(this.zone);
    clone.ox = this.ox + ox;
    clone.oy = this.oy + oy;
    clone.oz = this.oz + oz;
    return clone;
  }

  id(key) {
    return key === 'air' || key == null ? AIR : blockId(key);
  }

  set(x, y, z, key) {
    this.zone.set(x + this.ox, y + this.oy, z + this.oz, this.id(key));
  }

  get(x, y, z) {
    return this.zone.get(x + this.ox, y + this.oy, z + this.oz);
  }

  /** Solid filled cuboid, inclusive of both corners. */
  box(x0, y0, z0, x1, y1, z1, key) {
    const id = this.id(key);
    const [ax, bx] = x0 <= x1 ? [x0, x1] : [x1, x0];
    const [ay, by] = y0 <= y1 ? [y0, y1] : [y1, y0];
    const [az, bz] = z0 <= z1 ? [z0, z1] : [z1, z0];
    for (let y = ay; y <= by; y++) {
      for (let z = az; z <= bz; z++) {
        for (let x = ax; x <= bx; x++) {
          this.zone.set(x + this.ox, y + this.oy, z + this.oz, id);
        }
      }
    }
  }

  /** The four vertical walls of a cuboid, no floor or ceiling. */
  walls(x0, y0, z0, x1, y1, z1, key) {
    this.box(x0, y0, z0, x1, y1, z0, key);
    this.box(x0, y0, z1, x1, y1, z1, key);
    this.box(x0, y0, z0, x0, y1, z1, key);
    this.box(x1, y0, z0, x1, y1, z1, key);
  }

  /** A single-block-thick rectangle outline on one horizontal layer. */
  outline(x0, y, z0, x1, z1, key) {
    this.walls(x0, y, z0, x1, y, z1, key);
  }

  /**
   * Stepped gable roof. `axis` is the direction the ridge runs.
   * Each layer steps in by one on both sides until the span closes.
   */
  gable(x0, z0, x1, z1, baseY, key, { axis = 'x', overhang = 1, trim = null } = {}) {
    let ax = x0 - overhang;
    let bx = x1 + overhang;
    let az = z0 - overhang;
    let bz = z1 + overhang;
    let y = baseY;
    let guard = 0;
    while (guard++ < 64) {
      this.box(ax, y, az, bx, y, bz, key);
      if (trim && y === baseY) {
        // Darker eave line along the overhang edge.
        this.box(ax, y - 1, az, bx, y - 1, az, trim);
        this.box(ax, y - 1, bz, bx, y - 1, bz, trim);
      }
      if (axis === 'x') {
        if (bz - az <= 1) break;
        az += 1;
        bz -= 1;
      } else {
        if (bx - ax <= 1) break;
        ax += 1;
        bx -= 1;
      }
      y += 1;
    }
    return y;
  }

  /** Four-sided pyramid roof, used for square towers and the barn cupola. */
  pyramid(x0, z0, x1, z1, baseY, key, overhang = 1) {
    let ax = x0 - overhang;
    let bx = x1 + overhang;
    let az = z0 - overhang;
    let bz = z1 + overhang;
    let y = baseY;
    let guard = 0;
    while (ax <= bx && az <= bz && guard++ < 64) {
      this.box(ax, y, az, bx, y, bz, key);
      ax += 1; bx -= 1; az += 1; bz -= 1; y += 1;
    }
    return y;
  }

  /** Horizontal line of blocks between two points (axis-aligned only). */
  line(x0, y0, z0, x1, y1, z1, key) {
    this.box(x0, y0, z0, x1, y1, z1, key);
  }

  /** Window opening with a frame, shutters and a flower box under the sill. */
  window(x, y, z, facing, {
    width = 2, height = 2, shutters = true, flowers = 'flower_pink',
  } = {}) {
    const horizontal = facing === 'z' ? [1, 0] : [0, 1];
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        this.set(x + horizontal[0] * i, y + j, z + horizontal[1] * i, 'glass');
      }
    }
    if (shutters) {
      this.set(x - horizontal[0], y, z - horizontal[1], 'shutter');
      this.set(x - horizontal[0], y + 1, z - horizontal[1], 'shutter');
      this.set(x + horizontal[0] * width, y, z + horizontal[1] * width, 'shutter');
      this.set(x + horizontal[0] * width, y + 1, z + horizontal[1] * width, 'shutter');
    }
    if (flowers) {
      const nx = facing === 'z' ? 0 : 1;
      const nz = facing === 'z' ? 1 : 0;
      for (let i = 0; i < width; i++) {
        const fx = x + horizontal[0] * i;
        const fz = z + horizontal[1] * i;
        this.set(fx + nx, y - 1, fz + nz, 'oak');
        this.set(fx + nx, y, fz + nz, flowers);
      }
    }
  }

  /** A doorway punched through a wall, two blocks tall. */
  doorway(x, y, z, facing = 'z', width = 1) {
    for (let i = 0; i < width; i++) {
      const dx = facing === 'z' ? i : 0;
      const dz = facing === 'z' ? 0 : i;
      this.set(x + dx, y, z + dz, 'air');
      this.set(x + dx, y + 1, z + dz, 'air');
    }
  }

  /**
   * Blocky tree. The canopy is a squashed sphere around the top of the trunk —
   * a flat slab of leaves is the fastest way to make a village look cheap.
   */
  tree(x, y, z, { height = 5, canopy = 2, leaf = 'leaves', trunk = 'log' } = {}) {
    const top = y + height;
    for (let i = 0; i < height; i++) this.set(x, y + i, z, trunk);
    const r = canopy;
    for (let dy = -r; dy <= r; dy++) {
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          // Slightly squashed vertically so it reads as a canopy, not a ball.
          const distance = Math.sqrt(dx * dx + dy * dy * 1.5 + dz * dz);
          if (distance > r + 0.4) continue;
          if (dx === 0 && dz === 0 && dy <= 0) continue;   // leave the trunk showing
          this.set(x + dx, top + dy, z + dz, leaf);
        }
      }
    }
    this.set(x, top, z, leaf);
  }

  /** Low picket fence outline with posts; leaves gaps where `skip` says so. */
  fence(x0, z0, x1, z1, y, key = 'fence', skip = []) {
    const skipped = new Set(skip.map(([sx, sz]) => `${sx},${sz}`));
    const place = (x, z) => {
      if (skipped.has(`${x},${z}`)) return;
      this.set(x, y, z, key);
    };
    for (let x = x0; x <= x1; x++) { place(x, z0); place(x, z1); }
    for (let z = z0; z <= z1; z++) { place(x0, z); place(x1, z); }
  }

  /** Scatter of flowers and tufts, seeded so the village looks the same daily. */
  scatter(x0, z0, x1, z1, y, options = {}) {
    const { density = 0.12, kinds = ['flower_pink', 'flower_yellow', 'tuft'], seed = 1 } = options;
    let s = seed >>> 0;
    const rand = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) {
        if (rand() > density) continue;
        if (this.get(x, y, z) !== AIR) continue;
        if (this.get(x, y - 1, z) === AIR) continue;
        this.set(x, y, z, kinds[Math.floor(rand() * kinds.length)]);
      }
    }
  }

  /** A run of lantern posts along a path. */
  lampPosts(points, y, height = 3) {
    for (const [x, z] of points) {
      for (let i = 0; i < height; i++) this.set(x, y + i, z, 'lamppost');
      this.set(x, y + height, z, 'lantern');
    }
  }
}
