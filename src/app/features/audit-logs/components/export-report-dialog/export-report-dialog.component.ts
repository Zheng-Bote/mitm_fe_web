import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';

export interface ExportReportParams {
  jobName: string;
  topic: string;
  startDate: Date;
  endDate: Date;
}

@Component({
  selector: 'app-export-report-dialog',
  templateUrl: './export-report-dialog.component.html',
  imports: [
    FormsModule,
    ...HlmDialogImports,
    ...HlmButtonImports,
    ...BrnDialogImports
  ]
})
export class ExportReportDialogComponent {
  @Output() exportTriggered = new EventEmitter<ExportReportParams>();

  jobName = '';
  topic = '';
  
  // Set default to last 7 days
  startDateStr: string;
  endDateStr: string;

  constructor() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    
    this.endDateStr = end.toISOString().split('T')[0];
    this.startDateStr = start.toISOString().split('T')[0];
  }

  onExport() {
    this.exportTriggered.emit({
      jobName: this.jobName,
      topic: this.topic,
      startDate: new Date(this.startDateStr),
      endDate: new Date(this.endDateStr)
    });
  }
}
