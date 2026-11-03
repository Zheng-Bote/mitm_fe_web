// SPDX-FileCopyrightText: 2026 ZHENG Robert
// SPDX-License-Identifier: Apache-2.0

import { Component, effect, inject, signal, OnDestroy } from '@angular/core';
import { SchedulerService } from './services/scheduler.service';
import { Job } from './models/job.model';
import { SchedulerTableComponent } from './components/scheduler-table/scheduler-table.component';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { JobEditorDialogComponent } from './components/job-editor-dialog/job-editor-dialog.component';

import { AuthService } from '../../core/auth/auth.service';
import { ConfirmService } from '../../core/confirm/confirm.service';

@Component({
  selector: 'app-scheduler',
  templateUrl: './scheduler.component.html',
  imports: [SchedulerTableComponent, HlmButton, HlmCheckbox, HlmLabel, ...HlmDialogImports, ...BrnDialogImports, JobEditorDialogComponent],
  host: {
    class: 'block p-4'
  }
})
export class SchedulerComponent implements OnDestroy {
  readonly schedulerService = inject(SchedulerService);
  readonly authService = inject(AuthService);
  private readonly confirmService = inject(ConfirmService);
  
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
  
  async onDeleteJob(jobName: string) {
    const confirmed = await this.confirmService.confirm({
      title: 'Delete job?',
      message: `Are you sure you want to delete job '${jobName}'?`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (confirmed) {
      this.schedulerService.deleteJob(jobName);
    }
  }

  async onStopJob(jobName: string) {
    const confirmed = await this.confirmService.confirm({
      title: 'Stop job?',
      message: `Are you sure you want to stop job '${jobName}'?`,
      confirmLabel: 'Stop',
      destructive: true,
    });
    if (confirmed) {
      this.schedulerService.stopJob(jobName);
    }
  }

  async onExecuteJob(jobName: string) {
    const confirmed = await this.confirmService.confirm({
      title: 'Execute job?',
      message: `Are you sure you want to execute job '${jobName}'?`,
      confirmLabel: 'Execute',
      destructive: false,
    });
    if (confirmed) {
      this.schedulerService.executeJob(jobName);
    }
  }
}
