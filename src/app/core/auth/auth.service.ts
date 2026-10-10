import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
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

  private renewalTimer: any;

  constructor() {
    if (this._sessionToken()) {
      this.startSessionRenewal();
    }
  }

  /**
   * Logs in by requesting a session token from the backend.
   */
  login(osUser: string): Observable<SessionResponse> {
    return this.http.get<{ip: string}>('https://api64.ipify.org?format=json').pipe(
      catchError(() => of({ ip: '127.0.0.1' })),
      switchMap(ipResponse => {
        const payload = {
          os_user: osUser,
          client_ip: ipResponse.ip
        };
        
        return this.http.post<SessionResponse>(`/api/v1/auth/session`, payload).pipe(
          tap(response => {
            if (response && response.session_token) {
              this._sessionToken.set(response.session_token);
              sessionStorage.setItem('mitm_session_token', response.session_token);
              this.startSessionRenewal();
            }
          })
        );
      })
    );
  }

  private startSessionRenewal() {
    this.stopSessionRenewal();
    this.renewalTimer = setInterval(() => {
      this.fetchRoles().subscribe({
        next: (roles) => {
          if (roles.length === 0) {
            this.logout();
          }
        },
        error: () => this.logout()
      });
    }, 1800000); // 30 minutes
  }

  private stopSessionRenewal() {
    if (this.renewalTimer) {
      clearInterval(this.renewalTimer);
      this.renewalTimer = null;
    }
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
        const uppercaseRoles = (response.roles || []).map(r => r.toUpperCase());
        this._roles.set(uppercaseRoles);
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
   * Check if user has a role, accounting for hierarchy:
   * ADMIN inherits USER inherits VIEWER
   */
  public hasRole(requiredRole: string): boolean {
    const roles = this._roles();
    const req = requiredRole.toUpperCase();
    
    if (roles.includes('ADMIN')) {
      return true; // ADMIN can do anything
    }
    
    if (roles.includes('USER') && (req === 'USER' || req === 'VIEWER')) {
      return true; // USER can do USER and VIEWER things
    }
    
    return roles.includes(req);
  }

  /**
   * Clears the session state and redirects to login.
   */
  logout(): void {
    this.stopSessionRenewal();
    this._sessionToken.set(null);
    this._roles.set([]);
    this._osUser.set(null);
    sessionStorage.removeItem('mitm_session_token');
    this.router.navigate(['/login']);
  }
}
