import { Component, computed, input } from '@angular/core';

export interface BarListRow {
  name: string;
  value: number;
  /** Identity color for the leading dot / icon. */
  color?: string;
  /** PrimeIcons class (e.g. "pi-briefcase"); renders a tinted icon instead of a dot. */
  icon?: string;
}

/**
 * Ranked horizontal bars (HTML/CSS) with direct labels, values and share of total.
 * Bars use one hue (magnitude); identity is carried by the leading dot or icon.
 */
@Component({
  selector: 'app-bar-list',
  standalone: true,
  host: { class: 'bar-list' },
  template: `
    @for (r of shown(); track r.name) {
      <div class="bl-row">
        <div class="bl-name">
          @if (r.icon) {
            <span class="cat-ic sm" [style.background]="'color-mix(in oklab, ' + (r.color || 'var(--muted)') + ' 14%, transparent)'" [style.color]="r.color"><i class="pi {{ r.icon }}"></i></span>
          } @else {
            <span class="pdot" [style.background]="r.color || 'var(--muted)'"></span>
          }
          <span class="bl-text" [title]="r.name">{{ r.name }}</span>
        </div>
        <div class="bl-val num">{{ format()(r.value) }}<em>{{ pct(r.value) }}</em></div>
        <div class="bl-track"><div class="bl-fill" [style.width.%]="max() ? (r.value / max()) * 100 : 0"></div></div>
      </div>
    }
    @if (totalLabel()) {
      <div class="bl-total"><span>{{ totalLabel() }}</span><b class="num">{{ format()(total()) }}</b></div>
    }
  `,
})
export class BarListComponent {
  rows = input.required<BarListRow[]>();
  format = input<(v: number) => string>(v => String(v));
  totalLabel = input('');
  /** Max rows; the tail folds into one "Other" row. */
  limit = input(6);

  protected shown = computed<BarListRow[]>(() => {
    const rows = [...this.rows()].sort((a, b) => b.value - a.value);
    if (rows.length <= this.limit()) return rows;
    const head = rows.slice(0, this.limit() - 1);
    const rest = rows.slice(this.limit() - 1);
    return [...head, { name: `${rest.length} more`, value: rest.reduce((s, r) => s + r.value, 0), color: 'var(--line-strong)', icon: head[0]?.icon ? 'pi-ellipsis-h' : undefined }];
  });
  protected total = computed(() => this.rows().reduce((s, r) => s + r.value, 0));
  protected max = computed(() => Math.max(0, ...this.shown().map(r => r.value)));

  protected pct(v: number): string {
    const t = this.total();
    return t ? `${Math.round((v / t) * 100)}%` : '';
  }
}
