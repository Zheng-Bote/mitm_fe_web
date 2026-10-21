import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ByteBuffer } from 'flatbuffers';
import { TransformationErrorList } from '../../../core/models/schematas/transformation-error-list';
import { TransformationErrorEntry } from '../models/transformation-error.model';

@Injectable({
  providedIn: 'root'
})
export class TransformationErrorsService {
  private http = inject(HttpClient);

  getErrors(from?: string, to?: string): Observable<TransformationErrorEntry[]> {
    let url = '/api/v1/logs/transformation-errors';
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const headers = new HttpHeaders({
      'Accept': 'application/x-flatbuffers'
    });

    return this.http.get(url, {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map(buffer => this.parseFlatBuffer(buffer))
    );
  }

  private parseFlatBuffer(buffer: ArrayBuffer): TransformationErrorEntry[] {
    const byteBuffer = new ByteBuffer(new Uint8Array(buffer));
    const errorList = TransformationErrorList.getRootAsTransformationErrorList(byteBuffer);

    const items: TransformationErrorEntry[] = [];
    const length = errorList.errorsLength();

    for (let i = 0; i < length; i++) {
      const error = errorList.errors(i);
      if (error) {
        items.push({
          id: error.id() || '',
          correlationId: error.correlationId() || '',
          failedField: error.failedField() || '',
          ruleName: error.ruleName() || '',
          errorMessage: error.errorMessage() || '',
          createdAt: error.createdAt() || ''
        });
      }
    }

    return items;
  }
}
