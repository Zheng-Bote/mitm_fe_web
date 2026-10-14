/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { AuthService } from './auth.service';

vi.mock('@simplewebauthn/browser', () => ({
  startAuthentication: vi.fn(),
  startRegistration: vi.fn()
}));

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    service.logout();
  });

  it('issues a session only after the passkey ceremony finishes', async () => {
    const credential = { id: 'cred', rawId: 'cred', type: 'public-key' };
    vi.mocked(startAuthentication).mockResolvedValue(credential as never);

    const login = firstValueFrom(service.loginWithPasskey('alice'));

    const start = http.expectOne('/api/v1/auth/webauthn/login/start');
    expect(start.request.body).toEqual({ username: 'alice' });
    start.flush({ ceremony_id: 'c-1', public_key_options: { publicKey: { challenge: 'abc' } } });
    await Promise.resolve();

    expect(startAuthentication).toHaveBeenCalledWith({ optionsJSON: { challenge: 'abc' } });
    expect(service.isAuthenticated()).toBe(false);

    const finish = http.expectOne('/api/v1/auth/webauthn/login/finish');
    expect(finish.request.body).toEqual({ ceremony_id: 'c-1', credential });
    finish.flush({ session_token: 'token-1' });

    await login;
    expect(service.sessionToken()).toBe('token-1');
    expect(sessionStorage.getItem('mitm_session_token')).toBe('token-1');
  });

  it('does not sign in a newly registered user pending approval', async () => {
    vi.mocked(startRegistration).mockResolvedValue({ id: 'cred', authenticatorAttachment: 'cross-platform' } as never);

    const register = firstValueFrom(service.registerPasskey({ username: 'bob' }));

    http.expectOne('/api/v1/auth/webauthn/register/start')
      .flush({ ceremony_id: 'c-2', public_key_options: { publicKey: { challenge: 'xyz' } }, is_bootstrap: false });
    await Promise.resolve();

    const finish = http.expectOne('/api/v1/auth/webauthn/register/finish');
    expect(finish.request.body.attachment_type).toBe('cross-platform');
    finish.flush({ status: 'pending_approval', message: 'pending' });

    expect((await register).status).toBe('pending_approval');
    expect(service.isAuthenticated()).toBe(false);
  });

  it('signs in the bootstrap administrator with the returned session token', async () => {
    vi.mocked(startRegistration).mockResolvedValue({ id: 'cred' } as never);

    const register = firstValueFrom(service.registerPasskey({ username: 'admin', bootstrap_token: 't'.repeat(32) }));

    const start = http.expectOne('/api/v1/auth/webauthn/register/start');
    expect(start.request.body.bootstrap_token).toBe('t'.repeat(32));
    start.flush({ ceremony_id: 'c-3', public_key_options: { publicKey: {} }, is_bootstrap: true });
    await Promise.resolve();

    http.expectOne('/api/v1/auth/webauthn/register/finish')
      .flush({ status: 'active', message: 'ok', session_token: 'token-admin' });

    await register;
    expect(service.sessionToken()).toBe('token-admin');
  });
});
