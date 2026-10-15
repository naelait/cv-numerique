import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatrixClickerService, type ClickerUpgradeDef } from './matrix-clicker.service';
import { MatrixRain } from './matrix-rain';
import { DEV_PALETTES, DEV_SPRITES, type DevSpriteId } from './pixel-devs';

interface ClickParticle {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  amount: number;
  crit: boolean;
}

type ShopTab = 'click' | 'passive';
type CoachStep = 'hit' | 'hire' | 'chain';

const COACH_KEY = 'nael.matrix-coach.v1';

type ShopCell =
  | { kind: 'item'; item: ClickerUpgradeDef }
  | { kind: 'soon'; label: string; glyph: string; detail: string }
  | { kind: 'empty' };

@Component({
  selector: 'app-matrix-clicker',
  templateUrl: './matrix-clicker.html',
  styleUrl: './matrix-clicker.css',
})
export class MatrixClicker {
  readonly active = input(true);
  readonly huntRequest = output<string>();

  private readonly destroyRef = inject(DestroyRef);
  protected readonly clicker = inject(MatrixClickerService);
  private readonly canvasEl = viewChild<ElementRef<HTMLCanvasElement>>('rainCanvas');

  protected readonly reducedMotion = signal(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  protected readonly particles = signal<ClickParticle[]>([]);
  protected readonly corePulse = signal(false);
  protected readonly mobHit = signal(false);
  protected readonly shopTab = signal<ShopTab>('click');
  protected readonly justBoughtId = signal<string | null>(null);
  protected readonly coach = signal<CoachStep | null>(null);
  protected readonly comboLive = signal(false);
  protected readonly coreCrit = signal(false);

  protected readonly showShopTabs = computed(
    () =>
      this.clicker.isUnlocked('click-shop') &&
      this.clicker.clickUpgrades().length > 0 &&
      this.clicker.passiveUpgrades().length > 0,
  );

  protected readonly showingDevs = computed(() => {
    if (this.clicker.clickUpgrades().length && this.clicker.passiveUpgrades().length) {
      return this.shopTab() === 'passive';
    }
    return this.clicker.passiveUpgrades().length > 0;
  });

  protected readonly visibleShopUpgrades = computed(() => {
    if (this.clicker.clickUpgrades().length && this.clicker.passiveUpgrades().length) {
      return this.shopTab() === 'click'
        ? this.clicker.clickUpgrades()
        : this.clicker.passiveUpgrades();
    }
    return this.clicker.passiveUpgrades().length
      ? this.clicker.passiveUpgrades()
      : this.clicker.clickUpgrades();
  });

  /** Always 4 slots so the phone height never jumps with unlocks. */
  protected readonly shopSlots = computed((): ShopCell[] => {
    const kind = this.showingDevs() ? 'passive' : 'click';
    const slots: ShopCell[] = this.visibleShopUpgrades()
      .slice(0, 4)
      .map((item) => ({ kind: 'item' as const, item }));
    for (const soon of this.clicker.nextLocked(kind)) {
      if (slots.length >= 4) break;
      slots.push({ kind: 'soon', ...soon });
    }
    while (slots.length < 4) slots.push({ kind: 'empty' });
    return slots;
  });

  protected readonly shopHeading = computed(() => {
    if (this.showingDevs()) return 'Équipe';
    return 'Pouvoirs';
  });

  protected critChanceLabel(): string {
    const pct = this.clicker.critChance() * 100;
    if (pct <= 0) return '0';
    return pct >= 10 ? pct.toFixed(0) : pct.toFixed(1);
  }

  protected coachCopy(): string {
    switch (this.coach()) {
      case 'hit':
        return 'Clique le noyau pour frapper le bug.';
      case 'hire':
        return 'Dépense l’or sur Léa. Elle continue d’attaquer.';
      case 'chain':
        return 'Enchaîne les clics tant que l’anneau est plein. Les dégâts montent.';
      default:
        return '';
    }
  }

  private rain: MatrixRain | null = null;
  private comboFrame = 0;
  private chainReady = false;
  private critTimer: ReturnType<typeof setTimeout> | null = null;
  private particleId = 0;
  private buyFlashTimer: ReturnType<typeof setTimeout> | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private motionQuery: MediaQueryList | null = null;
  private onMotionChange: ((event: MediaQueryListEvent) => void) | null = null;

  constructor() {
    this.coach.set(this.readCoach());

    effect(() => {
      if (this.clicker.session() === 0) return;
      this.chainReady = false;
      this.coach.set('hit');
    });

    effect(() => {
      const step = this.coach();
      if (!step) return;
      if (step === 'hit' && this.clicker.zone() > 1) this.setCoach('hire');
      if ((step === 'hit' || step === 'hire') && this.clicker.hiredAny()) this.setCoach('chain');
      if (step !== 'chain') return;
      const combo = this.clicker.combo();
      if (combo === 0) this.chainReady = true;
      if (this.chainReady && combo >= 4) this.finishCoach();
    });

    effect(() => {
      if (this.clicker.combo() === 0) this.comboLive.set(false);
    });

    effect(() => {
      const active = this.active();
      this.reducedMotion();
      this.clicker.setGameActive(active);
      this.syncRainState();
    });

    effect(() => {
      const speed = this.clicker.rainSpeed();
      this.rain?.setSpeed(speed);
    });

    effect(() => {
      const burst = this.clicker.levelUpBurst();
      if (burst && !this.reducedMotion()) {
        this.corePulse.set(true);
        const t = window.setTimeout(() => this.corePulse.set(false), 900);
        return () => clearTimeout(t);
      }
      return undefined;
    });

    effect(() => {
      if (!this.showShopTabs()) return;
      const tab = this.shopTab();
      const hasClick = this.clicker.clickUpgrades().length > 0;
      const hasPassive = this.clicker.passiveUpgrades().length > 0;
      if (tab === 'click' && !hasClick && hasPassive) {
        this.shopTab.set('passive');
      } else if (tab === 'passive' && !hasPassive && hasClick) {
        this.shopTab.set('click');
      }
    });

    afterNextRender(() => {
      this.initRain();
    });

    this.destroyRef.onDestroy(() => {
      this.rain?.stop();
      this.resizeObserver?.disconnect();
      if (this.buyFlashTimer) clearTimeout(this.buyFlashTimer);
      if (this.critTimer) clearTimeout(this.critTimer);
      cancelAnimationFrame(this.comboFrame);
      if (this.motionQuery && this.onMotionChange) {
        this.motionQuery.removeEventListener('change', this.onMotionChange);
      }
    });
  }

  protected setShopTab(tab: ShopTab, event: Event): void {
    event.stopPropagation();
    if (tab === 'click' && this.clicker.clickUpgrades().length === 0) return;
    if (tab === 'passive' && this.clicker.passiveUpgrades().length === 0) return;
    this.shopTab.set(tab);
  }

  protected onShopTabKey(event: KeyboardEvent): void {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const next: ShopTab =
      event.key === 'Home'
        ? 'click'
        : event.key === 'End'
          ? 'passive'
          : this.shopTab() === 'click'
            ? 'passive'
            : 'click';
    this.shopTab.set(next);
    queueMicrotask(() => {
      document
        .getElementById(next === 'click' ? 'matrix-shop-tab-click' : 'matrix-shop-tab-passive')
        ?.focus({ preventScroll: true });
    });
  }

  protected onCoreClick(event: MouseEvent): void {
    event.stopPropagation();
    const result = this.clicker.click();
    this.spawnParticle(event, result.damage, result.crit);
    this.armStrike(result.crit);
  }

  protected skipCoach(event: Event): void {
    event.stopPropagation();
    this.finishCoach();
  }

  protected onRaidBannerClick(event: Event): void {
    event.stopPropagation();
    const section = this.clicker.activeRaid()?.sectionId;
    if (section) this.huntRequest.emit(section);
  }

  protected buyUpgrade(id: string, event: Event): void {
    event.stopPropagation();
    if (!this.clicker.buyUpgrade(id)) return;
    this.justBoughtId.set(id);
    if (this.buyFlashTimer) clearTimeout(this.buyFlashTimer);
    this.buyFlashTimer = setTimeout(() => this.justBoughtId.set(null), 480);
  }

  protected upgradeAriaLabel(upgrade: ClickerUpgradeDef): string {
    const cost = this.clicker.formatCount(this.clicker.upgradeCost(upgrade.id));
    const owned = this.clicker.ownedCount(upgrade.id);
    const role = upgrade.role ? ` (${upgrade.role})` : '';
    const verb = upgrade.kind === 'passive' ? 'Recruter' : 'Acheter';
    if (this.clicker.canAfford(upgrade.id)) {
      return `${verb} ${upgrade.label}${role} pour ${cost} or${owned ? `, niveau ${owned}` : ''}`;
    }
    const need = this.clicker.formatCount(this.clicker.goldShortfall(upgrade.id));
    return `${upgrade.label}${role} — encore ${need} or`;
  }

  protected spriteRows(id: DevSpriteId): number[][] {
    return DEV_SPRITES[id];
  }

  protected pixColor(id: DevSpriteId, cell: number): string {
    return DEV_PALETTES[id][cell] ?? 'transparent';
  }

  private initRain(): void {
    const canvas = this.canvasEl()?.nativeElement;
    if (!canvas) return;

    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.onMotionChange = (event) => {
      this.reducedMotion.set(event.matches);
      this.syncRainState();
    };
    this.motionQuery.addEventListener('change', this.onMotionChange);

    try {
      this.rain = new MatrixRain(canvas);
      this.rain.setSpeed(this.clicker.rainSpeed());
    } catch {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => this.rain?.resize());
    this.resizeObserver.observe(canvas);
    this.syncRainState();
  }

  private syncRainState(): void {
    if (!this.rain) return;
    if (this.active() && !this.reducedMotion()) {
      this.rain.start();
      this.rain.resize();
      return;
    }
    this.rain.stop();
  }

  private readCoach(): CoachStep | null {
    try {
      if (localStorage.getItem(COACH_KEY) === 'done') return null;
    } catch {
      return 'hit';
    }
    if (this.clicker.hiredAny() || this.clicker.heroLevel() >= 4 || this.clicker.zone() >= 6) {
      return null;
    }
    if (this.clicker.zone() > 1 || this.clicker.gold() > 0) return 'hire';
    return 'hit';
  }

  private setCoach(step: CoachStep): void {
    if (this.coach() === step) return;
    if (step === 'chain') this.chainReady = false;
    this.coach.set(step);
  }

  private finishCoach(): void {
    if (this.coach() === null) return;
    this.coach.set(null);
    try {
      localStorage.setItem(COACH_KEY, 'done');
    } catch {
      /* ignore quota */
    }
  }

  private armStrike(crit: boolean): void {
    if (this.reducedMotion()) return;
    this.mobHit.set(true);
    window.setTimeout(() => this.mobHit.set(false), crit ? 180 : 120);
    if (crit) {
      this.coreCrit.set(true);
      if (this.critTimer) clearTimeout(this.critTimer);
      this.critTimer = setTimeout(() => this.coreCrit.set(false), 180);
    }
    this.comboLive.set(false);
    cancelAnimationFrame(this.comboFrame);
    this.comboFrame = requestAnimationFrame(() => {
      this.comboFrame = requestAnimationFrame(() => this.comboLive.set(true));
    });
  }

  private spawnParticle(event: MouseEvent, amount: number, crit = false): void {
    const core = event.currentTarget as HTMLElement;
    const strike = core.closest('.matrix__strike');
    if (!strike) return;

    const strikeRect = strike.getBoundingClientRect();
    const coreRect = core.getBoundingClientRect();
    const cx = coreRect.left + coreRect.width / 2 - strikeRect.left;
    const cy = coreRect.top + coreRect.height / 2 - strikeRect.top;

    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.15;
    const ring = coreRect.width * (0.48 + Math.random() * 0.28);
    const x = cx + Math.cos(angle) * ring;
    const y = cy + Math.sin(angle) * ring;
    const drift = 18 + Math.random() * 22;
    const tx = Math.cos(angle) * drift;
    const ty = Math.sin(angle) * drift - 12;

    const id = ++this.particleId;
    this.particles.update((list) => [...list, { id, x, y, tx, ty, amount, crit }]);
    window.setTimeout(() => {
      this.particles.update((list) => list.filter((p) => p.id !== id));
    }, crit ? 900 : 760);
  }
}
