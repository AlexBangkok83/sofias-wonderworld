import * as THREE from 'three';

/**
 * Sky, sun and lantern light.
 *
 * Lanterns are the whole mood of this village, but a point light per lantern
 * would be hundreds of lights. Instead a small pool of lights follows the
 * player around, always attached to the nearest glowing blocks — which is the
 * only place the difference would ever show.
 */

const LIGHT_POOL_SIZE = 8;

function gradientSky(top, bottom) {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, top);
  gradient.addColorStop(0.55, bottom);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(320, 24, 16),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, depthWrite: false, fog: false }),
  );
  mesh.renderOrder = -1;
  return mesh;
}

function starField(count = 700) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Upper hemisphere only — no stars underfoot.
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.95);
    const r = 260;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({
    color: 0xf3eeff, size: 1.9, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.9,
  }));
  points.renderOrder = -1;
  return points;
}

export class Lighting {
  constructor(scene) {
    this.scene = scene;

    this.hemi = new THREE.HemisphereLight(0xdfeaf5, 0x6f7d54, 1.2);
    scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xfff1d4, 1.9);
    this.sun.position.set(38, 60, 24);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 180;
    const extent = 42;
    this.sun.shadow.camera.left = -extent;
    this.sun.shadow.camera.right = extent;
    this.sun.shadow.camera.top = extent;
    this.sun.shadow.camera.bottom = -extent;
    this.sun.shadow.bias = -0.0012;
    this.sun.shadow.normalBias = 0.04;
    scene.add(this.sun);
    scene.add(this.sun.target);

    this.fill = new THREE.DirectionalLight(0xc9d8f0, 0.35);
    this.fill.position.set(-30, 26, -22);
    scene.add(this.fill);

    // Lantern pool.
    this.pool = [];
    for (let i = 0; i < LIGHT_POOL_SIZE; i++) {
      const light = new THREE.PointLight(0xffcf85, 0, 12, 2);
      light.visible = false;
      scene.add(light);
      this.pool.push(light);
    }

    this.sky = null;
    this.stars = null;
    this._skyKey = null;
  }

  setShadowsEnabled(enabled) {
    this.sun.castShadow = enabled;
  }

  /** Apply a zone's mood: sky colours, fog, sun strength. */
  applyZone(zone) {
    const night = !!zone.night;
    const indoor = !!zone.indoor;
    const ambient = zone.ambient || {};

    const key = `${zone.id}`;
    if (this._skyKey !== key) {
      this._skyKey = key;
      if (this.sky) {
        this.scene.remove(this.sky);
        this.sky.geometry.dispose();
        this.sky.material.map?.dispose();
        this.sky.material.dispose();
        this.sky = null;
      }
      if (this.stars) {
        this.scene.remove(this.stars);
        this.stars.geometry.dispose();
        this.stars.material.dispose();
        this.stars = null;
      }
      if (night) {
        this.sky = gradientSky('#1a1730', '#332a4a');
        this.stars = starField();
        this.scene.add(this.stars);
      } else if (!indoor) {
        // Late-afternoon warmth, never a grey sky.
        this.sky = gradientSky('#8ec4e8', '#f4dcc0');
      }
      if (this.sky) this.scene.add(this.sky);
    }

    if (indoor && !night) {
      // Rooms are lantern-lit and cosy, never gloomy — white plaster has to
      // still read as white plaster.
      this.scene.background = new THREE.Color(ambient.fog ?? 0x4a3a38);
      this.scene.fog = new THREE.Fog(ambient.fog ?? 0x4a3a38, 26, 70);
      this.hemi.color.setHex(ambient.sky ?? 0xffe6c2);
      this.hemi.groundColor.setHex(ambient.ground ?? 0x7d5f45);
      this.hemi.intensity = ambient.hemi ?? 1.6;
      this.sun.intensity = ambient.sun ?? 0.55;
      this.sun.color.setHex(0xfff0d4);
      this.fill.intensity = 0.3;
    } else if (night) {
      this.scene.background = null;
      this.scene.fog = new THREE.FogExp2(ambient.fog ?? 0x14132a, 0.012);
      this.hemi.color.setHex(ambient.sky ?? 0x6f74b8);
      this.hemi.groundColor.setHex(ambient.ground ?? 0x2b2740);
      this.hemi.intensity = ambient.hemi ?? 1.15;
      this.sun.intensity = ambient.sun ?? 0.55;
      this.sun.color.setHex(0xc6cdf7);
      this.fill.intensity = 0.25;
    } else {
      this.scene.background = null;
      this.scene.fog = new THREE.Fog(0xdcd0c0, 70, 190);
      this.hemi.color.setHex(0xdfeaf5);
      this.hemi.groundColor.setHex(0x6f7d54);
      this.hemi.intensity = 1.25;
      this.sun.intensity = 1.9;
      this.sun.color.setHex(0xfff1d4);
      this.fill.intensity = 0.35;
    }
  }

  /** Keep the shadow frustum and lantern pool centred on the player. */
  update(zone, playerPosition) {
    this.sun.target.position.copy(playerPosition);
    this.sun.position.set(
      playerPosition.x + 38,
      playerPosition.y + 60,
      playerPosition.z + 24,
    );
    if (this.sky) this.sky.position.copy(playerPosition);
    if (this.stars) this.stars.position.copy(playerPosition);

    // Nearest N glowing blocks get a real light.
    const points = zone.glowPoints;
    const best = [];
    for (const point of points) {
      const dx = point.x - playerPosition.x;
      const dy = point.y - playerPosition.y;
      const dz = point.z - playerPosition.z;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > 900) continue;
      if (best.length < LIGHT_POOL_SIZE) {
        best.push({ point, d2 });
        best.sort((a, b) => a.d2 - b.d2);
      } else if (d2 < best[best.length - 1].d2) {
        best[best.length - 1] = { point, d2 };
        best.sort((a, b) => a.d2 - b.d2);
      }
    }

    for (let i = 0; i < this.pool.length; i++) {
      const light = this.pool[i];
      const entry = best[i];
      if (!entry) {
        light.visible = false;
        light.intensity = 0;
        continue;
      }
      const { point } = entry;
      light.visible = true;
      light.position.set(point.x, point.y, point.z);
      light.color.setHex(point.glow.color);
      light.distance = point.glow.distance;
      // Fade out at the edge of range so lights don't pop as she walks.
      const fade = Math.max(0, 1 - entry.d2 / 900);
      light.intensity = point.glow.intensity * (0.35 + 0.65 * fade) * 9;
    }
  }
}
