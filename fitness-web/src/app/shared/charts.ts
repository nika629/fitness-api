import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

/** Width of the host element, kept up to date with a ResizeObserver */
function observeWidth(): () => number {
  const host = inject(ElementRef).nativeElement as HTMLElement;
  const width = signal(0);
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver((entries) => width.set(Math.floor(entries[0].contentRect.width)));
    ro.observe(host);
    inject(DestroyRef).onDestroy(() => ro.disconnect());
  }
  return width;
}

/** 3–5 round tick values between min and max */
function niceTicks(min: number, max: number, count = 4): number[] {
  if (max <= min) max = min + 1;
  const raw = (max - min) / count;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

const PAD = { top: 16, right: 12, bottom: 28, left: 40 };

/** Keeps a centred tooltip inside the chart so it never causes sideways scrolling */
function clampTip(x: number, width: number): number {
  return Math.min(Math.max(x, 80), Math.max(80, width - 80));
}

// ---------------------------------------------------------------------------
// Bar chart – one series, rounded tops, tooltip on hover/tap
// ---------------------------------------------------------------------------

export interface BarDatum {
  label: string;
  value: number;
  /** Text shown in the tooltip */
  tip: string;
}

@Component({
  selector: 'app-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (geo(); as g) {
      <svg [attr.width]="g.w" [attr.height]="height()" role="img" [attr.aria-label]="label()">
        @for (t of g.ticks; track t.v) {
          <line class="grid" [attr.x1]="pad.left" [attr.x2]="g.w - pad.right" [attr.y1]="t.y" [attr.y2]="t.y" />
          <text class="axis" [attr.x]="pad.left - 8" [attr.y]="t.y" text-anchor="end" dominant-baseline="middle">{{ t.v }}</text>
        }
        @for (b of g.bars; track b.i) {
          <path class="bar" [class.dim]="hover() !== null && hover() !== b.i" [attr.d]="b.d" />
          @if (b.showLabel) {
            <text class="axis" [attr.x]="b.cx" [attr.y]="height() - 8" text-anchor="middle">{{ b.label }}</text>
          }
          <rect class="hit" [attr.x]="b.hx" [attr.y]="pad.top" [attr.width]="b.hw" [attr.height]="g.ih"
                (pointerenter)="hover.set(b.i)" (pointerleave)="hover.set(null)" (click)="hover.set(b.i)" />
        }
      </svg>
      @if (hover() !== null && g.bars[hover()!]; as b) {
        <div class="tip" [style.left.px]="tipX(b.cx, g.w)" [style.top.px]="b.top">{{ b.tip }}</div>
      }
    }
  `,
  styleUrl: './charts.scss',
})
export class BarChart {
  readonly data = input.required<BarDatum[]>();
  readonly height = input(220);
  readonly label = input('Bar chart');

  protected readonly pad = PAD;
  protected readonly tipX = clampTip;
  protected readonly hover = signal<number | null>(null);
  private readonly width = observeWidth();

  protected readonly geo = computed(() => {
    const w = this.width();
    const data = this.data();
    if (w < 80 || data.length === 0) return null;
    const h = this.height();
    const iw = w - PAD.left - PAD.right;
    const ih = h - PAD.top - PAD.bottom;
    const max = Math.max(1, ...data.map((d) => d.value));
    const ticks = niceTicks(0, max);
    const top = ticks[ticks.length - 1] || 1;
    const y = (v: number) => PAD.top + ih - (v / top) * ih;
    const slot = iw / data.length;
    const bw = Math.max(4, Math.min(36, slot - 4));
    const every = Math.ceil(data.length / Math.max(1, Math.floor(iw / 44)));
    const r = 4;

    return {
      w,
      ih,
      ticks: ticks.map((v) => ({ v, y: y(v) })),
      bars: data.map((d, i) => {
        const cx = PAD.left + slot * i + slot / 2;
        const x0 = cx - bw / 2;
        const y0 = y(d.value);
        const base = PAD.top + ih;
        const hgt = base - y0;
        const rr = Math.min(r, hgt, bw / 2);
        // rounded top corners only, flat on the baseline
        const dPath =
          hgt <= 0
            ? ''
            : `M${x0},${base} V${y0 + rr} Q${x0},${y0} ${x0 + rr},${y0} H${x0 + bw - rr} Q${x0 + bw},${y0} ${x0 + bw},${y0 + rr} V${base} Z`;
        return {
          i,
          d: dPath,
          cx,
          top: y0,
          hx: PAD.left + slot * i,
          hw: slot,
          label: d.label,
          tip: d.tip,
          showLabel: (data.length - 1 - i) % every === 0,
        };
      }),
    };
  });
}

// ---------------------------------------------------------------------------
// Line chart – values over time, optional dashed goal line, crosshair tooltip
// ---------------------------------------------------------------------------

export interface LinePoint {
  date: Date;
  value: number;
}

@Component({
  selector: 'app-line-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (geo(); as g) {
      <svg [attr.width]="g.w" [attr.height]="height()" role="img" [attr.aria-label]="label()"
           (pointermove)="move($event)" (pointerleave)="hover.set(null)">
        @for (t of g.ticks; track t.v) {
          <line class="grid" [attr.x1]="pad.left" [attr.x2]="g.w - pad.right" [attr.y1]="t.y" [attr.y2]="t.y" />
          <text class="axis" [attr.x]="pad.left - 8" [attr.y]="t.y" text-anchor="end" dominant-baseline="middle">{{ t.v }}</text>
        }
        @for (t of g.xTicks; track t.x) {
          <text class="axis" [attr.x]="t.x" [attr.y]="height() - 8" text-anchor="middle">{{ t.label }}</text>
        }
        @if (g.goalY !== null) {
          <line class="goal" [attr.x1]="pad.left" [attr.x2]="g.w - pad.right" [attr.y1]="g.goalY" [attr.y2]="g.goalY" />
          <text class="goal-label" [attr.x]="g.w - pad.right" [attr.y]="g.goalY - 6" text-anchor="end">Goal {{ goal() }} {{ unit() }}</text>
        }
        <path class="line" [attr.d]="g.path" />
        @if (hover() !== null) {
          <line class="cross" [attr.x1]="g.pts[hover()!].x" [attr.x2]="g.pts[hover()!].x" [attr.y1]="pad.top" [attr.y2]="height() - pad.bottom" />
        }
        @for (p of g.pts; track p.i) {
          <circle class="dot" [class.on]="hover() === p.i" [attr.cx]="p.x" [attr.cy]="p.y" [attr.r]="hover() === p.i ? 6 : 4" />
        }
      </svg>
      @if (hover() !== null && g.pts[hover()!]; as p) {
        <div class="tip" [style.left.px]="tipX(p.x, g.w)" [style.top.px]="p.y">
          <b>{{ p.value }} {{ unit() }}</b> · {{ p.dateLabel }}
        </div>
      }
    }
  `,
  styleUrl: './charts.scss',
})
export class LineChart {
  readonly points = input.required<LinePoint[]>();
  readonly goal = input<number | null>(null);
  readonly unit = input('');
  readonly height = input(260);
  readonly label = input('Line chart');

  protected readonly pad = PAD;
  protected readonly tipX = clampTip;
  protected readonly hover = signal<number | null>(null);
  private readonly width = observeWidth();
  private readonly fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

  protected readonly geo = computed(() => {
    const w = this.width();
    const pts = this.points();
    if (w < 80 || pts.length === 0) return null;
    const h = this.height();
    const iw = w - PAD.left - PAD.right;
    const ih = h - PAD.top - PAD.bottom;
    const goal = this.goal();

    const values = pts.map((p) => p.value).concat(goal ?? []);
    const min = Math.floor(Math.min(...values) - 1);
    const max = Math.ceil(Math.max(...values) + 1);
    const ticks = niceTicks(min, max);
    const lo = Math.min(ticks[0], min);
    const hi = Math.max(ticks[ticks.length - 1], max);
    const y = (v: number) => PAD.top + ih - ((v - lo) / (hi - lo)) * ih;

    const t0 = pts[0].date.getTime();
    const t1 = pts[pts.length - 1].date.getTime();
    const span = Math.max(1, t1 - t0);
    const x = (d: Date) => (pts.length === 1 ? PAD.left + iw / 2 : PAD.left + ((d.getTime() - t0) / span) * iw);

    const mapped = pts.map((p, i) => ({
      i,
      x: x(p.date),
      y: y(p.value),
      value: p.value,
      dateLabel: this.fmt.format(p.date),
    }));

    // ~5 date labels along the bottom
    const n = Math.min(pts.length, Math.max(2, Math.floor(iw / 90)));
    const xTicks =
      pts.length === 1
        ? [{ x: mapped[0].x, label: mapped[0].dateLabel }]
        : Array.from({ length: n }, (_, k) => {
            const t = t0 + (span * k) / (n - 1);
            return { x: PAD.left + (iw * k) / (n - 1), label: this.fmt.format(new Date(t)) };
          });

    return {
      w,
      pts: mapped,
      path: mapped.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' '),
      ticks: ticks.filter((v) => v >= lo && v <= hi).map((v) => ({ v, y: y(v) })),
      xTicks,
      goalY: goal != null ? y(goal) : null,
    };
  });

  /** Highlight the point nearest to the pointer */
  protected move(event: PointerEvent): void {
    const g = this.geo();
    if (!g) return;
    const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
    const px = event.clientX - rect.left;
    let best = 0;
    for (const p of g.pts) if (Math.abs(p.x - px) < Math.abs(g.pts[best].x - px)) best = p.i;
    this.hover.set(best);
  }
}
