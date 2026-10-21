/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DlqService } from './services/dlq.service';
import { DlqEntryItem } from './models/dlq-entry.model';
import { DlqComponent } from './dlq.component';

const ENTRY: DlqEntryItem = {
  id: '11111111-1111-1111-1111-111111111111',
  payload: '{"a":1}',
  errorCode: 'VALIDATION_FAILED',
  errorMessage: 'customer.email is invalid',
  failedAt: '2026-10-21T08:00:00Z',
};

describe('DlqComponent', () => {
  let fixture: ComponentFixture<DlqComponent>;
  let getEntries: ReturnType<typeof vi.fn>;

  const element = () => fixture.nativeElement as HTMLElement;
  const refreshButton = () =>
    Array.from(element().querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Refresh DLQ'),
    )!;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    getEntries = vi.fn(() => of([ENTRY]));

    await TestBed.configureTestingModule({
      imports: [DlqComponent],
      providers: [{ provide: DlqService, useValue: { getEntries } }],
    }).compileComponents();

    fixture = TestBed.createComponent(DlqComponent);
    await settle();
  });

  it('shows a hint instead of fetching when the view is opened', () => {
    expect(getEntries).not.toHaveBeenCalled();
    expect(element().textContent).toContain('Not loaded yet');
    expect(element().textContent).not.toContain('VALIDATION_FAILED');
  });

  it('loads the entries on refresh', async () => {
    refreshButton().click();
    await settle();

    expect(getEntries).toHaveBeenCalledTimes(1);
    expect(element().textContent).toContain('VALIDATION_FAILED');
    expect(element().textContent).toContain('customer.email is invalid');
  });
});
