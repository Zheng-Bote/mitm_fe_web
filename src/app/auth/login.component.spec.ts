/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { LoginComponent } from './login.component';

vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: () => true,
  WebAuthnError: class extends Error {}
}));

async function render(bootstrapRequired: boolean) {
  await TestBed.configureTestingModule({
    imports: [LoginComponent],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { bootstrapRequired: () => of(bootstrapRequired) } }
    ]
  }).compileComponents();

  const fixture = TestBed.createComponent(LoginComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

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
});
