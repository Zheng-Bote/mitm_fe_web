// SPDX-FileCopyrightText: 2026 ZHENG Robert
// SPDX-License-Identifier: Apache-2.0

import { Component, input, output, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Job } from '../../models/job.model';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmButton } from '@spartan-ng/helm/button';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-scheduler-table',
  templateUrl: './scheduler-table.component.html',
  imports: [...HlmTableImports, HlmButton, DatePipe],
  host: {
    class: 'block w-full overflow-x-auto'
  }
})
export class SchedulerTableComponent {
  readonly authService = inject(AuthService);
  jobs = input<Job[]>([]);
  
  edit = output<Job>();
  delete = output<string>();
  stop = output<string>();
  execute = output<string>();

  onEdit(job: Job) {
    this.edit.emit(job);
  }

  onDelete(jobName: string) {
    this.delete.emit(jobName);
  }

  onStop(jobName: string) {
    this.stop.emit(jobName);
  }

  onExecute(jobName: string) {
    this.execute.emit(jobName);
  }
}
