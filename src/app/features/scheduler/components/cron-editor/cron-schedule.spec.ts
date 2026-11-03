import { buildCron, describeCron, nextRuns, parseCron, scheduleError, validateCron } from './cron-schedule';

describe('cron-schedule', () => {
  it.each([
    ['*/15 * * * *', 'minutes'],
    ['5 * * * *', 'hourly'],
    ['30 6 * * *', 'daily'],
    ['30 6 * * MON,FRI', 'weekly'],
    ['0 2 1 * *', 'monthly'],
  ])('maps %s to the %s tab and builds it back unchanged', (expr, mode) => {
    const schedule = parseCron(expr);
    expect(schedule.mode).toBe(mode);
    expect(buildCron(schedule)).toBe(expr);
  });

  it.each(['55 */8 * * *', '0 9-17 * * MON-FRI', '0 0 1 JAN *', '0 0 * * 1', '* * * * * *', ''])(
    'keeps %s in the advanced tab',
    expr => {
      const schedule = parseCron(expr);
      expect(schedule.mode).toBe('advanced');
      expect(buildCron(schedule)).toBe(expr);
    },
  );

  it('normalizes weekday order and case', () => {
    expect(buildCron(parseCron('0 8 * * fri,mon'))).toBe('0 8 * * MON,FRI');
  });

  it('accepts valid 5-field expressions', () => {
    expect(validateCron('55 */8 * * *')).toBeNull();
    expect(validateCron('0 9 * * MON-FRI')).toBeNull();
  });

  it('rejects empty, wrong field count, numeric weekdays and invalid values', () => {
    expect(validateCron(' ')).toContain('required');
    expect(validateCron('0 0 * * * *')).toContain('5 fields');
    expect(validateCron('0 0 * * 1')).toContain('weekday names');
    expect(validateCron('75 0 * * *')).toBe('Invalid cron expression.');
  });

  it('reports out-of-range preset fields', () => {
    const daily = parseCron('0 6 * * *');
    expect(scheduleError(daily)).toBeNull();
    expect(scheduleError({ ...daily, hour: NaN })).toBe('Enter a valid time.');
    expect(scheduleError({ ...daily, mode: 'weekly', days: [] })).toBe('Select at least one weekday.');
    expect(scheduleError({ ...daily, mode: 'minutes', interval: 0 })).toContain('1 and 59');
  });

  it('describes an expression in English', () => {
    expect(describeCron('30 6 * * MON')).toBe('At 06:30, only on Monday');
  });

  it('computes the next runs in UTC', () => {
    const runs = nextRuns('55 */8 * * *', 3, new Date('2026-11-03T09:00:00Z'));
    expect(runs.map(d => d.toISOString())).toEqual([
      '2026-11-03T16:55:00.000Z',
      '2026-11-04T00:55:00.000Z',
      '2026-11-04T08:55:00.000Z',
    ]);
  });
});
