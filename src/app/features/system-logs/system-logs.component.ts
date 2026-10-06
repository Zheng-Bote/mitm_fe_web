import { Component, inject, signal, effect, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SystemLogsService, SystemLogItem } from '../../core/services/system-logs.service';
import { SystemLogsTableComponent } from './components/system-logs-table/system-logs-table.component';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { saveAs } from 'file-saver';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-system-logs',
  imports: [
    CommonModule,
    FormsModule,
    SystemLogsTableComponent,
    HlmButtonImports
  ],
  template: `
    <div class="flex flex-col h-full p-4 gap-4">
      <!-- Header Actions -->
      <div class="flex items-center gap-4 border-b pb-4">
        <h1 class="text-2xl font-bold mr-auto">System Logs</h1>

        <button hlmBtn variant="outline" (click)="refresh()" [disabled]="isLoading()">
          {{ isLoading() ? 'Refreshing...' : 'Refresh System Logs' }}
        </button>

        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox"
                 [ngModel]="autoRefresh()"
                 (ngModelChange)="autoRefresh.set($event)"
                 class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
          Auto-Refresh (5s)
        </label>

        <button hlmBtn variant="default" (click)="exportCsv()" [disabled]="logs().length === 0">
          Export CSV
        </button>
      </div>

      <!-- Data Table -->
      <div class="flex-1 overflow-auto">
        <app-system-logs-table [logs]="logs()" />
      </div>
    </div>
  `
})
export class SystemLogsComponent implements OnInit, OnDestroy {
  private logsService = inject(SystemLogsService);

  logs = signal<SystemLogItem[]>([]);
  isLoading = signal(false);
  autoRefresh = signal(false);

  private autoRefreshSub?: Subscription;

  constructor() {
    effect(() => {
      const isAuto = this.autoRefresh();
      if (isAuto) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    });
  }

  ngOnInit() {
    this.refresh();
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
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
        console.error('Failed to fetch system logs:', err);
        // Error handling could show a toast here.
        this.isLoading.set(false);
      }
    });
  }

  private startAutoRefresh() {
    if (this.autoRefreshSub) return;
    // The C++ client does auto-refresh every 5s.
    this.autoRefreshSub = interval(5000).subscribe(() => {
      this.refresh();
    });
  }

  private stopAutoRefresh() {
    if (this.autoRefreshSub) {
      this.autoRefreshSub.unsubscribe();
      this.autoRefreshSub = undefined;
    }
  }

  exportCsv() {
    const data = this.logs();
    if (!data.length) return;

    const headers = ['ID', 'Timestamp', 'Level', 'Component', 'Message'];
    const csvRows = [];
    csvRows.push(headers.map(h => `"${h}"`).join(','));

    for (const row of data) {
      const tsFormatted = this.formatTimestamp(row.ts);
      const values = [
        row.id.toString(),
        tsFormatted,
        row.level,
        row.component,
        row.message
      ];
      csvRows.push(values.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'system_logs.csv');
  }

  private formatTimestamp(ts: string): string {
    if (!ts) return '';
    const dt = new Date(ts);
    if (isNaN(dt.getTime())) return ts;
    return dt.toLocaleString();
  }
}
