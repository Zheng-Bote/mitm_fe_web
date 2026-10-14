/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpErrorResponse } from '@angular/common/http';
import { WebAuthnError } from '@simplewebauthn/browser';
import { authErrorMessage } from './auth-error-message';

describe('authErrorMessage', () => {
  it('returns the JSON:API error detail from the backend', () => {
    const err = new HttpErrorResponse({
      status: 403,
      error: { errors: [{ status: '403', title: 'Forbidden', detail: 'Account is inactive pending administrator approval.' }] }
    });
    expect(authErrorMessage(err)).toBe('Account is inactive pending administrator approval.');
  });

  it('reports the rate limit', () => {
    expect(authErrorMessage(new HttpErrorResponse({ status: 429 }))).toContain('Too many attempts');
  });

  it('reports an unreachable server', () => {
    expect(authErrorMessage(new HttpErrorResponse({ status: 0 }))).toContain('not reachable');
  });

  it('reports a cancelled passkey prompt', () => {
    const cancelled = new Error('The operation either timed out or was not allowed.');
    cancelled.name = 'NotAllowedError';
    expect(authErrorMessage(cancelled)).toBe('The passkey prompt was cancelled or timed out.');
  });

  it('reports an already registered authenticator', () => {
    const err = new WebAuthnError({
      message: 'already registered',
      code: 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED',
      cause: new Error()
    });
    expect(authErrorMessage(err)).toBe('This passkey is already registered for this user.');
  });
});
