import { HttpInterceptorFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { catchError, map } from 'rxjs/operators';
import { throwError } from 'rxjs';

/** True for the core-layer response envelope `{id, status, code, title, detail, meta, data}`. */
function isEnvelope(body: unknown): body is { data: unknown } {
  return !!body && typeof body === 'object' && !(body instanceof ArrayBuffer)
    && ['id', 'status', 'code', 'meta', 'data'].every(key => key in body);
}

/** Error bodies of `responseType: 'arraybuffer'` requests (FlatBuffers) are JSON envelopes too. */
function parseArrayBufferError(error: HttpErrorResponse): HttpErrorResponse {
  if (!(error.error instanceof ArrayBuffer)) {
    return error;
  }
  try {
    const body = JSON.parse(new TextDecoder().decode(error.error));
    return new HttpErrorResponse({
      error: body,
      headers: error.headers,
      status: error.status,
      statusText: error.statusText,
      url: error.url ?? undefined
    });
  } catch {
    return error;
  }
}

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

  // Inject Bearer token if we have one and we are not calling the public auth endpoints
  const token = authService.sessionToken();
  if (token && !req.url.includes('/api/v1/auth/webauthn/') && !req.url.includes('/api/v1/auth/oidc/') && !req.url.includes('/api/v1/auth/bootstrap/')) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  const apiReq = req.clone({
    url: finalUrl,
    headers: headers
  });

  return next(apiReq).pipe(
    // Callers receive the resource payload (`data`) of the response envelope.
    map(event => event instanceof HttpResponse && isEnvelope(event.body)
      ? event.clone({ body: event.body.data })
      : event),
    catchError((raw: HttpErrorResponse) => {
      const error = parseArrayBufferError(raw);
      // Invalid session or deactivated account: clear the session. A missing permission (RBAC_FORBIDDEN) keeps it.
      if (error.status === 401 || error.error?.code === 'USER_INACTIVE') {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
