import { Component, ElementRef, viewChild, input, AfterViewInit, HostListener, OnDestroy, signal, inject, ChangeDetectorRef, effect, untracked, ChangeDetectionStrategy } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert HSL to RGB [0-255, 0-255, 0-255]
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = (h % 360 + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r1 = 0, g1 = 0, b1 = 0;
  if (h >= 0 && h < 60) { r1 = c; g1 = x; b1 = 0; }
  else if (h >= 60 && h < 120) { r1 = x; g1 = c; b1 = 0; }
  else if (h >= 120 && h < 180) { r1 = 0; g1 = c; b1 = x; }
  else if (h >= 180 && h < 240) { r1 = 0; g1 = x; b1 = c; }
  else if (h >= 240 && h < 300) { r1 = x; g1 = 0; b1 = c; }
  else if (h >= 300 && h < 360) { r1 = c; g1 = 0; b1 = x; }

  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255)
  ];
}

// Linear color interpolation
function lerpColor(c1: [number, number, number], c2: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t)
  ];
}

interface Point {
  x: number;
  y: number;
}

@Component({
  selector: 'app-trianglify-background',
  template: `
    <div class="trianglify-container">
      <canvas #canvasA class="trianglify-canvas" [class.visible]="activeBuffer() === 'A'"></canvas>
      <canvas #canvasB class="trianglify-canvas" [class.visible]="activeBuffer() === 'B'"></canvas>
      <div class="trianglify-overlay"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 0;
      pointer-events: none;
    }

    .trianglify-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #f1f5f9;
      transition: background-color 0.5s ease;
    }

    :host-context([data-theme="dark"]) .trianglify-container {
      background: #090d16;
    }

    .trianglify-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      transform: scale(1.02);
      transition: opacity 2.6s cubic-bezier(0.33, 1, 0.68, 1), transform 3.0s cubic-bezier(0.33, 1, 0.68, 1);
      will-change: opacity, transform;

      &.visible {
        opacity: 1;
        transform: scale(1);
      }
    }

    .trianglify-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.25) 0%, rgba(241, 245, 249, 0.6) 100%);
      pointer-events: none;
      transition: background 0.5s ease;
    }

    :host-context([data-theme="dark"]) .trianglify-overlay {
      background: radial-gradient(circle at 50% 35%, rgba(15, 23, 42, 0.15) 0%, rgba(9, 13, 22, 0.65) 100%);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrianglifyBackgroundComponent implements AfterViewInit, OnDestroy {
  readonly seed = input<number>(42);
  readonly cellSize = input<number>(110);
  readonly variance = input<number>(0.45);

  readonly canvasARef = viewChild<ElementRef<HTMLCanvasElement>>('canvasA');
  readonly canvasBRef = viewChild<ElementRef<HTMLCanvasElement>>('canvasB');

  readonly themeService = inject(ThemeService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly activeBuffer = signal<'A' | 'B'>('A');
  private isInitialized = false;
  private resizeTimeout: any;

  constructor() {
    // When dark mode or seed changes, cleanly crossfade without creating reactive loops
    effect(() => {
      // Track theme and seed reactively
      this.themeService.isDark();
      const currentSeed = this.seed();
      if (this.isInitialized) {
        untracked(() => {
          this.crossfadeToNewSeed(currentSeed);
        });
      }
    });
  }

  ngAfterViewInit(): void {
    this.isInitialized = true;
    requestAnimationFrame(() => {
      const canvasA = this.canvasARef()?.nativeElement;
      if (canvasA) {
        this.drawTriangles(canvasA, this.seed());
      }
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      if (this.isInitialized) {
        const activeCanvas = this.activeBuffer() === 'A' 
          ? this.canvasARef()?.nativeElement 
          : this.canvasBRef()?.nativeElement;
        if (activeCanvas) {
          this.drawTriangles(activeCanvas, this.seed());
        }
      }
    }, 250);
  }

  ngOnDestroy(): void {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
  }

  private crossfadeToNewSeed(newSeed: number): void {
    const canvasA = this.canvasARef()?.nativeElement;
    const canvasB = this.canvasBRef()?.nativeElement;
    if (!canvasA || !canvasB) return;

    const currentBuf = untracked(() => this.activeBuffer());
    const nextBuf: 'A' | 'B' = currentBuf === 'A' ? 'B' : 'A';
    const targetCanvas = nextBuf === 'A' ? canvasA : canvasB;

    // Draw softly on background canvas
    this.drawTriangles(targetCanvas, newSeed);

    // Switch buffer for ultra-smooth 2.6s fade
    this.activeBuffer.set(nextBuf);
    this.cdr.markForCheck();
  }

  private drawTriangles(canvas: HTMLCanvasElement, seedNumber: number): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0, 800);
    const height = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0, 600);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const rng = mulberry32(seedNumber);
    const isDark = untracked(() => this.themeService.isDark());

    // Continuous, harmonious chromatic wheel calculation
    const baseHue = (Math.abs(seedNumber) * 27.5) % 360;
    
    let c1: [number, number, number];
    let c2: [number, number, number];
    let c3: [number, number, number];

    if (isDark) {
      // Dark Mode Palettes (Deep & moody)
      c1 = hslToRgb(baseHue, 38, 16);
      c2 = hslToRgb((baseHue + 28) % 360, 44, 26);
      c3 = hslToRgb((baseHue + 56) % 360, 48, 38);
    } else {
      // Light Mode Palettes (Luminous & soft pastel)
      c1 = hslToRgb(baseHue, 48, 76);
      c2 = hslToRgb((baseHue + 28) % 360, 52, 82);
      c3 = hslToRgb((baseHue + 56) % 360, 56, 88);
    }

    const currentCellSize = this.cellSize();
    const cell = width < 600 ? Math.max(70, currentCellSize * 0.75) : currentCellSize;
    const variance = this.variance();

    const cols = Math.ceil(width / cell) + 2;
    const rows = Math.ceil(height / cell) + 2;

    const startX = -cell;
    const startY = -cell;

    // 1. Generate soft, non-jagged grid points
    const grid: Point[][] = [];
    for (let r = 0; r <= rows; r++) {
      grid[r] = [];
      for (let c = 0; c <= cols; c++) {
        const baseX = startX + c * cell;
        const baseY = startY + r * cell;

        const jitterX = (rng() - 0.5) * cell * variance;
        const jitterY = (rng() - 0.5) * cell * variance;

        grid[r][c] = {
          x: baseX + jitterX,
          y: baseY + jitterY
        };
      }
    }

    // 2. Draw silky low-poly mesh
    ctx.clearRect(0, 0, width, height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const p1 = grid[r][c];
        const p2 = grid[r][c + 1];
        const p3 = grid[r + 1][c];
        const p4 = grid[r + 1][c + 1];

        const flipDiagonal = rng() > 0.5;

        if (flipDiagonal) {
          this.drawTriangle(ctx, p1, p2, p4, width, height, c1, c2, c3, rng);
          this.drawTriangle(ctx, p1, p4, p3, width, height, c1, c2, c3, rng);
        } else {
          this.drawTriangle(ctx, p1, p2, p3, width, height, c1, c2, c3, rng);
          this.drawTriangle(ctx, p2, p4, p3, width, height, c1, c2, c3, rng);
        }
      }
    }
  }

  private drawTriangle(
    ctx: CanvasRenderingContext2D,
    p1: Point,
    p2: Point,
    p3: Point,
    w: number,
    h: number,
    c1: [number, number, number],
    c2: [number, number, number],
    c3: [number, number, number],
    rng: () => number
  ): void {
    const cx = (p1.x + p2.x + p3.x) / 3;
    const cy = (p1.y + p2.y + p3.y) / 3;

    const tX = Math.min(1, Math.max(0, cx / w));
    const tY = Math.min(1, Math.max(0, cy / h));
    const t = (tX * 0.6 + tY * 0.4);

    let rgb: [number, number, number];
    if (t < 0.5) {
      rgb = lerpColor(c1, c2, t * 2);
    } else {
      rgb = lerpColor(c2, c3, (t - 0.5) * 2);
    }

    const shade = 1 + (rng() - 0.5) * 0.08;
    const r = Math.min(255, Math.max(0, Math.round(rgb[0] * shade)));
    const g = Math.min(255, Math.max(0, Math.round(rgb[1] * shade)));
    const b = Math.min(255, Math.max(0, Math.round(rgb[2] * shade)));

    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.strokeStyle = `rgb(${r},${g},${b})`;
    ctx.lineWidth = 0.5;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}
