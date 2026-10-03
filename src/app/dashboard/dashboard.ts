import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private http = inject(HttpClient);

  systemHealth = signal<string>('Loading...');
  engineInfo = signal<string>('Loading...');
  dbInfo = signal<string>('Loading...');
  totalJobs = signal<number | string>('Loading...');
  dlqCursors = signal<number | string>('Loading...');
  adminAuditLogs = signal<number | string>('Loading...');
  systemLogs = signal<number | string>('Loading...');
  jobAuditLogs = signal<number | string>('Loading...');
  transformationErrors = signal<number | string>('Loading...');

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    // Health
    this.http.get<{status: string}>('/health').pipe(
      catchError(() => of({ status: 'Error 🔴' }))
    ).subscribe(res => {
      this.systemHealth.set(res.status === 'ok' ? 'Healthy 🟢' : res.status);
    });

    // Info
    this.http.get<any>('/api/system/v1/info').pipe(
      catchError(() => of(null))
    ).subscribe(res => {
      if (res) {
        let engineStr = `Engine: ${res.name || 'MitM Core Layer'}\n`;
        if (res.core_components) {
          res.core_components.forEach((c: any) => {
            engineStr += `${c.name} v${c.version}\n`;
          });
        }
        this.engineInfo.set(engineStr.trim());
        
        let dbStr = `DB: ${res.database?.name || 'mitm'}\n`;
        if (res.database?.size) {
          dbStr += `Size: ${res.database.size}\n`;
        }
        dbStr += `${res.database?.version || 'Unknown'}\n`;
        this.dbInfo.set(dbStr.trim());
      } else {
        this.engineInfo.set('Offline');
        this.dbInfo.set('Offline');
      }
    });

    // Dashboard Stats (via individual v1 endpoints)
    const countFallback = catchError(() => of(null));
    
    const getCount = (data: any, field?: string) => {
      if (!data) return '-';
      if (Array.isArray(data)) return data.length;
      if (field && Array.isArray(data[field])) return data[field].length;
      return '-';
    };

    forkJoin({
      jobs: this.http.get<any>('/admin/jobs').pipe(countFallback),
      dlq: this.http.get<any>('/api/public/v1/dlq').pipe(countFallback), // Public V1 endpoint works
      adminAudit: this.http.get<any>('/admin/logs/admin-audit').pipe(countFallback),
      systemLogs: this.http.get<any>('/admin/logs/system').pipe(countFallback),
      jobAudit: this.http.get<any>('/admin/logs/job-audit').pipe(countFallback),
      transformErrors: this.http.get<any>('/admin/transformation/errors').pipe(countFallback)
    }).subscribe(results => {
      this.totalJobs.set(getCount(results.jobs));
      this.dlqCursors.set(getCount(results.dlq));
      this.adminAuditLogs.set(getCount(results.adminAudit, 'logs'));
      this.systemLogs.set(getCount(results.systemLogs, 'logs'));
      this.jobAuditLogs.set(getCount(results.jobAudit, 'logs'));
      this.transformationErrors.set(getCount(results.transformErrors, 'errors'));
    });
  }
}
