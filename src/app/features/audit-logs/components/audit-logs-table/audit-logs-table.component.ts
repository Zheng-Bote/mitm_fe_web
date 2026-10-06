import { Component, input } from '@angular/core';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { AuditLogEntry } from '../../models/audit-log.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-audit-logs-table',
  templateUrl: './audit-logs-table.component.html',
  imports: [...HlmTableImports, DatePipe]
})
export class AuditLogsTableComponent {
  logs = input.required<AuditLogEntry[]>();
}
