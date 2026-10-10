import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent) 
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout').then(m => m.Layout),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard) 
      },
      {
        path: 'scheduler',
        loadChildren: () => import('./features/scheduler/scheduler.routes')
      },
      {
        path: 'system-logs',
        loadComponent: () => import('./features/system-logs/system-logs.component').then(m => m.SystemLogsComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'USER'] }
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./features/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent)
      },
      {
        path: 'admin-logs',
        loadComponent: () => import('./features/admin-logs/admin-logs.component').then(m => m.AdminLogsComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'rbac',
        loadComponent: () => import('./features/rbac/rbac.component').then(m => m.RbacComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'upload',
        loadComponent: () => import('./features/upload/upload.component').then(m => m.UploadComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'USER'] }
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
