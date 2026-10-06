import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminLogsService, AdminLogItem } from '../../core/services/admin-logs.service';
import { AdminLogsTableComponent } from './components/admin-logs-table/admin-logs-table.component';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-admin-logs',
  imports: [
    CommonModule,
    AdminLogsTableComponent,
    HlmButtonImports
  ],
  template: `
    <div class="flex flex-col h-full p-4 gap-4">
      <!-- Header Actions -->
      <div class="flex items-center gap-4 border-b pb-4">
        <h1 class="text-2xl font-bold mr-auto">Admin Audit Logs</h1>

        <button hlmBtn variant="outline" (click)="refresh()" [disabled]="isLoading()">
          {{ isLoading() ? 'Refreshing...' : 'Refresh Admin Logs' }}
        </button>

        <button hlmBtn variant="default" (click)="exportCsv()" [disabled]="logs().length === 0">
          Export CSV
        </button>
      </div>

      <!-- Data Table -->
      <div class="flex-1 overflow-auto">
        <app-admin-logs-table [logs]="logs()" />
      </div>
    </div>
  `
})
export class AdminLogsComponent implements OnInit {
  private logsService = inject(AdminLogsService);

  logs = signal<AdminLogItem[]>([]);
  isLoading = signal(false);

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    
    this.logsService.getLogs().subscribe({
      next: (data) => {
        this.logs.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch admin logs:', err);
        this.isLoading.set(false);
      }
    });
  }

  exportCsv() {
    const data = this.logs();
    if (!data.length) return;

    const headers = ['ID', 'Timestamp', 'Username', 'Action', 'Details'];
    const csvRows = [];
    csvRows.push(headers.map(h => `"${h}"`).join(','));

    for (const row of data) {
      const tsFormatted = this.formatTimestamp(row.ts);
      const values = [
        row.id.toString(),
        tsFormatted,
        row.username,
        row.action,
        row.details
      ];
      csvRows.push(values.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'admin_logs.csv');
  }

  private formatTimestamp(ts: string): string {
    if (!ts) return '';
    const dt = new Date(ts);
    if (isNaN(dt.getTime())) return ts;
    return dt.toLocaleString();
  }
}
