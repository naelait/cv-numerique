import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { GroupeCompetence } from '../cv.data';

const GROUP_COLORS: Record<string, number> = {
  s1: 0x79c0ff,
  s2: 0x7ee787,
  s3: 0xd2a8ff,
};

interface MoonState {
  mesh: THREE.Mesh;
  label: CSS2DObject;
  groupId: string;
  itemLabel: string;
  orbitRadius: number;
  orbitSpeed: number;
  orbitAngle: number;
}

interface PlanetState {
  group: GroupeCompetence;
  mesh: THREE.Mesh;
  glow: THREE.Mesh;
  label: CSS2DObject;
  orbitRadius: number;
  orbitSpeed: number;
  orbitAngle: number;
  inclination: number;
  moons: MoonState[];
  trail: THREE.LineLoop;
}

export interface SkillSolarSystemOptions {
  onSelect: (groupId: string, itemLabel?: string) => void;
}

export class SkillSolarSystem {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(52, 1, 0.1, 400);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly labelRenderer: CSS2DRenderer;
  private readonly controls: OrbitControls;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly clickable: THREE.Object3D[] = [];

  private planets: PlanetState[] = [];
  private sun: THREE.Mesh | null = null;
  private stars: THREE.Points | null = null;
  private activeGroupId = '';
  private running = false;
  private reducedMotion = false;
  private sectionActive = true;
  private raf = 0;
  private clock = new THREE.Clock();
  private resizeObserver: ResizeObserver | null = null;
  private hovered: THREE.Object3D | null = null;

  constructor(
    private readonly host: HTMLElement,
    canvas: HTMLCanvasElement,
    private readonly options: SkillSolarSystemOptions,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x0a0d11, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.className = 'galaxy__labels';
    this.host.appendChild(this.labelRenderer.domElement);

    this.camera.position.set(0, 16, 38);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 95;
    this.controls.maxPolarAngle = Math.PI * 0.92;
    this.controls.enablePan = true;
    this.controls.panSpeed = 0.65;
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 0.85;
    this.controls.target.set(0, 0, 0);

    this.scene.fog = new THREE.FogExp2(0x0a0d11, 0.012);

    this.buildSun();
    this.buildStarfield();

    const ambient = new THREE.AmbientLight(0x404860, 0.55);
    this.scene.add(ambient);

    const key = new THREE.PointLight(0xff6a3d, 2.4, 120);
    key.position.set(0, 0, 0);
    this.scene.add(key);

    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('click', this.onClick);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
    this.animate();
  }

  setGroups(groups: GroupeCompetence[]): void {
    this.clearPlanets();
    this.buildPlanets(groups);
    this.applyActiveHighlight();
  }

  setActiveGroup(id: string): void {
    this.activeGroupId = id;
    this.applyActiveHighlight();
  }

  setActive(active: boolean): void {
    this.sectionActive = active;
    this.controls.autoRotate = !this.reducedMotion && active;
    if (active) {
      this.resize();
      if (!this.raf) this.animate();
    } else if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
    this.controls.autoRotate = !reduced && this.sectionActive;
    this.controls.autoRotateSpeed = 0.25;
  }

  zoomIn(): void {
    this.camera.position.multiplyScalar(0.82);
    this.controls.update();
  }

  zoomOut(): void {
    this.camera.position.multiplyScalar(1.18);
    this.controls.update();
  }

  resetView(): void {
    this.camera.position.set(0, 16, 38);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect();
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.removeEventListener('click', this.onClick);
    this.clearPlanets();
    this.controls.dispose();
    this.renderer.dispose();
    this.labelRenderer.domElement.remove();
    this.stars?.geometry.dispose();
    (this.stars?.material as THREE.Material)?.dispose();
    this.sun?.geometry.dispose();
    (this.sun?.material as THREE.Material)?.dispose();
  }

  private buildSun(): void {
    const geo = new THREE.SphereGeometry(2.2, 48, 48);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff6a3d,
      emissive: 0xff6a3d,
      emissiveIntensity: 1.6,
      roughness: 0.35,
      metalness: 0.1,
    });
    this.sun = new THREE.Mesh(geo, mat);
    this.scene.add(this.sun);

    const glowGeo = new THREE.SphereGeometry(3.4, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff6a3d,
      transparent: true,
      opacity: 0.12,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    this.scene.add(glow);
  }

  private buildStarfield(): void {
    const count = 2200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 70 + Math.random() * 90;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x7ee787,
      size: 0.22,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    this.stars = new THREE.Points(geo, mat);
    this.scene.add(this.stars);
  }

  private buildPlanets(groups: GroupeCompetence[]): void {
    const configs = [
      { radius: 13, speed: 0.14, angle: 0.6, inclination: 2.2 },
      { radius: 21, speed: 0.1, angle: 2.6, inclination: -1.6 },
      { radius: 29, speed: 0.08, angle: 4.4, inclination: 1.1 },
    ];

    groups.forEach((group, i) => {
      const cfg = configs[i] ?? configs[0];
      const color = GROUP_COLORS[group.id] ?? 0x79c0ff;
      const size = 1.35 + (group.niveau / 100) * 0.85;

      const geo = new THREE.SphereGeometry(size, 40, 40);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.35,
        roughness: 0.42,
        metalness: 0.25,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { type: 'group', groupId: group.id };
      this.scene.add(mesh);
      this.clickable.push(mesh);

      const glowGeo = new THREE.SphereGeometry(size * 1.35, 24, 24);
      const glowMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.1,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      mesh.add(glow);

      const labelEl = document.createElement('span');
      labelEl.className = 'galaxy__label';
      labelEl.textContent = group.libelle;
      const label = new CSS2DObject(labelEl);
      label.position.set(0, -(size + 1.8), 0);
      mesh.add(label);

      const trailPoints: THREE.Vector3[] = [];
      for (let a = 0; a <= 64; a++) {
        const t = (a / 64) * Math.PI * 2;
        trailPoints.push(
          new THREE.Vector3(
            Math.cos(t) * cfg.radius,
            Math.sin(t * 0.5) * cfg.inclination,
            Math.sin(t) * cfg.radius,
          ),
        );
      }
      const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPoints);
      const trailMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.16,
      });
      const trail = new THREE.LineLoop(trailGeo, trailMat);
      this.scene.add(trail);

      const moons: MoonState[] = [];
      group.items.forEach((item, mi) => {
        const moonSize = 0.38 + (mi % 3) * 0.06;
        const moonGeo = new THREE.SphereGeometry(moonSize, 16, 16);
        const moonMat = new THREE.MeshStandardMaterial({
          color: 0xcad5e2,
          emissive: color,
          emissiveIntensity: 0.25,
          roughness: 0.55,
          metalness: 0.15,
        });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        moonMesh.userData = { type: 'item', groupId: group.id, label: item.nom };
        this.scene.add(moonMesh);

        const pickGeo = new THREE.SphereGeometry(moonSize * 2.5, 12, 12);
        const pickMat = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          depthWrite: false,
        });
        const pickMesh = new THREE.Mesh(pickGeo, pickMat);
        pickMesh.userData = { type: 'item', groupId: group.id, label: item.nom, pickFor: moonMesh };
        moonMesh.add(pickMesh);
        this.clickable.push(pickMesh);

        const moonLabelEl = document.createElement('span');
        moonLabelEl.className = 'galaxy__moon-label';
        moonLabelEl.textContent = item.nom;
        const moonLabel = new CSS2DObject(moonLabelEl);
        moonLabel.position.set(moonSize + 0.75, 0.2, 0);
        moonLabel.visible = false;
        moonMesh.add(moonLabel);

        moons.push({
          mesh: moonMesh,
          label: moonLabel,
          groupId: group.id,
          itemLabel: item.nom,
          orbitRadius: size + 2.2 + mi * 0.55,
          orbitSpeed: 0.35 + mi * 0.04,
          orbitAngle: (mi / group.items.length) * Math.PI * 2 + i,
        });
      });

      this.planets.push({
        group,
        mesh,
        glow,
        label,
        orbitRadius: cfg.radius,
        orbitSpeed: cfg.speed,
        orbitAngle: cfg.angle,
        inclination: cfg.inclination,
        moons,
        trail,
      });
    });

    this.updatePlanetPositions(0);
  }

  private clearPlanets(): void {
    for (const planet of this.planets) {
      this.scene.remove(planet.mesh);
      this.scene.remove(planet.trail);
      planet.mesh.geometry.dispose();
      (planet.mesh.material as THREE.Material).dispose();
      planet.glow.geometry.dispose();
      (planet.glow.material as THREE.Material).dispose();
      planet.trail.geometry.dispose();
      (planet.trail.material as THREE.Material).dispose();
      for (const moon of planet.moons) {
        this.scene.remove(moon.mesh);
        moon.mesh.geometry.dispose();
        (moon.mesh.material as THREE.Material).dispose();
      }
    }
    this.planets = [];
    this.clickable.length = 0;
  }

  private updatePlanetPositions(delta: number): void {
    for (const planet of this.planets) {
      if (!this.reducedMotion) {
        planet.orbitAngle += planet.orbitSpeed * delta;
      }

      const x = Math.cos(planet.orbitAngle) * planet.orbitRadius;
      const z = Math.sin(planet.orbitAngle) * planet.orbitRadius;
      const y = Math.sin(planet.orbitAngle * 0.55) * planet.inclination;
      planet.mesh.position.set(x, y, z);

      for (const moon of planet.moons) {
        if (!this.reducedMotion) {
          moon.orbitAngle += moon.orbitSpeed * delta;
        }
        moon.mesh.position.set(
          x + Math.cos(moon.orbitAngle) * moon.orbitRadius,
          y + Math.sin(moon.orbitAngle * 0.85) * moon.orbitRadius * 0.35,
          z + Math.sin(moon.orbitAngle) * moon.orbitRadius,
        );
      }
    }
  }

  private applyActiveHighlight(): void {
    for (const planet of this.planets) {
      const active = planet.group.id === this.activeGroupId;
      const mat = planet.mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = active ? 0.95 : 0.35;
      (planet.glow.material as THREE.MeshBasicMaterial).opacity = active ? 0.22 : 0.1;
      planet.mesh.scale.setScalar(active ? 1.12 : 1);
      planet.label.element.classList.toggle('is-active', active);

      for (const moon of planet.moons) {
        const moonMat = moon.mesh.material as THREE.MeshStandardMaterial;
        moonMat.emissiveIntensity = active ? 0.55 : 0.25;
        moon.label.visible = active;
      }
    }
  }

  private onPointerMove = (event: PointerEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.clickable, false);
    const hit = hits[0]?.object ?? null;
    if (this.hovered !== hit) {
      this.hovered = hit;
      this.renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
      this.syncMoonLabels(hit);
    }
  };

  private syncMoonLabels(hit: THREE.Object3D | null): void {
    const hoverMoon =
      hit?.userData['type'] === 'item'
        ? ((hit.userData['pickFor'] as THREE.Mesh | undefined) ?? (hit as THREE.Mesh))
        : null;

    for (const planet of this.planets) {
      for (const moon of planet.moons) {
        const show = hoverMoon === moon.mesh || planet.group.id === this.activeGroupId;
        moon.label.visible = show;
      }
    }
  }

  private onClick = (): void => {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.clickable, false)[0]?.object;
    if (!hit) return;
    const groupId = hit.userData['groupId'] as string | undefined;
    if (!groupId) return;

    if (hit.userData['type'] === 'item') {
      const label = hit.userData['label'] as string | undefined;
      this.options.onSelect(groupId, label);
      return;
    }

    this.options.onSelect(groupId);
  };

  private resize(): void {
    const w = Math.max(1, this.host.clientWidth);
    const h = Math.max(1, this.host.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.labelRenderer.setSize(w, h);
  }

  private animate = (): void => {
    if (!this.sectionActive) {
      this.raf = 0;
      return;
    }
    this.raf = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.updatePlanetPositions(delta);

    if (this.sun && !this.reducedMotion) {
      this.sun.rotation.y += delta * 0.25;
    }

    this.controls.autoRotate = !this.reducedMotion && this.sectionActive;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  };
}
