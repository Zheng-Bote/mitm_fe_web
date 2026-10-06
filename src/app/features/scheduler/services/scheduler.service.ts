// SPDX-FileCopyrightText: 2026 ZHENG Robert
// SPDX-License-Identifier: Apache-2.0

import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Job } from '../models/job.model';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SchedulerService {
  private readonly http = inject(HttpClient);
  
  // State
  readonly jobs = signal<Job[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  private readonly API_URL = '/api/v1/jobs';

  async loadJobs(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.http.get<Job[]>(this.API_URL));
      this.jobs.set(data || []);
    } catch (err: any) {
      this.error.set(this.formatError(err, 'Failed to load jobs'));
      this.jobs.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private formatError(err: any, fallback: string): string {
    if (err?.status === 403) return 'Permission Denied (403): You need ADMIN rights.';
    return err?.error?.message || err?.message || fallback;
  }

  async addJob(job: Job): Promise<void> {
    try {
      await firstValueFrom(this.http.post(this.API_URL, [job]));
      await this.loadJobs();
    } catch (err: any) {
      this.error.set(this.formatError(err, 'Failed to add job'));
      throw err;
    }
  }

  async editJob(job: Job): Promise<void> {
    try {
      await firstValueFrom(this.http.post(this.API_URL, [job]));
      await this.loadJobs();
    } catch (err: any) {
      this.error.set(this.formatError(err, 'Failed to update job'));
      throw err;
    }
  }

  async deleteJob(jobName: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.API_URL}/${jobName}`));
      await this.loadJobs();
    } catch (err: any) {
      this.error.set(this.formatError(err, 'Failed to delete job'));
      throw err;
    }
  }

  async stopJob(jobName: string): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.API_URL}/${jobName}/stop`, {}));
      await this.loadJobs();
    } catch (err: any) {
      this.error.set(this.formatError(err, 'Failed to stop job'));
      throw err;
    }
  }

  async executeJob(jobName: string): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.API_URL}/${jobName}/execute`, {}));
      await this.loadJobs();
    } catch (err: any) {
      this.error.set(this.formatError(err, 'Failed to execute job'));
      throw err;
    }
  }
}
