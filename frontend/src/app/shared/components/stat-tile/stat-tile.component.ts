import { Component, computed, input } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

/**
 * One KPI cell: label, big value, optional delta chip, footnote and sparkline.
 * Place several inside a `.card.kpis` container.
 */
@Component({
  selector: 'app-stat-tile',
  standalone: true,
  imports: [SkeletonModule],
  host: { class: 'stat-tile' },
  template: `
    <div class="st-label">{{ label() }}</div>
    @if (loading()) {
      <p-skeleton width="7rem" height="1.9rem" />
      <p-skeleton width="9rem" height="0.9rem" />
    } @else {
      <div class="st-row">
        <div class="st-value num" [class]="valueClass()">{{ value() }}@if (unit()) {<small>{{ unit() }}</small>}</div>
        @if (sparkPath(); as p) {
          <svg class="st-spark" viewBox="0 0 84 30" aria-hidden="true">
            <path [attr.d]="p.area" fill="var(--accent)" opacity=".1" />
            <path [attr.d]="p.line" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round" />
            <circle [attr.cx]="p.end[0]" [attr.cy]="p.end[1]" r="2.75" fill="var(--accent)" stroke="var(--surface)" stroke-width="1.5" />
          </svg>
        }
      </div>
      <div class="st-foot">
        @if (delta() !== null) {
          <span class="delta" [class.up]="good()" [class.down]="!good()">
            <i class="pi" [class.pi-arrow-up-right]="delta()! >= 0" [class.pi-arrow-down-right]="delta()! < 0"></i>{{ deltaText() }}
          </span>
        }
        <span>{{ foot() }}</span>
      </div>
    }
  `,
})
export class StatTileComponent {
  label = input.required<string>();
  value = input<string>('');
  unit = input<string>('');
  foot = input<string>('');
  /** Percent change; null hides the chip. */
  delta = input<number | null>(null);
  /** Whether an increase is good (green). False for expenses. */
  goodWhenUp = input(true);
  spark = input<number[] | null>(null);
  valueClass = input('');
  loading = input(false);

  protected good = computed(() => (this.delta()! >= 0) === this.goodWhenUp());
  protected deltaText = computed(() => `${Math.abs(this.delta()!).toFixed(0)}%`);

  protected sparkPath = computed(() => {
    const v = this.spark();
    if (!v || v.length < 2) return null;
    const w = 84, h = 30, max = Math.max(...v), min = Math.min(...v);
    const x = (i: number) => (i / (v.length - 1)) * w;
    const y = (n: number) => h - 3 - ((n - min) / (max - min || 1)) * (h - 6);
    const pts = v.map((n, i) => `${x(i).toFixed(1)},${y(n).toFixed(1)}`);
    return { line: `M${pts.join(' L')}`, area: `M0,${h} L${pts.join(' L')} L${w},${h} Z`, end: [x(v.length - 1), y(v[v.length - 1])] };
  });
}
