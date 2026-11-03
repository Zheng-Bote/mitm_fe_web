/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { InjectionToken } from '@angular/core';
import { browserSupportsWebAuthn, startAuthentication, startRegistration } from '@simplewebauthn/browser';

/**
 * Browser WebAuthn functions, provided via DI so tests can replace them without module mocks
 * (module mocks leak between spec files in the bundled unit-test build).
 */
export interface WebAuthnApi {
  startAuthentication: typeof startAuthentication;
  startRegistration: typeof startRegistration;
  browserSupportsWebAuthn: typeof browserSupportsWebAuthn;
}

export const WEBAUTHN = new InjectionToken<WebAuthnApi>('WEBAUTHN', {
  providedIn: 'root',
  factory: () => ({ startAuthentication, startRegistration, browserSupportsWebAuthn }),
});
