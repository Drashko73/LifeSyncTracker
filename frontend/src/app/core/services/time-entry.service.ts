import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, interval, Subscription, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  TimeEntry, 
  StartTimerDto, 
  StopTimerDto, 
  CreateTimeEntryDto, 
  UpdateTimeEntryDto,
  TimeEntryFilterDto,
  EmployerReport,
  PaginatedResponse,
  ApiResponse 
} from '../models';
import { toLocalISOString } from '../utils/date-utils';

/**
 * Service for time tracking operations.
 * Manages timer state using Angular Signals.
 */
@Injectable({
  providedIn: 'root'
})
export class TimeEntryService {
  private readonly apiUrl = `${environment.apiUrl}/timeentries`;
  
  /** Signal for currently running timer */
  private runningTimerSignal = signal<TimeEntry | null>(null);
  
  /** Signal for elapsed seconds (for live display) */
  private elapsedSecondsSignal = signal<number>(0);
  
  /** Subscription for the timer interval */
  private timerSubscription?: Subscription;

  /** Computed signal to get running timer */
  readonly runningTimer = computed(() => this.runningTimerSignal());
  
  /** Computed signal to get elapsed time in seconds */
  readonly elapsedSeconds = computed(() => this.elapsedSecondsSignal());
  
  /** Computed signal to check if timer is running */
  readonly isTimerRunning = computed(() => !!this.runningTimerSignal());

  constructor(private http: HttpClient) {
    this.checkRunningTimer();
  }

  /**
   * Checks for an existing running timer on service initialization.
   */
  private checkRunningTimer(): void {
    this.getRunningTimer().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.runningTimerSignal.set(response.data);
          this.startTimerDisplay(new Date(response.data.startTime));
        }
      }
    });
  }

  /**
   * Starts the timer display interval.
   */
  private startTimerDisplay(startTime: Date): void {
    this.stopTimerDisplay();
    this.updateElapsedSeconds(startTime);
    this.timerSubscription = interval(1000).subscribe(() => {
      this.updateElapsedSeconds(startTime);
    });
  }

  /**
   * Stops the timer display interval.
   */
  private stopTimerDisplay(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
    this.elapsedSecondsSignal.set(0);
  }

  /**
   * Updates the elapsed seconds signal.
   */
  private updateElapsedSeconds(startTime: Date): void {
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - new Date(startTime).getTime()) / 1000);
    this.elapsedSecondsSignal.set(elapsed);
  }

  /**
   * Formats seconds into HH:MM:SS format.
   */
  formatElapsedTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Gets time entries with filtering and pagination.
   */
  getAll(filter: TimeEntryFilterDto): Observable<ApiResponse<PaginatedResponse<TimeEntry>>> {
    let params = new HttpParams();
    if (filter.projectId) params = params.set('projectId', filter.projectId.toString());
    if (filter.startDate) params = params.set('startDate', filter.startDate.toISOString());
    if (filter.endDate) params = params.set('endDate', filter.endDate.toISOString());
    if (filter.page) params = params.set('page', filter.page.toString());
    if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());
    
    return this.http.get<ApiResponse<PaginatedResponse<TimeEntry>>>(this.apiUrl, { params });
  }

  /**
   * Gets a time entry by ID.
   */
  getById(id: number): Observable<ApiResponse<TimeEntry>> {
    return this.http.get<ApiResponse<TimeEntry>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Gets the currently running timer.
   */
  getRunningTimer(): Observable<ApiResponse<TimeEntry | null>> {
    return this.http.get<ApiResponse<TimeEntry | null>>(`${this.apiUrl}/running`);
  }

  /**
   * Starts a new timer.
   */
  startTimer(dto: StartTimerDto): Observable<ApiResponse<TimeEntry>> {
    return this.http.post<ApiResponse<TimeEntry>>(`${this.apiUrl}/start`, dto).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.runningTimerSignal.set(response.data);
          this.startTimerDisplay(new Date(response.data.startTime));
        }
      })
    );
  }

  /**
   * Stops the running timer.
   */
  stopTimer(dto: StopTimerDto): Observable<ApiResponse<TimeEntry>> {
    return this.http.post<ApiResponse<TimeEntry>>(`${this.apiUrl}/stop`, dto).pipe(
      tap(response => {
        if (response.success) {
          this.runningTimerSignal.set(null);
          this.stopTimerDisplay();
        }
      })
    );
  }

  /**
   * Creates a manual time entry.
   * Converts dates to local ISO format to preserve user's intended time.
   */
  createManualEntry(dto: CreateTimeEntryDto): Observable<ApiResponse<TimeEntry>> {
    const payload = {
      ...dto,
      startTime: toLocalISOString(dto.startTime),
      endTime: toLocalISOString(dto.endTime)
    };
    return this.http.post<ApiResponse<TimeEntry>>(this.apiUrl, payload);
  }

  /**
   * Updates a time entry.
   * Converts dates to local ISO format to preserve user's intended time.
   */
  update(id: number, dto: UpdateTimeEntryDto): Observable<ApiResponse<TimeEntry>> {
    const payload = {
      ...dto,
      startTime: dto.startTime ? toLocalISOString(dto.startTime) : undefined,
      endTime: dto.endTime ? toLocalISOString(dto.endTime) : undefined
    };
    return this.http.put<ApiResponse<TimeEntry>>(`${this.apiUrl}/${id}`, payload);
  }

  /**
   * Deletes a time entry.
   */
  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Gets employer report for a project and month.
   */
  getEmployerReport(projectId: number, year: number, month: number): Observable<ApiResponse<EmployerReport>> {
    const params = new HttpParams()
      .set('projectId', projectId.toString())
      .set('year', year.toString())
      .set('month', month.toString());
    
    return this.http.get<ApiResponse<EmployerReport>>(`${this.apiUrl}/report`, { params });
  }

  /**
   * Downloads a PDF report for a project and month.
   */
  downloadPdfReport(projectId: number, year: number, month: number): Observable<Blob> {
    const params = new HttpParams()
      .set('projectId', projectId.toString())
      .set('year', year.toString())
      .set('month', month.toString());

    return this.http.get(`${this.apiUrl}/report/pdf`, {
      params,
      responseType: 'blob'
    });
  }
}
