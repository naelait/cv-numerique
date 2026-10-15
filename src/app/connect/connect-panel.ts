import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ChatService } from '../chat/chat.service';

interface ConnectLine {
  id: string;
  tone: 'cmd' | 'dim' | 'ok' | 'data' | 'success';
  prefix?: string;
  text: string;
  suffix?: string;
}

interface NetworkNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

@Component({
  selector: 'app-connect-panel',
  standalone: true,
  templateUrl: './connect-panel.html',
  styleUrl: './connect-panel.css',
})
export class ConnectPanel {
  readonly email = input.required<string>();
  readonly telephone = input.required<string>();
  readonly telephoneTel = input.required<string>();
  readonly cloture = input.required<string>();
  readonly contactNote = input.required<string>();
  readonly disponibilite = input.required<string>();
  readonly nomComplet = input.required<string>();
  readonly liens = input<{ libelle: string; href: string }[]>([]);
  readonly active = input(false);
  readonly reducedMotion = input(false);
  readonly hasBreakpoint = input(true);

  readonly connected = output<void>();

  private readonly chat = inject(ChatService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  protected readonly visibleCount = signal(0);
  protected readonly ready = signal(false);
  protected readonly copied = signal<string | null>(null);
  protected readonly connectLines = signal<ConnectLine[]>([]);
  private sequenceTimers: ReturnType<typeof setTimeout>[] = [];
  private rafId = 0;
  private nodes: NetworkNode[] = [];
  private connectStrength = 0;
  private wasActive = false;

  constructor() {
    effect(() => {
      this.buildLines();
    });

    effect(() => {
      const isActive = this.active();
      if (isActive && !this.wasActive) {
        this.startSequence();
        this.startCanvas();
      }
      if (!isActive && this.wasActive) {
        this.stopCanvas();
      }
      this.wasActive = isActive;
    });

    afterNextRender(() => {
      this.destroyRef.onDestroy(() => {
        this.clearSequence();
        this.stopCanvas();
      });
    });
  }

  protected openPersona(): void {
    this.chat.openPanel();
  }

  protected async copyEmail(event: Event): Promise<void> {
    event.preventDefault();
    try {
      await navigator.clipboard.writeText(this.email());
      this.copied.set('email');
      window.setTimeout(() => this.copied.set(null), 2200);
    } catch {
      window.location.href = `mailto:${this.email()}`;
    }
  }

  private buildLines(): void {
    const linkedin = this.liens()[0]?.href.replace(/^https?:\/\/(www\.)?linkedin\.com/i, '') ?? '/profile';
    this.connectLines.set([
      { id: 'l0', tone: 'cmd', prefix: '›', text: `await Recruteur.Connect("${this.nomComplet()}");` },
      { id: 'l1', tone: 'dim', prefix: '  ', text: 'resolving endpoints…', suffix: 'ok' },
      { id: 'l2', tone: 'dim', prefix: '  ', text: 'TLS handshake 1.3…', suffix: 'ok' },
      { id: 'l3', tone: 'data', prefix: '  ', text: `email     ${this.email()}` },
      { id: 'l4', tone: 'data', prefix: '  ', text: `phone     ${this.telephone()}` },
      { id: 'l5', tone: 'data', prefix: '  ', text: `linkedin  ${linkedin}` },
      { id: 'l6', tone: 'data', prefix: '  ', text: 'locale    Bruxelles · fr-BE' },
      { id: 'l7', tone: 'ok', prefix: '  ', text: `disponible = true  // ${this.disponibilite()}` },
      { id: 'l8', tone: 'success', prefix: '✓ ', text: 'Connection established — breakpoint hit' },
    ]);
  }

  private startSequence(): void {
    this.clearSequence();
    this.visibleCount.set(0);
    this.ready.set(false);
    this.copied.set(null);

    const items = this.connectLines();
    if (this.reducedMotion()) {
      this.visibleCount.set(items.length);
      this.ready.set(true);
      this.connectStrength = 1;
      this.connected.emit();
      return;
    }

    const delays = [0, 280, 520, 820, 1080, 1320, 1540, 1780, 2100];
    items.forEach((_, i) => {
      const timer = window.setTimeout(() => {
        this.visibleCount.set(i + 1);
        this.connectStrength = Math.min(1, (i + 1) / items.length);
        if (i === items.length - 1) {
          window.setTimeout(() => {
            this.ready.set(true);
            this.connected.emit();
          }, 180);
        }
      }, delays[i] ?? i * 260);
      this.sequenceTimers.push(timer);
    });
  }

  private clearSequence(): void {
    for (const t of this.sequenceTimers) clearTimeout(t);
    this.sequenceTimers = [];
  }

  private startCanvas(): void {
    if (this.reducedMotion()) return;
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? canvas);

    if (this.nodes.length === 0) {
      for (let i = 0; i < 18; i += 1) {
        this.nodes.push({
          x: Math.random(),
          y: Math.random(),
          vx: (Math.random() - 0.5) * 0.0009,
          vy: (Math.random() - 0.5) * 0.0009,
          r: 1.2 + Math.random() * 1.8,
        });
      }
    }

    const accent =
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff6a3d';
    const cyan =
      getComputedStyle(document.documentElement).getPropertyValue('--focus').trim() || '#5ec8ff';
    const green =
      getComputedStyle(document.documentElement).getPropertyValue('--runtime-green').trim() ||
      '#7ee787';

    const withAlpha = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const tick = () => {
      if (!this.active()) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.42;
      const strength = this.connectStrength;

      for (const n of this.nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0.05 || n.x > 0.95) n.vx *= -1;
        if (n.y < 0.05 || n.y > 0.95) n.vy *= -1;
      }

      for (const n of this.nodes) {
        const nx = n.x * w;
        const ny = n.y * h;
        const dist = Math.hypot(nx - cx, ny - cy);
        const link = Math.max(0, 1 - dist / (Math.min(w, h) * 0.55)) * strength;
        if (link > 0.08) {
          ctx.strokeStyle = withAlpha(cyan, link * 0.55);
          ctx.lineWidth = 0.6 + link;
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(cx, cy);
          ctx.stroke();
        }
        ctx.fillStyle = withAlpha(cyan, 0.35 + link * 0.4);
        ctx.beginPath();
        ctx.arc(nx, ny, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      const pulse = 0.85 + Math.sin(Date.now() * 0.004) * 0.15;
      const hubR = (14 + strength * 10) * pulse;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, hubR * 2.2);
      grad.addColorStop(0, withAlpha(accent, 0.25 + strength * 0.35));
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, hubR * 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = strength > 0.85 ? green : accent;
      ctx.beginPath();
      ctx.arc(cx, cy, hubR * 0.35, 0, Math.PI * 2);
      ctx.fill();

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);

    this.destroyRef.onDestroy(() => ro.disconnect());
  }

  private stopCanvas(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }
}
