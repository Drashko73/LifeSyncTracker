import { Component, computed, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { SkeletonModule } from 'primeng/skeleton';
import { ChartModule } from 'primeng/chart';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TransactionService } from '../../core/services/transaction.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { ThemeService } from '../../core/services/theme.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { Transaction, TransactionCategory, TransactionType, Currency, TransactionFilterDto, FinancialSummary, MonthlyFlow } from '../../core/models';
import { StatTileComponent } from '../../shared/components/stat-tile/stat-tile.component';
import { BarListComponent, BarListRow } from '../../shared/components/bar-list/bar-list.component';
import { currencyCode, formatMoney, formatRange, percentChange, tint } from '../../core/utils/format';
import { cashFlowChart } from '../../core/utils/chart-theme';
import { confirmDelete } from '../../core/utils/confirm';

type PeriodKey = 1 | 3 | 6 | 12 | 0 | 'custom';

// ponytail: one request of up to 2000 transactions per range for the category breakdown; page it if ranges outgrow that.
const BREAKDOWN_LIMIT = 2000;

/**
 * Finance: period KPIs, spending by category, monthly trend, filtered transaction table, add/edit dialog.
 */
@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, ButtonModule, TableModule, DialogModule, InputTextModule, InputNumber,
    SelectModule, DatePicker, SkeletonModule, ChartModule, StatTileComponent, BarListComponent],
  templateUrl: './finance.component.html',
})
export class FinanceComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private dashboardService = inject(DashboardService);
  private themeService = inject(ThemeService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  protected prefs = inject(UserPreferencesService);

  protected readonly tint = tint;
  protected readonly Income = TransactionType.Income;
  protected readonly Expense = TransactionType.Expense;

  readonly periods: { label: string; value: PeriodKey }[] = [
    { label: '1M', value: 1 }, { label: '3M', value: 3 }, { label: '6M', value: 6 }, { label: '12M', value: 12 }, { label: 'All', value: 0 },
  ];
  readonly typeOptions: { label: string; value: TransactionType | null }[] = [
    { label: 'All', value: null }, { label: 'Income', value: TransactionType.Income }, { label: 'Expenses', value: TransactionType.Expense },
  ];
  readonly currencies = [
    { label: 'USD', value: Currency.USD }, { label: 'EUR', value: Currency.EUR }, { label: 'RSD', value: Currency.RSD },
  ];

  categories = signal<TransactionCategory[]>([]);
  period = signal<PeriodKey>(6);
  range = signal(this.rangeFor(6));
  customRange: Date[] | null = null;

  summary = signal<FinancialSummary | null>(null);
  previousSummary = signal<FinancialSummary | null>(null);
  rangeTransactions = signal<Transaction[] | null>(null);
  flow = signal<MonthlyFlow[]>([]);
  chartData = signal<any>(null);
  chartOptions = signal<any>(null);

  // Table
  isLoading = signal(true);
  transactions = signal<Transaction[]>([]);
  totalRecords = signal(0);
  filterType = signal<TransactionType | null>(null);
  filterCategoryId = signal<number | null>(null);
  rows = 20;
  first = 0;

  // Dialog
  showDialog = false;
  editing: Transaction | null = null;
  isSaving = signal(false);
  formType = signal<TransactionType>(TransactionType.Expense);

  form = this.fb.group({
    categoryId: [null as number | null, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    currency: [Currency.USD],
    date: [new Date(), Validators.required],
    description: [''],
  });

  rangeLabel = computed(() => formatRange(this.range().start, this.range().end));
  hasComparison = computed(() => this.period() !== 0);

  kpis = computed(() => {
    const s = this.summary(), p = this.previousSummary();
    if (!s) return null;
    const rate = s.totalIncome ? (s.netBalance / s.totalIncome) * 100 : null;
    const months = Math.max(1, Math.round((this.range().end.getTime() - this.range().start.getTime()) / (30.44 * 86_400_000)));
    return {
      income: s.totalIncome, expenses: s.totalExpenses, net: s.netBalance, rate, perMonth: s.netBalance / months,
      incomeDelta: p && this.hasComparison() ? percentChange(s.totalIncome, p.totalIncome) : null,
      expenseDelta: p && this.hasComparison() ? percentChange(s.totalExpenses, p.totalExpenses) : null,
    };
  });

  categoryRows = computed<BarListRow[]>(() => {
    const totals = new Map<number, BarListRow>();
    for (const t of this.rangeTransactions() ?? []) {
      if (t.category.type !== TransactionType.Expense) continue;
      const row = totals.get(t.category.id) ?? { name: t.category.name, value: 0, color: t.category.colorCode, icon: t.category.icon || 'pi-tag' };
      row.value += t.amount;
      totals.set(t.category.id, row);
    }
    return [...totals.values()].sort((a, b) => b.value - a.value);
  });

  /** Transactions not in the preferred currency are summed as-is by the API; say so. */
  foreignCurrency = computed(() => {
    const pref = this.prefs.currency();
    const foreign = (this.rangeTransactions() ?? []).filter(t => t.currency !== pref);
    if (!foreign.length) return null;
    const codes = [...new Set(foreign.map(t => currencyCode(t.currency)))].join(', ');
    return `${foreign.length} ${foreign.length === 1 ? 'transaction' : 'transactions'} in ${codes} ${foreign.length === 1 ? 'is' : 'are'} counted in these totals without conversion.`;
  });

  dialogCategories = computed(() => this.categories().filter(c => c.type === this.formType()));
  filterCategories = computed(() => {
    const t = this.filterType();
    return t === null ? this.categories() : this.categories().filter(c => c.type === t);
  });

  trendMonths = computed(() => {
    const p = this.period();
    return p === 0 ? 24 : p === 'custom' ? 12 : Math.max(p, 6);
  });
  hasFlow = computed(() => this.flow().some(f => f.income || f.expenses));

  money = (v: number) => formatMoney(v, this.prefs.currency(), { decimals: 0 });

  constructor() {
    effect(() => {
      this.themeService.isDark();
      const flow = this.flow();
      untracked(() => this.buildChart(flow));
    });
  }

  ngOnInit(): void {
    const pref = this.prefs.defaultFilterMonths() as PeriodKey;
    if ([1, 3, 6, 12, 0].includes(pref as number)) {
      this.period.set(pref);
      this.range.set(this.rangeFor(pref));
    }
    this.transactionService.getCategories().subscribe(res => res.success && res.data && this.categories.set(res.data));
    if (this.route.snapshot.queryParamMap.get('add')) {
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
      this.openNew();
    }
    this.reloadAll();
  }

  // ---------- Filters ----------
  setPeriod(key: PeriodKey): void {
    this.period.set(key);
    this.range.set(this.rangeFor(key));
    this.customRange = null;
    this.reloadAll();
  }

  onCustomRange(): void {
    const [start, end] = this.customRange ?? [];
    if (!start || !end) return;
    const e = new Date(end); e.setHours(23, 59, 59, 999);
    this.period.set('custom');
    this.range.set({ start, end: e });
    this.reloadAll();
  }

  setType(type: TransactionType | null): void {
    this.filterType.set(type);
    const cat = this.categories().find(c => c.id === this.filterCategoryId());
    if (cat && type !== null && cat.type !== type) this.filterCategoryId.set(null);
    this.reloadTable();
  }

  setCategory(id: number | null): void {
    this.filterCategoryId.set(id);
    this.reloadTable();
  }

  private rangeFor(key: PeriodKey): { start: Date; end: Date } {
    const r = this.prefs.getDateRangeForPeriod(typeof key === 'number' ? key : 6);
    return { start: r.startDate ?? new Date(2000, 0, 1), end: r.endDate };
  }

  // ---------- Data ----------
  private reloadAll(): void {
    const { start, end } = this.range();
    const endInclusive = new Date(end); endInclusive.setDate(endInclusive.getDate() + 1);

    this.summary.set(null);
    this.transactionService.getSummary(start, endInclusive).subscribe({
      next: res => this.summary.set(res.data ?? null),
      error: () => this.toastError('Could not load totals', 'Check your connection and refresh the page.'),
    });

    this.previousSummary.set(null);
    if (this.period() !== 0) {
      const span = endInclusive.getTime() - start.getTime();
      this.transactionService.getSummary(new Date(start.getTime() - span), start).subscribe(res => this.previousSummary.set(res.data ?? null));
    }

    this.rangeTransactions.set(null);
    this.transactionService.getAll({ startDate: start, endDate: end, page: 1, pageSize: BREAKDOWN_LIMIT }).subscribe({
      next: res => this.rangeTransactions.set(res.data?.items ?? []),
      error: () => this.rangeTransactions.set([]),
    });

    this.dashboardService.getMonthlyFlow(this.trendMonths()).subscribe(res => this.flow.set(res.data ?? []));
    this.reloadTable();
  }

  private reloadTable(): void {
    this.first = 0;
    this.loadPage(1);
  }

  private loadPage(page: number): void {
    const filter: TransactionFilterDto = {
      type: this.filterType() ?? undefined,
      categoryId: this.filterCategoryId() ?? undefined,
      startDate: this.range().start,
      endDate: this.range().end,
      page,
      pageSize: this.rows,
    };
    this.isLoading.set(true);
    this.transactionService.getAll(filter).subscribe({
      next: res => {
        this.transactions.set(res.data?.items ?? []);
        this.totalRecords.set(res.data?.totalCount ?? 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastError('Could not load transactions', 'Check your connection and try again.');
      },
    });
  }

  onPage(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.rows, first = event.first ?? 0;
    if (first === this.first && rows === this.rows) return;
    this.rows = rows;
    this.first = first;
    this.loadPage(Math.floor(first / rows) + 1);
  }

  // ---------- Dialog ----------
  openNew(): void {
    this.editing = null;
    this.formType.set(TransactionType.Expense);
    this.form.reset({ categoryId: null, amount: null, currency: this.prefs.currency(), date: new Date(), description: '' });
    this.showDialog = true;
  }

  edit(t: Transaction): void {
    this.editing = t;
    this.formType.set(t.category.type);
    this.form.reset({ categoryId: t.category.id, amount: t.amount, currency: t.currency ?? this.prefs.currency(), date: new Date(t.date), description: t.description ?? '' });
    this.showDialog = true;
  }

  setFormType(type: TransactionType): void {
    if (this.formType() === type) return;
    this.formType.set(type);
    this.form.patchValue({ categoryId: null });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    const dto = { categoryId: v.categoryId!, amount: v.amount!, currency: v.currency ?? this.prefs.currency(), date: v.date!, description: v.description || undefined };
    const editing = this.editing;
    this.isSaving.set(true);
    (editing ? this.transactionService.update(editing.id, dto) : this.transactionService.create(dto)).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showDialog = false;
        this.reloadAll();
        this.messageService.add({ severity: 'success', summary: editing ? 'Transaction updated' : 'Transaction added' });
      },
      error: err => {
        this.isSaving.set(false);
        this.toastError(editing ? 'Could not update transaction' : 'Could not add transaction', err.error?.message || 'Check the details and try again.');
      },
    });
  }

  remove(t: Transaction): void {
    confirmDelete(this.confirmationService, {
      header: 'Delete transaction?',
      message: `“${t.description || t.category.name}” (${this.amount(t)}) will be removed. This can’t be undone.`,
      accept: () =>
        this.transactionService.delete(t.id).subscribe({
          next: () => {
            this.reloadAll();
            this.messageService.add({ severity: 'success', summary: 'Transaction deleted' });
          },
          error: () => this.toastError('Could not delete transaction', 'Try again in a moment.'),
        }),
    });
  }

  // ---------- Display ----------
  amount(t: Transaction): string {
    return formatMoney(t.category.type === TransactionType.Income ? t.amount : -t.amount, t.currency, { sign: true });
  }

  date(d: string | Date): string {
    const x = new Date(d);
    return x.toLocaleDateString(undefined, { day: 'numeric', month: 'short', ...(x.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) });
  }

  currencyLabel(c: Currency): string {
    return currencyCode(c);
  }

  categoryById(id: number | null | undefined): TransactionCategory | undefined {
    return this.categories().find(c => c.id === id);
  }

  private buildChart(flow: MonthlyFlow[]): void {
    if (!flow.length) return;
    const { data, options } = cashFlowChart(flow, this.prefs.currency());
    this.chartData.set(data);
    this.chartOptions.set(options);
  }

  private toastError(summary: string, detail: string): void {
    this.messageService.add({ severity: 'error', summary, detail });
  }
}
