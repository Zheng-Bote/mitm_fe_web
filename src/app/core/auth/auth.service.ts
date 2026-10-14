import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { Observable, throwError, of, from } from 'rxjs';
import {
  startAuthentication,
  startRegistration,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import { environment } from '../../../environments/environment';

export interface SessionResponse {
  session_token: string;
}

/** webauthn-rs wraps the WebAuthn options in a `publicKey` member. */
interface LoginStartResponse {
  ceremony_id: string;
  public_key_options: { publicKey: PublicKeyCredentialRequestOptionsJSON };
}

interface RegistrationStartResponse {
  ceremony_id: string;
  public_key_options: { publicKey: PublicKeyCredentialCreationOptionsJSON };
  is_bootstrap: boolean;
}

export interface RegistrationRequest {
  username: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  bootstrap_token?: string;
}

export interface RegistrationResult {
  status: 'active' | 'pending_approval';
  message: string;
  session_token?: string;
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
   * Returns whether the system has no user yet and needs the initial administrator registration.
   */
  bootstrapRequired(): Observable<boolean> {
    return this.http.get<{ bootstrap_required: boolean }>(`/api/v1/auth/bootstrap/status`).pipe(
      map(response => response.bootstrap_required)
    );
  }

  /**
   * Logs in via the WebAuthn passkey ceremony; the backend issues the session token
   * only after verifying the passkey signature.
   */
  loginWithPasskey(username: string): Observable<SessionResponse> {
    return this.http.post<LoginStartResponse>(`/api/v1/auth/webauthn/login/start`, { username }).pipe(
      switchMap(start =>
        from(startAuthentication({ optionsJSON: start.public_key_options.publicKey })).pipe(
          switchMap(credential =>
            this.http.post<SessionResponse>(`/api/v1/auth/webauthn/login/finish`, {
              ceremony_id: start.ceremony_id,
              credential
            })
          )
        )
      ),
      tap(response => this.setSession(response.session_token))
    );
  }

  /**
   * Registers a passkey. New users stay inactive until approved; the bootstrap
   * administrator is signed in immediately.
   */
  registerPasskey(request: RegistrationRequest): Observable<RegistrationResult> {
    return this.http.post<RegistrationStartResponse>(`/api/v1/auth/webauthn/register/start`, request).pipe(
      switchMap(start =>
        from(startRegistration({ optionsJSON: start.public_key_options.publicKey })).pipe(
          switchMap(credential =>
            this.http.post<RegistrationResult>(`/api/v1/auth/webauthn/register/finish`, {
              ceremony_id: start.ceremony_id,
              credential,
              attachment_type: credential.authenticatorAttachment
            })
          )
        )
      ),
      tap(result => {
        if (result.session_token) {
          this.setSession(result.session_token);
        }
      })
    );
  }

  private setSession(token: string) {
    this._sessionToken.set(token);
    sessionStorage.setItem('mitm_session_token', token);
    this.startSessionRenewal();
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
