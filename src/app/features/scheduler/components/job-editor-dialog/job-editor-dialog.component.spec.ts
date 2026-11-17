// SPDX-FileCopyrightText: 2026 ZHENG Robert
// SPDX-License-Identifier: Apache-2.0

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobEditorDialogComponent, parseArgs } from './job-editor-dialog.component';
import { Job } from '../../models/job.model';

const monitor: Job = {
  id: 3,
  name: 'Admin Monitor',
  command: 'mitm-admin-monitor',
  cron_expr: '*/5 * * * *',
  enabled: true,
  restart_on_exit: true,
  args: { digest: { to: ['ops@example.com'], enabled: true, hour_utc: 6 }, routing: [{ to: ['ops@example.com'], category: 'job' }] }
};

describe('parseArgs', () => {
  it('treats an empty text as an empty object', () => {
    expect(parseArgs('  ')).toEqual({});
  });

  it('rejects invalid JSON and non-object roots', () => {
    expect(() => parseArgs('{"a":')).toThrow();
    expect(() => parseArgs('[1, 2]')).toThrow('JSON object');
    expect(() => parseArgs('null')).toThrow('JSON object');
    expect(() => parseArgs('42')).toThrow('JSON object');
  });
});

describe('JobEditorDialogComponent', () => {
  let fixture: ComponentFixture<JobEditorDialogComponent>;
  let component: JobEditorDialogComponent;
  let saved: Job | undefined;

  function open(job: Job | null) {
    fixture.componentRef.setInput('job', job);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [JobEditorDialogComponent] }).compileComponents();
    fixture = TestBed.createComponent(JobEditorDialogComponent);
    component = fixture.componentInstance;
    saved = undefined;
    component.save.subscribe(job => (saved = job));
  });

  it('starts a new job with empty args and restart_on_exit off', () => {
    open(null);
    expect(component.form.controls.args.value).toBe('{}');
    expect(component.form.controls.restart_on_exit.value).toBe(false);
  });

  it('saves an unchanged job with identical args and restart_on_exit', () => {
    open(monitor);
    expect(JSON.parse(component.form.controls.args.value)).toEqual(monitor.args);
    component.onSave();
    expect(saved).toEqual({ ...monitor });
  });

  it('sends edited args as an object', () => {
    open(null);
    component.form.patchValue({ name: 'transform-employee', command: 'mitm-transformation', args: '{"topic": "Employee", "workers": 5}' });
    component.onSave();
    expect(saved?.args).toEqual({ topic: 'Employee', workers: 5 });
    expect(saved?.restart_on_exit).toBe(false);
  });

  it('blocks saving and shows the error for args that are not a JSON object', () => {
    open(monitor);
    component.form.controls.args.setValue('["not", "an", "object"]');
    fixture.detectChanges();

    expect(component.form.invalid).toBe(true);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#args-error')?.textContent).toContain('JSON object');
    expect(el.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
    component.onSave();
    expect(saved).toBeUndefined();
  });
});
