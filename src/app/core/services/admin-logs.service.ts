import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ByteBuffer } from 'flatbuffers';
import { AdminAuditLogList } from '../models/schematas/admin-audit-log-list';
import { AdminAuditLog } from '../models/schematas/admin-audit-log';

export interface AdminLogItem {
  id: number;
  username: string;
  action: string;
  details: string;
  ts: string;
  tsUnixMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminLogsService {
  private http = inject(HttpClient);

  getLogs(): Observable<AdminLogItem[]> {
    const headers = new HttpHeaders({
      'Accept': 'application/x-flatbuffers'
    });

    return this.http.get('/api/v1/logs/admin-audit', {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map(buffer => this.parseFlatBuffer(buffer))
    );
  }

  private parseFlatBuffer(buffer: ArrayBuffer): AdminLogItem[] {
    const byteBuffer = new ByteBuffer(new Uint8Array(buffer));
    const logList = AdminAuditLogList.getRootAsAdminAuditLogList(byteBuffer);
    
    const items: AdminLogItem[] = [];
    const length = logList.logsLength();
    
    for (let i = 0; i < length; i++) {
      const log = logList.logs(i);
      if (log) {
        items.push({
          id: Number(log.id()),
          username: log.username() || '',
          action: log.action() || '',
          details: log.details() || '',
          ts: log.ts() || '',
          tsUnixMs: Number(log.tsUnixMs())
        });
      }
    }
    
    return items;
  }
}
