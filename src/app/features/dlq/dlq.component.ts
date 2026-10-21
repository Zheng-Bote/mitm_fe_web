import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DlqService } from './services/dlq.service';
import { DlqEntryItem } from './models/dlq-entry.model';
import { DlqTableComponent } from './components/dlq-table/dlq-table.component';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { saveAs } from 'file-saver';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dlq',
  imports: [
    CommonModule,
    DlqTableComponent,
    HlmButtonImports
  ],
  template: `
    <div class="flex flex-col h-full p-4 gap-4">
      <!-- Header Actions -->
      <div class="flex flex-wrap items-center gap-4 border-b pb-4">
        <h1 class="text-2xl font-bold mr-auto">Dead Letter Queue</h1>

        <button hlmBtn variant="outline" (click)="refresh()" [disabled]="isLoading()">
          {{ isLoading() ? 'Refreshing...' : 'Refresh DLQ' }}
        </button>

        <button hlmBtn variant="default" (click)="exportCsv()" [disabled]="entries().length === 0">
          Export CSV
        </button>
      </div>

      <!-- Data Table -->
      <div class="flex-1 overflow-auto">
        <app-dlq-table [entries]="entries()" [hasLoaded]="hasLoaded()" />
      </div>
    </div>
  `
})
export class DlqComponent implements OnDestroy {
  private dlqService = inject(DlqService);

  entries = signal<DlqEntryItem[]>([]);
  isLoading = signal(false);
  hasLoaded = signal(false);

  private fetchSubscription?: Subscription;

  ngOnDestroy() {
    if (this.fetchSubscription) {
      this.fetchSubscription.unsubscribe();
    }
  }

  refresh() {
    this.isLoading.set(true);

    if (this.fetchSubscription) {
      this.fetchSubscription.unsubscribe();
    }

    this.fetchSubscription = this.dlqService.getEntries().subscribe({
      next: (data) => {
        this.entries.set(data);
        this.hasLoaded.set(true);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch DLQ entries:', err);
        this.isLoading.set(false);
      }
    });
  }

  exportCsv() {
    const data = this.entries();
    if (!data.length) return;

    const headers = ['ID', 'Failed At', 'Error Code', 'Error Message', 'Payload'];
    const csvRows = [];
    csvRows.push(headers.map(h => `"${h}"`).join(','));

    for (const row of data) {
      const values = [
        row.id,
        row.failedAt ? new Date(row.failedAt).toLocaleString() : '',
        row.errorCode,
        row.errorMessage,
        row.payload
      ];
      csvRows.push(values.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'dlq_entries.csv');
  }
}
