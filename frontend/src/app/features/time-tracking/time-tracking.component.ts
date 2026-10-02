import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { MultiSelect } from 'primeng/multiselect';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TimeEntryService } from '../../core/services/time-entry.service';
import { ProjectService } from '../../core/services/project.service';
import { TagService } from '../../core/services/tag.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { TimeEntry, Project, Tag, TimeEntryFilterDto, EmployerReport } from '../../core/models';
import { dayKey, formatDuration, formatMoney, formatRange } from '../../core/utils/format';
import { confirmDelete } from '../../core/utils/confirm';

type PeriodKey = 'week' | 1 | 3 | 6 | 12 | 0 | 'custom';

/** Full fetch used for the summary strip and day subtotals. */
// ponytail: single request capped at 2000 entries per range; page it if a range ever holds more.
const SUMMARY_LIMIT = 2000;

/**
 * Time tracking: timer, filters, period summary, entries grouped by day, entry/stop/report dialogs.
 */
@Component({
  selector: 'app-time-tracking',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, ButtonModule, TableModule, DialogModule, InputTextModule, Textarea,
    SelectModule, DatePicker, MultiSelect, SkeletonModule, TooltipModule],
  templateUrl: './time-tracking.component.html',
})
export class TimeTrackingComponent implements OnInit {
  protected timer = inject(TimeEntryService);
  private projectService = inject(ProjectService);
  private tagService = inject(TagService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private prefs = inject(UserPreferencesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  protected readonly formatDuration = formatDuration;

  readonly periods: { label: string; value: PeriodKey }[] = [
    { label: 'Week', value: 'week' }, { label: '1M', value: 1 }, { label: '3M', value: 3 },
    { label: '6M', value: 6 }, { label: '12M', value: 12 }, { label: 'All', value: 0 },
  ];

  isLoading = signal(true);
  entries = signal<TimeEntry[]>([]);
  totalRecords = signal(0);
  projects = signal<Project[]>([]);
  tags = signal<Tag[]>([]);

  period = signal<PeriodKey>('week');
  range = signal<{ start: Date; end: Date }>(this.rangeFor('week'));
  customRange: Date[] | null = null;
  filterProjectId = signal<number | null>(null);
  filterTagIds = signal<number[]>([]);
  rows = 20;
  first = 0;

  /** All entries for the current filters (summary + day subtotals). */
  allEntries = signal<TimeEntry[] | null>(null);

  // Timer hero
  startProjectId: number | null = null;
  draftDescription = '';
  isStarting = signal(false);

  showStopDialog = false;
  showEntryDialog = false;
  showReportDialog = false;
  editingEntry: TimeEntry | null = null;
  isSaving = signal(false);

  // Reports
  reportProjectId: number | null = null;
  reportMonth: Date = new Date();
  report = signal<EmployerReport | null>(null);
  reportLoading = signal(false);
  isDownloadingPdf = signal(false);

  stopForm = this.fb.group({
    projectId: [null as number | null],
    description: [''],
    nextSteps: [''],
    tagIds: [[] as number[]],
  });

  entryForm = this.fb.group({
    startTime: [new Date(), Validators.required],
    endTime: [new Date(), Validators.required],
    projectId: [null as number | null],
    description: [''],
    nextSteps: [''],
    tagIds: [[] as number[]],
  });

  rangeLabel = computed(() => formatRange(this.range().start, this.range().end));

  summary = computed(() => {
    const all = this.allEntries();
    if (!all) return null;
    const minutes = all.reduce((s, e) => s + this.minutesOf(e), 0);
    const days = new Set(all.map(e => dayKey(e.startTime))).size;
    const byProject = new Map<string, { name: string; color?: string; minutes: number }>();
    for (const e of all) {
      if (!e.project) continue;
      const p = byProject.get(e.project.name) ?? { name: e.project.name, color: e.project.colorCode, minutes: 0 };
      p.minutes += this.minutesOf(e);
      byProject.set(p.name, p);
    }
    const top = [...byProject.values()].sort((a, b) => b.minutes - a.minutes)[0] ?? null;
    return { minutes, count: all.length, avgPerDay: days ? minutes / days : 0, days, top };
  });

  dayTotals = computed(() => {
    const totals = new Map<string, number>();
    for (const e of this.allEntries() ?? []) totals.set(dayKey(e.startTime), (totals.get(dayKey(e.startTime)) ?? 0) + this.minutesOf(e));
    return totals;
  });

  /** Rows carry a day key so the table can group them under day headers. */
  tableRows = computed(() => this.entries().map(e => ({ ...e, day: dayKey(e.startTime) })));

  entryDuration = signal<number | null>(null);

  private stopRequested = false;

  constructor() {
    // Dashboard "Stop" deep link: open the stop dialog once the running timer is known.
    effect(() => {
      if (this.stopRequested && this.timer.runningTimer()) {
        this.stopRequested = false;
        queueMicrotask(() => this.openStopDialog());
      }
    });
    this.entryForm.valueChanges.subscribe(v => {
      const s = v.startTime ? new Date(v.startTime) : null, e = v.endTime ? new Date(v.endTime) : null;
      this.entryDuration.set(s && e ? (e.getTime() - s.getTime()) / 60000 : null);
    });
  }

  ngOnInit(): void {
    const pref = this.prefs.defaultFilterMonths() as PeriodKey;
    if ([1, 3, 6, 12, 0].includes(pref as number)) this.setPeriod(pref, false);
    if (this.route.snapshot.queryParamMap.get('stop')) {
      this.stopRequested = true;
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }
    this.projectService.getAll().subscribe(res => res.success && res.data && this.projects.set(res.data));
    this.tagService.getAll().subscribe(res => res.success && res.data && this.tags.set(res.data));
    this.reload();
  }

  // ---------- Filters ----------
  setPeriod(key: PeriodKey, reload = true): void {
    this.period.set(key);
    this.range.set(this.rangeFor(key));
    this.customRange = null;
    if (reload) this.reload();
  }

  onCustomRange(): void {
    const [start, end] = this.customRange ?? [];
    if (!start || !end) return;
    const e = new Date(end); e.setHours(23, 59, 59, 999);
    this.period.set('custom');
    this.range.set({ start, end: e });
    this.reload();
  }

  onProjectFilter(id: number | null): void { this.filterProjectId.set(id); this.reload(); }
  onTagFilter(ids: number[]): void { this.filterTagIds.set(ids ?? []); this.reload(); }

  private rangeFor(key: PeriodKey): { start: Date; end: Date } {
    if (key === 'week') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      return { start, end: new Date() };
    }
    const r = this.prefs.getDateRangeForPeriod(typeof key === 'number' ? key : 6);
    return { start: r.startDate ?? new Date(2000, 0, 1), end: r.endDate };
  }

  private baseFilter(): TimeEntryFilterDto {
    return {
      projectId: this.filterProjectId() ?? undefined,
      tagIds: this.filterTagIds().length ? this.filterTagIds() : undefined,
      startDate: this.range().start,
      endDate: this.range().end,
    };
  }

  reload(): void {
    this.first = 0;
    this.loadPage(1);
    this.allEntries.set(null);
    this.timer.getAll({ ...this.baseFilter(), page: 1, pageSize: SUMMARY_LIMIT }).subscribe({
      next: res => this.allEntries.set(res.data?.items ?? []),
      error: () => this.allEntries.set([]),
    });
  }

  private loadPage(page: number): void {
    this.isLoading.set(true);
    this.timer.getAll({ ...this.baseFilter(), page, pageSize: this.rows }).subscribe({
      next: res => {
        this.entries.set(res.data?.items ?? []);
        this.totalRecords.set(res.data?.totalCount ?? 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastError('Could not load entries', 'Check your connection and try again.');
      },
    });
  }

  onPage(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.rows;
    const first = event.first ?? 0;
    if (first === this.first && rows === this.rows) return;
    this.rows = rows;
    this.first = first;
    this.loadPage(Math.floor(first / rows) + 1);
  }

  // ---------- Timer ----------
  startTimer(): void {
    this.isStarting.set(true);
    this.timer.startTimer({ projectId: this.startProjectId ?? undefined }).subscribe({
      next: () => {
        this.isStarting.set(false);
        this.reload();
      },
      error: err => {
        this.isStarting.set(false);
        this.toastError('Could not start timer', err.error?.message || 'Try again in a moment.');
      },
    });
  }

  openStopDialog(): void {
    const running = this.timer.runningTimer();
    this.stopForm.reset({
      projectId: running?.project?.id ?? this.startProjectId ?? null,
      description: this.draftDescription,
      nextSteps: '',
      tagIds: [],
    });
    this.showStopDialog = true;
  }

  stopTimer(): void {
    const v = this.stopForm.value;
    const minutes = this.timer.elapsedSeconds() / 60;
    this.isSaving.set(true);
    this.timer.stopTimer({
      projectId: v.projectId ?? undefined,
      description: v.description || undefined,
      nextSteps: v.nextSteps || undefined,
      tagIds: v.tagIds ?? [],
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showStopDialog = false;
        this.draftDescription = '';
        this.reload();
        this.messageService.add({ severity: 'success', summary: 'Entry saved', detail: `${formatDuration(minutes)} added to your log.` });
      },
      error: err => {
        this.isSaving.set(false);
        this.toastError('Could not stop timer', err.error?.message || 'Try again in a moment.');
      },
    });
  }

  // ---------- Entries ----------
  openNewEntry(): void {
    this.editingEntry = null;
    const end = new Date(); end.setSeconds(0, 0);
    const start = new Date(end.getTime() - 60 * 60000);
    this.entryForm.reset({ startTime: start, endTime: end, projectId: null, description: '', nextSteps: '', tagIds: [] });
    this.showEntryDialog = true;
  }

  editEntry(entry: TimeEntry): void {
    this.editingEntry = entry;
    this.entryForm.reset({
      startTime: new Date(entry.startTime),
      endTime: entry.endTime ? new Date(entry.endTime) : new Date(),
      projectId: entry.project?.id ?? null,
      description: entry.description ?? '',
      nextSteps: entry.nextSteps ?? '',
      tagIds: entry.tags.map(t => t.id),
    });
    this.showEntryDialog = true;
  }

  saveEntry(): void {
    if (this.entryForm.invalid || (this.entryDuration() ?? 0) <= 0) return;
    const v = this.entryForm.value;
    const dto = {
      startTime: v.startTime!, endTime: v.endTime!, projectId: v.projectId ?? undefined,
      description: v.description || undefined, nextSteps: v.nextSteps || undefined, tagIds: v.tagIds ?? [],
    };
    const editing = this.editingEntry;
    const request = editing ? this.timer.update(editing.id, dto) : this.timer.createManualEntry(dto);
    this.isSaving.set(true);
    request.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showEntryDialog = false;
        this.reload();
        this.messageService.add({ severity: 'success', summary: editing ? 'Entry updated' : 'Entry added' });
      },
      error: err => {
        this.isSaving.set(false);
        this.toastError(editing ? 'Could not update entry' : 'Could not add entry', err.error?.message || 'Check the times and try again.');
      },
    });
  }

  deleteEntry(entry: TimeEntry): void {
    confirmDelete(this.confirmationService, {
      header: 'Delete time entry?',
      message: `“${entry.description || 'Untitled entry'}” (${formatDuration(this.minutesOf(entry))}) will be removed. This can’t be undone.`,
      accept: () =>
        this.timer.delete(entry.id).subscribe({
          next: () => {
            this.reload();
            this.messageService.add({ severity: 'success', summary: 'Entry deleted' });
          },
          error: () => this.toastError('Could not delete entry', 'Try again in a moment.'),
        }),
    });
  }

  // ---------- Reports ----------
  openReports(): void {
    this.reportProjectId = this.filterProjectId() ?? this.projects()[0]?.id ?? null;
    this.reportMonth = new Date();
    this.report.set(null);
    this.showReportDialog = true;
    this.loadReport();
  }

  loadReport(): void {
    if (!this.reportProjectId) return;
    this.reportLoading.set(true);
    this.timer.getEmployerReport(this.reportProjectId, this.reportMonth.getFullYear(), this.reportMonth.getMonth() + 1).subscribe({
      next: res => {
        this.report.set(res.data ?? null);
        this.reportLoading.set(false);
      },
      error: () => {
        this.report.set(null);
        this.reportLoading.set(false);
      },
    });
  }

  reportDays = computed(() => {
    const days = new Map<string, { date: Date; minutes: number; count: number }>();
    for (const e of this.report()?.timeEntries ?? []) {
      const k = dayKey(e.startTime);
      const d = days.get(k) ?? { date: new Date(e.startTime), minutes: 0, count: 0 };
      d.minutes += e.durationMinutes ?? 0;
      d.count++;
      days.set(k, d);
    }
    return [...days.values()];
  });

  reportEarnings(): string {
    const r = this.report();
    return r?.totalEarnings != null ? formatMoney(r.totalEarnings, this.prefs.currency()) : '—';
  }

  downloadPdf(): void {
    if (!this.reportProjectId) return;
    const y = this.reportMonth.getFullYear(), m = this.reportMonth.getMonth() + 1;
    this.isDownloadingPdf.set(true);
    this.timer.downloadPdfReport(this.reportProjectId, y, m).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${y}_${String(m).padStart(2, '0')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.isDownloadingPdf.set(false);
      },
      error: () => {
        this.isDownloadingPdf.set(false);
        this.toastError('Could not create PDF', 'Try again in a moment.');
      },
    });
  }

  // ---------- Display helpers ----------
  minutesOf(e: TimeEntry): number {
    if (e.isRunning) return this.timer.elapsedSeconds() / 60;
    return e.durationMinutes ?? 0;
  }

  timeRange(e: TimeEntry): string {
    const t = (d: string | Date) => new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return e.isRunning || !e.endTime ? `${t(e.startTime)} – now` : `${t(e.startTime)} – ${t(e.endTime)}`;
  }

  dayLabel(key: string): string {
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const today = dayKey(new Date()), yesterday = dayKey(new Date(Date.now() - 86_400_000));
    const prefix = key === today ? 'Today · ' : key === yesterday ? 'Yesterday · ' : '';
    return prefix + date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', ...(y !== new Date().getFullYear() ? { year: 'numeric' } : {}) });
  }

  projectColor(id: number | null | undefined): string {
    return this.projects().find(p => p.id === id)?.colorCode || 'var(--muted)';
  }

  private toastError(summary: string, detail: string): void {
    this.messageService.add({ severity: 'error', summary, detail });
  }
}
