// SPDX-FileCopyrightText: 2026 ZHENG Robert
// SPDX-License-Identifier: Apache-2.0

import { Component, effect, inject, signal, OnDestroy } from '@angular/core';
import { SchedulerService } from './services/scheduler.service';
import { Job } from './models/job.model';
import { SchedulerTableComponent } from './components/scheduler-table/scheduler-table.component';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { JobEditorDialogComponent } from './components/job-editor-dialog/job-editor-dialog.component';

@Component({
  selector: 'app-scheduler',
  templateUrl: './scheduler.component.html',
  imports: [SchedulerTableComponent, HlmButton, ...HlmDialogImports, ...BrnDialogImports, JobEditorDialogComponent],
  host: {
    class: 'block p-4'
  }
})
export class SchedulerComponent implements OnDestroy {
  readonly schedulerService = inject(SchedulerService);
  
  readonly jobs = this.schedulerService.jobs;
  readonly isLoading = this.schedulerService.isLoading;
  readonly error = this.schedulerService.error;

  readonly autoRefreshEnabled = signal(false);
  private pollingTimer: any;

  readonly selectedJob = signal<Job | null>(null);
  readonly dialogState = signal<'open' | 'closed'>('closed');

  constructor() {
    this.schedulerService.loadJobs();

    effect(() => {
      if (this.autoRefreshEnabled()) {
        this.startPolling();
      } else {
        this.stopPolling();
      }
    });
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  private startPolling() {
    this.stopPolling();
    this.pollingTimer = setInterval(() => {
      this.schedulerService.loadJobs();
    }, 5000);
  }

  private stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  onRefresh() {
    this.schedulerService.loadJobs();
  }

  toggleAutoRefresh() {
    this.autoRefreshEnabled.update(val => !val);
  }

  onAddJob() {
    this.selectedJob.set(null);
    this.dialogState.set('open');
  }

  onEditJob(job: Job) {
    this.selectedJob.set(job);
    this.dialogState.set('open');
  }

  closeDialog() {
    this.dialogState.set('closed');
  }

  async onSaveJob(job: Job) {
    try {
      if (this.selectedJob()) {
        await this.schedulerService.editJob(job);
      } else {
        await this.schedulerService.addJob(job);
      }
      this.closeDialog();
    } catch (e) {
      // Error is caught and displayed by the service
    }
  }
  
  onDeleteJob(jobName: string) {
    if (confirm(`Are you sure you want to delete job '${jobName}'?`)) {
      this.schedulerService.deleteJob(jobName);
    }
  }

  onStopJob(jobName: string) {
    if (confirm(`Are you sure you want to stop job '${jobName}'?`)) {
      this.schedulerService.stopJob(jobName);
    }
  }

  onExecuteJob(jobName: string) {
    if (confirm(`Are you sure you want to execute job '${jobName}'?`)) {
      this.schedulerService.executeJob(jobName);
    }
  }
}
