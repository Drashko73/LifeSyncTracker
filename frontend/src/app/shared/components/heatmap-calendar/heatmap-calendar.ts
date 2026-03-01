import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HeatMapDate {
  date: Date;
  value: number | null;
}

interface HeatMapCell {
  date: Date;
  value: number | null;
  x: number;
  y: number;
  cssClass: string;
}

@Component({
  selector: 'app-heatmap-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './heatmap-calendar.html'
})
export class HeatmapCalendarComponent implements OnChanges {
  @Input() startDate!: Date;
  @Input() endDate!: Date;
  @Input() dates: HeatMapDate[] = [];
  @Input() classForValue: (date: HeatMapDate) => string = () => 'heatmap-0';
  @Input() showMonthLabel = true;
  @Input() showDayLabel = true;

  cells: HeatMapCell[] = [];
  monthLabels: { text: string; x: number }[] = [];
  readonly cellSize = 14;
  readonly headerHeight = 20;
  readonly labelWidth = 28;
  svgWidth = 800;
  svgHeight = 0;

  ngOnChanges(): void {
    this.buildGrid();
  }

  private buildGrid(): void {
    if (!this.startDate || !this.endDate) return;

    const dateMap = new Map<string, number | null>();
    for (const d of this.dates) {
      const key = this.dateKey(d.date);
      dateMap.set(key, d.value);
    }

    const cells: HeatMapCell[] = [];
    const months: { text: string; x: number }[] = [];
    const offsetX = this.showDayLabel ? this.labelWidth : 0;

    const current = new Date(this.startDate);
    // Move to the start of the week (Sunday)
    current.setDate(current.getDate() - current.getDay());

    let weekIndex = 0;
    let lastMonth = -1;

    while (current <= this.endDate || current.getDay() !== 0) {
      const dayOfWeek = current.getDay();

      if (dayOfWeek === 0 && current > this.startDate) {
        weekIndex++;
      }

      // Month labels
      if (this.showMonthLabel && current.getMonth() !== lastMonth && current >= this.startDate && current <= this.endDate) {
        lastMonth = current.getMonth();
        months.push({
          text: current.toLocaleString('default', { month: 'short' }),
          x: offsetX + weekIndex * this.cellSize
        });
      }

      if (current >= this.startDate && current <= this.endDate) {
        const key = this.dateKey(current);
        const value = dateMap.get(key) ?? null;
        cells.push({
          date: new Date(current),
          value,
          x: offsetX + weekIndex * this.cellSize,
          y: this.headerHeight + dayOfWeek * this.cellSize,
          cssClass: this.classForValue({ date: new Date(current), value })
        });
      }

      current.setDate(current.getDate() + 1);
      if (current > this.endDate && current.getDay() !== 0) {
        break;
      }
    }

    this.cells = cells;
    this.monthLabels = months;
    this.svgWidth = offsetX + (weekIndex + 1) * this.cellSize;
    this.svgHeight = this.headerHeight + 7 * this.cellSize;
  }

  private dateKey(d: Date): string {
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}