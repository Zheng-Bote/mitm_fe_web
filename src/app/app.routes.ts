import { Routes } from '@angular/router';

import { Layout } from './layout/layout';
import { Dashboard } from './dashboard/dashboard';
import { LoginComponent } from './auth/login.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
