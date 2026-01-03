import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { MultiSelect } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TimeEntryService } from '../../core/services/time-entry.service';
import { ProjectService } from '../../core/services/project.service';
import { TagService } from '../../core/services/tag.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { TimeEntry, Project, Tag, TimeEntryFilterDto, ApiResponse } from '../../core/models';

/**
 * Time tracking component for managing timers and time entries.
 */
@Component({
  selector: 'app-time-tracking',
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
    Textarea,
    Select,
    DatePicker,
    MultiSelect,
    ToastModule,
    ConfirmDialog,
    ProgressSpinnerModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="p-4 md:p-6 bg-gray-50 min-h-screen">
      <p-toast></p-toast>
      <p-confirmdialog></p-confirmdialog>

      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-800">Time Tracking</h1>
          <p class="text-gray-500">Track your work sessions and manage time entries</p>
        </div>
        <div class="mt-4 md:mt-0">
          <p-button 
            label="Add Manual Entry" 
            icon="pi pi-plus" 
            (onClick)="showManualEntryDialog()"
          ></p-button>
        </div>
      </div>

      <!-- Timer Card -->
      <p-card class="mb-6" [class]="timeEntryService.isTimerRunning() ? 'ring-2 ring-blue-500' : ''">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="mb-4 md:mb-0">
            <h2 class="text-lg font-semibold text-gray-800 mb-2">Timer</h2>
            @if (timeEntryService.isTimerRunning()) {
              <p class="text-gray-500">
                Project: {{ timeEntryService.runningTimer()?.project?.name || 'No project selected' }}
              </p>
            }
          </div>
          
          <div class="flex items-center space-x-4">
            <span class="timer-display text-4xl font-mono" [class.text-blue-600]="timeEntryService.isTimerRunning()">
              {{ timeEntryService.formatElapsedTime(timeEntryService.elapsedSeconds()) }}
            </span>
            
            @if (!timeEntryService.isTimerRunning()) {
              <p-button 
                label="Start" 
                icon="pi pi-play" 
                severity="success" 
                size="large"
                (onClick)="startTimer()"
              ></p-button>
            } @else {
              <p-button 
                label="Stop" 
                icon="pi pi-stop" 
                severity="danger" 
                size="large"
                (onClick)="showStopTimerDialog()"
              ></p-button>
            }
          </div>
        </div>
      </p-card>

      <!-- Filters -->
      <p-card class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
            <p-select 
              [options]="userPreferencesService.getFilterPeriodOptions()" 
              [(ngModel)]="filterPeriod" 
              optionLabel="label" 
              optionValue="value"
              styleClass="w-full"
              (onChange)="onFilterPeriodChange()"
            ></p-select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <p-select 
              [options]="projects()" 
              [(ngModel)]="filterProjectId" 
              optionLabel="name" 
              optionValue="id"
              placeholder="All Projects"
              [showClear]="true"
              styleClass="w-full"
              (onChange)="loadTimeEntries()"
            ></p-select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <p-datepicker 
              [(ngModel)]="filterStartDate" 
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              styleClass="w-full"
              (onSelect)="loadTimeEntries()"
            ></p-datepicker>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <p-datepicker 
              [(ngModel)]="filterEndDate" 
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              styleClass="w-full"
              (onSelect)="loadTimeEntries()"
            ></p-datepicker>
          </div>
          <div class="flex items-end">
            <p-button label="Clear Filters" icon="pi pi-times" severity="secondary" (onClick)="clearFilters()"></p-button>
          </div>
        </div>
      </p-card>

      <!-- Time Entries Table -->
      <p-card>
        <ng-template pTemplate="header">
          <div class="p-4 border-b">
            <h2 class="text-lg font-semibold text-gray-800">Time Entries</h2>
          </div>
        </ng-template>
        
        @if (isLoading()) {
          <div class="flex justify-center items-center h-32">
            <p-progressSpinner></p-progressSpinner>
          </div>
        } @else {
          <p-table 
            [value]="timeEntries()" 
            [paginator]="true" 
            [rows]="10"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
            styleClass="p-datatable-sm"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Date</th>
                <th>Project</th>
                <th>Duration</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-entry>
              <tr>
                <td>{{ formatDateTime(entry.startTime) }}</td>
                <td>
                  @if (entry.project) {
                    <span 
                      class="px-2 py-1 rounded text-sm"
                      [style.backgroundColor]="entry.project.colorCode || '#e5e7eb'"
                      [style.color]="getContrastColor(entry.project.colorCode)"
                    >
                      {{ entry.project.name }}
                    </span>
                  } @else {
                    <span class="text-gray-400">No project</span>
                  }
                </td>
                <td>{{ formatDuration(entry.durationMinutes) }}</td>
                <td class="max-w-xs truncate">{{ entry.description || '-' }}</td>
                <td>
                  <div class="flex gap-2">
                    <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" (onClick)="editTimeEntry(entry)"></p-button>
                    <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="confirmDelete(entry)"></p-button>
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="5" class="text-center py-8 text-gray-500">
                  No time entries found. Start tracking your time!
                </td>
              </tr>
            </ng-template>
          </p-table>
        }
      </p-card>

      <!-- Stop Timer Dialog -->
      <p-dialog 
        header="Stop Timer" 
        [(visible)]="showStopDialog" 
        [modal]="true" 
        [style]="{width: '500px'}"
        [closable]="true"
      >
        <form [formGroup]="stopTimerForm">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <p-select 
              [options]="projects()" 
              formControlName="projectId" 
              optionLabel="name" 
              optionValue="id"
              placeholder="Select a project"
              [showClear]="true"
              styleClass="w-full"
            ></p-select>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">What have I done?</label>
            <textarea 
              pTextarea 
              formControlName="description" 
              rows="3" 
              class="w-full"
              placeholder="Describe what you worked on..."
            ></textarea>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">What should be done next?</label>
            <textarea 
              pTextarea 
              formControlName="nextSteps" 
              rows="3" 
              class="w-full"
              placeholder="Handover notes for next session..."
            ></textarea>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <p-multiselect 
              [options]="tags()" 
              formControlName="tagIds" 
              optionLabel="name" 
              optionValue="id"
              placeholder="Select tags"
              styleClass="w-full"
            ></p-multiselect>
          </div>
        </form>
        <ng-template pTemplate="footer">
          <p-button label="Cancel" icon="pi pi-times" [text]="true" (onClick)="showStopDialog = false"></p-button>
          <p-button label="Save & Stop" icon="pi pi-check" (onClick)="stopTimer()"></p-button>
        </ng-template>
      </p-dialog>

      <!-- Manual Entry Dialog -->
      <p-dialog 
        [header]="editingEntry ? 'Edit Time Entry' : 'Add Manual Entry'" 
        [(visible)]="showManualDialog" 
        [modal]="true" 
        [style]="{width: '500px'}"
        [closable]="true"
      >
        <form [formGroup]="manualEntryForm">
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <p-datepicker 
                formControlName="startTime" 
                [showTime]="true" 
                [showIcon]="true"
                dateFormat="yy-mm-dd"
                styleClass="w-full"
              ></p-datepicker>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <p-datepicker 
                formControlName="endTime" 
                [showTime]="true" 
                [showIcon]="true"
                dateFormat="yy-mm-dd"
                styleClass="w-full"
              ></p-datepicker>
            </div>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <p-select 
              [options]="projects()" 
              formControlName="projectId" 
              optionLabel="name" 
              optionValue="id"
              placeholder="Select a project"
              [showClear]="true"
              styleClass="w-full"
            ></p-select>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              pTextarea 
              formControlName="description" 
              rows="3" 
              class="w-full"
              placeholder="What did you work on?"
            ></textarea>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Next Steps</label>
            <textarea 
              pTextarea 
              formControlName="nextSteps" 
              rows="3" 
              class="w-full"
              placeholder="Handover notes..."
            ></textarea>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <p-multiselect 
              [options]="tags()" 
              formControlName="tagIds" 
              optionLabel="name" 
              optionValue="id"
              placeholder="Select tags"
              styleClass="w-full"
            ></p-multiselect>
          </div>
        </form>
        <ng-template pTemplate="footer">
          <p-button label="Cancel" icon="pi pi-times" [text]="true" (onClick)="showManualDialog = false"></p-button>
          <p-button [label]="editingEntry ? 'Update' : 'Save'" icon="pi pi-check" (onClick)="saveManualEntry()"></p-button>
        </ng-template>
      </p-dialog>
    </div>
  `
})
export class TimeTrackingComponent implements OnInit {
  protected timeEntryService = inject(TimeEntryService);
  private projectService = inject(ProjectService);
  private tagService = inject(TagService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  protected userPreferencesService = inject(UserPreferencesService);

  isLoading = signal(true);
  timeEntries = signal<TimeEntry[]>([]);
  projects = signal<Project[]>([]);
  tags = signal<Tag[]>([]);

  showStopDialog = false;
  showManualDialog = false;
  editingEntry: TimeEntry | null = null;

  filterPeriod: number = 6;
  filterProjectId: number | null = null;
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;

  stopTimerForm = this.fb.group({
    projectId: [null as number | null],
    description: [''],
    nextSteps: [''],
    tagIds: [[] as number[]]
  });

  manualEntryForm = this.fb.group({
    startTime: [new Date(), Validators.required],
    endTime: [new Date(), Validators.required],
    projectId: [null as number | null],
    description: [''],
    nextSteps: [''],
    tagIds: [[] as number[]]
  });

  ngOnInit(): void {
    // Initialize from user preferences
    this.filterPeriod = this.userPreferencesService.defaultFilterMonths();
    this.applyFilterPeriod();
    
    this.loadProjects();
    this.loadTags();
    this.loadTimeEntries();
  }

  onFilterPeriodChange(): void {
    this.applyFilterPeriod();
    this.loadTimeEntries();
  }

  private applyFilterPeriod(): void {
    const { startDate, endDate } = this.userPreferencesService.getDateRangeForPeriod(this.filterPeriod);
    this.filterStartDate = startDate;
    this.filterEndDate = endDate;
  }

  private loadProjects(): void {
    this.projectService.getAll().subscribe({
      next: (response: ApiResponse<Project[]>) => {
        if (response.success && response.data) {
          this.projects.set(response.data);
        }
      }
    });
  }

  private loadTags(): void {
    this.tagService.getAll().subscribe({
      next: (response: ApiResponse<Tag[]>) => {
        if (response.success && response.data) {
          this.tags.set(response.data);
        }
      }
    });
  }

  loadTimeEntries(): void {
    this.isLoading.set(true);
    const filter: TimeEntryFilterDto = {
      projectId: this.filterProjectId || undefined,
      startDate: this.filterStartDate || undefined,
      endDate: this.filterEndDate || undefined,
      page: 1,
      pageSize: 100
    };

    this.timeEntryService.getAll(filter).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.timeEntries.set(response.data.items);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load time entries'
        });
      }
    });
  }

  clearFilters(): void {
    this.filterPeriod = this.userPreferencesService.defaultFilterMonths();
    this.filterProjectId = null;
    this.applyFilterPeriod();
    this.loadTimeEntries();
  }

  startTimer(): void {
    this.timeEntryService.startTimer({}).subscribe({
      next: (response: ApiResponse<TimeEntry>) => {
        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Timer Started',
            detail: 'Your timer is now running'
          });
        }
      },
      error: (error: { error?: { message?: string } }) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Failed to start timer'
        });
      }
    });
  }

  showStopTimerDialog(): void {
    const runningTimer = this.timeEntryService.runningTimer();
    if (runningTimer) {
      this.stopTimerForm.patchValue({
        projectId: runningTimer.project?.id || null,
        description: '',
        nextSteps: '',
        tagIds: []
      });
    }
    this.showStopDialog = true;
  }

  stopTimer(): void {
    const formValue = this.stopTimerForm.value;
    this.timeEntryService.stopTimer({
      projectId: formValue.projectId || undefined,
      description: formValue.description || undefined,
      nextSteps: formValue.nextSteps || undefined,
      tagIds: formValue.tagIds || []
    }).subscribe({
      next: (response: ApiResponse<TimeEntry>) => {
        if (response.success) {
          this.showStopDialog = false;
          this.loadTimeEntries();
          this.messageService.add({
            severity: 'success',
            summary: 'Timer Stopped',
            detail: 'Time entry saved successfully'
          });
        }
      },
      error: (error: { error?: { message?: string } }) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Failed to stop timer'
        });
      }
    });
  }

  showManualEntryDialog(): void {
    this.editingEntry = null;
    this.manualEntryForm.reset({
      startTime: new Date(),
      endTime: new Date(),
      projectId: null,
      description: '',
      nextSteps: '',
      tagIds: []
    });
    this.showManualDialog = true;
  }

  editTimeEntry(entry: TimeEntry): void {
    this.editingEntry = entry;
    this.manualEntryForm.patchValue({
      startTime: new Date(entry.startTime),
      endTime: entry.endTime ? new Date(entry.endTime) : new Date(),
      projectId: entry.project?.id || null,
      description: entry.description || '',
      nextSteps: entry.nextSteps || '',
      tagIds: entry.tags.map(t => t.id)
    });
    this.showManualDialog = true;
  }

  saveManualEntry(): void {
    if (this.manualEntryForm.invalid) return;

    const formValue = this.manualEntryForm.value;

    if (this.editingEntry) {
      this.timeEntryService.update(this.editingEntry.id, {
        startTime: formValue.startTime!,
        endTime: formValue.endTime!,
        projectId: formValue.projectId || undefined,
        description: formValue.description || undefined,
        nextSteps: formValue.nextSteps || undefined,
        tagIds: formValue.tagIds || undefined
      }).subscribe({
        next: (response: ApiResponse<TimeEntry>) => {
          if (response.success) {
            this.showManualDialog = false;
            this.loadTimeEntries();
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Time entry updated'
            });
          }
        },
        error: (error: { error?: { message?: string } }) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to update time entry'
          });
        }
      });
    } else {
      this.timeEntryService.createManualEntry({
        startTime: formValue.startTime!,
        endTime: formValue.endTime!,
        projectId: formValue.projectId || undefined,
        description: formValue.description || undefined,
        nextSteps: formValue.nextSteps || undefined,
        tagIds: formValue.tagIds || []
      }).subscribe({
        next: (response: ApiResponse<TimeEntry>) => {
          if (response.success) {
            this.showManualDialog = false;
            this.loadTimeEntries();
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Time entry created'
            });
          }
        },
        error: (error: { error?: { message?: string } }) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to create time entry'
          });
        }
      });
    }
  }

  confirmDelete(entry: TimeEntry): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this time entry?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteTimeEntry(entry.id);
      }
    });
  }

  private deleteTimeEntry(id: number): void {
    this.timeEntryService.delete(id).subscribe({
      next: (response: ApiResponse<boolean>) => {
        if (response.success) {
          this.loadTimeEntries();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Time entry deleted'
          });
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete time entry'
        });
      }
    });
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString();
  }

  formatDuration(minutes: number | undefined): string {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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
