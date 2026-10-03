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

  onSubmit() {
    if (!this.osUser()) return;
    
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.osUser()).subscribe({
      next: () => {
        // Fetch roles after successful login
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
