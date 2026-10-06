// SPDX-FileCopyrightText: 2026 ZHENG Robert
// SPDX-License-Identifier: Apache-2.0

import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./scheduler.component').then(m => m.SchedulerComponent)
  }
] satisfies Routes;
