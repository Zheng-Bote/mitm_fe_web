// SPDX-FileCopyrightText: 2026 ZHENG Robert
// SPDX-License-Identifier: Apache-2.0

import cronstrue from 'cronstrue';
import { CronExpressionParser } from 'cron-parser';

/**
 * Weekdays as names: mitm_scheduler-server (Rust crate `cron`) numbers weekdays
 * 1 = SUN … 7 = SAT, unlike Unix cron, so numeric weekdays would be ambiguous.
 */
export const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export type CronMode = 'minutes' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'advanced';

export interface CronSchedule {
  mode: CronMode;
  interval: number;
  minute: number;
  hour: number;
  days: Weekday[];
  dayOfMonth: number;
  expression: string;
}

export const DEFAULT_SCHEDULE: CronSchedule = {
  mode: 'daily',
  interval: 15,
  minute: 0,
  hour: 0,
  days: ['MON'],
  dayOfMonth: 1,
  expression: '',
};

function num(field: string, min: number, max: number): number | null {
  if (!/^\d{1,2}$/.test(field)) return null;
  const n = Number(field);
  return n >= min && n <= max ? n : null;
}

function weekdays(field: string): Weekday[] | null {
  const days = field.toUpperCase().split(',');
  if (!days.every(d => (WEEKDAYS as readonly string[]).includes(d))) return null;
  if (new Set(days).size !== days.length) return null;
  return WEEKDAYS.filter(d => days.includes(d));
}

/** Maps a 5-field cron expression to the editor tab that can represent it; anything else is `advanced`. */
export function parseCron(expression: string): CronSchedule {
  const expr = expression.trim();
  const base: CronSchedule = { ...DEFAULT_SCHEDULE, mode: 'advanced', expression: expr };
  const fields = expr.split(/\s+/);
  if (fields.length !== 5) return base;
  const [mi, h, dom, mon, dow] = fields;
  if (mon !== '*') return base;

  const step = /^\*\/(\d{1,2})$/.exec(mi);
  if (step && h === '*' && dom === '*' && dow === '*') {
    const interval = num(step[1], 1, 59);
    return interval === null ? base : { ...base, mode: 'minutes', interval };
  }

  const minute = num(mi, 0, 59);
  if (minute === null) return base;
  if (h === '*') {
    return dom === '*' && dow === '*' ? { ...base, mode: 'hourly', minute } : base;
  }

  const hour = num(h, 0, 23);
  if (hour === null) return base;
  if (dom === '*' && dow === '*') return { ...base, mode: 'daily', minute, hour };
  if (dom === '*') {
    const days = weekdays(dow);
    return days ? { ...base, mode: 'weekly', minute, hour, days } : base;
  }
  const dayOfMonth = num(dom, 1, 31);
  return dayOfMonth !== null && dow === '*' ? { ...base, mode: 'monthly', minute, hour, dayOfMonth } : base;
}

/** Builds the 5-field cron expression for a schedule. */
export function buildCron(s: CronSchedule): string {
  switch (s.mode) {
    case 'minutes': return `*/${s.interval} * * * *`;
    case 'hourly': return `${s.minute} * * * *`;
    case 'daily': return `${s.minute} ${s.hour} * * *`;
    case 'weekly': return `${s.minute} ${s.hour} * * ${WEEKDAYS.filter(d => s.days.includes(d)).join(',')}`;
    case 'monthly': return `${s.minute} ${s.hour} ${s.dayOfMonth} * *`;
    case 'advanced': return s.expression.trim();
  }
}

function inRange(n: number, min: number, max: number): boolean {
  return Number.isInteger(n) && n >= min && n <= max;
}

/** Returns an error message for out-of-range fields of a non-advanced schedule, or null. */
export function scheduleError(s: CronSchedule): string | null {
  const needsTime = s.mode === 'daily' || s.mode === 'weekly' || s.mode === 'monthly';
  if (s.mode === 'minutes' && !inRange(s.interval, 1, 59)) return 'Interval must be between 1 and 59 minutes.';
  if (s.mode === 'hourly' && !inRange(s.minute, 0, 59)) return 'Minute must be between 0 and 59.';
  if (needsTime && (!inRange(s.hour, 0, 23) || !inRange(s.minute, 0, 59))) return 'Enter a valid time.';
  if (s.mode === 'weekly' && s.days.length === 0) return 'Select at least one weekday.';
  if (s.mode === 'monthly' && !inRange(s.dayOfMonth, 1, 31)) return 'Day of month must be between 1 and 31.';
  return null;
}

/** Validates a cron expression against what mitm_scheduler-server accepts; returns an error message or null. */
export function validateCron(expression: string): string | null {
  const expr = expression.trim();
  if (!expr) return 'A cron expression is required.';
  const fields = expr.split(/\s+/);
  if (fields.length !== 5) return 'Use exactly 5 fields: minute hour day-of-month month day-of-week.';
  if (/\d/.test(fields[4])) return 'Use weekday names (MON–SUN) instead of numbers.';
  try {
    CronExpressionParser.parse(expr, { tz: 'UTC', strict: false });
  } catch {
    return 'Invalid cron expression.';
  }
  return null;
}

/** Plain-English description of a valid cron expression. */
export function describeCron(expression: string): string | null {
  try {
    return cronstrue.toString(expression, { use24HourTimeFormat: true, throwExceptionOnParseError: true });
  } catch {
    return null;
  }
}

/** The next run times (UTC) of a valid cron expression after `from`. */
export function nextRuns(expression: string, count = 3, from: Date = new Date()): Date[] {
  try {
    return CronExpressionParser.parse(expression, { tz: 'UTC', currentDate: from })
      .take(count)
      .map(d => d.toDate());
  } catch {
    return [];
  }
}
