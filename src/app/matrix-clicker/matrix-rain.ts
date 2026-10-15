const MATRIX_CHARS = '01アイウエオカキクケコサシスセソ0123456789ABCDEF{}[]();';

export class MatrixRain {
  private ctx: CanvasRenderingContext2D;
  private columns = 0;
  private drops: number[] = [];
  private width = 0;
  private height = 0;
  private raf = 0;
  private running = false;
  private fontSize = 14;
  private speed = 1;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('MatrixRain: 2d context unavailable');
    this.ctx = ctx;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.resize();
    this.loop();
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  setSpeed(multiplier: number): void {
    this.speed = Math.max(0.5, Math.min(3, multiplier));
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(1, Math.floor(rect.width));
    this.height = Math.max(1, Math.floor(rect.height));
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.fontSize = Math.max(11, Math.floor(this.width / 28));
    this.columns = Math.max(1, Math.floor(this.width / this.fontSize));
    this.drops = Array.from({ length: this.columns }, () =>
      Math.random() * this.height / this.fontSize,
    );
  }

  private loop = (): void => {
    if (!this.running) return;
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  };

  private draw(): void {
    const styles = getComputedStyle(document.documentElement);
    const deep = styles.getPropertyValue('--bg-deep').trim() || '#0a0d11';
    const green = styles.getPropertyValue('--runtime-green').trim() || '#7ee787';
    const r = parseInt(green.slice(1, 3), 16);
    const g = parseInt(green.slice(3, 5), 16);
    const b = parseInt(green.slice(5, 7), 16);

    this.ctx.fillStyle = deep.startsWith('#')
      ? `rgba(${parseInt(deep.slice(1, 3), 16)}, ${parseInt(deep.slice(3, 5), 16)}, ${parseInt(deep.slice(5, 7), 16)}, 0.12)`
      : 'rgba(10, 13, 17, 0.12)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.font = `${this.fontSize}px "IBM Plex Mono", monospace`;
    for (let i = 0; i < this.columns; i++) {
      const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
      const x = i * this.fontSize;
      const y = this.drops[i] * this.fontSize;
      const head = Math.random() > 0.985;
      this.ctx.fillStyle = head ? green : `rgba(${r}, ${g}, ${b}, 0.55)`;
      this.ctx.fillText(char, x, y);

      if (y > this.height && Math.random() > 0.975) {
        this.drops[i] = 0;
      }
      this.drops[i] += (0.45 + Math.random() * 0.35) * this.speed;
    }
  }
}
