import * as THREE from 'three';
import {
  buildAvatar, animateAvatar, characterHeight, DEFAULT_CHARACTER,
} from './avatar.js';

// Movement is plain AABB-against-the-grid, resolved one axis at a time.
// No physics engine — the world is cubes, so cubes are all we need to solve.

const HALF_WIDTH = 0.3;
const GRAVITY = 28;
const JUMP_SPEED = 9.2;
const WALK_SPEED = 4.4;
const SPRINT_SPEED = 6.8;
const ACCEL_GROUND = 42;
const ACCEL_AIR = 12;
const EPS = 1e-3;
const MAX_STEP = 1.05;      // auto-climb a single block, like Minecraft's autojump

const _forward = new THREE.Vector3();
const _target = new THREE.Vector3();

/** Any solid block overlapping this AABB? */
function overlapsSolid(zone, minX, minY, minZ, maxX, maxY, maxZ) {
  const x0 = Math.floor(minX);
  const x1 = Math.floor(maxX - EPS);
  const y0 = Math.floor(minY);
  const y1 = Math.floor(maxY - EPS);
  const z0 = Math.floor(minZ);
  const z1 = Math.floor(maxZ - EPS);
  for (let y = y0; y <= y1; y++) {
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) {
        if (zone.isSolidAt(x, y, z)) return true;
      }
    }
  }
  return false;
}

export class Player {
  constructor(character = DEFAULT_CHARACTER) {
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.grounded = false;
    this.firstPerson = false;
    this.cameraDistance = 4.4;
    this.smoothY = 0;
    this.speed = 0;

    this.group = new THREE.Group();
    this.avatar = null;
    this.character = character;
    this.setCharacter(character);
  }

  setCharacter(config) {
    this.character = config;
    if (this.avatar) this.group.remove(this.avatar);
    this.avatar = buildAvatar(config);
    this.group.add(this.avatar);
    this.height = characterHeight(config);
    this.eyeHeight = this.height - 0.22;
  }

  teleport(pos, yaw = this.yaw, pitch = 0) {
    this.position.set(pos[0], pos[1], pos[2]);
    this.velocity.set(0, 0, 0);
    this.yaw = yaw;
    this.pitch = pitch;
    this.smoothY = this.position.y;
    this.grounded = false;
  }

  /** Unit vector the player is looking along. */
  lookDirection(out = _forward) {
    const cosPitch = Math.cos(this.pitch);
    return out.set(
      -Math.sin(this.yaw) * cosPitch,
      -Math.sin(this.pitch),
      -Math.cos(this.yaw) * cosPitch,
    );
  }

  /** World position of the eyes — the origin for block targeting. */
  eyePosition(out = _target) {
    return out.set(this.position.x, this.position.y + this.eyeHeight, this.position.z);
  }

  applyLook(dx, dy) {
    this.yaw -= dx;
    this.pitch += dy;
    const limit = Math.PI / 2 - 0.02;
    this.pitch = Math.max(-limit, Math.min(limit, this.pitch));
    this.yaw = ((this.yaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  }

  update(dt, input, zone) {
    const look = input.consumeLook();
    if (look.dx || look.dy) this.applyLook(look.dx, look.dy);

    const move = input.move;
    const wanted = new THREE.Vector3();
    if (move.x || move.z) {
      // Movement is relative to where the camera is pointing.
      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);
      wanted.x = move.x * cos - move.z * sin;
      wanted.z = -move.x * sin - move.z * cos;
      wanted.normalize();
    }

    const maxSpeed = input.sprinting ? SPRINT_SPEED : WALK_SPEED;
    const accel = (this.grounded ? ACCEL_GROUND : ACCEL_AIR) * dt;
    const targetVX = wanted.x * maxSpeed;
    const targetVZ = wanted.z * maxSpeed;
    this.velocity.x += Math.max(-accel, Math.min(accel, targetVX - this.velocity.x));
    this.velocity.z += Math.max(-accel, Math.min(accel, targetVZ - this.velocity.z));

    // Friction when there's no input, so she doesn't skate.
    if (!wanted.lengthSq() && this.grounded) {
      const damping = Math.max(0, 1 - 12 * dt);
      this.velocity.x *= damping;
      this.velocity.z *= damping;
    }

    if (input.jumping && this.grounded) {
      this.velocity.y = JUMP_SPEED;
      this.grounded = false;
    }
    this.velocity.y = Math.max(-40, this.velocity.y - GRAVITY * dt);

    this._moveAndCollide(zone, this.velocity.x * dt, this.velocity.y * dt, this.velocity.z * dt);

    this.speed = Math.hypot(this.velocity.x, this.velocity.z);

    // Face the direction of travel (third person) or the camera (first person).
    if (this.avatar) {
      const facing = this.firstPerson || this.speed < 0.2
        ? this.yaw
        : Math.atan2(this.velocity.x, this.velocity.z) + Math.PI;
      let delta = facing - this.group.rotation.y;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      this.group.rotation.y += delta * Math.min(1, dt * 12);
      animateAvatar(this.avatar, dt, this.speed, { grounded: this.grounded });
    }

    // Smoothed Y for the camera so auto-stepping doesn't jolt the view.
    const ySmoothing = Math.min(1, dt * 14);
    this.smoothY += (this.position.y - this.smoothY) * ySmoothing;
    if (Math.abs(this.position.y - this.smoothY) > 2) this.smoothY = this.position.y;

    this.group.position.set(this.position.x, this.position.y, this.position.z);
    // Visibility is decided in updateCamera, which knows how close a wall has
    // pushed the camera.
  }

  _moveAndCollide(zone, dx, dy, dz) {
    const h = this.height;
    const p = this.position;

    const blocked = (x, y, z) => overlapsSolid(
      zone,
      x - HALF_WIDTH + EPS, y + EPS, z - HALF_WIDTH + EPS,
      x + HALF_WIDTH - EPS, y + h - EPS, z + HALF_WIDTH - EPS,
    );

    // --- X ---
    if (dx !== 0) {
      const nx = p.x + dx;
      if (!blocked(nx, p.y, p.z)) {
        p.x = nx;
      } else if (this.grounded && !blocked(nx, p.y + MAX_STEP, p.z)) {
        p.x = nx;
        p.y += MAX_STEP;
      } else {
        this.velocity.x = 0;
      }
    }

    // --- Z ---
    if (dz !== 0) {
      const nz = p.z + dz;
      if (!blocked(p.x, p.y, nz)) {
        p.z = nz;
      } else if (this.grounded && !blocked(p.x, p.y + MAX_STEP, nz)) {
        p.z = nz;
        p.y += MAX_STEP;
      } else {
        this.velocity.z = 0;
      }
    }

    // --- Y ---
    this.grounded = false;
    if (dy !== 0) {
      const ny = p.y + dy;
      if (!blocked(p.x, ny, p.z)) {
        p.y = ny;
      } else if (dy < 0) {
        // Landed: snap to the top of the block below.
        p.y = Math.floor(p.y + dy) + 1;
        this.velocity.y = 0;
        this.grounded = true;
      } else {
        // Bumped the ceiling.
        this.velocity.y = 0;
      }
    }

    // A grounded check that survives standing perfectly still.
    if (!this.grounded && this.velocity.y <= 0) {
      if (blocked(p.x, p.y - 0.02, p.z)) {
        this.grounded = true;
        this.velocity.y = 0;
      }
    }

    // Last-resort unstick, e.g. if a block is placed inside the player.
    if (blocked(p.x, p.y, p.z)) {
      for (let lift = 0; lift < 4; lift += 0.5) {
        if (!blocked(p.x, p.y + lift, p.z)) {
          p.y += lift;
          break;
        }
      }
    }
  }

  /** Position the camera for the current view mode, avoiding walls. */
  updateCamera(camera, zone) {
    const eyeY = this.smoothY + this.eyeHeight;
    const dir = this.lookDirection();
    if (this.firstPerson) {
      camera.position.set(this.position.x, eyeY, this.position.z);
      this.group.visible = false;
    } else {
      let distance = this.cameraDistance;
      const origin = new THREE.Vector3(this.position.x, eyeY, this.position.z);
      const back = dir.clone().multiplyScalar(-1);
      const hit = zone.raycast(origin, back, distance + 0.6);
      if (hit) {
        const hx = hit.block.x + 0.5 - origin.x;
        const hy = hit.block.y + 0.5 - origin.y;
        const hz = hit.block.z + 0.5 - origin.z;
        distance = Math.max(1.1, Math.hypot(hx, hy, hz) - 0.9);
      }
      camera.position.set(
        origin.x + back.x * distance,
        origin.y + back.y * distance + 0.35,
        origin.z + back.z * distance,
      );
      // Backed into a corner: her own head would fill the screen, so drop to
      // first-person rather than showing the inside of it.
      this.group.visible = distance > 2;
    }
    camera.lookAt(
      this.position.x + dir.x * 8,
      eyeY + dir.y * 8,
      this.position.z + dir.z * 8,
    );
  }

  /** Which block is under the crosshair, and where a new one would go. */
  targetBlock(zone, reach = 6) {
    const origin = this.eyePosition(new THREE.Vector3());
    const dir = this.lookDirection(new THREE.Vector3());
    return zone.raycast(origin, dir, reach);
  }

  /** Would a block at these coordinates be inside the player? */
  intersectsCell(x, y, z) {
    const p = this.position;
    return (
      p.x + HALF_WIDTH > x && p.x - HALF_WIDTH < x + 1 &&
      p.y + this.height > y && p.y < y + 1 &&
      p.z + HALF_WIDTH > z && p.z - HALF_WIDTH < z + 1
    );
  }
}
