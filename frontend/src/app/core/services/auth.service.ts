import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, LoginDto, RegisterDto, AuthResponse, ApiResponse } from '../models';

/**
 * Service for handling authentication operations.
 * Uses Angular Signals for reactive state management.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'lifesync_token';
  private readonly USER_KEY = 'lifesync_user';

  /** Signal holding the current user */
  private currentUserSignal = signal<User | null>(null);
  
  /** Signal holding the authentication token */
  private tokenSignal = signal<string | null>(null);

  /** Computed signal to check if user is authenticated */
  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  
  /** Computed signal to get current user */
  readonly currentUser = computed(() => this.currentUserSignal());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredAuth();
  }

  /**
   * Loads stored authentication data from localStorage.
   */
  private loadStoredAuth(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        this.tokenSignal.set(token);
        this.currentUserSignal.set(user);
      } catch {
        this.clearAuth();
      }
    }
  }

  /**
   * Stores authentication data to localStorage.
   */
  private storeAuth(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    this.tokenSignal.set(response.token);
    this.currentUserSignal.set(response.user);
  }

  /**
   * Clears authentication data from localStorage and signals.
   */
  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
  }

  /**
   * Gets the current authentication token.
   * @returns The JWT token or null if not authenticated.
   */
  getToken(): string | null {
    return this.tokenSignal();
  }

  /**
   * Registers a new user.
   * @param dto Registration data.
   * @returns Observable with authentication response.
   */
  register(dto: RegisterDto): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, dto).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.storeAuth(response.data);
        }
      }),
      catchError(error => {
        console.error('Registration error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Authenticates a user.
   * @param dto Login credentials.
   * @returns Observable with authentication response.
   */
  login(dto: LoginDto): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, dto).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.storeAuth(response.data);
        }
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logs out the current user.
   */
  logout(): void {
    this.clearAuth();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Gets the current user's information from the API.
   * @returns Observable with user data.
   */
  getCurrentUser(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`);
  }
}
