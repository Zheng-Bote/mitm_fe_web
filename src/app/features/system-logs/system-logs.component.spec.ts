/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SystemLogsService, SystemLogItem } from '../../core/services/system-logs.service';
import { SystemLogsComponent } from './system-logs.component';

const LOG: SystemLogItem = {
  id: 1,
  level: 'INFO',
  component: 'core',
  message: 'hello',
  ts: '2026-10-21T08:00:00Z',
  tsUnixMs: 0,
};

describe('SystemLogsComponent', () => {
  let fixture: ComponentFixture<SystemLogsComponent>;
  let getLogs: ReturnType<typeof vi.fn>;

  const element = () => fixture.nativeElement as HTMLElement;
  const refreshButton = () =>
    Array.from(element().querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Refresh'),
    )!;
  const autoRefreshBox = () => element().querySelector<HTMLInputElement>('input[type="checkbox"]')!;

  beforeEach(async () => {
    getLogs = vi.fn(() => of([LOG]));

    await TestBed.configureTestingModule({
      imports: [SystemLogsComponent],
      providers: [{ provide: SystemLogsService, useValue: { getLogs } }],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemLogsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('shows a hint instead of fetching when the view is opened', () => {
    expect(getLogs).not.toHaveBeenCalled();
    expect(element().textContent).toContain('Not loaded yet');
    expect(element().textContent).not.toContain('hello');
  });

  it('loads the logs on refresh and enables auto-refresh only after that', async () => {
    expect(autoRefreshBox().disabled).toBe(true);

    refreshButton().click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getLogs).toHaveBeenCalledTimes(1);
    expect(element().textContent).toContain('hello');
    expect(autoRefreshBox().disabled).toBe(false);
  });
});
