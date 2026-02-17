import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
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
  templateUrl: './time-tracking.component.html'
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
  showPdfDialog = false;
  editingEntry: TimeEntry | null = null;
  isMobile = window.innerWidth < 768;

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth < 768;
  }

  // PDF report fields
  pdfProjectId: number | null = null;
  pdfYear: number = new Date().getFullYear();
  pdfMonth: number = new Date().getMonth() + 1;
  isDownloadingPdf = false;

  pdfYearOptions = Array.from({ length: 6 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return { label: y.toString(), value: y };
  });

  pdfMonthOptions = [
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 }
  ];

  filterPeriod: number = 6;
  filterProjectId: number | null = null;
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;

  totalRecords: number = 0;
  currentPage: number = 1;
  first: number = 0;
  last: number = 0;
  rows: number = 10;

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
    this.first = 0;
    this.currentPage = 1;
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
      page: this.currentPage,
      pageSize: this.rows
    };

    this.timeEntryService.getAll(filter).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.timeEntries.set(response.data.items);
          this.totalRecords = response.data.totalCount;
          this.currentPage = response.data.page;
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
    this.first = 0;
    this.currentPage = 1;
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

  showPdfReportDialog(): void {
    this.pdfProjectId = null;
    this.pdfYear = new Date().getFullYear();
    this.pdfMonth = new Date().getMonth() + 1;
    this.showPdfDialog = true;
  }

  downloadPdfReport(): void {
    if (!this.pdfProjectId) return;
    this.isDownloadingPdf = true;

    this.timeEntryService.downloadPdfReport(this.pdfProjectId, this.pdfYear, this.pdfMonth).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${this.pdfYear}_${this.pdfMonth}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.isDownloadingPdf = false;
        this.showPdfDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'PDF report downloaded'
        });
      },
      error: () => {
        this.isDownloadingPdf = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to download PDF report'
        });
      }
    });
  }

  pageChange(event: any): void {
    const newPage = Math.floor(event.first / event.rows) + 1;
    const rowsChanged = event.rows !== this.rows;

    if (!rowsChanged && newPage === this.currentPage && event.first === this.first) return;

    this.currentPage = rowsChanged ? 1 : newPage;
    this.first = rowsChanged ? 0 : event.first;
    this.rows = event.rows;
    this.loadTimeEntries();
  }
}
