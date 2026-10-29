/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpErrorResponse } from '@angular/common/http';
import { WebAuthnError } from '@simplewebauthn/browser';

/**
 * Maps errors of the passkey login/registration flow to a user-facing message:
 * browser WebAuthn errors and backend JSON:API errors.
 */
export function authErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Server not reachable. Please try again later.';
    }
    if (err.status === 429) {
      return 'Too many attempts. Please wait a minute and try again.';
    }
    const detail = typeof err.error === 'string' ? err.error : err.error?.errors?.[0]?.detail;
    return detail || 'Authentication failed.';
  }

  if (err instanceof WebAuthnError) {
    switch (err.code) {
      case 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED':
        return 'This passkey is already registered for this user.';
      case 'ERROR_INVALID_DOMAIN':
      case 'ERROR_INVALID_RP_ID':
        return 'Passkeys are not available on this address (WebAuthn RP ID / origin mismatch).';
    }
  }

  // The browser reports a cancelled or timed-out passkey prompt as NotAllowedError.
  if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'AbortError')) {
    return 'The passkey prompt was cancelled or timed out.';
  }

  return err instanceof Error && err.message ? err.message : 'Authentication failed.';
}

const SSO_ERRORS: Record<string, string> = {
  invalid_state: 'The SSO sign-in expired or was already used. Please try again.',
  idp_error: 'The SSO sign-in was cancelled or rejected by the identity provider.',
  idp_unavailable: 'The identity provider is not reachable. Please try again later.',
  unknown_user: 'Your SSO account is not registered in MitM Admin. Please contact an administrator.',
  inactive_user: 'Your account is inactive (pending administrator approval).'
};

/**
 * Maps the `sso_error` code of a failed OIDC callback (`/login?sso_error=...`) to a user-facing message.
 */
export function ssoErrorMessage(code: string): string {
  return SSO_ERRORS[code] ?? 'SSO sign-in failed. Please try again.';
}
