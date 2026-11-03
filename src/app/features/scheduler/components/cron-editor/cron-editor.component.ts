// SPDX-FileCopyrightText: 2026 ZHENG Robert
// SPDX-License-Identifier: Apache-2.0

import { Component, computed, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import {
  buildCron,
  CronMode,
  CronSchedule,
  DEFAULT_SCHEDULE,
  describeCron,
  nextRuns,
  parseCron,
  scheduleError,
  validateCron,
  Weekday,
  WEEKDAYS,
} from './cron-schedule';

/**
 * Form control for 5-field cron expressions with presets (minutes, hourly, daily,
 * weekly, monthly) and a raw "advanced" mode. Times are UTC, as in mitm_scheduler-server.
 */
@Component({
  selector: 'app-cron-editor',
  templateUrl: './cron-editor.component.html',
  imports: [HlmTabsImports, HlmInput, HlmButton],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CronEditorComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => CronEditorComponent), multi: true },
  ],
  host: {
    class: 'block w-full',
    '(focusout)': 'onTouched()',
  },
})
export class CronEditorComponent implements ControlValueAccessor, Validator {
  readonly weekdays = WEEKDAYS;
  readonly tabs: { mode: CronMode; label: string }[] = [
    { mode: 'minutes', label: 'Minutes' },
    { mode: 'hourly', label: 'Hourly' },
    { mode: 'daily', label: 'Daily' },
    { mode: 'weekly', label: 'Weekly' },
    { mode: 'monthly', label: 'Monthly' },
    { mode: 'advanced', label: 'Advanced' },
  ];

  readonly schedule = signal<CronSchedule>({ ...DEFAULT_SCHEDULE });
  readonly disabled = signal(false);

  readonly expression = computed(() => buildCron(this.schedule()));
  readonly error = computed(() => {
    const s = this.schedule();
    return (s.mode === 'advanced' ? null : scheduleError(s)) ?? validateCron(this.expression());
  });
  readonly description = computed(() => (this.error() ? null : describeCron(this.expression())));
  readonly runs = computed(() => (this.error() ? [] : nextRuns(this.expression())));
  readonly time = computed(() => {
    const { hour, minute } = this.schedule();
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  });

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.schedule.set(parseCron(value ?? ''));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  validate(): ValidationErrors | null {
    const error = this.error();
    return error ? { cron: error } : null;
  }

  selectMode(mode: string): void {
    const current = this.schedule();
    if (mode === current.mode) return;
    // Advanced starts from the expression built so far, so presets can be fine-tuned by hand.
    const expression = mode === 'advanced' ? this.expression() : current.expression;
    this.update({ mode: mode as CronMode, expression });
  }

  setNumber(key: 'interval' | 'minute' | 'dayOfMonth', event: Event): void {
    this.update({ [key]: (event.target as HTMLInputElement).valueAsNumber });
  }

  setTime(event: Event): void {
    const match = /^(\d{2}):(\d{2})/.exec((event.target as HTMLInputElement).value);
    this.update(match ? { hour: Number(match[1]), minute: Number(match[2]) } : { hour: NaN, minute: NaN });
  }

  toggleDay(day: Weekday): void {
    const days = this.schedule().days;
    this.update({ days: days.includes(day) ? days.filter(d => d !== day) : [...days, day] });
  }

  setExpression(event: Event): void {
    this.update({ expression: (event.target as HTMLInputElement).value });
  }

  formatRun(date: Date): string {
    return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  }

  private update(patch: Partial<CronSchedule>): void {
    this.schedule.update(s => ({ ...s, ...patch }));
    this.onChange(this.expression());
  }
}
