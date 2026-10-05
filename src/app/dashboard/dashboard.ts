import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

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
    this.http.get<{ status: string }>('/health').pipe(
      catchError(() => of({ status: 'Error 🔴' }))
    ).subscribe(res => {
      this.systemHealth.set(res.status === 'ready' ? 'Healthy 🟢' : res.status);
    });

    // Info
    this.http.get<any>('/api/v1/system/info').pipe(
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
      } else {
        this.engineInfo.set('Offline');
      }
    });

    // Dashboard Stats (via unified v1 endpoint)
    this.http.get<any>('/api/v1/system/dashboard').pipe(
      catchError(() => of(null))
    ).subscribe(res => {
      if (res) {
        let dbStr = `DB: ${res.db_name || 'mitm'}\n`;
        if (res.db_size) {
          dbStr += `Size: ${res.db_size}\n`;
        }
        dbStr += `${res.db_version || 'Unknown'}\n`;
        this.dbInfo.set(dbStr.trim());

        if (res.stats) {
          this.totalJobs.set(res.stats.total_scheduled_jobs ?? '-');
          this.dlqCursors.set(res.stats.dlq?.count ?? '-');
          this.adminAuditLogs.set(res.stats.admin_audit_logs?.count ?? '-');
          this.systemLogs.set(res.stats.system_logs?.count ?? '-');
          this.jobAuditLogs.set(res.stats.job_audit_logs?.count ?? '-');
          this.transformationErrors.set(res.stats.transformation_errors?.count ?? '-');
        }
      } else {
        this.dbInfo.set('Offline');
        this.totalJobs.set('-');
        this.dlqCursors.set('-');
        this.adminAuditLogs.set('-');
        this.systemLogs.set('-');
        this.jobAuditLogs.set('-');
        this.transformationErrors.set('-');
      }
    });
  }
}
