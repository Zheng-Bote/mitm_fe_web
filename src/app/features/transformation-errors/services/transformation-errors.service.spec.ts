/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { Builder } from 'flatbuffers';
import { TransformationError } from '../../../core/models/schematas/transformation-error';
import { TransformationErrorList } from '../../../core/models/schematas/transformation-error-list';
import { TransformationErrorsService } from './transformation-errors.service';

function buildPayload(): ArrayBuffer {
  const builder = new Builder();

  const id = builder.createString('id-1');
  const correlationId = builder.createString('corr-1');
  const topic = builder.createString('');
  const failedField = builder.createString('customer.email');
  const ruleName = builder.createString('email_format');
  const errorMessage = builder.createString('invalid email');
  const createdAt = builder.createString('2026-10-21T08:00:00+00:00');

  const error = TransformationError.createTransformationError(
    builder,
    id,
    correlationId,
    topic,
    failedField,
    ruleName,
    errorMessage,
    createdAt,
    BigInt(0),
  );
  const vector = TransformationErrorList.createErrorsVector(builder, [error]);
  const list = TransformationErrorList.createTransformationErrorList(builder, vector);
  TransformationErrorList.finishTransformationErrorListBuffer(builder, list);

  return builder.asUint8Array().slice().buffer;
}

describe('TransformationErrorsService', () => {
  let service: TransformationErrorsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TransformationErrorsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests FlatBuffers and decodes the error list', async () => {
    const result = firstValueFrom(service.getErrors('2026-10-01T00:00:00Z', '2026-10-21T23:59:59Z'));

    const request = http.expectOne(
      (req) =>
        req.url.startsWith('/api/v1/logs/transformation-errors') &&
        decodeURIComponent(req.url).includes('from=2026-10-01T00:00:00Z') &&
        decodeURIComponent(req.url).includes('to=2026-10-21T23:59:59Z'),
    );
    expect(request.request.headers.get('Accept')).toBe('application/x-flatbuffers');
    expect(request.request.responseType).toBe('arraybuffer');

    request.flush(buildPayload());

    expect(await result).toEqual([
      {
        id: 'id-1',
        correlationId: 'corr-1',
        failedField: 'customer.email',
        ruleName: 'email_format',
        errorMessage: 'invalid email',
        createdAt: '2026-10-21T08:00:00+00:00',
      },
    ]);
  });

  it('omits the range parameters when no range is given', async () => {
    const result = firstValueFrom(service.getErrors());

    const request = http.expectOne('/api/v1/logs/transformation-errors');
    expect(request.request.url).not.toContain('?');

    request.flush(buildPayload());
    await result;
  });
});
