import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
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
  ApiResponse,
} from '../../core/models';

/**
 * Settings component for managing projects, tags, and transaction categories.
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
  template: `
    <div class="p-4 md:p-6 bg-gray-50 min-h-screen">
      <p-toast></p-toast>
      <p-confirmdialog></p-confirmdialog>

      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800">Settings</h1>
        <p class="text-gray-500">Manage your projects, tags, and categories</p>
      </div>

      <!-- Tabs -->
      <p-tabs value="0">
        <p-tablist>
          <p-tab value="0">
            <i class="pi pi-folder mr-2"></i> Projects
          </p-tab>
          <p-tab value="1">
            <i class="pi pi-tag mr-2"></i> Tags
          </p-tab>
          <p-tab value="2">
            <i class="pi pi-list mr-2"></i> Categories
          </p-tab>
        </p-tablist>

        <p-tabpanels>
          <!-- Projects Tab -->
          <p-tabpanel value="0">
            <p-card>
              <ng-template pTemplate="header">
                <div class="p-4 border-b flex justify-between items-center">
                  <h2 class="text-lg font-semibold text-gray-800">Projects</h2>
                  <p-button
                    label="Add Project"
                    icon="pi pi-plus"
                    size="small"
                    (onClick)="showAddProjectDialog()"
                  ></p-button>
                </div>
              </ng-template>

              @if (isLoadingProjects()) {
              <div class="flex justify-center items-center h-32">
                <p-progressSpinner></p-progressSpinner>
              </div>
              } @else {
              <p-table
                [value]="projects()"
                [paginator]="true"
                [rows]="10"
                styleClass="p-datatable-sm"
              >
                <ng-template pTemplate="header">
                  <tr>
                    <th>Name</th>
                    <th>Color</th>
                    <th>Hourly Rate</th>
                    <th>Auto Income</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-project>
                  <tr>
                    <td class="font-medium">{{ project.name }}</td>
                    <td>
                      <div
                        class="w-6 h-6 rounded"
                        [style.backgroundColor]="project.colorCode || '#e5e7eb'"
                      ></div>
                    </td>
                    <td>{{ project.hourlyRate ? '$' + project.hourlyRate : '-' }}</td>
                    <td>
                      <span
                        class="px-2 py-1 rounded text-xs"
                        [class]="
                          project.autoCreateIncome
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        "
                      >
                        {{ project.autoCreateIncome ? 'Yes' : 'No' }}
                      </span>
                    </td>
                    <td>
                      <span
                        class="px-2 py-1 rounded text-xs"
                        [class]="
                          project.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        "
                      >
                        {{ project.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>
                      <div class="flex gap-2">
                        <p-button
                          icon="pi pi-pencil"
                          [rounded]="true"
                          [text]="true"
                          (onClick)="editProject(project)"
                        ></p-button>
                        <p-button
                          icon="pi pi-trash"
                          [rounded]="true"
                          [text]="true"
                          severity="danger"
                          (onClick)="confirmDeleteProject(project)"
                        ></p-button>
                      </div>
                    </td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="6" class="text-center py-8 text-gray-500">
                      No projects found. Create your first project!
                    </td>
                  </tr>
                </ng-template>
              </p-table>
              }
            </p-card>
          </p-tabpanel>

          <!-- Tags Tab -->
          <p-tabpanel value="1">
            <p-card>
              <ng-template pTemplate="header">
                <div class="p-4 border-b flex justify-between items-center">
                  <h2 class="text-lg font-semibold text-gray-800">Tags</h2>
                  <p-button
                    label="Add Tag"
                    icon="pi pi-plus"
                    size="small"
                    (onClick)="showAddTagDialog()"
                  ></p-button>
                </div>
              </ng-template>

              @if (isLoadingTags()) {
              <div class="flex justify-center items-center h-32">
                <p-progressSpinner></p-progressSpinner>
              </div>
              } @else {
              <p-table [value]="tags()" [paginator]="true" [rows]="10" styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Name</th>
                    <th>Color</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-tag>
                  <tr>
                    <td>
                      <span
                        class="px-2 py-1 rounded text-sm"
                        [style.backgroundColor]="tag.colorCode || '#e5e7eb'"
                        [style.color]="getContrastColor(tag.colorCode)"
                      >
                        {{ tag.name }}
                      </span>
                    </td>
                    <td>
                      <div
                        class="w-6 h-6 rounded"
                        [style.backgroundColor]="tag.colorCode || '#e5e7eb'"
                      ></div>
                    </td>
                    <td>{{ formatDate(tag.createdAt) }}</td>
                    <td>
                      <div class="flex gap-2">
                        <p-button
                          icon="pi pi-pencil"
                          [rounded]="true"
                          [text]="true"
                          (onClick)="editTag(tag)"
                        ></p-button>
                        <p-button
                          icon="pi pi-trash"
                          [rounded]="true"
                          [text]="true"
                          severity="danger"
                          (onClick)="confirmDeleteTag(tag)"
                        ></p-button>
                      </div>
                    </td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="4" class="text-center py-8 text-gray-500">
                      No tags found. Create your first tag!
                    </td>
                  </tr>
                </ng-template>
              </p-table>
              }
            </p-card>
          </p-tabpanel>

          <!-- Categories Tab -->
          <p-tabpanel value="2">
            <p-card>
              <ng-template pTemplate="header">
                <div class="p-4 border-b flex justify-between items-center">
                  <h2 class="text-lg font-semibold text-gray-800">Transaction Categories</h2>
                  <p-button
                    label="Add Category"
                    icon="pi pi-plus"
                    size="small"
                    (onClick)="showAddCategoryDialog()"
                  ></p-button>
                </div>
              </ng-template>

              @if (isLoadingCategories()) {
              <div class="flex justify-center items-center h-32">
                <p-progressSpinner></p-progressSpinner>
              </div>
              } @else {
              <p-table
                [value]="categories()"
                [paginator]="true"
                [rows]="10"
                styleClass="p-datatable-sm"
              >
                <ng-template pTemplate="header">
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Color</th>
                    <th>System</th>
                    <th>Actions</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-category>
                  <tr>
                    <td>
                      <span class="flex items-center">
                        <i [class]="category.icon + ' mr-2'" *ngIf="category.icon"></i>
                        {{ category.name }}
                      </span>
                    </td>
                    <td>
                      <span
                        class="px-2 py-1 rounded text-xs"
                        [class]="
                          category.type === 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        "
                      >
                        {{ category.type === 0 ? 'Income' : 'Expense' }}
                      </span>
                    </td>
                    <td>
                      <div
                        class="w-6 h-6 rounded"
                        [style.backgroundColor]="category.colorCode || '#e5e7eb'"
                      ></div>
                    </td>
                    <td>
                      <span
                        class="px-2 py-1 rounded text-xs"
                        [class]="
                          category.isSystem
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        "
                      >
                        {{ category.isSystem ? 'System' : 'Custom' }}
                      </span>
                    </td>
                    <td>
                      @if (!category.isSystem) {
                      <div class="flex gap-2">
                        <p-button
                          icon="pi pi-pencil"
                          [rounded]="true"
                          [text]="true"
                          (onClick)="editCategory(category)"
                        ></p-button>
                        <p-button
                          icon="pi pi-trash"
                          [rounded]="true"
                          [text]="true"
                          severity="danger"
                          (onClick)="confirmDeleteCategory(category)"
                        ></p-button>
                      </div>
                      } @else {
                      <span class="text-gray-400 text-sm">Protected</span>
                      }
                    </td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="5" class="text-center py-8 text-gray-500">
                      No categories found. Create your first category!
                    </td>
                  </tr>
                </ng-template>
              </p-table>
              }
            </p-card>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>

      <!-- Project Dialog -->
      <p-dialog
        [header]="editingProject ? 'Edit Project' : 'Add Project'"
        [(visible)]="showProjectDialog"
        [modal]="true"
        [style]="{ width: '450px' }"
        [closable]="true"
      >
        <form [formGroup]="projectForm">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input pInputText formControlName="name" class="w-full" placeholder="Project name" />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              pInputText
              formControlName="description"
              class="w-full"
              placeholder="Project description"
            />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <p-colorpicker formControlName="colorCode"></p-colorpicker>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Hourly Rate</label>
            <p-inputnumber
              formControlName="hourlyRate"
              mode="currency"
              currency="USD"
              [min]="0"
              styleClass="w-full"
            ></p-inputnumber>
          </div>
          <div class="mb-4">
            <p-checkbox
              formControlName="autoCreateIncome"
              [binary]="true"
              label="Auto-create income transactions"
            ></p-checkbox>
          </div>
          @if (editingProject) {
          <div class="mb-4">
            <p-checkbox formControlName="isActive" [binary]="true" label="Active"></p-checkbox>
          </div>
          }
        </form>
        <ng-template pTemplate="footer">
          <p-button
            label="Cancel"
            icon="pi pi-times"
            [text]="true"
            (onClick)="showProjectDialog = false"
          ></p-button>
          <p-button
            [label]="editingProject ? 'Update' : 'Save'"
            icon="pi pi-check"
            (onClick)="saveProject()"
            [disabled]="projectForm.invalid"
          ></p-button>
        </ng-template>
      </p-dialog>

      <!-- Tag Dialog -->
      <p-dialog
        [header]="editingTag ? 'Edit Tag' : 'Add Tag'"
        [(visible)]="showTagDialog"
        [modal]="true"
        [style]="{ width: '400px' }"
        [closable]="true"
      >
        <form [formGroup]="tagForm">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input pInputText formControlName="name" class="w-full" placeholder="Tag name" />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <p-colorpicker formControlName="colorCode"></p-colorpicker>
          </div>
        </form>
        <ng-template pTemplate="footer">
          <p-button
            label="Cancel"
            icon="pi pi-times"
            [text]="true"
            (onClick)="showTagDialog = false"
          ></p-button>
          <p-button
            [label]="editingTag ? 'Update' : 'Save'"
            icon="pi pi-check"
            (onClick)="saveTag()"
            [disabled]="tagForm.invalid"
          ></p-button>
        </ng-template>
      </p-dialog>

      <!-- Category Dialog -->
      <p-dialog
        [header]="editingCategory ? 'Edit Category' : 'Add Category'"
        [(visible)]="showCategoryDialog"
        [modal]="true"
        [style]="{ width: '400px' }"
        [closable]="true"
      >
        <form [formGroup]="categoryForm">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              pInputText
              formControlName="name"
              class="w-full"
              placeholder="Category name"
            />
          </div>
          @if (!editingCategory) {
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <p-select
              [options]="categoryTypes"
              formControlName="type"
              optionLabel="label"
              optionValue="value"
              placeholder="Select type"
              styleClass="w-full"
            ></p-select>
          </div>
          }
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Icon (PrimeIcons class)</label>
            <input
              pInputText
              formControlName="icon"
              class="w-full"
              placeholder="e.g., pi pi-shopping-cart"
            />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <p-colorpicker formControlName="colorCode"></p-colorpicker>
          </div>
        </form>
        <ng-template pTemplate="footer">
          <p-button
            label="Cancel"
            icon="pi pi-times"
            [text]="true"
            (onClick)="showCategoryDialog = false"
          ></p-button>
          <p-button
            [label]="editingCategory ? 'Update' : 'Save'"
            icon="pi pi-check"
            (onClick)="saveCategory()"
            [disabled]="categoryForm.invalid"
          ></p-button>
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private tagService = inject(TagService);
  private transactionService = inject(TransactionService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);

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
        autoCreateIncome: formValue.autoCreateIncome ?? undefined,
        isActive: formValue.isActive ?? undefined,
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
