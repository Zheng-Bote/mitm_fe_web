import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransformationErrorsService } from './services/transformation-errors.service';
import { TransformationErrorEntry } from './models/transformation-error.model';
import { TransformationErrorsTableComponent } from './components/transformation-errors-table/transformation-errors-table.component';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { saveAs } from 'file-saver';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-transformation-errors',
  imports: [
    CommonModule,
    FormsModule,
    TransformationErrorsTableComponent,
    HlmButtonImports
  ],
  template: `
    <div class="flex flex-col h-full p-4 gap-4">
      <!-- Header Actions -->
      <div class="flex flex-wrap items-center gap-4 border-b pb-4">
        <h1 class="text-2xl font-bold mr-auto">Transformation Errors</h1>

        <button hlmBtn variant="outline" (click)="refresh()" [disabled]="isLoading()">
          {{ isLoading() ? 'Refreshing...' : 'Refresh Transformation Errors' }}
        </button>

        <div class="flex items-center gap-2 border-l pl-4">
          <label class="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox"
                   [ngModel]="useDateRange()"
                   (ngModelChange)="useDateRange.set($event); useDateRange() ? refresh() : null"
                   class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
            Filter by Date
          </label>

          <input type="date"
                 [ngModel]="startDateStr()"
                 (ngModelChange)="startDateStr.set($event); useDateRange() ? refresh() : null"
                 [disabled]="!useDateRange()"
                 class="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50" />

          <span class="text-sm">to</span>

          <input type="date"
                 [ngModel]="endDateStr()"
                 (ngModelChange)="endDateStr.set($event); useDateRange() ? refresh() : null"
                 [disabled]="!useDateRange()"
                 class="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50" />
        </div>

        <button hlmBtn variant="default" (click)="exportCsv()" [disabled]="errors().length === 0">
          Export CSV
        </button>
      </div>

      <!-- Data Table -->
      <div class="flex-1 overflow-auto">
        <app-transformation-errors-table [errors]="errors()" [hasLoaded]="hasLoaded()" />
      </div>
    </div>
  `
})
export class TransformationErrorsComponent implements OnDestroy {
  private errorsService = inject(TransformationErrorsService);

  errors = signal<TransformationErrorEntry[]>([]);
  isLoading = signal(false);
  hasLoaded = signal(false);

  useDateRange = signal(false);
  startDateStr = signal<string>('');
  endDateStr = signal<string>('');

  private fetchSubscription?: Subscription;

  constructor() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);

    this.endDateStr.set(end.toISOString().split('T')[0]);
    this.startDateStr.set(start.toISOString().split('T')[0]);
  }

  ngOnDestroy() {
    if (this.fetchSubscription) {
      this.fetchSubscription.unsubscribe();
    }
  }

  refresh() {
    this.isLoading.set(true);

    let from: string | undefined;
    let to: string | undefined;

    if (this.useDateRange()) {
      // The backend parses the range as RFC3339.
      from = `${this.startDateStr()}T00:00:00Z`;
      to = `${this.endDateStr()}T23:59:59Z`;
    }

    if (this.fetchSubscription) {
      this.fetchSubscription.unsubscribe();
    }

    this.fetchSubscription = this.errorsService.getErrors(from, to).subscribe({
      next: (data) => {
        this.errors.set(data);
        this.hasLoaded.set(true);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch transformation errors:', err);
        this.isLoading.set(false);
      }
    });
  }

  exportCsv() {
    const data = this.errors();
    if (!data.length) return;

    const headers = ['ID', 'Correlation ID', 'Failed Field', 'Rule Name', 'Error Message', 'Created At'];
    const csvRows = [];
    csvRows.push(headers.map(h => `"${h}"`).join(','));

    for (const row of data) {
      const values = [
        row.id,
        row.correlationId,
        row.failedField,
        row.ruleName,
        row.errorMessage,
        row.createdAt ? new Date(row.createdAt).toLocaleString() : ''
      ];
      csvRows.push(values.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'transformation_errors.csv');
  }
}
