/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TransformationErrorsService } from './services/transformation-errors.service';
import { TransformationErrorEntry } from './models/transformation-error.model';
import { TransformationErrorsComponent } from './transformation-errors.component';

const ERROR: TransformationErrorEntry = {
  id: '11111111-1111-1111-1111-111111111111',
  correlationId: '22222222-2222-2222-2222-222222222222',
  failedField: 'customer.email',
  ruleName: 'email_format',
  errorMessage: 'invalid email',
  createdAt: '2026-10-21T08:00:00Z',
};

describe('TransformationErrorsComponent', () => {
  let fixture: ComponentFixture<TransformationErrorsComponent>;
  let getErrors: ReturnType<typeof vi.fn>;

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
    getErrors = vi.fn(() => of([ERROR]));

    await TestBed.configureTestingModule({
      imports: [TransformationErrorsComponent],
      providers: [{ provide: TransformationErrorsService, useValue: { getErrors } }],
    }).compileComponents();

    fixture = TestBed.createComponent(TransformationErrorsComponent);
    await settle();
  });

  it('shows a hint instead of fetching when the view is opened', () => {
    expect(getErrors).not.toHaveBeenCalled();
    expect(element().textContent).toContain('Not loaded yet');
    expect(element().textContent).not.toContain('invalid email');
  });

  it('loads the errors on refresh', async () => {
    button('Refresh Transformation Errors').click();
    await settle();

    expect(getErrors).toHaveBeenCalledWith(undefined, undefined);
    expect(element().textContent).toContain('invalid email');
    expect(element().textContent).toContain('email_format');
  });

  it('refetches with an RFC3339 range when the date filter is switched on', async () => {
    checkbox(0).click();
    await settle();

    expect(getErrors).toHaveBeenCalledTimes(1);
    const [from, to] = getErrors.mock.calls[0] as [string, string];
    expect(from).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00Z$/);
    expect(to).toMatch(/^\d{4}-\d{2}-\d{2}T23:59:59Z$/);
  });
});
