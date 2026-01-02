import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Project, 
  CreateProjectDto, 
  UpdateProjectDto, 
  ApiResponse 
} from '../models';

/**
 * Service for project management operations.
 */
@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly apiUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  /**
   * Gets all projects for the current user.
   * @param includeInactive Whether to include inactive projects.
   * @returns Observable with list of projects.
   */
  getAll(includeInactive = false): Observable<ApiResponse<Project[]>> {
    const params = new HttpParams().set('includeInactive', includeInactive.toString());
    return this.http.get<ApiResponse<Project[]>>(this.apiUrl, { params });
  }

  /**
   * Gets a project by ID.
   * @param id Project ID.
   * @returns Observable with project data.
   */
  getById(id: number): Observable<ApiResponse<Project>> {
    return this.http.get<ApiResponse<Project>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Creates a new project.
   * @param dto Project data.
   * @returns Observable with created project.
   */
  create(dto: CreateProjectDto): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(this.apiUrl, dto);
  }

  /**
   * Updates a project.
   * @param id Project ID.
   * @param dto Updated project data.
   * @returns Observable with updated project.
   */
  update(id: number, dto: UpdateProjectDto): Observable<ApiResponse<Project>> {
    return this.http.put<ApiResponse<Project>>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Deletes a project.
   * @param id Project ID.
   * @returns Observable with success status.
   */
  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }
}
