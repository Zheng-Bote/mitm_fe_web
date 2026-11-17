// SPDX-FileCopyrightText: 2026 ZHENG Robert
// SPDX-License-Identifier: Apache-2.0

import { Component, effect, input, output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Job } from '../../models/job.model';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import { CronEditorComponent } from '../cron-editor/cron-editor.component';

/** Parses the args text: empty → `{}`; throws unless it is a JSON object. */
export function parseArgs(text: string): Record<string, unknown> {
  if (!text.trim()) {
    return {};
  }
  const value = JSON.parse(text);
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Args must be a JSON object, e.g. {"topic": "Employee"}.');
  }
  return value;
}

/** Marks the control invalid (`{json: message}`) unless its text is a JSON object. */
export function jsonObjectValidator(control: AbstractControl<string>): ValidationErrors | null {
  try {
    parseArgs(control.value ?? '');
    return null;
  } catch (e) {
    return { json: e instanceof Error ? e.message : String(e) };
  }
}

@Component({
  selector: 'app-job-editor-dialog',
  templateUrl: './job-editor-dialog.component.html',
  imports: [ReactiveFormsModule, HlmButton, HlmCheckbox, HlmFieldImports, HlmInput, CronEditorComponent],
  host: {
    class: 'block w-full'
  }
})
export class JobEditorDialogComponent {
  job = input<Job | null>(null);
  
  save = output<Job>();
  cancel = output<void>();

  form = new FormGroup({
    id: new FormControl<number>(0, { nonNullable: true }),
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    command: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    cron_expr: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    enabled: new FormControl<boolean>(false, { nonNullable: true }),
    restart_on_exit: new FormControl<boolean>(false, { nonNullable: true }),
    args: new FormControl<string>('{}', { nonNullable: true, validators: [jsonObjectValidator] })
  });

  constructor() {
    effect(() => {
      const j = this.job();
      if (j) {
        this.form.patchValue({
          id: j.id,
          name: j.name,
          command: j.command,
          cron_expr: j.cron_expr,
          enabled: j.enabled,
          restart_on_exit: j.restart_on_exit ?? false,
          args: JSON.stringify(j.args ?? {}, null, 2)
        });
        // Name is the unique identifier for API routes, so disable it during edit
        this.form.controls.name.disable();
      } else {
        this.form.reset({ id: 0, cron_expr: '0 0 * * *', enabled: true, restart_on_exit: false, args: '{}' });
        this.form.controls.name.enable();
      }
    });
  }

  onSave() {
    if (this.form.valid) {
      const value = this.form.getRawValue();
      this.save.emit({ ...value, args: parseArgs(value.args) });
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
