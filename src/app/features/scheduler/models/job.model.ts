// SPDX-FileCopyrightText: 2026 ZHENG Robert
// SPDX-License-Identifier: Apache-2.0

export interface Job {
  id: number;
  name: string;
  command: string;
  cron_expr: string;
  enabled: boolean;
  /** Program arguments (`scheduled_programs.args`, JSON object). */
  args: Record<string, unknown> | null;
  restart_on_exit: boolean;
  next_run?: string;
  is_running?: boolean;
  active_pid?: number;
}
