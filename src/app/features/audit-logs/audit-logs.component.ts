import { Component, OnInit, OnDestroy, signal, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditLogsService } from './services/audit-logs.service';
import { ExcelExportService } from './services/excel-export.service';
import { AuditLogEntry } from './models/audit-log.model';
import { AuditLogsTableComponent } from './components/audit-logs-table/audit-logs-table.component';
import { ExportReportDialogComponent, ExportReportParams } from './components/export-report-dialog/export-report-dialog.component';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-audit-logs',
  templateUrl: './audit-logs.component.html',
  imports: [
    FormsModule,
    AuditLogsTableComponent,
    ExportReportDialogComponent,
    ...HlmButtonImports
  ]
})
export class AuditLogsComponent implements OnInit, OnDestroy {
  private auditLogsService = inject(AuditLogsService);
  private excelExportService = inject(ExcelExportService);

  logs = signal<AuditLogEntry[]>([]);
  isLoading = signal<boolean>(false);
  
  autoRefresh = signal<boolean>(false);
  useDateRange = signal<boolean>(false);
  
  startDateStr = signal<string>('');
  endDateStr = signal<string>('');
  
  private fetchSubscription?: Subscription;
  private refreshInterval: any;

  constructor() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    
    this.endDateStr.set(end.toISOString().split('T')[0]);
    this.startDateStr.set(start.toISOString().split('T')[0]);

    // Handle auto refresh toggle via effect
    effect((onCleanup) => {
      const isAuto = this.autoRefresh();
      if (isAuto) {
        this.refreshInterval = setInterval(() => this.fetchData(), 5000);
      } else {
        if (this.refreshInterval) {
          clearInterval(this.refreshInterval);
        }
      }
      onCleanup(() => {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
      });
    });
  }

  ngOnInit() {
    this.fetchData();
  }

  ngOnDestroy() {
    if (this.fetchSubscription) {
      this.fetchSubscription.unsubscribe();
    }
  }

  onRefresh() {
    this.fetchData();
  }

  fetchData() {
    this.isLoading.set(true);
    let from: string | undefined;
    let to: string | undefined;
    
    if (this.useDateRange()) {
      from = this.startDateStr();
      to = this.endDateStr();
    }

    if (this.fetchSubscription) {
      this.fetchSubscription.unsubscribe();
    }

    this.fetchSubscription = this.auditLogsService.getLogs(from, to).subscribe({
      next: (data) => {
        this.logs.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch logs', err);
        this.isLoading.set(false);
      }
    });
  }

  exportCsv() {
    const data = this.logs();
    if (data.length === 0) return;

    const headers = ['ID', 'Timestamp', 'Run ID', 'Component', 'Message'];
    const rows = data.map(log => [
      log.id.toString(),
      (log.tsUnixMs ? new Date(log.tsUnixMs).toISOString() : log.ts),
      log.runId.toString(),
      `"${log.component.replace(/"/g, '""')}"`,
      `"${log.message.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  handleExportReport(params: ExportReportParams) {
    this.auditLogsService.getLogs(
      params.startDate.toISOString().split('T')[0],
      params.endDate.toISOString().split('T')[0]
    ).subscribe(data => {
      this.excelExportService.exportReport(
        data,
        params.jobName,
        params.topic,
        params.startDate,
        params.endDate
      );
    });
  }
}
