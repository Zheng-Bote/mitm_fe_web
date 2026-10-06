import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemLogItem } from '../../../../core/services/system-logs.service';
import { HlmTableImports } from '@spartan-ng/helm/table';

@Component({
  selector: 'app-system-logs-table',
  imports: [
    CommonModule,
    HlmTableImports,
  ],
  template: `
    <div hlmTableContainer>
      <table hlmTable class="w-full">
        <caption hlmCaption>System Logs</caption>
        <thead hlmTHead>
          <tr hlmTr>
            <th hlmTh class="w-20">ID</th>
            <th hlmTh class="w-48">Timestamp</th>
            <th hlmTh class="w-32">Level</th>
            <th hlmTh class="w-48">Component</th>
            <th hlmTh>Message</th>
          </tr>
        </thead>
        <tbody hlmTBody>
          @for (log of logs(); track log.id) {
            <tr hlmTr>
              <td hlmTd class="w-20 truncate">{{ log.id }}</td>
              <td hlmTd class="w-48">{{ formatTimestamp(log.ts) }}</td>
              <td hlmTd class="w-32 truncate">{{ log.level }}</td>
              <td hlmTd class="w-48 truncate">{{ log.component }}</td>
              <td hlmTd>{{ log.message }}</td>
            </tr>
          }
          @if (logs().length === 0) {
            <tr hlmTr>
              <td hlmTd colspan="5" class="text-center text-muted-foreground">No logs found</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class SystemLogsTableComponent {
  logs = input.required<SystemLogItem[]>();

  formatTimestamp(ts: string): string {
    if (!ts) return '';
    const dt = new Date(ts);
    if (isNaN(dt.getTime())) return ts;
    return dt.toLocaleString(); // Local TZ
  }
}
