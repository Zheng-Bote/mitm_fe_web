import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, map } from 'rxjs/operators';
import { Observable, throwError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SessionResponse {
  session_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // State via Angular Signals
  private readonly _sessionToken = signal<string | null>(sessionStorage.getItem('mitm_session_token'));
  private readonly _roles = signal<string[]>([]);
  private readonly _osUser = signal<string | null>(null);

  // Computed properties
  public sessionToken = computed(() => this._sessionToken());
  public roles = computed(() => this._roles());
  public osUser = computed(() => this._osUser());
  public isAuthenticated = computed(() => !!this._sessionToken());

  constructor() { }

  /**
   * Logs in by requesting a session token from the backend.
   */
  login(osUser: string): Observable<SessionResponse> {
    const payload = {
      os_user: osUser
    };
    
    return this.http.post<SessionResponse>(`/api/v1/auth/session`, payload).pipe(
      tap(response => {
        if (response && response.session_token) {
          this._sessionToken.set(response.session_token);
          sessionStorage.setItem('mitm_session_token', response.session_token);
        }
      })
    );
  }

  /**
   * Fetches roles for the current session.
   */
  fetchRoles(): Observable<string[]> {
    if (!this.isAuthenticated()) {
      return of([]);
    }
    
    return this.http.get<{ roles: string[], os_user: string }>(`/api/v1/auth/me`).pipe(
      tap(response => {
        this._roles.set(response.roles || []);
        if (response.os_user) {
          this._osUser.set(response.os_user);
        }
      }),
      map(response => response.roles || []),
      catchError(err => {
        console.error('Failed to fetch roles', err);
        return of([]);
      })
    );
  }

  /**
   * Clears the session state and redirects to login.
   */
  logout(): void {
    this._sessionToken.set(null);
    this._roles.set([]);
    this._osUser.set(null);
    sessionStorage.removeItem('mitm_session_token');
    this.router.navigate(['/login']);
  }
}
