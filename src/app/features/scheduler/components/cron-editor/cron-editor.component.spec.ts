import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CronEditorComponent } from './cron-editor.component';

@Component({
  imports: [ReactiveFormsModule, CronEditorComponent],
  template: `<app-cron-editor [formControl]="control" />`,
})
class HostComponent {
  control = new FormControl('', { nonNullable: true });
}

describe('CronEditorComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;

  async function setValue(value: string) {
    host.control.setValue(value);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function selectedTab(): string | null {
    return el.querySelector('[role="tab"][data-state="active"]')?.textContent?.trim() ?? null;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('opens a daily schedule in the Daily tab with description and next runs', async () => {
    await setValue('30 6 * * *');
    expect(selectedTab()).toBe('Daily');
    expect(el.querySelector<HTMLInputElement>('input[type="time"]')!.value).toBe('06:30');
    expect(el.textContent).toContain('At 06:30 (UTC)');
    expect(el.querySelectorAll('li').length).toBe(3);
    expect(host.control.valid).toBe(true);
  });

  it('opens unsupported expressions unchanged in the Advanced tab', async () => {
    await setValue('55 */8 * * *');
    expect(selectedTab()).toBe('Advanced');
    expect(el.querySelector<HTMLInputElement>('input[type="text"]')!.value).toBe('55 */8 * * *');
    expect(host.control.value).toBe('55 */8 * * *');
  });

  it('updates the form value when weekdays are toggled', async () => {
    await setValue('0 8 * * MON');
    const fri = Array.from(el.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')).find(b => b.textContent?.trim() === 'FRI')!;
    fri.click();
    fixture.detectChanges();
    expect(host.control.value).toBe('0 8 * * MON,FRI');
  });

  it('marks numeric weekdays as invalid', async () => {
    await setValue('0 0 * * 1');
    expect(host.control.valid).toBe(false);
    expect(host.control.errors?.['cron']).toContain('weekday names');
    expect(el.textContent).toContain('weekday names');
  });

  it('carries the built expression into the Advanced tab', async () => {
    await setValue('*/10 * * * *');
    const editor = fixture.debugElement.children[0].componentInstance as CronEditorComponent;
    editor.selectMode('advanced');
    fixture.detectChanges();
    expect(selectedTab()).toBe('Advanced');
    expect(el.querySelector<HTMLInputElement>('input[type="text"]')!.value).toBe('*/10 * * * *');
  });
});
