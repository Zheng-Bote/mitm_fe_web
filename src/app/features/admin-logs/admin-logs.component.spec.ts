/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AdminLogsService, AdminLogItem } from '../../core/services/admin-logs.service';
import { AdminLogsComponent } from './admin-logs.component';

const LOG: AdminLogItem = {
  id: 1,
  username: 'alice',
  action: 'login',
  details: 'passkey',
  ts: '2026-10-21T08:00:00Z',
  tsUnixMs: 0,
};

describe('AdminLogsComponent', () => {
  let fixture: ComponentFixture<AdminLogsComponent>;
  let getLogs: ReturnType<typeof vi.fn>;

  const element = () => fixture.nativeElement as HTMLElement;
  const refreshButton = () =>
    Array.from(element().querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Refresh Admin Logs'),
    )!;

  beforeEach(async () => {
    getLogs = vi.fn(() => of([LOG]));

    await TestBed.configureTestingModule({
      imports: [AdminLogsComponent],
      providers: [{ provide: AdminLogsService, useValue: { getLogs } }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLogsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('shows a hint instead of fetching when the view is opened', () => {
    expect(getLogs).not.toHaveBeenCalled();
    expect(element().textContent).toContain('Not loaded yet');
    expect(element().textContent).not.toContain('alice');
  });

  it('loads the logs on refresh', () => {
    refreshButton().click();
    fixture.detectChanges();

    expect(getLogs).toHaveBeenCalledTimes(1);
    expect(element().textContent).toContain('alice');
  });
});
