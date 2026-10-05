import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div>
          <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            MitM Admin
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Sign in to access the control plane
          </p>
        </div>
        
        <form class="mt-8 space-y-6" (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="-space-y-px rounded-md shadow-sm">
            <div>
              <label for="os-user" class="sr-only">OS Username</label>
              <input
                id="os-user"
                name="osUser"
                type="text"
                required
                [(ngModel)]="osUser"
                class="relative block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Enter OS Username (e.g., zb_ba)"
              />
            </div>
          </div>

          <!-- Error message display -->
          <div *ngIf="errorMessage()" class="text-red-500 text-sm text-center">
            {{ errorMessage() }}
          </div>

          <div>
            <button
              type="submit"
              [disabled]="isLoading() || !osUser()"
              class="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span *ngIf="isLoading()">Authenticating...</span>
              <span *ngIf="!isLoading()">Sign In</span>
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

  osUser = signal<string>('');
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
    if (!this.osUser()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    // Optional WebAuthn / Windows Hello enforcement for extra local security
    //    if (this.webAuthnAvailable()) {
    //      try {
    //        await this.triggerWebAuthn();
    //      } catch (err: any) {
    //        if (err.name === 'NotAllowedError') {
    //          this.isLoading.set(false);
    //          this.errorMessage.set('Windows Hello authentication was cancelled.');
    //          return; // Block login ONLY if user actively cancels
    //        }
    //        console.warn('WebAuthn failed or not supported by browser, falling back to direct login.', err);
    //        // Do NOT return here. Proceed with login as fallback.
    //      }
    //    }

    this.proceedWithLogin();
  }

  private async triggerWebAuthn(): Promise<void> {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    try {
      // 1. Try to authenticate with an existing local passkey
      await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          userVerification: "required",
          timeout: 60000
        }
      });
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        throw err; // User actively cancelled the prompt
      }

      // 2. If no passkey exists on this device yet, register a local dummy passkey
      // to trigger Windows Hello / TouchID setup for this domain
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      await navigator.credentials.create({
        publicKey: {
          challenge: challenge,
          rp: { name: "MitM Admin Control Plane", id: window.location.hostname },
          user: {
            id: userId,
            name: this.osUser(),
            displayName: this.osUser()
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "required"
          },
          timeout: 60000
        }
      });
    }
  }

  private proceedWithLogin() {
    this.authService.login(this.osUser()).subscribe({
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
        this.errorMessage.set(err?.error?.message || 'Authentication failed. Please check your username.');
      }
    });
  }
}
