// SPDX-FileCopyrightText: 2026 ZHENG Robert
// SPDX-License-Identifier: Apache-2.0

import { Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Job } from '../../models/job.model';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';

@Component({
  selector: 'app-job-editor-dialog',
  templateUrl: './job-editor-dialog.component.html',
  imports: [ReactiveFormsModule, HlmButton, HlmCheckbox],
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
    enabled: new FormControl<boolean>(false, { nonNullable: true })
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
          enabled: j.enabled
        });
        // Name is the unique identifier for API routes, so disable it during edit
        this.form.controls.name.disable();
      } else {
        this.form.reset({ id: 0, enabled: true });
        this.form.controls.name.enable();
      }
    });
  }

  onSave() {
    if (this.form.valid) {
      this.save.emit(this.form.getRawValue() as Job);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
