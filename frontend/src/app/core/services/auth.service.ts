import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject, switchMap, filter, take } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, LoginDto, RegisterDto, AuthResponse, ApiResponse, RefreshTokenDto } from '../models';

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
  private readonly REFRESH_TOKEN_KEY = 'lifesync_refresh_token';
  private readonly USER_KEY = 'lifesync_user';
  private readonly DEVICE_ID_KEY = 'lifesync_device_id';

  /** Signal holding the current user */
  private currentUserSignal = signal<User | null>(null);
  
  /** Signal holding the authentication token */
  private tokenSignal = signal<string | null>(null);

  /** Signal holding the refresh token */
  private refreshTokenSignal = signal<string | null>(null);

  /** Whether a token refresh is currently in progress */
  private isRefreshing = false;

  /** Subject that emits when a token refresh completes */
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  /** Computed signal to check if user is authenticated */
  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  
  /** Computed signal to get current user */
  readonly currentUser = computed(() => this.currentUserSignal());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredAuth();
    this.ensureDeviceId();
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

        const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
        if (refreshToken) {
          this.refreshTokenSignal.set(refreshToken);
        }
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
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    this.tokenSignal.set(response.token);
    this.refreshTokenSignal.set(response.refreshToken);
    this.currentUserSignal.set(response.user);
  }

  /**
   * Clears authentication data from localStorage and signals.
   */
  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.tokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.currentUserSignal.set(null);
  }

  /**
   * Ensures a unique device ID exists for this browser/device.
   * Generates one if not already stored.
   */
  private ensureDeviceId(): void {
    if (!localStorage.getItem(this.DEVICE_ID_KEY)) {
      const deviceId = this.generateUUID();
      localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
    }
  }

  /**
   * Generates a UUID v4 string.
   * Falls back to crypto.getRandomValues when crypto.randomUUID is unavailable.
   */
  private generateUUID(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  /**
   * Gets the stored device ID.
   * @returns The unique device identifier.
   */
  getDeviceId(): string {
    return localStorage.getItem(this.DEVICE_ID_KEY)!;
  }

  /**
   * Gets the current refresh token.
   * @returns The refresh token or null if not available.
   */
  getRefreshToken(): string | null {
    return this.refreshTokenSignal();
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
   * Attempts to refresh the access token using the stored refresh token.
   * Queues concurrent callers so only one refresh request is made at a time.
   * @returns Observable with the new authentication response.
   */
  refreshAccessToken(): Observable<ApiResponse<AuthResponse>> {
    if (this.isRefreshing) {
      // Wait for the ongoing refresh to complete and return the new token
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(() => {
          // Return a simple success observable since the token is already refreshed
          return new Observable<ApiResponse<AuthResponse>>(subscriber => {
            subscriber.next({ success: true, data: { token: this.tokenSignal()!, refreshToken: this.refreshTokenSignal()!, expiresAt: new Date(), user: this.currentUserSignal()! } });
            subscriber.complete();
          });
        })
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    const dto: RefreshTokenDto = {
      accessToken: this.tokenSignal()!,
      refreshToken: this.refreshTokenSignal()!
    };

    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/refresh`, dto, {
      headers: { 'X-Device-Id': this.getDeviceId() }
    }).pipe(
      tap(response => {
        this.isRefreshing = false;
        if (response.success && response.data) {
          this.storeAuth(response.data);
          this.refreshTokenSubject.next(response.data.token);
        }
      }),
      catchError(error => {
        this.isRefreshing = false;
        this.refreshTokenSubject.next(null);
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
