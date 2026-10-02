import { Component, computed, effect, inject, OnInit, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ChartModule, UIChart } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { MenuModule } from 'primeng/menu';
import { MenuItem, MessageService } from 'primeng/api';
import { HeatmapCalendarComponent, HeatmapDay } from '../../shared/components/heatmap-calendar/heatmap-calendar';
import { StatTileComponent } from '../../shared/components/stat-tile/stat-tile.component';
import { BarListComponent, BarListRow } from '../../shared/components/bar-list/bar-list.component';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { TimeEntryService } from '../../core/services/time-entry.service';
import { TransactionService } from '../../core/services/transaction.service';
import { ThemeService } from '../../core/services/theme.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { DailyProductivity, DashboardStats, MonthlyFlow, TimeEntry, Transaction, TransactionType } from '../../core/models';
import { currencyCode, formatDuration, formatHours, formatMoney, percentChange, tint } from '../../core/utils/format';
import { baseChartOptions, chartColors } from '../../core/utils/chart-theme';

const DAY = 86_400_000;

/** Backend dates are calendar days; read the y-m-d part so no timezone can shift them. */
function toDays(rows: DailyProductivity[]): HeatmapDay[] {
  return rows.map(r => {
    const [y, m, d] = String(r.date).slice(0, 10).split('-').map(Number);
    return { date: new Date(y, m - 1, d), hours: r.hours };
  });
}

function startOfToday(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

/**
 * Dashboard: KPIs, running timer, cash flow, time by project, activity heatmap, recent activity.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, RouterLink, ButtonModule, ChartModule, SelectModule, SkeletonModule, MenuModule,
    HeatmapCalendarComponent, StatTileComponent, BarListComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private transactionService = inject(TransactionService);
  private themeService = inject(ThemeService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  protected timer = inject(TimeEntryService);
  protected prefs = inject(UserPreferencesService);

  protected readonly tint = tint;
  protected readonly formatDuration = formatDuration;
  protected readonly formatHours = formatHours;
  protected readonly Income = TransactionType.Income;

  private flowChart = viewChild<UIChart>('flowChart');

  isLoading = signal(true);
  stats = signal<DashboardStats | null>(null);
  flow = signal<MonthlyFlow[]>([]);
  recentEntries = signal<TimeEntry[] | null>(null);
  recentTransactions = signal<Transaction[] | null>(null);
  chartData = signal<any>(null);
  chartOptions = signal<any>(null);

  /** null = trailing 12 months (from the stats call), otherwise a calendar year. */
  selectedYear = signal<number | null>(null);
  yearDays = signal<HeatmapDay[] | null>(null);
  heatmapLoading = signal(false);

  readonly chartMenu: MenuItem[] = [{ label: 'Download PNG', icon: 'pi pi-download', command: () => this.downloadChart() }];

  greeting = computed(() => {
    const h = new Date().getHours();
    const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    const name = this.authService.currentUser()?.username;
    return name ? `${part}, ${name}` : part;
  });
  today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  yearOptions = computed(() => {
    const current = new Date().getFullYear();
    const created = this.authService.currentUser()?.created;
    const first = created ? new Date(created).getFullYear() : current;
    const options: { label: string; value: number | null }[] = [{ label: 'Last 12 months', value: null }];
    for (let y = current; y >= first; y--) options.push({ label: String(y), value: y });
    return options;
  });

  private statDays = computed(() => toDays(this.stats()?.productivityHeatmap ?? []));
  heatmapDays = computed(() => this.yearDays() ?? this.statDays());

  /** Hours this week (Mon → today) vs the same days last week, plus a 12-week sparkline. */
  week = computed(() => {
    const days = this.statDays();
    const today = startOfToday();
    const monday = new Date(today.getTime() - ((today.getDay() + 6) % 7) * DAY);
    const sum = (from: Date, to: Date) =>
      days.filter(d => d.date >= from && d.date <= to).reduce((s, d) => s + d.hours, 0);
    const hours = sum(monday, today);
    const lastWeek = sum(new Date(monday.getTime() - 7 * DAY), new Date(today.getTime() - 7 * DAY));
    const spark: number[] = [];
    for (let k = 12; k >= 1; k--) {
      const from = new Date(monday.getTime() - 7 * k * DAY);
      spark.push(sum(from, new Date(from.getTime() + 6 * DAY)));
    }
    spark.push(hours);
    return { hours, delta: percentChange(hours, lastWeek), spark };
  });

  month = computed(() => {
    const first = new Date(); first.setDate(1); first.setHours(0, 0, 0, 0);
    const inMonth = this.statDays().filter(d => d.date >= first);
    return {
      hours: inMonth.reduce((s, d) => s + d.hours, 0),
      activeDays: inMonth.filter(d => d.hours > 0).length,
      name: first.toLocaleDateString(undefined, { month: 'long' }),
    };
  });

  /** Previous full month from the stats flow, used as the reference for month-to-date money. */
  previousMonth = computed(() => {
    const f = this.stats()?.monthlyFlow ?? [];
    const p = f[f.length - 2];
    return p ? { name: new Date(p.year, p.month - 1, 1).toLocaleDateString(undefined, { month: 'long' }), ...p } : null;
  });

  projectRows = computed<BarListRow[]>(() =>
    (this.stats()?.timeDistribution ?? []).map(d => ({ name: d.projectName, value: d.totalHours, color: d.colorCode })),
  );
  formatHoursLabel = (v: number) => `${formatHours(v)} h`;

  heatmapSummary = computed(() => {
    const days = this.heatmapDays();
    let streak = 0, longest = 0;
    let best: HeatmapDay | null = null;
    for (const d of days) {
      streak = d.hours > 0 ? streak + 1 : 0;
      longest = Math.max(longest, streak);
      if (!best || d.hours > best.hours) best = d;
    }
    return {
      total: days.reduce((s, d) => s + d.hours, 0),
      active: days.filter(d => d.hours > 0).length,
      count: days.length,
      longest,
      best: best && best.hours > 0 ? best : null,
    };
  });

  hasFlow = computed(() => this.flow().some(f => f.income || f.expenses));

  constructor() {
    // Rebuild the chart when data or theme changes (canvas needs resolved colors).
    effect(() => {
      this.themeService.isDark();
      const flow = this.flow();
      untracked(() => this.buildChart(flow));
    });
  }

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next: res => {
        if (res.success && res.data) this.stats.set(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Could not load dashboard', detail: 'Check your connection and refresh the page.' });
      },
    });
    this.dashboardService.getMonthlyFlow(12).subscribe({ next: res => res.success && res.data && this.flow.set(res.data) });
    this.timer.getAll({ page: 1, pageSize: 5 }).subscribe({
      next: res => this.recentEntries.set(res.data?.items.filter(e => !e.isRunning) ?? []),
      error: () => this.recentEntries.set([]),
    });
    this.transactionService.getAll({ page: 1, pageSize: 5 }).subscribe({
      next: res => this.recentTransactions.set(res.data?.items ?? []),
      error: () => this.recentTransactions.set([]),
    });
  }

  onYearChange(year: number | null): void {
    this.selectedYear.set(year);
    if (year === null) {
      this.yearDays.set(null);
      return;
    }
    const now = new Date();
    const end = year === now.getFullYear() ? now : new Date(year, 11, 31);
    this.heatmapLoading.set(true);
    this.dashboardService.getProductivityHeatmap(year, 1, 1, end.getFullYear(), end.getMonth() + 1, end.getDate()).subscribe({
      next: res => {
        this.yearDays.set(toDays(res.data ?? []));
        this.heatmapLoading.set(false);
      },
      error: () => {
        this.heatmapLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Could not load activity', detail: `Activity for ${year} is unavailable right now.` });
      },
    });
  }

  stopTimer(): void {
    this.router.navigate(['/time-tracking'], { queryParams: { stop: 1 } });
  }

  money(amount: number, opts?: { decimals?: 0 | 2; sign?: boolean }): string {
    return formatMoney(amount, this.prefs.currency(), { decimals: 0, ...opts });
  }

  txAmount(t: Transaction): string {
    return formatMoney(t.category.type === TransactionType.Income ? t.amount : -t.amount, t.currency, { sign: true });
  }

  shortDate(d: string | Date): string {
    return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }

  startedAt(): string {
    const t = this.timer.runningTimer();
    return t ? new Date(t.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
  }

  private buildChart(flow: MonthlyFlow[]): void {
    if (!flow.length) return;
    const c = chartColors();
    const currency = this.prefs.currency();
    const compact = new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode(currency), notation: 'compact', maximumFractionDigits: 1 });
    this.chartData.set({
      labels: flow.map((f, i) => (i === 0 || f.month === 1 ? [f.label.split(' ')[0], f.year] : f.label.split(' ')[0])),
      datasets: [
        { type: 'line', label: 'Net', data: flow.map(f => f.income - f.expenses), borderColor: c.ink, backgroundColor: c.ink, borderWidth: 2,
          pointRadius: flow.map((_, i) => (i === flow.length - 1 ? 4 : 2.5)), pointHoverRadius: 5, pointBackgroundColor: c.ink,
          pointBorderColor: c.surface, pointBorderWidth: 2, tension: 0, order: 0 },
        { type: 'bar', label: 'Income', data: flow.map(f => f.income), backgroundColor: c.s1, borderRadius: 4, borderSkipped: 'start',
          barPercentage: 0.9, categoryPercentage: 0.62, order: 1 },
        { type: 'bar', label: 'Expenses', data: flow.map(f => f.expenses), backgroundColor: c.s2, borderRadius: 4, borderSkipped: 'start',
          barPercentage: 0.9, categoryPercentage: 0.62, order: 1 },
      ],
    });
    const base = baseChartOptions(c, v => compact.format(v));
    this.chartOptions.set({
      ...base,
      plugins: {
        ...base.plugins,
        tooltip: {
          ...base.plugins.tooltip,
          itemSort: (a: any, b: any) => a.datasetIndex === 0 ? 1 : b.datasetIndex === 0 ? -1 : a.datasetIndex - b.datasetIndex,
          callbacks: {
            title: (items: any[]) => flow[items[0].dataIndex].label,
            label: (ctx: any) => ` ${ctx.dataset.label}: ${formatMoney(ctx.parsed.y, currency, { decimals: 0, sign: ctx.datasetIndex === 0 })}`,
          },
        },
      },
    });
  }

  private downloadChart(): void {
    const image = this.flowChart()?.getBase64Image();
    if (!image) return;
    const link = document.createElement('a');
    link.href = image;
    link.download = 'cash-flow.png';
    link.click();
  }
}
