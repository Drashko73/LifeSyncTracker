import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputNumber } from 'primeng/inputnumber';
import { Checkbox } from 'primeng/checkbox';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ProjectService } from '../../core/services/project.service';
import { TagService } from '../../core/services/tag.service';
import { TransactionService } from '../../core/services/transaction.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import {
  Project,
  Tag,
  TransactionCategory,
  CreateProjectDto,
  UpdateProjectDto,
  CreateTagDto,
  UpdateTagDto,
  CreateTransactionCategoryDto,
  UpdateTransactionCategoryDto,
  TransactionType,
  Currency,
  ApiResponse,
} from '../../core/models';

/**
 * Settings component for managing projects, tags, transaction categories, and user preferences.
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TableModule,
    DialogModule,
    InputTextModule,
    Select,
    ColorPickerModule,
    InputNumber,
    Checkbox,
    TabsModule,
    ToastModule,
    ConfirmDialog,
    ProgressSpinnerModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './settings.components.html'
})
export class SettingsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private tagService = inject(TagService);
  private transactionService = inject(TransactionService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  protected userPreferencesService = inject(UserPreferencesService);
  protected themeService = inject(ThemeService);

  // Loading states
  isLoadingProjects = signal(true);
  isLoadingTags = signal(true);
  isLoadingCategories = signal(true);

  // Data
  projects = signal<Project[]>([]);
  tags = signal<Tag[]>([]);
  categories = signal<TransactionCategory[]>([]);

  // Dialog visibility
  showProjectDialog = false;
  showTagDialog = false;
  showCategoryDialog = false;

  // Editing items
  editingProject: Project | null = null;
  editingTag: Tag | null = null;
  editingCategory: TransactionCategory | null = null;

  // Category types for dropdown
  categoryTypes = [
    { label: 'Income', value: TransactionType.Income },
    { label: 'Expense', value: TransactionType.Expense },
  ];

  // Currency options for preferences
  currencyOptions = [
    { label: 'US Dollar ($)', value: Currency.USD },
    { label: 'Euro (€)', value: Currency.EUR },
    { label: 'Serbian Dinar (дин.)', value: Currency.RSD },
  ];

  // Forms
  projectForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    colorCode: ['#3B82F6'],
    hourlyRate: [null as number | null],
    autoCreateIncome: [false],
    isActive: [true],
  });

  tagForm = this.fb.group({
    name: ['', Validators.required],
    colorCode: ['#3B82F6'],
  });

  categoryForm = this.fb.group({
    name: ['', Validators.required],
    type: [TransactionType.Expense],
    icon: [''],
    colorCode: ['#3B82F6'],
  });

  ngOnInit(): void {
    this.loadProjects();
    this.loadTags();
    this.loadCategories();
  }

  // === User Preferences ===

  onThemeChange(theme: ThemeMode): void {
    this.themeService.setThemeMode(theme);
    this.messageService.add({
      severity: 'success',
      summary: 'Saved',
      detail: 'Theme preference updated',
    });
  }

  onCurrencyChange(currency: Currency): void {
    this.userPreferencesService.setCurrency(currency);
    this.messageService.add({
      severity: 'success',
      summary: 'Saved',
      detail: 'Currency preference updated',
    });
  }

  onTimezoneChange(timezone: string): void {
    this.userPreferencesService.setTimezone(timezone);
    this.messageService.add({
      severity: 'success',
      summary: 'Saved',
      detail: 'Timezone preference updated',
    });
  }

  onFilterPeriodChange(months: number): void {
    this.userPreferencesService.setDefaultFilterMonths(months);
    this.messageService.add({
      severity: 'success',
      summary: 'Saved',
      detail: 'Default filter period updated',
    });
  }

  resetPreferences(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to reset all preferences to defaults?',
      header: 'Confirm Reset',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.userPreferencesService.resetPreferences();
        this.messageService.add({
          severity: 'success',
          summary: 'Reset',
          detail: 'Preferences reset to defaults',
        });
      },
    });
  }

  // === Projects ===

  private loadProjects(): void {
    this.isLoadingProjects.set(true);
    this.projectService.getAll(true).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.projects.set(response.data);
        }
        this.isLoadingProjects.set(false);
      },
      error: () => {
        this.isLoadingProjects.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load projects',
        });
      },
    });
  }

  showAddProjectDialog(): void {
    this.editingProject = null;
    this.projectForm.reset({
      name: '',
      description: '',
      colorCode: '#3B82F6',
      hourlyRate: null,
      autoCreateIncome: false,
      isActive: true,
    });
    this.showProjectDialog = true;
  }

  editProject(project: Project): void {
    this.editingProject = project;
    this.projectForm.patchValue({
      name: project.name,
      description: project.description || '',
      colorCode: project.colorCode || '#3B82F6',
      hourlyRate: project.hourlyRate || null,
      autoCreateIncome: project.autoCreateIncome,
      isActive: project.isActive,
    });
    this.showProjectDialog = true;
  }

  saveProject(): void {
    if (this.projectForm.invalid) return;

    const formValue = this.projectForm.value;

    if (this.editingProject) {
      const dto: UpdateProjectDto = {
        name: formValue.name || undefined,
        description: formValue.description || undefined,
        colorCode: formValue.colorCode || undefined,
        hourlyRate: formValue.hourlyRate || undefined,
        autoCreateIncome: formValue.autoCreateIncome === true ? true : formValue.autoCreateIncome === false ? false : undefined,
        isActive: formValue.isActive === true ? true : formValue.isActive === false ? false : undefined,
      };
      this.projectService.update(this.editingProject.id, dto).subscribe({
        next: (response) => {
          if (response.success) {
            this.showProjectDialog = false;
            this.loadProjects();
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Project updated',
            });
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to update project',
          });
        },
      });
    } else {
      const dto: CreateProjectDto = {
        name: formValue.name!,
        description: formValue.description || undefined,
        colorCode: formValue.colorCode || undefined,
        hourlyRate: formValue.hourlyRate || undefined,
        autoCreateIncome: formValue.autoCreateIncome || false,
      };
      this.projectService.create(dto).subscribe({
        next: (response) => {
          if (response.success) {
            this.showProjectDialog = false;
            this.loadProjects();
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Project created',
            });
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to create project',
          });
        },
      });
    }
  }

  confirmDeleteProject(project: Project): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${project.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteProject(project.id);
      },
    });
  }

  private deleteProject(id: number): void {
    this.projectService.delete(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadProjects();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Project deleted',
          });
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete project',
        });
      },
    });
  }

  // === Tags ===

  private loadTags(): void {
    this.isLoadingTags.set(true);
    this.tagService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tags.set(response.data);
        }
        this.isLoadingTags.set(false);
      },
      error: () => {
        this.isLoadingTags.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load tags',
        });
      },
    });
  }

  showAddTagDialog(): void {
    this.editingTag = null;
    this.tagForm.reset({
      name: '',
      colorCode: '#3B82F6',
    });
    this.showTagDialog = true;
  }

  editTag(tag: Tag): void {
    this.editingTag = tag;
    this.tagForm.patchValue({
      name: tag.name,
      colorCode: tag.colorCode || '#3B82F6',
    });
    this.showTagDialog = true;
  }

  saveTag(): void {
    if (this.tagForm.invalid) return;

    const formValue = this.tagForm.value;

    if (this.editingTag) {
      const dto: UpdateTagDto = {
        name: formValue.name || undefined,
        colorCode: formValue.colorCode || undefined,
      };
      this.tagService.update(this.editingTag.id, dto).subscribe({
        next: (response) => {
          if (response.success) {
            this.showTagDialog = false;
            this.loadTags();
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Tag updated',
            });
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to update tag',
          });
        },
      });
    } else {
      const dto: CreateTagDto = {
        name: formValue.name!,
        colorCode: formValue.colorCode || undefined,
      };
      this.tagService.create(dto).subscribe({
        next: (response) => {
          if (response.success) {
            this.showTagDialog = false;
            this.loadTags();
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Tag created',
            });
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to create tag',
          });
        },
      });
    }
  }

  confirmDeleteTag(tag: Tag): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${tag.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteTag(tag.id);
      },
    });
  }

  private deleteTag(id: number): void {
    this.tagService.delete(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadTags();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Tag deleted',
          });
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete tag',
        });
      },
    });
  }

  // === Categories ===

  private loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.transactionService.getCategories().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories.set(response.data);
        }
        this.isLoadingCategories.set(false);
      },
      error: () => {
        this.isLoadingCategories.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load categories',
        });
      },
    });
  }

  showAddCategoryDialog(): void {
    this.editingCategory = null;
    this.categoryForm.reset({
      name: '',
      type: TransactionType.Expense,
      icon: '',
      colorCode: '#3B82F6',
    });
    this.showCategoryDialog = true;
  }

  editCategory(category: TransactionCategory): void {
    this.editingCategory = category;
    this.categoryForm.patchValue({
      name: category.name,
      type: category.type,
      icon: category.icon || '',
      colorCode: category.colorCode || '#3B82F6',
    });
    this.showCategoryDialog = true;
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) return;

    const formValue = this.categoryForm.value;

    if (this.editingCategory) {
      const dto: UpdateTransactionCategoryDto = {
        name: formValue.name || undefined,
        icon: formValue.icon || undefined,
        colorCode: formValue.colorCode || undefined,
      };
      this.transactionService.updateCategory(this.editingCategory.id, dto).subscribe({
        next: (response) => {
          if (response.success) {
            this.showCategoryDialog = false;
            this.loadCategories();
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Category updated',
            });
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to update category',
          });
        },
      });
    } else {
      const dto: CreateTransactionCategoryDto = {
        name: formValue.name!,
        type: formValue.type!,
        icon: formValue.icon || undefined,
        colorCode: formValue.colorCode || undefined,
      };
      this.transactionService.createCategory(dto).subscribe({
        next: (response) => {
          if (response.success) {
            this.showCategoryDialog = false;
            this.loadCategories();
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Category created',
            });
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to create category',
          });
        },
      });
    }
  }

  confirmDeleteCategory(category: TransactionCategory): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${category.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteCategory(category.id);
      },
    });
  }

  private deleteCategory(id: number): void {
    this.transactionService.deleteCategory(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadCategories();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Category deleted',
          });
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Failed to delete category',
        });
      },
    });
  }

  // === Utilities ===

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  getContrastColor(hexColor: string | undefined): string {
    if (!hexColor) return '#000000';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }
}
