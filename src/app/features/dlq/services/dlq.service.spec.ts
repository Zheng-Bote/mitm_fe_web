/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { Builder } from 'flatbuffers';
import { DLQEntry } from '../../../core/models/schematas/dlq-entry';
import { DLQEntryList } from '../../../core/models/schematas/dlq-entry-list';
import { DlqService } from './dlq.service';

function buildPayload(): ArrayBuffer {
  const builder = new Builder();

  const id = builder.createString('id-1');
  const packageId = builder.createString('pkg-1');
  const payload = builder.createString('{"a":1}');
  const errorCode = builder.createString('VALIDATION_FAILED');
  const errorMessage = builder.createString('customer.email is invalid');
  const failedAt = builder.createString('2026-10-21T08:00:00+00:00');
  const resolvedAt = builder.createString('');

  const entry = DLQEntry.createDLQEntry(
    builder,
    id,
    packageId,
    payload,
    errorCode,
    errorMessage,
    failedAt,
    BigInt(0),
    false,
    resolvedAt,
    BigInt(0),
  );
  const vector = DLQEntryList.createEntriesVector(builder, [entry]);
  const list = DLQEntryList.createDLQEntryList(builder, vector);
  DLQEntryList.finishDLQEntryListBuffer(builder, list);

  return builder.asUint8Array().slice().buffer;
}

describe('DlqService', () => {
  let service: DlqService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DlqService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests FlatBuffers and decodes the entry list', async () => {
    const result = firstValueFrom(service.getEntries());

    const request = http.expectOne('/api/v1/dlq');
    expect(request.request.headers.get('Accept')).toBe('application/x-flatbuffers');
    expect(request.request.responseType).toBe('arraybuffer');

    request.flush(buildPayload());

    expect(await result).toEqual([
      {
        id: 'id-1',
        payload: '{"a":1}',
        errorCode: 'VALIDATION_FAILED',
        errorMessage: 'customer.email is invalid',
        failedAt: '2026-10-21T08:00:00+00:00',
      },
    ]);
  });
});
