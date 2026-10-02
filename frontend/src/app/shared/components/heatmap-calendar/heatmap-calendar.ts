import { AfterViewInit, Component, ElementRef, computed, input, signal, viewChild } from '@angular/core';
import { formatDuration } from '../../../core/utils/format';

export interface HeatmapDay {
  date: Date;
  hours: number;
}

interface Cell { x: number; y: number; level: number; day: HeatmapDay; }

const CELL = 11, GAP = 3, STEP = CELL + GAP, LEFT = 30, TOP = 18;

/** Same thresholds as the backend's intensity levels. */
const level = (h: number) => (h <= 0 ? 0 : h < 2 ? 1 : h < 4 ? 2 : h < 6 ? 3 : 4);

/**
 * Calendar heatmap of tracked hours per day (Monday-first weeks, sequential blue ramp).
 */
@Component({
  selector: 'app-heatmap-calendar',
  standalone: true,
  templateUrl: './heatmap-calendar.html',
})
export class HeatmapCalendarComponent implements AfterViewInit {
  days = input.required<HeatmapDay[]>();

  private scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  protected hover = signal<{ x: number; y: number; title: string; value: string } | null>(null);
  protected readonly cell = CELL;
  protected readonly dayLabels = [{ t: 'Mon', r: 0 }, { t: 'Wed', r: 2 }, { t: 'Fri', r: 4 }].map(d => ({ ...d, y: TOP + d.r * STEP + 9 }));

  protected grid = computed(() => {
    const days = [...this.days()].sort((a, b) => a.date.getTime() - b.date.getTime());
    if (!days.length) return { cells: [] as Cell[], months: [] as { x: number; text: string }[], width: 0, height: 0 };
    const offset = (days[0].date.getDay() + 6) % 7; // Monday = 0
    const cells: Cell[] = [];
    const months: { x: number; text: string }[] = [];
    let lastMonth = -1;
    days.forEach((day, i) => {
      const idx = i + offset, col = Math.floor(idx / 7), row = idx % 7;
      const x = LEFT + col * STEP;
      if ((row === 0 || i === 0) && day.date.getMonth() !== lastMonth && day.date.getDate() <= 7) {
        months.push({ x, text: day.date.toLocaleDateString(undefined, { month: 'short' }) });
        lastMonth = day.date.getMonth();
      }
      cells.push({ x, y: TOP + row * STEP, level: level(day.hours), day });
    });
    const weeks = Math.ceil((offset + days.length) / 7);
    return { cells, months, width: LEFT + weeks * STEP, height: TOP + 7 * STEP };
  });

  ngAfterViewInit(): void {
    // Most recent weeks first on narrow screens.
    const el = this.scroller()?.nativeElement;
    if (el) setTimeout(() => (el.scrollLeft = el.scrollWidth));
  }

  protected show(cell: Cell, event: MouseEvent): void {
    const host = (event.currentTarget as SVGElement).closest('.hm')!.getBoundingClientRect();
    const r = (event.currentTarget as SVGElement).getBoundingClientRect();
    this.hover.set({
      x: Math.min(Math.max(r.left - host.left + r.width / 2, 80), host.width - 80), // keep the tip inside the card
      y: r.top - host.top,
      title: cell.day.date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
      value: cell.day.hours > 0 ? formatDuration(cell.day.hours * 60) : 'Nothing tracked',
    });
  }
}
