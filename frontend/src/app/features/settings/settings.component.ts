import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ProjectService } from '../../core/services/project.service';
import { TagService } from '../../core/services/tag.service';
import { TransactionService } from '../../core/services/transaction.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { Project, Tag, TransactionCategory, TransactionType, Currency, ApiResponse } from '../../core/models';
import { ColorFieldComponent, SWATCHES } from '../../shared/components/color-field/color-field.component';
import { confirmDelete } from '../../core/utils/confirm';
import { formatHours, formatMoney, tint } from '../../core/utils/format';

type Section = 'preferences' | 'projects' | 'tags' | 'categories';

const CATEGORY_ICONS = [
  'pi-shopping-cart', 'pi-shopping-bag', 'pi-home', 'pi-bolt', 'pi-car', 'pi-truck', 'pi-desktop', 'pi-ticket',
  'pi-heart', 'pi-briefcase', 'pi-dollar', 'pi-chart-line', 'pi-wallet', 'pi-credit-card', 'pi-gift', 'pi-book',
  'pi-wifi', 'pi-phone', 'pi-globe', 'pi-wrench', 'pi-users', 'pi-star', 'pi-sun', 'pi-tag',
];

/**
 * Settings: preferences plus management of projects, tags and transaction categories.
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, ButtonModule, TableModule, DialogModule, InputTextModule, SelectModule,
    InputNumber, ToggleSwitch, SkeletonModule, TooltipModule, ColorFieldComponent],
  templateUrl: './settings.components.html',
})
export class SettingsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private tagService = inject(TagService);
  private transactionService = inject(TransactionService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  protected prefs = inject(UserPreferencesService);
  protected theme = inject(ThemeService);

  protected readonly tint = tint;
  protected readonly formatHours = formatHours;
  protected readonly Income = TransactionType.Income;
  protected readonly Expense = TransactionType.Expense;
  protected readonly icons = CATEGORY_ICONS;

  readonly sections: { key: Section; label: string; icon: string }[] = [
    { key: 'preferences', label: 'Preferences', icon: 'pi-sliders-h' },
    { key: 'projects', label: 'Projects', icon: 'pi-briefcase' },
    { key: 'tags', label: 'Tags', icon: 'pi-tag' },
    { key: 'categories', label: 'Categories', icon: 'pi-th-large' },
  ];
  readonly themeOptions: { label: string; value: ThemeMode; icon: string }[] = [
    { label: 'System', value: 'system', icon: 'pi-desktop' }, { label: 'Light', value: 'light', icon: 'pi-sun' }, { label: 'Dark', value: 'dark', icon: 'pi-moon' },
  ];
  readonly currencyOptions = [
    { label: 'US Dollar (USD)', value: Currency.USD }, { label: 'Euro (EUR)', value: Currency.EUR }, { label: 'Serbian Dinar (RSD)', value: Currency.RSD },
  ];
  readonly periodOptions = [
    { label: '1M', value: 1 }, { label: '3M', value: 3 }, { label: '6M', value: 6 }, { label: '12M', value: 12 }, { label: 'All', value: 0 },
  ];
  readonly timezones = this.prefs.getCommonTimezones();

  section = signal<Section>('preferences');

  projects = signal<Project[] | null>(null);
  tags = signal<Tag[] | null>(null);
  categories = signal<TransactionCategory[] | null>(null);
  incomeCategories = computed(() => (this.categories() ?? []).filter(c => c.type === TransactionType.Income));
  expenseCategories = computed(() => (this.categories() ?? []).filter(c => c.type === TransactionType.Expense));

  showProjectDialog = false;
  showTagDialog = false;
  showCategoryDialog = false;
  editingProject: Project | null = null;
  editingTag: Tag | null = null;
  editingCategory: TransactionCategory | null = null;
  isSaving = signal(false);

  projectForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    colorCode: [SWATCHES[0]],
    hourlyRate: [null as number | null],
    autoCreateIncome: [false],
    isActive: [true],
  });
  tagForm = this.fb.group({ name: ['', Validators.required], colorCode: [SWATCHES[0]] });
  categoryForm = this.fb.group({
    name: ['', Validators.required],
    type: [TransactionType.Expense],
    icon: ['pi-tag'],
    colorCode: [SWATCHES[0]],
  });

  ngOnInit(): void {
    const s = this.route.snapshot.queryParamMap.get('section') as Section | null;
    if (s && this.sections.some(x => x.key === s)) this.section.set(s);
    this.loadProjects();
    this.loadTags();
    this.loadCategories();
  }

  // ---------- Preferences ----------
  setCurrency(c: Currency): void { this.prefs.setCurrency(c); this.saved(); }
  setTimezone(tz: string): void { this.prefs.setTimezone(tz); this.saved(); }
  setPeriod(m: number): void { this.prefs.setDefaultFilterMonths(m); this.saved(); }

  resetPreferences(): void {
    confirmDelete(this.confirmationService, {
      header: 'Reset preferences?',
      message: 'Currency, timezone and default period go back to their defaults. Your data is not affected.',
      acceptLabel: 'Reset',
      accept: () => {
        this.prefs.resetPreferences();
        this.theme.setThemeMode('system');
        this.messageService.add({ severity: 'success', summary: 'Preferences reset' });
      },
    });
  }

  private saved(): void {
    this.messageService.add({ severity: 'success', summary: 'Preference saved', life: 1500 });
  }

  // ---------- Loading ----------
  private loadProjects(): void {
    this.projectService.getAll(true).subscribe({ next: r => this.projects.set(r.data ?? []), error: () => this.loadFailed('projects') });
  }
  private loadTags(): void {
    this.tagService.getAll().subscribe({ next: r => this.tags.set(r.data ?? []), error: () => this.loadFailed('tags') });
  }
  private loadCategories(): void {
    this.transactionService.getCategories().subscribe({ next: r => this.categories.set(r.data ?? []), error: () => this.loadFailed('categories') });
  }
  private loadFailed(what: string): void {
    this.messageService.add({ severity: 'error', summary: `Could not load ${what}`, detail: 'Check your connection and refresh the page.' });
  }

  // ---------- Projects ----------
  newProject(): void {
    this.editingProject = null;
    this.projectForm.reset({ name: '', description: '', colorCode: this.nextColor(this.projects()), hourlyRate: null, autoCreateIncome: false, isActive: true });
    this.showProjectDialog = true;
  }

  editProject(p: Project): void {
    this.editingProject = p;
    this.projectForm.reset({
      name: p.name, description: p.description ?? '', colorCode: p.colorCode || SWATCHES[0],
      hourlyRate: p.hourlyRate ?? null, autoCreateIncome: p.autoCreateIncome, isActive: p.isActive,
    });
    this.showProjectDialog = true;
  }

  saveProject(): void {
    if (this.projectForm.invalid) return this.projectForm.markAllAsTouched();
    const v = this.projectForm.value;
    const base = {
      name: v.name!, description: v.description || undefined, colorCode: v.colorCode || undefined,
      hourlyRate: v.hourlyRate ?? undefined, autoCreateIncome: !!v.autoCreateIncome,
    };
    const editing = this.editingProject;
    this.submit(
      editing ? this.projectService.update(editing.id, { ...base, isActive: !!v.isActive }) : this.projectService.create(base),
      editing ? 'Project updated' : 'Project created',
      () => { this.showProjectDialog = false; this.loadProjects(); },
    );
  }

  deleteProject(p: Project): void {
    confirmDelete(this.confirmationService, {
      header: 'Delete project?',
      message: `“${p.name}” will be removed. Its time entries stay but lose their project. To keep it for reports, mark it inactive instead.`,
      accept: () => this.submit(this.projectService.delete(p.id), 'Project deleted', () => this.loadProjects()),
    });
  }

  rate(p: Project): string {
    return p.hourlyRate ? `${formatMoney(p.hourlyRate, this.prefs.currency())}/h` : '—';
  }

  // ---------- Tags ----------
  newTag(): void {
    this.editingTag = null;
    this.tagForm.reset({ name: '', colorCode: this.nextColor(this.tags()) });
    this.showTagDialog = true;
  }

  editTag(t: Tag): void {
    this.editingTag = t;
    this.tagForm.reset({ name: t.name, colorCode: t.colorCode || SWATCHES[0] });
    this.showTagDialog = true;
  }

  saveTag(): void {
    if (this.tagForm.invalid) return this.tagForm.markAllAsTouched();
    const v = this.tagForm.value;
    const dto = { name: v.name!, colorCode: v.colorCode || undefined };
    const editing = this.editingTag;
    this.submit(
      editing ? this.tagService.update(editing.id, dto) : this.tagService.create(dto),
      editing ? 'Tag updated' : 'Tag created',
      () => { this.showTagDialog = false; this.loadTags(); },
    );
  }

  deleteTag(t: Tag): void {
    confirmDelete(this.confirmationService, {
      header: 'Delete tag?',
      message: `“${t.name}” will be removed from every entry that uses it.`,
      accept: () => this.submit(this.tagService.delete(t.id), 'Tag deleted', () => this.loadTags()),
    });
  }

  // ---------- Categories ----------
  newCategory(type: TransactionType = TransactionType.Expense): void {
    this.editingCategory = null;
    this.categoryForm.reset({ name: '', type, icon: 'pi-tag', colorCode: this.nextColor(this.categories()) });
    this.showCategoryDialog = true;
  }

  editCategory(c: TransactionCategory): void {
    this.editingCategory = c;
    this.categoryForm.reset({ name: c.name, type: c.type, icon: c.icon || 'pi-tag', colorCode: c.colorCode || SWATCHES[0] });
    this.showCategoryDialog = true;
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) return this.categoryForm.markAllAsTouched();
    const v = this.categoryForm.value;
    const editing = this.editingCategory;
    this.submit(
      editing
        ? this.transactionService.updateCategory(editing.id, { name: v.name!, icon: v.icon || undefined, colorCode: v.colorCode || undefined })
        : this.transactionService.createCategory({ name: v.name!, type: v.type!, icon: v.icon || undefined, colorCode: v.colorCode || undefined }),
      editing ? 'Category updated' : 'Category created',
      () => { this.showCategoryDialog = false; this.loadCategories(); },
    );
  }

  deleteCategory(c: TransactionCategory): void {
    confirmDelete(this.confirmationService, {
      header: 'Delete category?',
      message: `“${c.name}” will be removed. Categories that still have transactions can't be deleted.`,
      accept: () => this.submit(this.transactionService.deleteCategory(c.id), 'Category deleted', () => this.loadCategories()),
    });
  }

  // ---------- Shared ----------
  private submit(request: Observable<ApiResponse<unknown>>, success: string, done: () => void): void {
    this.isSaving.set(true);
    request.subscribe({
      next: () => {
        this.isSaving.set(false);
        done();
        this.messageService.add({ severity: 'success', summary: success });
      },
      error: err => {
        this.isSaving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Something went wrong', detail: err.error?.message || 'Try again in a moment.' });
      },
    });
  }

  /** First palette color not used yet, so new items are distinguishable by default. */
  private nextColor(items: { colorCode?: string }[] | null): string {
    const used = new Set((items ?? []).map(i => i.colorCode?.toLowerCase()));
    return SWATCHES.find(c => !used.has(c)) ?? SWATCHES[0];
  }
}
