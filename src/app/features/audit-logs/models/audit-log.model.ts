export interface AuditLogEntry {
  id: number;
  runId: number;
  component: string;
  message: string;
  ts: string;
  tsUnixMs: number;
}
