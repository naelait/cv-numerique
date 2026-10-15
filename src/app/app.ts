import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { cv, type Experience, type Formation, type GroupeCompetence, type Projet } from './cv.data';
import { ConnectPanel } from './connect/connect-panel';
import { ChatPanel } from './chat/chat-panel';
import { ChatService } from './chat/chat.service';
import { chatEnabled } from './features';
import { MatrixClicker } from './matrix-clicker/matrix-clicker';
import { MatrixClickerService } from './matrix-clicker/matrix-clicker.service';
import { ScrollWordReveal } from './scroll-word-reveal';
import { SkillGalaxy } from './skill-galaxy/skill-galaxy';

const SECTION_ORDER = [
  'intro',
  'about',
  'work',
  'craft',
  'projects',
  'education',
  'contact',
] as const;

type SectionId = (typeof SECTION_ORDER)[number];

export interface NavItem {
  id: SectionId;
  label: string;
  shortLabel: string;
  line: string;
  fn: string;
  log: string;
}

export interface WatchVar {
  name: string;
  type: string;
  value: string;
}

@Component({
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
  imports: [ChatPanel, MatrixClicker, SkillGalaxy, ConnectPanel],
})
export class App {
  protected readonly chatEnabled = chatEnabled;
  protected readonly terminalPlaceholder = chatEnabled
    ? 'help | ask | reset game | goto Connect'
    : 'help | reset game | goto Connect';
  private readonly destroyRef = inject(DestroyRef);
  private readonly chat = inject(ChatService);
  protected readonly matrixClicker = inject(MatrixClickerService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly taglineRef = viewChild<ElementRef<HTMLElement>>('taglineReveal');
  private readonly runtimeRef = viewChild<ElementRef<HTMLElement>>('runtimeNav');

  protected readonly data = cv;
  protected readonly cvPreviewUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    `${cv.cvPdf}#toolbar=0&navpanes=0&view=FitH`,
  );
  protected readonly navItems: NavItem[] = [
    { id: 'intro', label: 'Accueil', shortLabel: 'Accueil', line: '01', fn: 'Init()', log: 'Boot OK — Bruxelles, BE' },
    { id: 'about', label: 'Profil', shortLabel: 'Profil', line: '02', fn: 'LoadProfil()', log: 'Profil développeur chargé' },
    { id: 'work', label: 'Parcours', shortLabel: 'Parcours', line: '03', fn: 'GetExperiences()', log: '3 expériences retournées' },
    { id: 'craft', label: 'Skills', shortLabel: 'Skills', line: '04', fn: 'ListSkills()', log: 'Angular · .NET · Flutter détectés' },
    { id: 'projects', label: 'Projets', shortLabel: 'Projets', line: '05', fn: 'FetchProjects()', log: '4 projets en cache' },
    { id: 'education', label: 'Formation', shortLabel: 'Études', line: '06', fn: 'GetFormation()', log: 'Ephec + Becode synchronisés' },
    { id: 'contact', label: 'Contact', shortLabel: 'Contact', line: '07', fn: 'Connect()', log: 'await Recruteur.Email()' },
  ];

  protected readonly scrollProgress = signal(0);
  protected readonly activeSection = signal<SectionId>('intro');
  protected readonly sectionDirection = signal(1);
  protected readonly activeExp = signal(cv.experiences[0]?.id ?? '');
  protected readonly activeSkill = signal(cv.competences[0]?.id ?? 's1');
  protected readonly activeSkillItem = signal<string | null>(
    cv.competences[0]?.items[0]?.nom ?? null,
  );
  protected readonly activeProject = signal(cv.projets[0]?.id ?? '');
  protected readonly activeFormation = signal(cv.formations[0]?.id ?? '');
  protected readonly introDone = signal(false);
  protected readonly reducedMotion = signal(false);
  protected readonly clock = signal(this.formatClock());
  protected readonly leavingSection = signal<SectionId | null>(null);
  protected readonly stepPulse = signal(false);
  protected readonly runtimeLog = signal('Boot OK — Bruxelles, BE');
  protected readonly breakpoints = signal<Set<SectionId>>(new Set(['contact']));
  protected readonly terminalLines = signal<string[]>([
    'nael.debug v1.0 — tape help',
  ]);
  protected readonly terminalInput = signal('');
  protected readonly isBooting = signal(true);
  protected readonly bootProgress = signal(0);
  protected readonly raidMobHit = signal(false);
  private taglineReveal: ScrollWordReveal | null = null;
  private readonly terminalHistory: string[] = [];
  private historyIndex = -1;
  private navClearTimer: ReturnType<typeof setTimeout> | null = null;
  private arrivalTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly navDurationMs = 720;
  private lastLoggedRaidId: string | null = null;

  constructor() {
    effect(() => {
      const raid = this.matrixClicker.activeRaid();
      if (!raid || raid.id === this.lastLoggedRaidId) return;
      this.lastLoggedRaidId = raid.id;
      const label = this.matrixClicker.sectionLabel(raid.sectionId);
      this.pushTerminal(`ALERTE intrusion → ${raid.name} @ ${label}`);
      this.runtimeLog.set(`Intrusion sur ${label} — ${raid.name}`);
    });
    effect(() => {
      const loot = this.matrixClicker.lastRaidLoot();
      if (!loot) return;
      const label = this.matrixClicker.sectionLabel(loot.sectionId);
      this.pushTerminal(
        `intrusion cleared @ ${label} — +${this.matrixClicker.formatCount(loot.gold)}g +${this.matrixClicker.formatCount(loot.xp)}xp`,
      );
    });
    afterNextRender(() => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion.set(mq.matches);
      const onMq = () => {
        this.reducedMotion.set(mq.matches);
        if (mq.matches) this.taglineReveal?.showAll();
      };
      mq.addEventListener('change', onMq);

      document.documentElement.classList.add('deck-mode');

      const taglineEl = this.taglineRef()?.nativeElement;
      if (taglineEl && !mq.matches) {
        this.taglineReveal = new ScrollWordReveal(taglineEl);
        this.taglineReveal.update(0.65);
      }

      this.applySectionProgress('intro');
      this.runBootSequence();
      const runtimeEl = this.runtimeRef()?.nativeElement;
      let runtimeObserver: ResizeObserver | null = null;
      const mobileNavMq = window.matchMedia('(max-width: 900px)');
      const syncRuntimeHeight = () => {
        const el = this.runtimeRef()?.nativeElement;
        if (!el) return;
        if (!mobileNavMq.matches) {
          document.documentElement.style.removeProperty('--footer-nav');
          document.documentElement.style.removeProperty('--runtime-height');
          return;
        }
        const h = Math.ceil(el.getBoundingClientRect().height);
        document.documentElement.style.setProperty('--footer-nav', `${h}px`);
        document.documentElement.style.setProperty('--runtime-height', `${h}px`);
      };
      const onMobileNavMq = () => syncRuntimeHeight();
      if (runtimeEl && typeof ResizeObserver !== 'undefined') {
        runtimeObserver = new ResizeObserver(() => syncRuntimeHeight());
        runtimeObserver.observe(runtimeEl);
        syncRuntimeHeight();
        requestAnimationFrame(syncRuntimeHeight);
      }
      mobileNavMq.addEventListener('change', onMobileNavMq);
      const onKey = (e: KeyboardEvent) => this.onKeyDown(e);
      window.addEventListener('keydown', onKey);

      const clockId = window.setInterval(() => this.clock.set(this.formatClock()), 1000);
      window.setTimeout(() => this.introDone.set(true), this.reducedMotion() ? 0 : 600);

      this.destroyRef.onDestroy(() => {
        document.documentElement.classList.remove('deck-mode');
        clearInterval(clockId);
        this.taglineReveal?.dispose();
        mq.removeEventListener('change', onMq);
        window.removeEventListener('keydown', onKey);
        if (this.navClearTimer) clearTimeout(this.navClearTimer);
        if (this.arrivalTimer) clearTimeout(this.arrivalTimer);
        runtimeObserver?.disconnect();
        mobileNavMq.removeEventListener('change', onMobileNavMq);
      });
    });
  }

  protected isSectionActive(id: string): boolean {
    return this.activeSection() === id;
  }

  protected sectionIndex(): number {
    return SECTION_ORDER.indexOf(this.activeSection());
  }

  protected scrollTo(id: string, event?: Event): void {
    event?.preventDefault();
    this.goToSection(id);
  }
  protected huntRaid(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const raid = this.matrixClicker.activeRaid();
    if (!raid) return;
    this.goToSection(raid.sectionId);
    this.pushTerminal(`hunt → ${this.matrixClicker.sectionLabel(raid.sectionId)}`);
  }
  protected hitRaidEnemy(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const result = this.matrixClicker.hitRaid();
    if (result.damage <= 0 && !result.fled) return;
    if (!this.reducedMotion()) {
      this.raidMobHit.set(true);
      window.setTimeout(() => this.raidMobHit.set(false), result.crit ? 180 : 110);
    }
    if (result.killed) {
      this.runtimeLog.set('Intrusion neutralisée — retour Init()');
      this.pushTerminal('intrusion clear → Init()');
      this.goToSection('intro');
    } else if (result.fled) {
      this.runtimeLog.set('Intrusion échappée');
    }
  }
  protected hasRaidOn(sectionId: string): boolean {
    return this.matrixClicker.hasRaidOn(sectionId);
  }

  protected skipToContent(event: Event): void {
    event.preventDefault();
    this.goToSection('about');
  }

  protected prevSection(event?: Event): void {
    event?.preventDefault();
    const idx = this.sectionIndex();
    if (idx > 0) this.goToSection(SECTION_ORDER[idx - 1]);
  }

  protected nextSection(event?: Event): void {
    event?.preventDefault();
    const idx = this.sectionIndex();
    if (idx < SECTION_ORDER.length - 1) this.goToSection(SECTION_ORDER[idx + 1]);
  }

  protected selectSkill(skill: GroupeCompetence): void {
    this.selectSkillById(skill.id);
  }
  protected selectSkillById(id: string): void {
    const prev = this.activeSkill();
    this.activeSkill.set(id);
    if (prev === id) return;
    const group = this.data.competences.find((s) => s.id === id);
    this.activeSkillItem.set(group?.items[0]?.nom ?? null);
  }
  protected selectSkillItem(nom: string): void {
    this.activeSkillItem.set(nom);
  }
  protected activeSkillItemDetail(): string | null {
    const nom = this.activeSkillItem();
    if (!nom) return null;
    return this.activeSkillGroup().items.find((i) => i.nom === nom)?.detail ?? null;
  }
  protected selectProject(project: Projet): void {
    this.activeProject.set(project.id);
  }
  protected activeProjectItem(): Projet {
    return this.data.projets.find((p) => p.id === this.activeProject()) ?? this.data.projets[0];
  }
  protected activeProjectIndex(): number {
    const idx = this.data.projets.findIndex((p) => p.id === this.activeProject());
    return idx >= 0 ? idx : 0;
  }
  protected nextProject(event?: Event): void {
    event?.preventDefault();
    const list = this.data.projets;
    const idx = list.findIndex((p) => p.id === this.activeProject());
    const next = list[(idx + 1) % list.length];
    if (next) this.activeProject.set(next.id);
  }
  protected prevProject(event?: Event): void {
    event?.preventDefault();
    const list = this.data.projets;
    const idx = list.findIndex((p) => p.id === this.activeProject());
    const prev = list[(idx - 1 + list.length) % list.length];
    if (prev) this.activeProject.set(prev.id);
  }
  protected projectTags(project: Projet): string[] {
    return project.tag
      .split('·')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  protected projectSlug(project: Projet): string {
    const slugs: Record<string, string> = {
      p1: 'vibely',
      p2: 'leroy-web',
      p3: 'huissiers-app',
      p4: 'freeflow-internal',
    };
    return slugs[project.id] ?? project.readmeTitle ?? project.id;
  }
  /** Inline **bold** markers for fake README paragraphs. */
  protected formatReadmeParagraph(text: string): string {
    return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }
  protected selectFormation(formation: Formation): void {
    this.activeFormation.set(formation.id);
  }
  protected activeFormationItem(): Formation {
    return (
      this.data.formations.find((f) => f.id === this.activeFormation()) ?? this.data.formations[0]
    );
  }
  protected activeFormationIndex(): number {
    const idx = this.data.formations.findIndex((f) => f.id === this.activeFormation());
    return idx >= 0 ? idx : 0;
  }
  protected nextFormation(event?: Event): void {
    event?.stopPropagation();
    const list = this.data.formations;
    const idx = list.findIndex((f) => f.id === this.activeFormation());
    const next = list[(idx + 1) % list.length];
    if (next) this.activeFormation.set(next.id);
  }
  protected prevFormation(event?: Event): void {
    event?.stopPropagation();
    const list = this.data.formations;
    const idx = list.findIndex((f) => f.id === this.activeFormation());
    const prev = list[(idx - 1 + list.length) % list.length];
    if (prev) this.activeFormation.set(prev.id);
  }
  protected formationStatusLabel(formation: Formation): string {
    return formation.statut === 'en_cours' ? '200 · syncing' : '200 OK';
  }
  protected formationStatutLabel(formation: Formation): string {
    if (formation.statut === 'en_cours') return 'finalisation';
    return formation.mention ? `obtenu ${formation.mention}` : 'obtenu';
  }
  protected formationJsonPreview(formation: Formation): string {
    const payload = {
      id: formation.id,
      diplome: formation.titre,
      ecole: formation.ecole,
      periode: formation.periode,
      lieu: formation.lieu,
      statut: this.formationStatutLabel(formation),
      modules: formation.modules.length,
      stack: formation.stack.length,
    };
    return JSON.stringify(payload, null, 2);
  }
  protected selectExp(exp: Experience): void {
    this.activeExp.set(exp.id);
  }
  /** Arrow-key navigation within an experience/project/education tablist. */
  protected onTabListKey(
    event: KeyboardEvent,
    kind: 'exp' | 'project' | 'formation',
  ): void {
    const keys = ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const list =
      kind === 'exp'
        ? this.data.experiences
        : kind === 'project'
          ? this.data.projets
          : this.data.formations;
    const currentId =
      kind === 'exp'
        ? this.activeExp()
        : kind === 'project'
          ? this.activeProject()
          : this.activeFormation();
    const idx = Math.max(
      0,
      list.findIndex((item) => item.id === currentId),
    );
    let next = idx;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = list.length - 1;
    else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      next = (idx + 1) % list.length;
    } else {
      next = (idx - 1 + list.length) % list.length;
    }
    const item = list[next];
    if (!item) return;
    if (kind === 'exp') this.activeExp.set(item.id);
    else if (kind === 'project') this.activeProject.set(item.id);
    else this.activeFormation.set(item.id);
    const prefix = kind === 'exp' ? 'exp-tab-' : kind === 'project' ? 'proj-tab-' : 'edu-tab-';
    queueMicrotask(() => {
      document.getElementById(prefix + item.id)?.focus({ preventScroll: true });
    });
  }
  protected activeExperience(): Experience {
    return (
      this.data.experiences.find((e) => e.id === this.activeExp()) ?? this.data.experiences[0]
    );
  }
  protected activeExpIndex(): number {
    const idx = this.data.experiences.findIndex((e) => e.id === this.activeExp());
    return idx >= 0 ? idx : 0;
  }
  protected activeSkillGroup(): GroupeCompetence {
    return this.data.competences.find((s) => s.id === this.activeSkill()) ?? this.data.competences[0];
  }

  protected nextExp(event?: Event): void {
    event?.preventDefault();
    const list = this.data.experiences;
    const idx = list.findIndex((e) => e.id === this.activeExp());
    const next = list[(idx + 1) % list.length];
    if (next) this.activeExp.set(next.id);
  }
  protected prevExp(event?: Event): void {
    event?.preventDefault();
    const list = this.data.experiences;
    const idx = list.findIndex((e) => e.id === this.activeExp());
    const prev = list[(idx - 1 + list.length) % list.length];
    if (prev) this.activeExp.set(prev.id);
  }
  protected skillLevelLabel(level: number): string {
    if (level >= 85) return 'Production';
    if (level >= 78) return 'Confirmé';
    return 'Solide';
  }

  protected isSectionLeaving(id: SectionId): boolean {
    return this.leavingSection() === id;
  }

  protected phoneHref(): string {
    return `tel:${this.data.telephoneTel}`;
  }

  protected activeFrame(): NavItem {
    return this.navItems.find((n) => n.id === this.activeSection()) ?? this.navItems[0];
  }

  protected callStack(): string {
    return `nael.run() › ${this.activeFrame().fn}`;
  }
  protected hasBreakpoint(id: SectionId): boolean {
    return this.breakpoints().has(id);
  }
  protected onConnectEstablished(): void {
    this.runtimeLog.set('Connection established ✓ — Recruteur.Email() ready');
  }
  protected toggleBreakpoint(id: SectionId, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const next = new Set(this.breakpoints());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.breakpoints.set(next);
    this.pushTerminal(
      next.has(id) ? `breakpoint + ${id}` : `breakpoint - ${id}`,
    );
  }
  protected watchVars(): WatchVar[] {
    const section = this.activeSection();
    const base: WatchVar[] = [
      { name: 'candidat', type: 'string', value: `"${this.data.nomComplet}"` },
      { name: 'stack', type: 'string[]', value: '[Angular, .NET, Flutter]' },
      { name: 'locale', type: 'string', value: '"fr-BE"' },
      { name: 'disponible', type: 'bool', value: 'true' },
    ];
    if (section === 'work') {
      return [
        ...base,
        { name: 'poste', type: 'Experience', value: 'Leroy & Partners' },
        { name: 'nbExp', type: 'int', value: String(this.data.experiences.length) },
      ];
    }
    if (section === 'craft') {
      return [
        ...base,
        { name: 'competenceActive', type: 'string', value: `"${this.activeSkillGroup().libelle}"` },
      ];
    }
    if (section === 'contact') {
      return [
        ...base,
        { name: 'email', type: 'string', value: `"${this.data.email}"` },
        { name: 'telephone', type: 'string', value: `"${this.data.telephone}"` },
      ];
    }
    if (section === 'projects') {
      return [
        ...base,
        { name: 'projets', type: 'int', value: String(this.data.projets.length) },
      ];
    }
    if (section === 'education') {
      const edu = this.activeFormationItem();
      return [
        ...base,
        { name: 'formationActive', type: 'string', value: `"${edu.ecole}"` },
        { name: 'statut', type: 'string', value: `"${this.formationStatutLabel(edu)}"` },
        { name: 'formations', type: 'int', value: String(this.data.formations.length) },
      ];
    }
    if (section === 'intro') {
      const raid = this.matrixClicker.activeRaid();
      return [
        ...base,
        {
          name: 'gold',
          type: 'long',
          value: this.matrixClicker.formatCount(this.matrixClicker.gold()),
        },
        {
          name: 'zone',
          type: 'int',
          value: String(this.matrixClicker.zone()),
        },
        {
          name: 'monsterHp',
          type: 'double',
          value: this.matrixClicker.formatHp(this.matrixClicker.monsterHp()),
        },
        {
          name: 'dps',
          type: 'double',
          value: this.matrixClicker.formatRate(this.matrixClicker.dps()),
        },
        {
          name: 'heroLevel',
          type: 'int',
          value: String(this.matrixClicker.heroLevel()),
        },
        {
          name: 'clickDamage',
          type: 'double',
          value: this.matrixClicker.formatRate(this.matrixClicker.clickDamage()),
        },
        {
          name: 'intrusion',
          type: 'string',
          value: raid
            ? `"${this.matrixClicker.sectionLabel(raid.sectionId)} (${this.matrixClicker.raidSecondsLeft()}s)"`
            : 'null',
        },
      ];
    }
    return base;
  }
  protected continueToBreakpoint(event?: Event): void {
    event?.preventDefault();
    const idx = this.sectionIndex();
    for (let i = idx + 1; i < SECTION_ORDER.length; i++) {
      const id = SECTION_ORDER[i];
      if (this.breakpoints().has(id)) {
        this.goToSection(id);
        this.pushTerminal(`continue → hit ${id}`);
        return;
      }
    }
    this.pushTerminal('continue → aucun breakpoint en aval');
    this.runtimeLog.set('No breakpoint ahead — End of run?');
  }
  protected onTerminalKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.runTerminalCommand(this.terminalInput().trim());
      this.terminalInput.set('');
      this.historyIndex = -1;
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.terminalHistory.length) return;
      this.historyIndex = Math.min(this.historyIndex + 1, this.terminalHistory.length - 1);
      this.terminalInput.set(this.terminalHistory[this.historyIndex] ?? '');
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.historyIndex <= 0) {
        this.historyIndex = -1;
        this.terminalInput.set('');
        return;
      }
      this.historyIndex -= 1;
      this.terminalInput.set(this.terminalHistory[this.historyIndex] ?? '');
    }
  }
  protected onTerminalInput(event: Event): void {
    this.terminalInput.set((event.target as HTMLInputElement).value);
  }
  private runBootSequence(): void {
    if (this.reducedMotion()) {
      this.isBooting.set(false);
      this.bootProgress.set(100);
      return;
    }
    const steps = [12, 28, 47, 63, 81, 100];
    let i = 0;
    const tick = () => {
      this.bootProgress.set(steps[i] ?? 100);
      i += 1;
      if (i < steps.length) {
        window.setTimeout(tick, 90);
      } else {
        window.setTimeout(() => this.isBooting.set(false), 220);
      }
    };
    window.setTimeout(tick, 80);
  }
  private pushTerminal(line: string): void {
    this.terminalLines.update((lines) => [...lines.slice(-8), line]);
  }
  private runTerminalCommand(raw: string): void {
    if (!raw) return;
    this.terminalHistory.unshift(raw);
    if (this.terminalHistory.length > 30) this.terminalHistory.pop();
    this.pushTerminal(`› ${raw}`);
    const [cmd, ...rest] = raw.toLowerCase().split(/\s+/);
    const arg = rest.join(' ');
    switch (cmd) {
      case 'help':
        this.pushTerminal(
          chatEnabled
            ? 'help | ask | goto <fn> | bp <fn> | mail | linkedin | stack | clear | reset game | run'
            : 'help | goto <fn> | bp <fn> | mail | linkedin | stack | clear | reset game | run',
        );
        break;
      case 'ask':
        if (!chatEnabled) {
          this.pushTerminal('Ask() indisponible sur cette version (hébergement statique).');
          break;
        }
        this.chat.openPanel();
        this.pushTerminal('Ask() — persona chat ouvert');
        break;
      case 'clear':
        this.terminalLines.set([]);
        break;
      case 'reset':
      case 'resetgame': {
        if (cmd === 'reset' && arg && arg !== 'game' && arg !== 'clicker') {
          this.pushTerminal('usage: reset game | resetgame');
          break;
        }
        this.matrixClicker.resetGame();
        this.pushTerminal('clicker reset — zone 1, gold 0');
        this.runtimeLog.set('Game state wiped');
        break;
      }
      case 'stack':
        this.pushTerminal(this.callStack());
        break;
      case 'mail':
        this.pushTerminal(`open mailto:${this.data.email}`);
        window.location.href = `mailto:${this.data.email}`;
        break;
      case 'linkedin': {
        const href = this.data.liens[0]?.href;
        if (href) {
          this.pushTerminal(`open ${href}`);
          window.open(href, '_blank', 'noopener,noreferrer');
        }
        break;
      }
      case 'run':
      case 'continue':
      case 'c':
        this.continueToBreakpoint();
        break;
      case 'bp':
      case 'break': {
        const target = this.resolveFnTarget(arg);
        if (!target) {
          this.pushTerminal('usage: bp Init|LoadProfil|GetExperiences|…');
          break;
        }
        this.toggleBreakpoint(target);
        break;
      }
      case 'goto':
      case 'g': {
        const target = this.resolveFnTarget(arg);
        if (!target) {
          this.pushTerminal('usage: goto Init|LoadProfil|Connect|…');
          break;
        }
        this.goToSection(target);
        this.pushTerminal(`goto ${target}`);
        break;
      }
      case 'next':
      case 'n':
        this.nextSection();
        break;
      case 'prev':
      case 'p':
        this.prevSection();
        break;
      default:
        this.pushTerminal(`unknown: ${cmd} — tape help`);
    }
  }
  private resolveFnTarget(arg: string): SectionId | null {
    if (!arg) return null;
    const needle = arg.replace(/[();]/g, '').toLowerCase();
    const byId = SECTION_ORDER.find((id) => id === needle);
    if (byId) return byId;
    const item = this.navItems.find(
      (n) =>
        n.fn.toLowerCase().replace(/[();]/g, '') === needle ||
        n.label.toLowerCase() === needle ||
        n.line === needle,
    );
    return item?.id ?? null;
  }
  private goToSection(id: string): void {
    if (id.startsWith('exp-')) {
      const prev = this.sectionIndex();
      const prevSection = this.activeSection();
      this.activeSection.set('work');
      this.activeExp.set(id);
      this.sectionDirection.set(prev < SECTION_ORDER.indexOf('work') ? 1 : -1);
      this.applySectionProgress('work');
      this.beginSectionTransition(prevSection);
      this.pulseStep();
      this.emitRuntimeLog('work');
      this.resetActiveScroll();
      this.focusExpCard(id);
      return;
    }

    if (!SECTION_ORDER.includes(id as SectionId)) return;

    const sectionId = id as SectionId;
    if (sectionId === this.activeSection()) return;

    const nextIdx = SECTION_ORDER.indexOf(sectionId);
    const prevIdx = this.sectionIndex();
    const prevSection = this.activeSection();
    this.sectionDirection.set(nextIdx >= prevIdx ? 1 : -1);
    this.activeSection.set(sectionId);
    this.applySectionProgress(sectionId);
    this.beginSectionTransition(prevSection);
    this.pulseStep();
    this.emitRuntimeLog(sectionId);
    this.resetActiveScroll();
    this.scrollDockTabIntoView();

    if (sectionId === 'intro' && this.taglineReveal && !this.reducedMotion()) {
      this.taglineReveal.update(1);
    }

    document.getElementById('main-content')?.focus({ preventScroll: true });
  }

  private emitRuntimeLog(id: SectionId): void {
    const item = this.navItems.find((n) => n.id === id);
    if (item) this.runtimeLog.set(item.log);
  }

  private beginSectionTransition(from: SectionId): void {
    if (this.reducedMotion()) {
      this.leavingSection.set(null);
      return;
    }
    this.leavingSection.set(from);
    if (this.navClearTimer) clearTimeout(this.navClearTimer);
    this.navClearTimer = setTimeout(() => {
      this.leavingSection.set(null);
    }, this.navDurationMs);
  }

  private pulseStep(): void {
    if (this.reducedMotion()) return;
    this.stepPulse.set(true);
    if (this.arrivalTimer) clearTimeout(this.arrivalTimer);
    this.arrivalTimer = setTimeout(() => this.stepPulse.set(false), 520);
  }

  private resetActiveScroll(): void {
    requestAnimationFrame(() => {
      const scroll = document.querySelector<HTMLElement>('.stage__view.is-active .stage__scroll');
      if (scroll) scroll.scrollTop = 0;
    });
  }
  private scrollDockTabIntoView(): void {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(max-width: 900px)').matches) return;
    queueMicrotask(() => {
      document
        .querySelector<HTMLElement>('.runtime__dock-tab.is-active')
        ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    });
  }

  private applySectionProgress(id: SectionId): void {
    const idx = SECTION_ORDER.indexOf(id);
    const max = SECTION_ORDER.length - 1;
    const phase = max > 0 ? idx / max : 0;
    this.scrollProgress.set(phase * 100);
  }

  private focusExpCard(id: string): void {
    window.setTimeout(() => {
      document.getElementById(`exp-tab-${id}`)?.focus({ preventScroll: true });
    }, this.reducedMotion() ? 0 : 350);
  }

  private onKeyDown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (this.chat.panelOpen() || target.closest('.persona')) return;
    // Let Operate controls own arrow keys (tabs, buttons, links, dialogs)
    if (
      target.closest(
        '[role="tablist"], [role="tab"], [role="dialog"], button, a, .sonar, .galaxy, .matrix, .connect, .runtime__term',
      )
    ) {
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      this.nextSection();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      this.prevSection();
    } else if (e.key === 'F10') {
      e.preventDefault();
      if (e.shiftKey) this.prevSection();
      else this.nextSection();
    } else if (e.key === 'F5') {
      e.preventDefault();
      this.continueToBreakpoint();
    } else if (e.key === 'Home') {
      e.preventDefault();
      this.goToSection('intro');
    } else if (e.key === 'End') {
      e.preventDefault();
      this.goToSection('contact');
    }
  }

  private formatClock(): string {
    return new Intl.DateTimeFormat('fr-BE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());
  }
}

