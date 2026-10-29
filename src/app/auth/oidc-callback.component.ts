/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../core/auth/auth.service';

/**
 * Target of the backend OIDC callback redirect (`/auth/callback?handoff=<id>`):
 * exchanges the single-use handoff id for the session token and enters the app.
 */
@Component({
  selector: 'app-oidc-callback',
  template: `
    <div class="flex min-h-screen items-center justify-center bg-background text-muted-foreground" role="status">
      Completing SSO sign-in...
    </div>
  `
})
export class OidcCallbackComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const handoff = this.route.snapshot.queryParamMap.get('handoff');
    if (!handoff) {
      this.fail();
      return;
    }
    this.authService.exchangeOidcHandoff(handoff).pipe(
      switchMap(() => this.authService.fetchRoles())
    ).subscribe({
      next: () => this.router.navigate(['/dashboard'], { replaceUrl: true }),
      error: () => this.fail()
    });
  }

  private fail() {
    this.router.navigate(['/login'], { queryParams: { sso_error: 'invalid_state' }, replaceUrl: true });
  }
}
