import { Component, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DlqEntryItem } from '../../models/dlq-entry.model';
import { HlmTableImports } from '@spartan-ng/helm/table';

@Component({
  selector: 'app-dlq-table',
  imports: [
    CommonModule,
    DatePipe,
    HlmTableImports,
  ],
  template: `
    <div hlmTableContainer>
      <table hlmTable class="w-full">
        <caption hlmCaption>Dead Letter Queue</caption>
        <thead hlmTHead>
          <tr hlmTr>
            <th hlmTh class="w-64">ID</th>
            <th hlmTh class="w-48">Failed At</th>
            <th hlmTh class="w-40">Error Code</th>
            <th hlmTh class="w-64">Error Message</th>
            <th hlmTh>Payload</th>
          </tr>
        </thead>
        <tbody hlmTBody>
          @for (entry of entries(); track entry.id) {
            <tr hlmTr>
              <td hlmTd class="w-64 truncate" [title]="entry.id">{{ entry.id }}</td>
              <td hlmTd class="w-48">{{ entry.failedAt ? (entry.failedAt | date:'yyyy-MM-dd HH:mm:ss') : '' }}</td>
              <td hlmTd class="w-40 truncate">{{ entry.errorCode }}</td>
              <td hlmTd class="w-64 truncate" [title]="entry.errorMessage">{{ entry.errorMessage }}</td>
              <td hlmTd class="max-w-md truncate" [title]="entry.payload">{{ entry.payload }}</td>
            </tr>
          }
          @if (entries().length === 0) {
            <tr hlmTr>
              <td hlmTd colspan="5" class="text-center text-muted-foreground">
                {{ hasLoaded() ? 'No DLQ entries found' : 'Not loaded yet – click "Refresh DLQ" to load entries.' }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class DlqTableComponent {
  entries = input.required<DlqEntryItem[]>();
  hasLoaded = input<boolean>(false);
}
