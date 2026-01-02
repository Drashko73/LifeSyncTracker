import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Transaction, 
  TransactionCategory,
  CreateTransactionDto, 
  UpdateTransactionDto,
  CreateTransactionCategoryDto,
  TransactionFilterDto,
  FinancialSummary,
  PaginatedResponse,
  ApiResponse 
} from '../models';

/**
 * Service for transaction management operations.
 */
@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly apiUrl = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) {}

  /**
   * Gets all transaction categories.
   */
  getCategories(): Observable<ApiResponse<TransactionCategory[]>> {
    return this.http.get<ApiResponse<TransactionCategory[]>>(`${this.apiUrl}/categories`);
  }

  /**
   * Creates a custom transaction category.
   */
  createCategory(dto: CreateTransactionCategoryDto): Observable<ApiResponse<TransactionCategory>> {
    return this.http.post<ApiResponse<TransactionCategory>>(`${this.apiUrl}/categories`, dto);
  }

  /**
   * Deletes a custom transaction category.
   */
  deleteCategory(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/categories/${id}`);
  }

  /**
   * Gets transactions with filtering and pagination.
   */
  getAll(filter: TransactionFilterDto): Observable<ApiResponse<PaginatedResponse<Transaction>>> {
    let params = new HttpParams();
    if (filter.type !== undefined) params = params.set('type', filter.type.toString());
    if (filter.categoryId) params = params.set('categoryId', filter.categoryId.toString());
    if (filter.startDate) params = params.set('startDate', filter.startDate.toISOString());
    if (filter.endDate) params = params.set('endDate', filter.endDate.toISOString());
    if (filter.page) params = params.set('page', filter.page.toString());
    if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());
    
    return this.http.get<ApiResponse<PaginatedResponse<Transaction>>>(this.apiUrl, { params });
  }

  /**
   * Gets a transaction by ID.
   */
  getById(id: number): Observable<ApiResponse<Transaction>> {
    return this.http.get<ApiResponse<Transaction>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Creates a new transaction.
   */
  create(dto: CreateTransactionDto): Observable<ApiResponse<Transaction>> {
    return this.http.post<ApiResponse<Transaction>>(this.apiUrl, dto);
  }

  /**
   * Updates a transaction.
   */
  update(id: number, dto: UpdateTransactionDto): Observable<ApiResponse<Transaction>> {
    return this.http.put<ApiResponse<Transaction>>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Deletes a transaction.
   */
  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Gets financial summary for a period.
   */
  getSummary(startDate: Date, endDate: Date): Observable<ApiResponse<FinancialSummary>> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());
    
    return this.http.get<ApiResponse<FinancialSummary>>(`${this.apiUrl}/summary`, { params });
  }
}
