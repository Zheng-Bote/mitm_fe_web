/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { apiInterceptor } from './api.interceptor';
import { AuthService } from '../auth/auth.service';
import { apiErrorDetail } from '../api-error';

const envelope = (status: number, code: string, data: unknown, detail: string | null = null) =>
  ({ id: 'req-1', status, code, title: code, detail, meta: { timestamp: '', version: '3.5.0' }, data });

describe('apiInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  const logout = vi.fn();

  beforeEach(() => {
    logout.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { sessionToken: () => null, logout } }
      ]
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('returns the payload of a success envelope', async () => {
    const result = firstValueFrom(http.get('/api/v1/iam/roles'));
    backend.expectOne(r => r.url.endsWith('/api/v1/iam/roles')).flush(envelope(200, 'OK', [{ id: 1, name: 'ADMIN' }]));
    expect(await result).toEqual([{ id: 1, name: 'ADMIN' }]);
  });

  it('keeps binary FlatBuffers responses', async () => {
    const result = firstValueFrom(http.get('/api/v1/dlq', { responseType: 'arraybuffer' }));
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    backend.expectOne(r => r.url.endsWith('/api/v1/dlq')).flush(bytes);
    expect(new Uint8Array(await result)).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('parses the JSON error envelope of a FlatBuffers request', async () => {
    const result = firstValueFrom(http.get('/api/v1/dlq', { responseType: 'arraybuffer' }));
    const body = Uint8Array.from(new TextEncoder().encode(JSON.stringify(envelope(500, 'INTERNAL_ERROR', null, 'Failed to load DLQ entries')))).buffer;
    backend.expectOne(r => r.url.endsWith('/api/v1/dlq')).flush(body, { status: 500, statusText: 'Internal Server Error' });
    const err = await result.catch(e => e as HttpErrorResponse);
    expect(apiErrorDetail(err)).toBe('Failed to load DLQ entries');
  });

  it('logs out on 401 and USER_INACTIVE, but not on RBAC_FORBIDDEN', async () => {
    const call = (status: number, code: string) => {
      const result = firstValueFrom(http.get('/api/v1/iam/users')).catch(() => undefined);
      backend.expectOne(r => r.url.endsWith('/api/v1/iam/users')).flush(envelope(status, code, null), { status, statusText: code });
      return result;
    };
    await call(403, 'RBAC_FORBIDDEN');
    expect(logout).not.toHaveBeenCalled();
    await call(403, 'USER_INACTIVE');
    expect(logout).toHaveBeenCalledTimes(1);
    await call(401, 'AUTH_REQUIRED');
    expect(logout).toHaveBeenCalledTimes(2);
  });
});
