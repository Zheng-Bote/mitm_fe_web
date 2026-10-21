import { Component, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TransformationErrorEntry } from '../../models/transformation-error.model';
import { HlmTableImports } from '@spartan-ng/helm/table';

@Component({
  selector: 'app-transformation-errors-table',
  imports: [
    CommonModule,
    DatePipe,
    HlmTableImports,
  ],
  template: `
    <div hlmTableContainer>
      <table hlmTable class="w-full">
        <caption hlmCaption>Transformation Errors</caption>
        <thead hlmTHead>
          <tr hlmTr>
            <th hlmTh class="w-64">ID</th>
            <th hlmTh class="w-64">Correlation ID</th>
            <th hlmTh class="w-48">Failed Field</th>
            <th hlmTh class="w-48">Rule Name</th>
            <th hlmTh>Error Message</th>
            <th hlmTh class="w-48">Created At</th>
          </tr>
        </thead>
        <tbody hlmTBody>
          @for (error of errors(); track error.id) {
            <tr hlmTr>
              <td hlmTd class="w-64 truncate" [title]="error.id">{{ error.id }}</td>
              <td hlmTd class="w-64 truncate" [title]="error.correlationId">{{ error.correlationId }}</td>
              <td hlmTd class="w-48 truncate">{{ error.failedField }}</td>
              <td hlmTd class="w-48 truncate">{{ error.ruleName }}</td>
              <td hlmTd class="whitespace-pre-wrap">{{ error.errorMessage }}</td>
              <td hlmTd class="w-48">{{ error.createdAt ? (error.createdAt | date:'yyyy-MM-dd HH:mm:ss') : '' }}</td>
            </tr>
          }
          @if (errors().length === 0) {
            <tr hlmTr>
              <td hlmTd colspan="6" class="text-center text-muted-foreground">
                {{ hasLoaded() ? 'No transformation errors found' : 'Not loaded yet – click "Refresh Transformation Errors" to load logs.' }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class TransformationErrorsTableComponent {
  errors = input.required<TransformationErrorEntry[]>();
  hasLoaded = input<boolean>(false);
}
