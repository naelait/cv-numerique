import { Injectable, NgZone, computed, inject, signal, DestroyRef } from '@angular/core';
import type { DevSpriteId } from './pixel-devs';

const STORAGE_KEY = 'nael.matrix-clicks.v3';
const STORAGE_KEY_V2 = 'nael.matrix-clicks.v2';
const STORAGE_KEY_V1 = 'nael.matrix-clicks.v1';
const TICK_MS = 100;
const PERSIST_EVERY_MS = 1000;
const COMBO_WINDOW_MS = 1600;
const COMBO_WINDOW_RANK_MS = 2200;
const MAX_COMBO = 28;
const CRIT_COMBO_MIN = 4;
const CRIT_CHANCE = 0.14;
const CRIT_MULT = 2.25;
const RAID_MIN_ZONE = 6;
const RAID_TTL_MS = 75_000;
const RAID_COOLDOWN_MS = 28_000;
const RAID_SECTIONS = ['about', 'work', 'craft', 'projects', 'education', 'contact'] as const;

export type UpgradeKind = 'click' | 'passive';

export interface ClickerUpgradeDef {
  id: string;
  label: string;
  blurb: string;
  glyph: string;
  kind: UpgradeKind;
  clickPower?: number;
  cps?: number;
  baseCost: number;
  growth: number;
  unlockHeroLevel: number;
  /** Developer sprite (Auto tab only). */
  sprite?: DevSpriteId;
  role?: string;
  /** Crit chance added per owned level (0.01 = +1%). */
  critChance?: number;
  /** Crit damage multiplier bonus per level (0.1 = +10% of base crit mult). */
  critDamage?: number;
  /** Invasion spawn rate / frequency bonus per level. */
  raidSpawn?: number;
  /** Extra gold on kills per level (0.05 = +5%). */
  goldFind?: number;
}

export interface ClickerMilestone {
  heroLevel: number;
  title: string;
  unlockId: string;
}

export interface LevelUpBurst {
  id: number;
  level: number;
  title: string;
  kind: 'hero' | 'boss';
}

export type RaidSectionId = (typeof RAID_SECTIONS)[number];

export interface ClickerRaid {
  id: string;
  sectionId: RaidSectionId;
  name: string;
  hp: number;
  maxHp: number;
  goldReward: number;
  xpReward: number;
  expiresAt: number;
  spawnedAt: number;
}

export interface ClickResult {
  damage: number;
  crit: boolean;
  killed: boolean;
}

export interface RaidHitResult {
  damage: number;
  crit: boolean;
  killed: boolean;
  fled: boolean;
  loot: { gold: number; xp: number } | null;
}

export const CLICKER_MILESTONES: ClickerMilestone[] = [
  { heroLevel: 2, title: 'Sam rejoint l’équipe', unlockId: 'click-stat' },
  { heroLevel: 3, title: 'Pouvoirs de clic', unlockId: 'click-shop' },
  { heroLevel: 4, title: 'La pluie accélère', unlockId: 'rain-boost' },
  { heroLevel: 5, title: 'Surcharge cyan', unlockId: 'core-cyan' },
  { heroLevel: 6, title: 'Fenêtre de combo allongée', unlockId: 'combo-meter' },
  { heroLevel: 7, title: 'Noyau full-stack', unlockId: 'core-code' },
  { heroLevel: 8, title: 'Pouvoirs senior', unlockId: 'click-tier2' },
  { heroLevel: 10, title: 'deploy.exe', unlockId: 'deploy-theme' },
];

export const CLICKER_UPGRADES: ClickerUpgradeDef[] = [
  {
    id: 'vim',
    label: 'Vim mode',
    blurb: 'Chaque frappe compte davantage',
    glyph: 'vi',
    kind: 'click',
    clickPower: 1,
    baseCost: 25,
    growth: 1.18,
    unlockHeroLevel: 3,
  },
  {
    id: 'tabs',
    label: 'Tab complete',
    blurb: 'Auto-complète tes dégâts',
    glyph: '>>',
    kind: 'click',
    clickPower: 2,
    baseCost: 90,
    growth: 1.2,
    unlockHeroLevel: 3,
  },
  {
    id: 'mech',
    label: 'Mech keyboard',
    blurb: 'Clics plus lourds, plus nets',
    glyph: 'kb',
    kind: 'click',
    clickPower: 5,
    baseCost: 400,
    growth: 1.24,
    unlockHeroLevel: 8,
  },
  {
    id: 'flow',
    label: 'Flow state',
    blurb: 'Enchaine sans friction',
    glyph: '~>',
    kind: 'click',
    clickPower: 12,
    baseCost: 1800,
    growth: 1.28,
    unlockHeroLevel: 8,
  },
  {
    id: 'npm',
    label: 'Léa',
    role: 'Junior',
    blurb: 'Premiers commits, premiers crits',
    glyph: 'Jr',
    sprite: 'junior',
    kind: 'passive',
    cps: 0.15,
    critChance: 0.015,
    baseCost: 8,
    growth: 1.14,
    unlockHeroLevel: 1,
  },
  {
    id: 'hotreload',
    label: 'Sam',
    role: 'Frontend',
    blurb: 'Quand ça crit, ça fait mal',
    glyph: 'Fe',
    sprite: 'frontend',
    kind: 'passive',
    cps: 1.2,
    critDamage: 0.1,
    baseCost: 80,
    growth: 1.17,
    unlockHeroLevel: 2,
  },
  {
    id: 'ci',
    label: 'Kai',
    role: 'DevOps',
    blurb: 'Attire les bugs hors prod',
    glyph: 'Ops',
    sprite: 'devops',
    kind: 'passive',
    cps: 9,
    raidSpawn: 0.08,
    baseCost: 420,
    growth: 1.19,
    unlockHeroLevel: 5,
  },
  {
    id: 'llm',
    label: 'Rio',
    role: 'Staff',
    blurb: 'Crits, loot et invasions',
    glyph: 'St',
    sprite: 'staff',
    kind: 'passive',
    cps: 45,
    critChance: 0.02,
    raidSpawn: 0.04,
    goldFind: 0.06,
    baseCost: 2200,
    growth: 1.21,
    unlockHeroLevel: 7,
  },
];

const MONSTER_NAMES = [
  'NullPointer',
  'Race Condition',
  'Memory Leak',
  'Legacy PHP',
  'Spaghetti Code',
  'Infinite Loop',
  'Stack Overflow',
  'Merge Conflict',
  'Production Bug',
  'Tech Debt Titan',
];

const RAID_NAMES = [
  'Intruder.exe',
  'Shadow Bug',
  'Profil Leech',
  'CV Scrapers',
  'Recruiter Bot',
  'Heap Phantom',
  'Stale Cache',
  'Ghost Thread',
];

export const RAID_SECTION_LABELS: Record<RaidSectionId, string> = {
  about: 'Profil',
  work: 'Parcours',
  craft: 'Skills',
  projects: 'Projets',
  education: 'Formation',
  contact: 'Contact',
};

@Injectable({ providedIn: 'root' })
export class MatrixClickerService {
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  readonly gold = signal(0);
  readonly heroXp = signal(0);
  readonly zone = signal(1);
  readonly monsterHp = signal(0);
  readonly owned = signal<Record<string, number>>({});
  readonly combo = signal(0);
  readonly levelUpBurst = signal<LevelUpBurst | null>(null);
  readonly lastKill = signal<{ gold: number; xp: number } | null>(null);
  readonly lastCrit = signal(false);
  readonly activeRaid = signal<ClickerRaid | null>(null);
  readonly raidAlert = signal<string | null>(null);
  readonly lastRaidLoot = signal<{ gold: number; xp: number; sectionId: RaidSectionId } | null>(null);
  readonly killStreak = signal(0);
  /** Bumps when the run is wiped, so the coach can start over. */
  readonly session = signal(0);

  readonly heroLevel = computed(() => heroLevelFromXp(this.heroXp()));
  readonly monsterMaxHp = computed(() => maxHpForZone(this.zone()));
  readonly monsterHpRatio = computed(() => {
    const max = this.monsterMaxHp();
    if (max <= 0) return 0;
    return Math.max(0, Math.min(1, this.monsterHp() / max));
  });
  readonly isBoss = computed(() => this.zone() % 10 === 0);
  readonly monsterName = computed(() => nameForZone(this.zone()));

  readonly raidHpRatio = computed(() => {
    const raid = this.activeRaid();
    if (!raid || raid.maxHp <= 0) return 0;
    return Math.max(0, Math.min(1, raid.hp / raid.maxHp));
  });

  readonly raidSectionLabel = computed(() => {
    const raid = this.activeRaid();
    return raid ? RAID_SECTION_LABELS[raid.sectionId] : null;
  });

  readonly raidSecondsLeft = computed(() => {
    const raid = this.activeRaid();
    if (!raid) return 0;
    return Math.max(0, Math.ceil((raid.expiresAt - Date.now()) / 1000));
  });

  readonly clickDamage = computed(() => {
    let dmg = 1;
    for (const upgrade of CLICKER_UPGRADES) {
      if (upgrade.kind !== 'click') continue;
      dmg += (this.owned()[upgrade.id] ?? 0) * (upgrade.clickPower ?? 0);
    }
    return dmg * (1 + (this.heroLevel() - 1) * 0.07);
  });

  readonly dps = computed(() =>
    CLICKER_UPGRADES.reduce((sum, upgrade) => {
      if (upgrade.kind !== 'passive') return sum;
      return sum + (upgrade.cps ?? 0) * (this.owned()[upgrade.id] ?? 0);
    }, 0),
  );

  readonly critChanceBonus = computed(() =>
    CLICKER_UPGRADES.reduce((sum, upgrade) => {
      if (!upgrade.critChance) return sum;
      return sum + upgrade.critChance * (this.owned()[upgrade.id] ?? 0);
    }, 0),
  );

  readonly critDamageBonus = computed(() =>
    CLICKER_UPGRADES.reduce((sum, upgrade) => {
      if (!upgrade.critDamage) return sum;
      return sum + upgrade.critDamage * (this.owned()[upgrade.id] ?? 0);
    }, 0),
  );

  readonly raidSpawnBonus = computed(() =>
    CLICKER_UPGRADES.reduce((sum, upgrade) => {
      if (!upgrade.raidSpawn) return sum;
      return sum + upgrade.raidSpawn * (this.owned()[upgrade.id] ?? 0);
    }, 0),
  );

  readonly goldFindBonus = computed(() =>
    CLICKER_UPGRADES.reduce((sum, upgrade) => {
      if (!upgrade.goldFind) return sum;
      return sum + upgrade.goldFind * (this.owned()[upgrade.id] ?? 0);
    }, 0),
  );

  readonly critMultiplier = computed(
    () => CRIT_MULT * (1 + this.critDamageBonus()),
  );

  readonly unlocked = computed(() => {
    const lvl = this.heroLevel();
    const set = new Set<string>();
    for (const milestone of CLICKER_MILESTONES) {
      if (lvl >= milestone.heroLevel) set.add(milestone.unlockId);
    }
    return set;
  });

  readonly heroXpProgress = computed(() => {
    const lvl = this.heroLevel();
    const current = xpRequiredForLevel(lvl);
    const next = xpRequiredForLevel(lvl + 1);
    const xp = this.heroXp();
    if (next <= current) return 1;
    return Math.min(1, Math.max(0, (xp - current) / (next - current)));
  });

  readonly xpToNextHeroLevel = computed(() => {
    const next = xpRequiredForLevel(this.heroLevel() + 1);
    return Math.max(0, Math.ceil(next - this.heroXp()));
  });

  readonly rainSpeed = computed(() => {
    if (this.unlocked().has('deploy-theme')) return 2;
    if (this.unlocked().has('rain-boost')) return 1.55;
    return 1;
  });

  readonly appTitle = computed(() =>
    this.unlocked().has('deploy-theme') ? 'deploy.exe' : 'commit.exe',
  );

  readonly coreGlyph = computed(() => {
    if (this.unlocked().has('core-code')) return '</>';
    return '{ }';
  });

  readonly clickUpgrades = computed(() =>
    CLICKER_UPGRADES.filter((u) => u.kind === 'click' && this.isUpgradeVisible(u)),
  );

  readonly passiveUpgrades = computed(() =>
    CLICKER_UPGRADES.filter((u) => u.kind === 'passive' && this.isUpgradeVisible(u)),
  );

  readonly shopUpgrades = computed(() => [...this.clickUpgrades(), ...this.passiveUpgrades()]);

  readonly hiredAny = computed(() => Object.values(this.owned()).some((count) => count > 0));

  readonly zonesUntilBoss = computed(() => {
    const zone = this.zone();
    if (zone % 10 === 0) return 0;
    return 10 - (zone % 10);
  });

  /** One next step, shown when no raid and the coach is done. */
  readonly objective = computed(() => {
    if ((this.owned()['npm'] ?? 0) <= 0 && this.heroLevel() >= 1) {
      if (this.canAfford('npm')) {
        return { kicker: 'À faire', text: 'Recrute Léa. Elle attaque toute seule.' };
      }
      const need = this.formatCount(this.goldShortfall('npm'));
      return { kicker: 'Objectif', text: `Encore ${need} or pour recruter Léa.` };
    }

    const ready = this.shopUpgrades().find((upgrade) => this.canAfford(upgrade.id));
    if (ready) {
      return { kicker: 'Achat', text: `${ready.label} est à portée.` };
    }

    const next = CLICKER_MILESTONES.find((milestone) => milestone.heroLevel > this.heroLevel());
    if (next) {
      return { kicker: `Niveau ${next.heroLevel}`, text: next.title };
    }

    const until = this.zonesUntilBoss();
    if (until === 0) return { kicker: 'Boss', text: 'Il encaisse beaucoup plus.' };
    return { kicker: 'Suite', text: `Boss dans ${until} zones.` };
  });

  readonly commits = this.gold;
  readonly clickPower = this.clickDamage;
  readonly cps = this.dps;
  readonly level = this.heroLevel;

  private tickHandle: ReturnType<typeof setInterval> | null = null;
  private lastTick = 0;
  private lastPersist = 0;
  private dirty = false;
  private lastHeroLevelTracked = 1;
  private lastClickAt = 0;
  private lastRaidAt = 0;
  private killsSinceRaid = 0;
  private raidIdSeq = 0;
  private comboDecayTimer: ReturnType<typeof setTimeout> | null = null;
  private levelUpClearTimer: ReturnType<typeof setTimeout> | null = null;
  private killClearTimer: ReturnType<typeof setTimeout> | null = null;
  private raidAlertTimer: ReturnType<typeof setTimeout> | null = null;
  private raidLootTimer: ReturnType<typeof setTimeout> | null = null;
  private sectionWanted = true;

  constructor() {
    this.load();
    if (this.monsterHp() <= 0) {
      this.monsterHp.set(this.monsterMaxHp());
    }
    this.lastHeroLevelTracked = this.heroLevel();
    this.startTick();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibilityChange);
      this.destroyRef.onDestroy(() => {
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        this.pauseTick();
        if (this.raidAlertTimer) clearTimeout(this.raidAlertTimer);
        if (this.raidLootTimer) clearTimeout(this.raidLootTimer);
      });
    }
  }

  /** Pause idle DPS when intro (or game) is not the active section. */
  setGameActive(active: boolean): void {
    this.sectionWanted = active;
    this.syncTickRunning();
  }

  private onVisibilityChange = (): void => {
    this.syncTickRunning();
  };

  private syncTickRunning(): void {
    // Keep the clock alive off-intro so raids can expire / update the timer.
    const shouldRun = typeof document !== 'undefined' && !document.hidden;
    if (shouldRun) this.resumeTick();
    else this.pauseTick();
  }

  private pauseTick(): void {
    if (this.tickHandle) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
  }

  private resumeTick(): void {
    if (!this.tickHandle) this.startTick();
  }

  isUnlocked(id: string): boolean {
    return this.unlocked().has(id);
  }

  milestoneTitle(heroLevel: number): string {
    return CLICKER_MILESTONES.find((m) => m.heroLevel === heroLevel)?.title ?? 'Rank up';
  }

  sectionLabel(sectionId: RaidSectionId): string {
    return RAID_SECTION_LABELS[sectionId];
  }

  click(): ClickResult {
    const beforeZone = this.zone();
    const comboMult = this.registerCombo();
    const crit = this.rollCrit();
    this.lastCrit.set(crit);
    const raw = this.clickDamage() * comboMult * (crit ? this.critMultiplier() : 1);
    const dmg = Math.max(1, Math.round(raw * 10) / 10);
    this.applyDamage(dmg);
    return {
      damage: dmg,
      crit,
      killed: this.zone() > beforeZone,
    };
  }

  hitRaid(): RaidHitResult {
    const raid = this.activeRaid();
    if (!raid) {
      return { damage: 0, crit: false, killed: false, fled: false, loot: null };
    }
    if (Date.now() >= raid.expiresAt) {
      this.fleeRaid();
      return { damage: 0, crit: false, killed: false, fled: true, loot: null };
    }

    const comboMult = this.registerCombo();
    const crit = this.rollCrit();
    this.lastCrit.set(crit);
    const raw = this.clickDamage() * comboMult * (crit ? this.critMultiplier() : 1) * 1.15;
    const dmg = Math.max(1, Math.round(raw * 10) / 10);
    const remaining = raid.hp - dmg;

    if (remaining <= 0) {
      const lootMult = 1 + this.goldFindBonus();
      const loot = {
        gold: Math.floor(raid.goldReward * lootMult),
        xp: raid.xpReward,
      };
      this.gold.update((g) => g + loot.gold);
      this.heroXp.update((x) => x + loot.xp);
      this.killStreak.update((s) => s + 1);
      this.lastRaidLoot.set({ ...loot, sectionId: raid.sectionId });
      if (this.raidLootTimer) clearTimeout(this.raidLootTimer);
      this.raidLootTimer = setTimeout(() => {
        this.ngZone.run(() => this.lastRaidLoot.set(null));
      }, 2200);
      this.clearRaid();
      this.lastRaidAt = Date.now();
      this.checkHeroLevelUp();
      this.markDirty(true);
      return { damage: dmg, crit, killed: true, fled: false, loot };
    }

    this.activeRaid.set({ ...raid, hp: remaining });
    return { damage: dmg, crit, killed: false, fled: false, loot: null };
  }

  hasRaidOn(sectionId: string): boolean {
    return this.activeRaid()?.sectionId === sectionId;
  }

  upgradeCost(id: string): number {
    const def = CLICKER_UPGRADES.find((u) => u.id === id);
    if (!def) return Infinity;
    const count = this.owned()[id] ?? 0;
    return Math.floor(def.baseCost * Math.pow(def.growth, count));
  }

  ownedCount(id: string): number {
    return this.owned()[id] ?? 0;
  }

  canAfford(id: string): boolean {
    return this.gold() >= this.upgradeCost(id);
  }

  /** Gold still needed to buy (0 if affordable). */
  goldShortfall(id: string): number {
    return Math.max(0, Math.ceil(this.upgradeCost(id) - this.gold()));
  }

  /** Progress toward next purchase 0–1. */
  affordProgress(id: string): number {
    const cost = this.upgradeCost(id);
    if (!Number.isFinite(cost) || cost <= 0) return 1;
    return Math.max(0, Math.min(1, this.gold() / cost));
  }

  upgradeEffect(upgrade: ClickerUpgradeDef): string {
    if (upgrade.kind === 'click') return `+${upgrade.clickPower ?? 0} / clic`;
    return `+${this.formatRate(upgrade.cps ?? 0)}/s`;
  }

  /** Secondary passive line for developers. */
  upgradePassive(upgrade: ClickerUpgradeDef): string | null {
    const parts: string[] = [];
    if (upgrade.critChance) {
      parts.push(`+${(upgrade.critChance * 100).toFixed(1)}% crit`);
    }
    if (upgrade.critDamage) {
      parts.push(`+${Math.round(upgrade.critDamage * 100)}% dégâts crit`);
    }
    if (upgrade.raidSpawn) {
      parts.push(`+${Math.round(upgrade.raidSpawn * 100)}% raids`);
    }
    if (upgrade.goldFind) {
      parts.push(`+${Math.round(upgrade.goldFind * 100)}% or`);
    }
    return parts.length ? parts.join(' · ') : null;
  }

  buyUpgrade(id: string): boolean {
    const def = CLICKER_UPGRADES.find((u) => u.id === id);
    if (!def || !this.isUpgradeVisible(def)) return false;
    const cost = this.upgradeCost(id);
    if (!Number.isFinite(cost) || this.gold() < cost) return false;
    this.gold.update((n) => n - cost);
    this.owned.update((map) => ({
      ...map,
      [id]: (map[id] ?? 0) + 1,
    }));
    this.markDirty(true);
    return true;
  }

  comboMultiplier(): number {
    const count = this.combo();
    if (count <= 1) return 1;
    return 1 + (count - 1) * 0.07;
  }

  /** Combo chain window. Rank 6 keeps the chain alive longer. */
  comboWindowMs(): number {
    return this.isUnlocked('combo-meter') ? COMBO_WINDOW_RANK_MS : COMBO_WINDOW_MS;
  }

  /** Crit chance from the team plus the current combo. */
  critChance(): number {
    const fromDevs = this.critChanceBonus();
    const fromCombo =
      this.combo() >= CRIT_COMBO_MIN
        ? CRIT_CHANCE + Math.min(0.12, this.combo() * 0.004)
        : 0;
    return Math.min(0.72, fromDevs + fromCombo);
  }

  /** Upgrades still hidden, nearest unlock first. */
  nextLocked(kind: UpgradeKind): { label: string; glyph: string; detail: string }[] {
    return CLICKER_UPGRADES.filter((upgrade) => upgrade.kind === kind && !this.isUpgradeVisible(upgrade))
      .sort((a, b) => a.unlockHeroLevel - b.unlockHeroLevel || a.baseCost - b.baseCost)
      .map((upgrade) => ({
        label: upgrade.label,
        glyph: upgrade.glyph,
        detail: `niveau ${upgrade.unlockHeroLevel}`,
      }));
  }

  formatCount(value: number): string {
    if (!Number.isFinite(value) || value < 0) return '0';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 10_000) return `${(value / 1_000).toFixed(1)}k`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(2)}k`;
    if (value >= 100) return String(Math.floor(value));
    const tenths = Math.round(value * 10) / 10;
    if (Number.isInteger(tenths)) return String(tenths);
    return tenths.toFixed(1);
  }

  formatRate(value: number): string {
    if (!Number.isFinite(value) || value <= 0) return '0';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 10_000) return `${(value / 1_000).toFixed(1)}k`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(2)}k`;
    const rounded = Math.round(value * 10) / 10;
    if (Number.isInteger(rounded)) return String(rounded);
    return rounded.toFixed(1);
  }

  formatHp(value: number): string {
    return this.formatCount(Math.max(0, Math.ceil(value)));
  }

  /** Wipe progress and start from zone 1. */
  resetGame(): void {
    this.gold.set(0);
    this.heroXp.set(0);
    this.zone.set(1);
    this.monsterHp.set(maxHpForZone(1));
    this.owned.set({});
    this.combo.set(0);
    this.levelUpBurst.set(null);
    this.lastKill.set(null);
    this.lastCrit.set(false);
    this.killStreak.set(0);
    this.lastRaidLoot.set(null);
    this.clearRaid();
    this.lastHeroLevelTracked = 1;
    this.lastClickAt = 0;
    this.lastRaidAt = 0;
    this.killsSinceRaid = 0;
    this.dirty = false;

    if (this.comboDecayTimer) {
      clearTimeout(this.comboDecayTimer);
      this.comboDecayTimer = null;
    }
    if (this.levelUpClearTimer) {
      clearTimeout(this.levelUpClearTimer);
      this.levelUpClearTimer = null;
    }
    if (this.killClearTimer) {
      clearTimeout(this.killClearTimer);
      this.killClearTimer = null;
    }
    if (this.raidAlertTimer) {
      clearTimeout(this.raidAlertTimer);
      this.raidAlertTimer = null;
    }
    if (this.raidLootTimer) {
      clearTimeout(this.raidLootTimer);
      this.raidLootTimer = null;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY_V2);
      localStorage.removeItem(STORAGE_KEY_V1);
      localStorage.removeItem('naiel.matrix-clicks.v3');
      localStorage.removeItem('naiel.matrix-clicks.v2');
      localStorage.removeItem('naiel.matrix-clicks.v1');
      localStorage.removeItem('nael.matrix-coach.v1');
    } catch {
      /* ignore */
    }
    this.persist();
    this.session.update((n) => n + 1);
  }

  private isUpgradeVisible(def: ClickerUpgradeDef): boolean {
    if (def.kind === 'click') {
      if (!this.isUnlocked('click-shop')) return false;
      if (def.unlockHeroLevel >= 8 && !this.isUnlocked('click-tier2')) return false;
    }
    return this.heroLevel() >= def.unlockHeroLevel;
  }

  private rollCrit(): boolean {
    const chance = this.critChance();
    if (chance <= 0) return false;
    return Math.random() < chance;
  }

  private applyDamage(amount: number): void {
    if (amount <= 0) return;
    const remaining = this.monsterHp() - amount;
    if (remaining <= 0) {
      this.monsterHp.set(0);
      this.onMonsterKilled();
    } else {
      this.monsterHp.set(remaining);
    }
    this.markDirty(false);
  }

  private onMonsterKilled(): void {
    const z = this.zone();
    const streakBonus = 1 + Math.min(0.35, this.killStreak() * 0.03);
    const lootMult = streakBonus * (1 + this.goldFindBonus());
    const goldReward = Math.floor(goldForZone(z) * lootMult);
    const xpReward = Math.floor(xpForZone(z) * streakBonus);
    this.gold.update((g) => g + goldReward);
    this.heroXp.update((x) => x + xpReward);
    this.killStreak.update((s) => s + 1);
    this.lastKill.set({ gold: goldReward, xp: xpReward });
    if (this.killClearTimer) clearTimeout(this.killClearTimer);
    this.killClearTimer = setTimeout(() => {
      this.ngZone.run(() => this.lastKill.set(null));
    }, 1400);

    const nextZone = z + 1;
    this.zone.set(nextZone);
    this.monsterHp.set(maxHpForZone(nextZone));

    if (nextZone % 10 === 0) {
      this.triggerBurst(nextZone, 'boss', `Boss — zone ${nextZone}`);
    }
    this.checkHeroLevelUp();
    this.killsSinceRaid += 1;
    this.maybeSpawnRaid(nextZone);
    this.markDirty(true);
  }

  private maybeSpawnRaid(zone: number): void {
    if (this.activeRaid()) return;
    if (zone < RAID_MIN_ZONE) return;
    const hired = Object.values(this.owned()).some((count) => count > 0);
    if (!hired && zone < 10) return;
    const now = Date.now();
    const spawnBonus = this.raidSpawnBonus();
    const cooldown = RAID_COOLDOWN_MS / (1 + spawnBonus);
    if (now - this.lastRaidAt < cooldown) return;

    const killsNeeded = Math.max(1, Math.round(2 - spawnBonus * 5));
    const dueByKills = this.killsSinceRaid >= killsNeeded;
    const dueByBoss = zone % 5 === 0;
    const lucky = Math.random() < 0.22 + spawnBonus * 0.55;
    if (!dueByKills && !dueByBoss && !lucky) return;

    this.spawnRaid();
  }

  private spawnRaid(forcedSection?: RaidSectionId): void {
    if (this.activeRaid()) return;
    const z = this.zone();
    const sectionId =
      forcedSection ?? RAID_SECTIONS[Math.floor(Math.random() * RAID_SECTIONS.length)];
    const maxHp = Math.max(12, Math.floor(maxHpForZone(z) * 0.42));
    const goldReward = Math.max(8, Math.floor(goldForZone(z) * 2.1));
    const xpReward = Math.max(6, Math.floor(xpForZone(z) * 1.8));
    const name = RAID_NAMES[Math.floor(Math.random() * RAID_NAMES.length)];
    const now = Date.now();
    const raid: ClickerRaid = {
      id: `raid-${++this.raidIdSeq}`,
      sectionId,
      name,
      hp: maxHp,
      maxHp,
      goldReward,
      xpReward,
      expiresAt: now + RAID_TTL_MS,
      spawnedAt: now,
    };

    this.activeRaid.set(raid);
    this.killsSinceRaid = 0;
    this.lastRaidAt = now;

    const label = RAID_SECTION_LABELS[sectionId];
    const msg = `${name} a fui vers ${label}. Va le finir avant qu'il disparaisse.`;
    this.raidAlert.set(msg);
    if (this.raidAlertTimer) clearTimeout(this.raidAlertTimer);
    this.raidAlertTimer = setTimeout(() => {
      this.ngZone.run(() => {
        if (this.raidAlert() === msg) this.raidAlert.set(null);
      });
    }, 9000);
  }

  private fleeRaid(): void {
    this.clearRaid();
    this.killStreak.set(0);
    this.raidAlert.set('Intrusion échappée — trop tard');
    if (this.raidAlertTimer) clearTimeout(this.raidAlertTimer);
    this.raidAlertTimer = setTimeout(() => {
      this.ngZone.run(() => this.raidAlert.set(null));
    }, 3200);
  }

  private clearRaid(): void {
    this.activeRaid.set(null);
    this.raidAlert.set(null);
  }

  private registerCombo(): number {
    const now = performance.now();
    const windowMs = this.comboWindowMs();
    if (now - this.lastClickAt <= windowMs) {
      this.combo.update((c) => Math.min(c + 1, MAX_COMBO));
    } else {
      this.combo.set(1);
    }
    this.lastClickAt = now;

    if (this.comboDecayTimer) clearTimeout(this.comboDecayTimer);
    this.comboDecayTimer = setTimeout(() => {
      this.ngZone.run(() => this.combo.set(0));
    }, windowMs);

    return this.comboMultiplier();
  }

  private checkHeroLevelUp(): void {
    const current = this.heroLevel();
    if (current <= this.lastHeroLevelTracked) return;
    for (let lvl = this.lastHeroLevelTracked + 1; lvl <= current; lvl += 1) {
      this.triggerBurst(lvl, 'hero', this.milestoneTitle(lvl));
    }
    this.lastHeroLevelTracked = current;
  }

  private triggerBurst(level: number, kind: LevelUpBurst['kind'], title: string): void {
    this.levelUpBurst.set({
      id: Date.now() + level,
      level,
      title,
      kind,
    });
    if (this.levelUpClearTimer) clearTimeout(this.levelUpClearTimer);
    this.levelUpClearTimer = setTimeout(() => {
      this.ngZone.run(() => this.levelUpBurst.set(null));
    }, 2400);
  }

  private startTick(): void {
    if (this.tickHandle) return;
    this.lastTick = performance.now();
    this.lastPersist = this.lastTick;
    this.ngZone.runOutsideAngular(() => {
      this.tickHandle = setInterval(() => {
        const now = performance.now();
        const delta = Math.max(0, (now - this.lastTick) / 1000);
        this.lastTick = now;
        const rate = this.dps();
        const needsPersist = this.dirty && now - this.lastPersist >= PERSIST_EVERY_MS;
        const raid = this.activeRaid();
        const raidExpired = !!raid && Date.now() >= raid.expiresAt;

        const applyIdle = this.sectionWanted && rate > 0 && delta > 0;
        if (applyIdle || needsPersist || raidExpired || raid) {
          this.ngZone.run(() => {
            if (raidExpired) this.fleeRaid();
            if (applyIdle) {
              this.applyDamage(rate * delta);
            }
            const live = this.activeRaid();
            if (live) this.activeRaid.set({ ...live });
            if (needsPersist) {
              this.persist();
              this.lastPersist = now;
              this.dirty = false;
            }
          });
        }
      }, TICK_MS);
    });
  }

  private markDirty(flush: boolean): void {
    this.dirty = true;
    if (flush) {
      this.persist();
      this.lastPersist = performance.now();
      this.dirty = false;
    }
  }

  private load(): void {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem(STORAGE_KEY_V2) ??
      localStorage.getItem(STORAGE_KEY_V1) ??
      localStorage.getItem('naiel.matrix-clicks.v3') ??
      localStorage.getItem('naiel.matrix-clicks.v2') ??
      localStorage.getItem('naiel.matrix-clicks.v1');
    if (!raw) {
      this.monsterHp.set(maxHpForZone(1));
      return;
    }
    try {
      const data = JSON.parse(raw) as {
        gold?: number;
        commits?: number;
        heroXp?: number;
        zone?: number;
        monsterHp?: number;
        owned?: Record<string, number>;
        lastHeroLevel?: number;
        killStreak?: number;
      };

      const legacyGold = data.gold ?? data.commits ?? 0;
      if (typeof legacyGold === 'number' && legacyGold >= 0) {
        this.gold.set(legacyGold);
      }

      if (typeof data.heroXp === 'number' && data.heroXp >= 0) {
        this.heroXp.set(data.heroXp);
      } else if (legacyGold > 0) {
        this.heroXp.set(Math.floor(Math.sqrt(legacyGold) * 4));
      }

      if (typeof data.zone === 'number' && data.zone >= 1) {
        this.zone.set(Math.floor(data.zone));
      } else if (legacyGold > 0) {
        this.zone.set(estimateZoneFromGold(legacyGold));
      }

      const z = this.zone();
      if (typeof data.monsterHp === 'number' && data.monsterHp > 0) {
        this.monsterHp.set(Math.min(data.monsterHp, maxHpForZone(z)));
      } else {
        this.monsterHp.set(maxHpForZone(z));
      }

      if (data.owned && typeof data.owned === 'object') {
        const cleaned: Record<string, number> = {};
        for (const upgrade of CLICKER_UPGRADES) {
          const n = data.owned[upgrade.id];
          if (typeof n === 'number' && n > 0) cleaned[upgrade.id] = Math.floor(n);
        }
        this.owned.set(cleaned);
      }

      if (typeof data.lastHeroLevel === 'number' && data.lastHeroLevel >= 1) {
        this.lastHeroLevelTracked = data.lastHeroLevel;
      }
      if (typeof data.killStreak === 'number' && data.killStreak >= 0) {
        this.killStreak.set(Math.floor(data.killStreak));
      }
    } catch {
      this.monsterHp.set(maxHpForZone(1));
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          gold: this.gold(),
          heroXp: this.heroXp(),
          zone: this.zone(),
          monsterHp: this.monsterHp(),
          owned: this.owned(),
          lastHeroLevel: this.lastHeroLevelTracked,
          killStreak: this.killStreak(),
        }),
      );
    } catch {
      /* ignore quota errors */
    }
  }
}

/** Softer early curve; still ramps hard mid-late. */
export function maxHpForZone(zone: number): number {
  const z = Math.max(1, zone);
  if (z === 1) return 8;
  const base = 12 * Math.pow(1.38, z - 1);
  const bossMult = z % 10 === 0 ? 4.2 : 1;
  return Math.max(6, Math.floor(base * bossMult));
}

export function goldForZone(zone: number): number {
  const z = Math.max(1, zone);
  const bossMult = z % 10 === 0 ? 2.8 : 1;
  return Math.max(4, Math.floor((8 + z * 2.6) * Math.pow(1.045, z - 1) * bossMult));
}

export function xpForZone(zone: number): number {
  const z = Math.max(1, zone);
  return Math.max(3, Math.floor(5 + z * 1.7 * Math.pow(1.035, z - 1)));
}

export function nameForZone(zone: number): string {
  const z = Math.max(1, zone);
  const base = MONSTER_NAMES[(z - 1) % MONSTER_NAMES.length];
  const tier = Math.ceil(z / MONSTER_NAMES.length);
  if (z % 10 === 0) return `${base} ★`;
  return tier > 1 ? `${base} · t${tier}` : base;
}

export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 1; i < level; i += 1) {
    total += Math.floor(10 * Math.pow(i, 1.36));
  }
  return total;
}

export function heroLevelFromXp(xp: number): number {
  let level = 1;
  while (xp >= xpRequiredForLevel(level + 1)) {
    level += 1;
    if (level > 999) break;
  }
  return level;
}

function estimateZoneFromGold(gold: number): number {
  return Math.max(1, Math.min(500, Math.floor(Math.log(gold + 20) / Math.log(1.65))));
}
