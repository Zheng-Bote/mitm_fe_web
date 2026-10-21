import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ByteBuffer } from 'flatbuffers';
import { DLQEntryList } from '../../../core/models/schematas/dlq-entry-list';
import { DlqEntryItem } from '../models/dlq-entry.model';

@Injectable({
  providedIn: 'root'
})
export class DlqService {
  private http = inject(HttpClient);

  getEntries(): Observable<DlqEntryItem[]> {
    const headers = new HttpHeaders({
      'Accept': 'application/x-flatbuffers'
    });

    return this.http.get('/api/v1/dlq', {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map(buffer => this.parseFlatBuffer(buffer))
    );
  }

  private parseFlatBuffer(buffer: ArrayBuffer): DlqEntryItem[] {
    const byteBuffer = new ByteBuffer(new Uint8Array(buffer));
    const entryList = DLQEntryList.getRootAsDLQEntryList(byteBuffer);

    const items: DlqEntryItem[] = [];
    const length = entryList.entriesLength();

    for (let i = 0; i < length; i++) {
      const entry = entryList.entries(i);
      if (entry) {
        items.push({
          id: entry.id() || '',
          payload: entry.payload() || '',
          errorCode: entry.errorCode() || '',
          errorMessage: entry.errorMessage() || '',
          failedAt: entry.failedAt() || ''
        });
      }
    }

    return items;
  }
}
