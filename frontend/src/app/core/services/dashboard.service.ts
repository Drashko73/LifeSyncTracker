import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  DashboardStats, 
  TimeDistribution, 
  MonthlyFlow, 
  DailyProductivity,
  ApiResponse 
} from '../models';

/**
 * Service for dashboard and analytics operations.
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  /**
   * Gets comprehensive dashboard statistics.
   */
  getStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(this.apiUrl);
  }

  /**
   * Gets time distribution by project for a period.
   */
  getTimeDistribution(startDate: Date, endDate: Date): Observable<ApiResponse<TimeDistribution[]>> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());
    
    return this.http.get<ApiResponse<TimeDistribution[]>>(`${this.apiUrl}/time-distribution`, { params });
  }

  /**
   * Gets monthly financial flow data.
   */
  getMonthlyFlow(months = 12): Observable<ApiResponse<MonthlyFlow[]>> {
    const params = new HttpParams().set('months', months.toString());
    return this.http.get<ApiResponse<MonthlyFlow[]>>(`${this.apiUrl}/monthly-flow`, { params });
  }

  /**
   * Gets productivity heatmap data for a year.
   */
  getProductivityHeatmap(year?: number): Observable<ApiResponse<DailyProductivity[]>> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    return this.http.get<ApiResponse<DailyProductivity[]>>(`${this.apiUrl}/productivity-heatmap`, { params });
  }
}
