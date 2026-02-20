import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Adds auth headers (Authorization + X-Device-Id) to a request.
 */
function addAuthHeaders(req: HttpRequest<unknown>, token: string, deviceId: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      'X-Device-Id': deviceId
    }
  });
}

/**
 * HTTP interceptor that adds the JWT token and device ID to requests
 * and handles authentication errors with automatic token refresh.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const deviceId = authService.getDeviceId();

  // Always attach X-Device-Id; add Authorization only when a token exists
  if (token) {
    req = addAuthHeaders(req, token, deviceId);
  } else {
    req = req.clone({ setHeaders: { 'X-Device-Id': deviceId } });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        const refreshToken = authService.getRefreshToken();

        if (refreshToken) {
          // Attempt to refresh the access token
          return authService.refreshAccessToken().pipe(
            switchMap(response => {
              if (response.success && response.data) {
                // Retry the original request with the new token
                const retryReq = addAuthHeaders(req, response.data.token, deviceId);
                return next(retryReq);
              }
              authService.logout();
              return throwError(() => error);
            }),
            catchError(refreshError => {
              // Refresh failed — log out
              authService.logout();
              return throwError(() => refreshError);
            })
          );
        }

        // No refresh token available — log out immediately
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
