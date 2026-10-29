/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { OidcCallbackComponent } from './oidc-callback.component';

async function render(url: string, exchange: () => unknown) {
  const authService = {
    exchangeOidcHandoff: vi.fn(exchange),
    fetchRoles: () => of(['VIEWER'])
  };
  await TestBed.configureTestingModule({
    imports: [OidcCallbackComponent],
    providers: [
      provideRouter([{ path: 'auth/callback', component: OidcCallbackComponent }]),
      { provide: AuthService, useValue: authService }
    ]
  }).compileComponents();

  const router = TestBed.inject(Router);
  await router.navigateByUrl(url);
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  TestBed.createComponent(OidcCallbackComponent).detectChanges();
  return { authService, navigate };
}

describe('OidcCallbackComponent', () => {
  it('exchanges the handoff id and opens the dashboard', async () => {
    const { authService, navigate } = await render('/auth/callback?handoff=h-1', () => of({ session_token: 't' }));

    expect(authService.exchangeOidcHandoff).toHaveBeenCalledWith('h-1');
    expect(navigate).toHaveBeenCalledWith(['/dashboard'], { replaceUrl: true });
  });

  it('returns to the login page when the exchange fails', async () => {
    const { navigate } = await render('/auth/callback?handoff=h-1', () => throwError(() => new Error('401')));

    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { sso_error: 'invalid_state' }, replaceUrl: true });
  });

  it('returns to the login page without a handoff id', async () => {
    const { authService, navigate } = await render('/auth/callback', () => of({ session_token: 't' }));

    expect(authService.exchangeOidcHandoff).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { sso_error: 'invalid_state' }, replaceUrl: true });
  });
});
