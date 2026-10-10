import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-background text-foreground px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div class="w-full max-w-md space-y-8 bg-card text-card-foreground p-8 rounded-xl shadow-md border border-border transition-colors duration-300">
        <div class="text-center">
          <img src="img/logo_256x256.avif" alt="MitM Logo" class="mx-auto h-24 w-24 mb-4 drop-shadow-md" />
          <h2 class="text-3xl font-bold tracking-tight text-primary font-tron uppercase">
            MitM Admin
          </h2>
          <p class="mt-2 text-center text-sm text-muted-foreground">
            Sign in to access the control plane
          </p>
        </div>
        
        <form class="mt-8 space-y-6" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="-space-y-px rounded-md shadow-sm">
            <div>
              <label for="os-user" class="sr-only">OS Username</label>
              <input
                id="os-user"
                formControlName="osUser"
                type="text"
                required
                class="relative block w-full rounded-md border border-border bg-background py-2.5 px-3 text-foreground placeholder:text-muted-foreground focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                placeholder="Enter Username (e.g., PY123456)"
              />
            </div>
          </div>

          <!-- Error message display -->
          @if (errorMessage()) {
            <div class="text-red-500 text-sm text-center">
              {{ errorMessage() }}
            </div>
          }

          <div>
            <button
              type="submit"
              [disabled]="isLoading() || loginForm.invalid"
              class="group relative flex w-full justify-center rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              @if (isLoading()) {
                <span>Authenticating...</span>
              } @else {
                <span>Sign In</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  loginForm = this.fb.group({
    osUser: ['', Validators.required]
  });

  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  webAuthnAvailable = signal<boolean>(false);

  async ngOnInit() {
    if (window.PublicKeyCredential) {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      this.webAuthnAvailable.set(available);
    }
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.proceedWithLogin();
  }

  private proceedWithLogin() {
    const osUser = this.loginForm.value.osUser!;
    this.authService.login(osUser).subscribe({
      next: () => {
        this.authService.fetchRoles().subscribe({
          next: () => {
            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            this.isLoading.set(false);
            this.errorMessage.set('Failed to fetch roles. Please try again.');
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        const detail = typeof err?.error === 'string' ? err.error : (err?.error?.errors?.[0]?.detail || err?.error?.message);
        if (detail && detail.toLowerCase().includes('inactive')) {
          this.errorMessage.set('Login Rejected: User account is inactive.');
        } else {
          this.errorMessage.set(detail || 'Authentication failed. Please check your username.');
        }
      }
    });
  }
}
