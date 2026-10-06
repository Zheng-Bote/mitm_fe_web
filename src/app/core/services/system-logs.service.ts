import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ByteBuffer } from 'flatbuffers';
import { SystemLogList } from '../models/schematas/system-log-list';
import { SystemLog } from '../models/schematas/system-log';

export interface SystemLogItem {
  id: number;
  level: string;
  component: string;
  message: string;
  ts: string;
  tsUnixMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class SystemLogsService {
  private http = inject(HttpClient);

  getLogs(): Observable<SystemLogItem[]> {
    const headers = new HttpHeaders({
      'Accept': 'application/x-flatbuffers'
    });

    return this.http.get('/api/v1/logs/system', {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map(buffer => this.parseFlatBuffer(buffer))
    );
  }

  private parseFlatBuffer(buffer: ArrayBuffer): SystemLogItem[] {
    const byteBuffer = new ByteBuffer(new Uint8Array(buffer));
    const logList = SystemLogList.getRootAsSystemLogList(byteBuffer);
    
    const items: SystemLogItem[] = [];
    const length = logList.logsLength();
    
    for (let i = 0; i < length; i++) {
      const log = logList.logs(i);
      if (log) {
        items.push({
          id: Number(log.id()),
          level: log.level() || '',
          component: log.component() || '',
          message: log.message() || '',
          ts: log.ts() || '',
          tsUnixMs: Number(log.tsUnixMs())
        });
      }
    }
    
    return items;
  }
}
