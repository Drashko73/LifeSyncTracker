import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Tag, 
  CreateTagDto, 
  UpdateTagDto, 
  ApiResponse 
} from '../models';

/**
 * Service for tag management operations.
 */
@Injectable({
  providedIn: 'root'
})
export class TagService {
  private readonly apiUrl = `${environment.apiUrl}/tags`;

  constructor(private http: HttpClient) {}

  /**
   * Gets all tags for the current user.
   * @returns Observable with list of tags.
   */
  getAll(): Observable<ApiResponse<Tag[]>> {
    return this.http.get<ApiResponse<Tag[]>>(this.apiUrl);
  }

  /**
   * Gets a tag by ID.
   * @param id Tag ID.
   * @returns Observable with tag data.
   */
  getById(id: number): Observable<ApiResponse<Tag>> {
    return this.http.get<ApiResponse<Tag>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Creates a new tag.
   * @param dto Tag data.
   * @returns Observable with created tag.
   */
  create(dto: CreateTagDto): Observable<ApiResponse<Tag>> {
    return this.http.post<ApiResponse<Tag>>(this.apiUrl, dto);
  }

  /**
   * Updates a tag.
   * @param id Tag ID.
   * @param dto Updated tag data.
   * @returns Observable with updated tag.
   */
  update(id: number, dto: UpdateTagDto): Observable<ApiResponse<Tag>> {
    return this.http.put<ApiResponse<Tag>>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Deletes a tag.
   * @param id Tag ID.
   * @returns Observable with success status.
   */
  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }
}
