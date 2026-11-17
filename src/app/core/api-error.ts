/*
 * SPDX-License-Identifier: Apache-2.0
 */

/** Error part of the core-layer response envelope (`/api/v1/*`, core-layer #93). */
export interface ApiErrorEnvelope {
  id: string;
  status: number;
  code: string;
  title: string;
  detail: string | null;
}

/** `detail` (or `title`) of a failed `/api/v1` request's response envelope, if any. */
export function apiErrorDetail(err: unknown): string | undefined {
  const body = (err as { error?: Partial<ApiErrorEnvelope> } | null)?.error;
  if (!body || typeof body !== 'object') {
    return undefined;
  }
  return body.detail ?? body.title ?? undefined;
}
