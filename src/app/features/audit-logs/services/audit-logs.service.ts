import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import * as flatbuffers from 'flatbuffers';
import { JobAuditLogList } from '../../../schematas/schematas/job-audit-log-list';
import { AuditLogEntry } from '../models/audit-log.model';

@Injectable({
  providedIn: 'root'
})
export class AuditLogsService {
  private http = inject(HttpClient);

  getLogs(from?: string, to?: string): Observable<AuditLogEntry[]> {
    let url = '/api/v1/logs/audit';
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    return this.http.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'application/x-flatbuffers'
      }
    }).pipe(
      map(buffer => this.parseFlatBuffer(buffer))
    );
  }

  private parseFlatBuffer(buffer: ArrayBuffer): AuditLogEntry[] {
    const bytes = new Uint8Array(buffer);
    const bb = new flatbuffers.ByteBuffer(bytes);
    
    // Attempt to parse the flatbuffer
    try {
      const list = JobAuditLogList.getRootAsJobAuditLogList(bb);
      const result: AuditLogEntry[] = [];
      const length = list.logsLength();
      
      for (let i = 0; i < length; i++) {
        const log = list.logs(i);
        if (log) {
          result.push({
            // Convert BigInt to Number (safe for standard timestamps and normal IDs)
            id: Number(log.id()),
            runId: Number(log.runId()),
            component: log.component() || '',
            message: log.message() || '',
            ts: log.ts() || '',
            tsUnixMs: Number(log.tsUnixMs())
          });
        }
      }
      return result;
    } catch (e) {
      console.error('Failed to parse FlatBuffer data for Audit Logs', e);
      return [];
    }
  }
}
