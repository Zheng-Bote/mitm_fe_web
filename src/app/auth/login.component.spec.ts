/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { LoginComponent } from './login.component';

vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: () => true,
  WebAuthnError: class extends Error {}
}));

async function render(bootstrapRequired: boolean, oidcEnabled = false, url = '/login') {
  await TestBed.configureTestingModule({
    imports: [LoginComponent],
    providers: [
      provideRouter([{ path: 'login', component: LoginComponent }]),
      { provide: AuthService, useValue: { bootstrapRequired: () => of(bootstrapRequired), oidcEnabled: () => of(oidcEnabled), startOidcLogin: vi.fn() } }
    ]
  }).compileComponents();

  await TestBed.inject(Router).navigateByUrl(url);
  const fixture = TestBed.createComponent(LoginComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

const ssoButton = (el: HTMLElement) =>
  Array.from(el.querySelectorAll('button')).find(b => b.textContent?.includes('Sign in with SSO'));

const trigger = (el: HTMLElement, tab: string) =>
  el.querySelector<HTMLButtonElement>(`[hlmTabsTrigger="${tab}"]`)!;

describe('LoginComponent', () => {
  it('starts on the sign-in tab without a bootstrap token field', async () => {
    const el = await render(false);

    expect(trigger(el, 'signin').getAttribute('data-state')).toBe('active');
    expect(trigger(el, 'signin').disabled).toBe(false);
    expect(el.querySelector('#reg-bootstrap-token')).toBeNull();
  });

  it('forces the registration tab with a bootstrap token field on a fresh installation', async () => {
    const el = await render(true);

    expect(trigger(el, 'register').getAttribute('data-state')).toBe('active');
    expect(trigger(el, 'signin').disabled).toBe(true);
    expect(el.querySelector('#reg-bootstrap-token')).not.toBeNull();
  });

  it('hides the SSO sign-in when OIDC is disabled', async () => {
    const el = await render(false, false);

    expect(ssoButton(el)).toBeUndefined();
  });

  it('starts the SSO sign-in when OIDC is enabled', async () => {
    const el = await render(false, true);

    ssoButton(el)!.click();

    expect(TestBed.inject(AuthService).startOidcLogin).toHaveBeenCalled();
  });

  it('hides the SSO sign-in on a fresh installation', async () => {
    const el = await render(true, true);

    expect(ssoButton(el)).toBeUndefined();
  });

  it('shows the reason of a failed SSO callback', async () => {
    const el = await render(false, true, '/login?sso_error=unknown_user');

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('not registered');
  });
});
