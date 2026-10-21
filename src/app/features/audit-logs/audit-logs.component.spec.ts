/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuditLogsService } from './services/audit-logs.service';
import { AuditLogEntry } from './models/audit-log.model';
import { AuditLogsComponent } from './audit-logs.component';

const LOG: AuditLogEntry = {
  id: 1,
  runId: 7,
  component: 'core',
  message: 'hello',
  ts: '2026-10-21T08:00:00Z',
  tsUnixMs: 0,
};

describe('AuditLogsComponent', () => {
  let fixture: ComponentFixture<AuditLogsComponent>;
  let getLogs: ReturnType<typeof vi.fn>;

  const element = () => fixture.nativeElement as HTMLElement;
  const button = (label: string) =>
    Array.from(element().querySelectorAll('button')).find((b) =>
      b.textContent?.includes(label),
    )!;
  const checkbox = (index: number) =>
    element().querySelectorAll<HTMLInputElement>('input[type="checkbox"]')[index];
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    getLogs = vi.fn(() => of([LOG]));

    await TestBed.configureTestingModule({
      imports: [AuditLogsComponent],
      providers: [{ provide: AuditLogsService, useValue: { getLogs } }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLogsComponent);
    await settle();
  });

  it('shows a hint instead of fetching when the view is opened', () => {
    expect(getLogs).not.toHaveBeenCalled();
    expect(element().textContent).toContain('Not loaded yet');
    expect(element().textContent).not.toContain('hello');
  });

  it('loads the logs on refresh and enables auto-refresh only after that', async () => {
    expect(checkbox(0).disabled).toBe(true);

    button('Refresh Job Audits').click();
    await settle();

    expect(getLogs).toHaveBeenCalledWith(undefined, undefined);
    expect(element().textContent).toContain('hello');
    expect(checkbox(0).disabled).toBe(false);
  });

  it('refetches immediately when the date filter is switched on', async () => {
    checkbox(1).click();
    await settle();

    expect(getLogs).toHaveBeenCalledTimes(1);
    const [from, to] = getLogs.mock.calls[0] as [string, string];
    expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
