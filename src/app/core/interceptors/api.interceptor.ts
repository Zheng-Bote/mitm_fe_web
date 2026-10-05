import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  // Wenn die URL bereits http:// oder https:// enthält, ignoriere sie
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req);
  }

  const authService = inject(AuthService);

  // Prepend the base URL from the environment
  let finalUrl = req.url;
  if (environment.apiUrl && !req.url.startsWith(environment.apiUrl) && !req.url.startsWith('/health')) {
    finalUrl = `${environment.apiUrl}${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }

  let headers = req.headers;
  
  // Set default Accept header for API v1 content negotiation
  if (!headers.has('Accept')) {
    headers = headers.set('Accept', 'application/json');
  }

  // Inject Bearer token if we have one and we are not calling the session endpoint
  const token = authService.sessionToken();
  if (token && !req.url.includes('/api/v1/auth/session')) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  const apiReq = req.clone({
    url: finalUrl,
    headers: headers
  });

  return next(apiReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle unauthorized errors by clearing session and redirecting
      if (error.status === 401 || error.status === 403) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
