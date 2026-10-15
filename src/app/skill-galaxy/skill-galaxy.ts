import {
  afterNextRender,
  Component,
  DestroyRef,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import type { GroupeCompetence } from '../cv.data';
import { SkillSolarSystem } from './skill-solar-system';

export interface SonarBlip {
  id: string;
  groupId: string;
  label: string;
  short: string;
  angle: number;
  left: number;
  top: number;
}

@Component({
  selector: 'app-skill-galaxy',
  templateUrl: './skill-galaxy.html',
  styleUrl: './skill-galaxy.css',
})
export class SkillGalaxy {
  readonly groups = input.required<GroupeCompetence[]>();
  readonly activeId = input('');
  readonly active = input(true);
  readonly reducedMotion = input(false);

  readonly skillSelect = output<string>();
  readonly itemSelect = output<string>();

  /** Desktop 3D vs mobile sonar (< 901px). */
  protected readonly useSonar = signal(
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 900px)').matches : false,
  );

  protected readonly sweepDeg = signal(0);
  protected readonly litIds = signal<ReadonlySet<string>>(new Set());
  protected readonly pingIds = signal<ReadonlySet<string>>(new Set());

  private readonly destroyRef = inject(DestroyRef);
  private readonly hostEl = viewChild<ElementRef<HTMLElement>>('hostEl');
  private readonly canvasEl = viewChild<ElementRef<HTMLCanvasElement>>('glCanvas');

  private system: SkillSolarSystem | null = null;
  private rafId = 0;
  private lastTs = 0;
  private readonly pingUntil = new Map<string, number>();
  private desktopMq: MediaQueryList | null = null;

  protected readonly blips = computed(() => this.buildBlips(this.groups()));

  protected readonly sectors = computed(() => {
    const list = this.groups();
    const n = Math.max(list.length, 1);
    return list.map((g, i) => {
      const start = (i / n) * 360;
      const end = ((i + 1) / n) * 360;
      const mid = (start + end) / 2;
      const rad = ((mid - 90) * Math.PI) / 180;
      return {
        id: g.id,
        libelle: g.libelle,
        short: this.shortLabel(g.libelle),
        niveau: g.niveau,
        mid,
        left: 50 + 46 * Math.cos(rad),
        top: 50 + 46 * Math.sin(rad),
      };
    });
  });

  constructor() {
    afterNextRender(() => {
      this.desktopMq = window.matchMedia('(min-width: 901px)');
      const syncMode = () => {
        const desktop = this.desktopMq?.matches ?? true;
        this.useSonar.set(!desktop);
        if (desktop) {
          this.stopSweep();
          requestAnimationFrame(() => {
            requestAnimationFrame(() => this.initSystem());
          });
        } else {
          this.disposeSystem();
          if (this.active()) this.startSweep();
        }
      };
      syncMode();
      this.desktopMq.addEventListener('change', syncMode);
      this.destroyRef.onDestroy(() => {
        this.desktopMq?.removeEventListener('change', syncMode);
      });
    });

    effect(() => {
      const groups = this.groups();
      untracked(() => this.system?.setGroups(groups));
    });

    effect(() => {
      const activeId = this.activeId();
      untracked(() => this.system?.setActiveGroup(activeId));
    });

    effect(() => {
      const active = this.active();
      const sonar = this.useSonar();
      untracked(() => {
        this.system?.setActive(active && !sonar);
        if (sonar) {
          if (active) this.startSweep();
          else this.stopSweep();
        } else {
          this.stopSweep();
        }
      });
    });

    effect(() => {
      const reduced = this.reducedMotion();
      untracked(() => this.system?.setReducedMotion(reduced));
    });

    this.destroyRef.onDestroy(() => {
      this.stopSweep();
      this.disposeSystem();
    });
  }

  protected isLit(id: string): boolean {
    return this.litIds().has(id);
  }

  protected isPing(id: string): boolean {
    return this.pingIds().has(id);
  }

  protected shortLabel(libelle: string): string {
    const head = libelle.split(/[/·–—-]/)[0]?.trim() ?? libelle;
    return head.length > 14 ? `${head.slice(0, 13)}…` : head;
  }

  protected zoomIn(event: Event): void {
    event.stopPropagation();
    this.system?.zoomIn();
  }

  protected zoomOut(event: Event): void {
    event.stopPropagation();
    this.system?.zoomOut();
  }

  protected resetView(event: Event): void {
    event.stopPropagation();
    this.system?.resetView();
  }

  protected onRadioKey(event: KeyboardEvent): void {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const list = this.groups();
    if (!list.length) return;
    const idx = Math.max(0, list.findIndex((g) => g.id === this.activeId()));
    let next = idx;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = list.length - 1;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = (idx + 1) % list.length;
    } else {
      next = (idx - 1 + list.length) % list.length;
    }
    const group = list[next];
    if (!group) return;
    this.skillSelect.emit(group.id);
    queueMicrotask(() => {
      document.getElementById('galaxy-radio-' + group.id)?.focus({ preventScroll: true });
    });
  }

  protected selectGroup(id: string, event?: Event): void {
    event?.stopPropagation();
    this.skillSelect.emit(id);
  }

  protected selectBlip(blip: SonarBlip, event?: Event): void {
    event?.stopPropagation();
    this.skillSelect.emit(blip.groupId);
    this.itemSelect.emit(blip.label);
  }

  private initSystem(): void {
    if (this.system || this.useSonar()) return;
    const host = this.hostEl()?.nativeElement;
    const canvas = this.canvasEl()?.nativeElement;
    if (!host || !canvas) return;

    this.system = new SkillSolarSystem(host, canvas, {
      onSelect: (id, item) => {
        this.skillSelect.emit(id);
        if (item) this.itemSelect.emit(item);
      },
    });
    this.system.setGroups(this.groups());
    this.system.setActiveGroup(this.activeId());
    this.system.setActive(this.active());
    this.system.setReducedMotion(this.reducedMotion());
  }

  private disposeSystem(): void {
    this.system?.dispose();
    this.system = null;
  }

  private buildBlips(groups: GroupeCompetence[]): SonarBlip[] {
    const n = Math.max(groups.length, 1);
    const out: SonarBlip[] = [];

    groups.forEach((group, gi) => {
      const sectorStart = (gi / n) * 360;
      const sectorEnd = ((gi + 1) / n) * 360;
      const items = group.items;
      const count = Math.max(items.length, 1);

      items.forEach((item, ii) => {
        const t = (ii + 0.5) / count;
        const angle = sectorStart + t * (sectorEnd - sectorStart);
        const ring = 0.32 + (ii % 3) * 0.12;
        const rad = ((angle - 90) * Math.PI) / 180;
        out.push({
          id: `${group.id}::${item.nom}`,
          groupId: group.id,
          label: item.nom,
          short: item.nom.length > 12 ? `${item.nom.slice(0, 11)}…` : item.nom,
          angle,
          left: 50 + ring * 42 * Math.cos(rad),
          top: 50 + ring * 42 * Math.sin(rad),
        });
      });
    });

    return out;
  }

  private startSweep(): void {
    this.stopSweep();
    this.lastTs = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(64, now - this.lastTs);
      this.lastTs = now;
      const degPerSec = this.reducedMotion() ? 55 : 110;
      this.sweepDeg.update((a) => (a + (dt / 1000) * degPerSec) % 360);
      this.refreshLit(now);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopSweep(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private refreshLit(now: number): void {
    const sweep = this.sweepDeg();
    const beam = 18;
    const lit = new Set<string>();
    const prev = this.litIds();

    for (const blip of this.blips()) {
      if (this.angleDelta(sweep, blip.angle) <= beam) {
        lit.add(blip.id);
        if (!prev.has(blip.id)) {
          this.pingUntil.set(blip.id, now + 900);
        }
      }
    }

    for (const [id, until] of [...this.pingUntil.entries()]) {
      if (until <= now) this.pingUntil.delete(id);
    }

    this.litIds.set(lit);
    this.pingIds.set(new Set(this.pingUntil.keys()));
  }

  private angleDelta(a: number, b: number): number {
    let d = Math.abs(a - b) % 360;
    if (d > 180) d = 360 - d;
    return d;
  }
}
