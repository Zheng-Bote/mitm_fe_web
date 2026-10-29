import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { AuthService, RegistrationRequest } from '../core/auth/auth.service';
import { authErrorMessage, ssoErrorMessage } from './auth-error-message';

type Mode = 'signin' | 'register';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, HlmButtonImports, HlmFieldImports, HlmInputImports, HlmTabsImports],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-background text-foreground px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div class="w-full max-w-md space-y-8 bg-card text-card-foreground p-8 rounded-xl shadow-md border border-border transition-colors duration-300">
        <div class="text-center">
          <img src="img/logo_256x256.avif" alt="MitM Logo" class="mx-auto h-24 w-24 mb-4 drop-shadow-md" />
          <h2 class="text-3xl font-bold tracking-tight text-primary font-tron uppercase">
            MitM Admin
          </h2>
          <p class="mt-2 text-center text-sm text-muted-foreground">
            @if (bootstrapRequired()) {
              Register the initial administrator
            } @else {
              Sign in with your passkey
            }
          </p>
        </div>

        @if (oidcEnabled() && !bootstrapRequired()) {
          <button hlmBtn type="button" class="w-full" [disabled]="isLoading()" (click)="onSso()">
            Sign in with SSO
          </button>
          <p class="text-center text-xs text-muted-foreground">or use your passkey</p>
        }

        @if (!webAuthnSupported) {
          <div class="text-red-500 text-sm text-center">
            This browser does not support passkeys (WebAuthn). Please use a current browser.
          </div>
        } @else {
          <hlm-tabs [tab]="mode()" (tabActivated)="switchMode($event)" class="w-full">
            <hlm-tabs-list class="w-full" aria-label="Sign in or register">
              <button hlmTabsTrigger="signin" [disabled]="isLoading() || bootstrapRequired()">Sign In</button>
              <button hlmTabsTrigger="register" [disabled]="isLoading()">Register</button>
            </hlm-tabs-list>

            <div hlmTabsContent="signin">
              <form class="mt-4 space-y-6" [formGroup]="loginForm" (ngSubmit)="onSignIn()">
                <hlm-field>
                  <label hlmFieldLabel for="login-username">Username</label>
                  <input hlmInput id="login-username" formControlName="username" type="text" required
                         autocomplete="username" placeholder="e.g. PY123456" />
                </hlm-field>
                <button hlmBtn type="submit" class="w-full" [disabled]="isLoading() || loginForm.invalid">
                  @if (isLoading()) { Waiting for passkey... } @else { Sign In with Passkey }
                </button>
              </form>
            </div>

            <div hlmTabsContent="register">
              <form class="mt-4 space-y-4" [formGroup]="registerForm" (ngSubmit)="onRegister()">
                <hlm-field>
                  <label hlmFieldLabel for="reg-username">Username</label>
                  <input hlmInput id="reg-username" formControlName="username" type="text" required
                         autocomplete="username" placeholder="e.g. PY123456" />
                </hlm-field>
                <div class="grid grid-cols-2 gap-2">
                  <hlm-field>
                    <label hlmFieldLabel for="reg-first-name">First name</label>
                    <input hlmInput id="reg-first-name" formControlName="firstName" type="text" autocomplete="given-name" />
                  </hlm-field>
                  <hlm-field>
                    <label hlmFieldLabel for="reg-last-name">Last name</label>
                    <input hlmInput id="reg-last-name" formControlName="lastName" type="text" autocomplete="family-name" />
                  </hlm-field>
                </div>
                <hlm-field>
                  <label hlmFieldLabel for="reg-department">Department</label>
                  <input hlmInput id="reg-department" formControlName="department" type="text" list="departments" />
                  <datalist id="departments">
                    @for (department of departments; track department) {
                      <option [value]="department"></option>
                    }
                  </datalist>
                </hlm-field>
                @if (bootstrapRequired()) {
                  <hlm-field>
                    <label hlmFieldLabel for="reg-bootstrap-token">Bootstrap token</label>
                    <input hlmInput id="reg-bootstrap-token" formControlName="bootstrapToken" type="password" autocomplete="off" />
                    <p hlmFieldDescription>The <code>INITIAL_ADMIN_TOKEN</code> configured for this installation.</p>
                  </hlm-field>
                }
                <button hlmBtn type="submit" class="w-full"
                        [disabled]="isLoading() || registerForm.invalid || (bootstrapRequired() && !registerForm.value.bootstrapToken)">
                  @if (isLoading()) { Waiting for passkey... } @else { Register Passkey }
                </button>
              </form>
            </div>
          </hlm-tabs>

          @if (infoMessage()) {
            <div class="text-sm text-center text-muted-foreground" role="status">
              {{ infoMessage() }}
            </div>
          }
          @if (errorMessage()) {
            <div class="text-red-500 text-sm text-center" role="alert">
              {{ errorMessage() }}
            </div>
          }
        }
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  /** Same suggestions as the desktop frontend; free text is allowed. */
  readonly departments = ['IT Security', 'Engineering', 'Finance', 'Operations', 'Administration'];
  readonly webAuthnSupported = browserSupportsWebAuthn();

  loginForm = this.fb.group({
    username: ['', Validators.required]
  });

  registerForm = this.fb.group({
    username: ['', Validators.required],
    firstName: [''],
    lastName: [''],
    department: [''],
    bootstrapToken: ['']
  });

  mode = signal<Mode>('signin');
  bootstrapRequired = signal<boolean>(false);
  oidcEnabled = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  infoMessage = signal<string>('');

  ngOnInit() {
    const ssoError = this.route.snapshot.queryParamMap.get('sso_error');
    if (ssoError) {
      this.errorMessage.set(ssoErrorMessage(ssoError));
    }
    this.authService.oidcEnabled().subscribe(enabled => this.oidcEnabled.set(enabled));
    this.authService.bootstrapRequired().subscribe({
      next: required => {
        this.bootstrapRequired.set(required);
        if (required) {
          this.mode.set('register');
        }
      },
      error: err => this.errorMessage.set(authErrorMessage(err))
    });
  }

  switchMode(mode: string) {
    this.mode.set(mode as Mode);
    this.errorMessage.set('');
    this.infoMessage.set('');
  }

  onSso() {
    this.startRequest();
    this.authService.startOidcLogin();
  }

  onSignIn() {
    if (this.loginForm.invalid) return;
    this.startRequest();

    this.authService.loginWithPasskey(this.loginForm.value.username!.trim()).subscribe({
      next: () => this.enterApp(),
      error: err => this.fail(err)
    });
  }

  onRegister() {
    if (this.registerForm.invalid) return;
    this.startRequest();

    const value = this.registerForm.value;
    const request: RegistrationRequest = {
      username: value.username!.trim(),
      first_name: value.firstName?.trim() || undefined,
      last_name: value.lastName?.trim() || undefined,
      department: value.department?.trim() || undefined,
      bootstrap_token: this.bootstrapRequired() ? value.bootstrapToken! : undefined
    };

    this.authService.registerPasskey(request).subscribe({
      next: result => {
        if (result.session_token) {
          this.enterApp();
          return;
        }
        // Pending approval or an additional passkey for an existing user: continue with sign in.
        this.isLoading.set(false);
        this.loginForm.patchValue({ username: request.username });
        this.mode.set('signin');
        this.infoMessage.set(result.message);
      },
      error: err => this.fail(err)
    });
  }

  private startRequest() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.infoMessage.set('');
  }

  private enterApp() {
    this.authService.fetchRoles().subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Failed to fetch roles. Please try again.');
      }
    });
  }

  private fail(err: unknown) {
    this.isLoading.set(false);
    this.errorMessage.set(authErrorMessage(err));
  }
}
